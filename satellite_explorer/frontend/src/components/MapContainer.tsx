import { useEffect, useRef, useCallback, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { SiteSummary, getCompanyColor, InfrastructureCategory, InfrastructureFeature, INFRASTRUCTURE_CATEGORIES, SiteOverlays } from '../types'
import { useTheme } from '../context/ThemeContext'
import OverlayLegend from './OverlayLegend'

interface MapContainerProps {
  sites: SiteSummary[]
  selectedSiteId: string | null
  onSelectSite: (siteId: string) => void
}

interface ImageryInfo {
  filename: string
  date: string | null
  url: string
  size_mb: number
}

interface ImageryBounds {
  site_id: string
  clip_name: string
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
  coordinates: [number, number][]
  sqkm: number
  center: { lat: number; lng: number }
}

// Basemap configurations
const BASEMAPS = {
  dark: {
    tiles: [
      'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
    ],
    attribution: '© CARTO',
  },
  light: {
    tiles: [
      'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
      'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
      'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
    ],
    attribution: '© CARTO',
  },
}

// All infrastructure categories
const ALL_CATEGORIES: InfrastructureCategory[] = [
  'building', 'grid_power', 'onsite_power', 'backup_power', 'cooling', 'storage', 'network'
]

export default function MapContainer({ sites, selectedSiteId, onSelectSite }: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const { isDark } = useTheme()

  // Overlay state
  const [overlayData, setOverlayData] = useState<SiteOverlays | null>(null)
  const [visibleCategories, setVisibleCategories] = useState<Set<InfrastructureCategory>>(new Set(ALL_CATEGORIES))
  const [hoveredCategory, setHoveredCategory] = useState<InfrastructureCategory | null>(null)
  const [allHidden, setAllHidden] = useState(false)

  // Imagery state
  const [availableImagery, setAvailableImagery] = useState<ImageryInfo[]>([])
  const [selectedImagery, setSelectedImagery] = useState<ImageryInfo | null>(null)
  const [showImagery, setShowImagery] = useState(true)
  const [imageryBounds, setImageryBounds] = useState<ImageryBounds | null>(null)

  // Create map style based on theme
  const getMapStyle = useCallback((dark: boolean): maplibregl.StyleSpecification => ({
    version: 8,
    sources: {
      'carto-basemap': {
        type: 'raster',
        tiles: dark ? BASEMAPS.dark.tiles : BASEMAPS.light.tiles,
        tileSize: 256,
        attribution: dark ? BASEMAPS.dark.attribution : BASEMAPS.light.attribution,
      },
    },
    layers: [
      {
        id: 'carto-basemap-layer',
        type: 'raster',
        source: 'carto-basemap',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  }), [])

  // Fetch overlay data and imagery when site is selected
  useEffect(() => {
    if (!selectedSiteId) {
      setOverlayData(null)
      setAvailableImagery([])
      setSelectedImagery(null)
      setImageryBounds(null)
      return
    }

    // Fetch overlays for the selected site
    async function fetchOverlays() {
      try {
        const res = await fetch(`/api/sites/${selectedSiteId}/overlays`)
        if (res.ok) {
          const data = await res.json()
          setOverlayData(data)
        } else {
          setOverlayData(null)
        }
      } catch (err) {
        console.warn('No overlay data available for this site')
        setOverlayData(null)
      }
    }

    // Fetch available imagery for the selected site
    async function fetchImagery() {
      try {
        const res = await fetch(`/api/imagery/${selectedSiteId}/available`)
        if (res.ok) {
          const data = await res.json()
          const images = data.images || []
          setAvailableImagery(images)
          // Auto-select the first (most recent) image
          if (images.length > 0) {
            setSelectedImagery(images[0])
          } else {
            setSelectedImagery(null)
          }
        } else {
          setAvailableImagery([])
          setSelectedImagery(null)
        }
      } catch (err) {
        console.warn('No imagery available for this site')
        setAvailableImagery([])
        setSelectedImagery(null)
      }
    }

    // Fetch imagery bounds for georeferencing
    async function fetchBounds() {
      try {
        const res = await fetch(`/api/imagery/${selectedSiteId}/bounds`)
        if (res.ok) {
          const data = await res.json()
          setImageryBounds(data)
        } else {
          setImageryBounds(null)
        }
      } catch (err) {
        console.warn('No imagery bounds available for this site')
        setImageryBounds(null)
      }
    }

    fetchOverlays()
    fetchImagery()
    fetchBounds()
  }, [selectedSiteId])

  // Toggle category visibility
  const handleToggleCategory = useCallback((category: InfrastructureCategory) => {
    setVisibleCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      setAllHidden(next.size === 0)
      return next
    })
  }, [])

  // Toggle all overlays
  const handleToggleAll = useCallback(() => {
    if (allHidden) {
      setVisibleCategories(new Set(ALL_CATEGORIES))
      setAllHidden(false)
    } else {
      setVisibleCategories(new Set())
      setAllHidden(true)
    }
  }, [allHidden])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyle(isDark),
      center: [-95, 38], // Center of US
      zoom: 4,
    })

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, []) // Empty dependency - only init once

  // Update basemap when theme changes
  useEffect(() => {
    if (!map.current) return

    const updateStyle = () => {
      const center = map.current!.getCenter()
      const zoom = map.current!.getZoom()

      map.current!.setStyle(getMapStyle(isDark))

      map.current!.once('styledata', () => {
        map.current!.setCenter(center)
        map.current!.setZoom(zoom)
      })
    }

    if (map.current.isStyleLoaded()) {
      updateStyle()
    } else {
      map.current.once('load', updateStyle)
    }
  }, [isDark, getMapStyle])

  // Render overlay polygons
  useEffect(() => {
    if (!map.current || !overlayData || overlayData.features.length === 0) return

    const mapInstance = map.current

    const renderOverlays = () => {
      // Remove existing overlay layers and sources first
      ALL_CATEGORIES.forEach(category => {
        try {
          if (mapInstance.getLayer(`overlay-fill-${category}`)) {
            mapInstance.removeLayer(`overlay-fill-${category}`)
          }
          if (mapInstance.getLayer(`overlay-outline-${category}`)) {
            mapInstance.removeLayer(`overlay-outline-${category}`)
          }
          if (mapInstance.getLayer(`overlay-glow-${category}`)) {
            mapInstance.removeLayer(`overlay-glow-${category}`)
          }
          if (mapInstance.getSource(`overlay-source-${category}`)) {
            mapInstance.removeSource(`overlay-source-${category}`)
          }
        } catch (e) {
          // Ignore errors from non-existent layers
        }
      })

      // Group features by category
      const featuresByCategory: Record<string, InfrastructureFeature[]> = {}
      overlayData.features.forEach(feature => {
        if (!featuresByCategory[feature.category]) {
          featuresByCategory[feature.category] = []
        }
        featuresByCategory[feature.category].push(feature)
      })

      // Add sources and layers for each category
      Object.entries(featuresByCategory).forEach(([category, features]) => {
        const config = INFRASTRUCTURE_CATEGORIES[category as InfrastructureCategory]
        if (!config) return

        // Convert to GeoJSON - the coordinates array IS the ring, wrap it in another array
        const geojson: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: features.map(f => ({
            type: 'Feature' as const,
            properties: {
              id: f.id,
              label: f.label,
              sublabel: f.sublabel,
              category: f.category,
              ...f.properties
            },
            geometry: {
              type: 'Polygon' as const,
              coordinates: [f.geometry.coordinates as [number, number][]]
            }
          }))
        }

        try {
          // Add source
          mapInstance.addSource(`overlay-source-${category}`, {
            type: 'geojson',
            data: geojson
          })

          // Add glow layer (wider, semi-transparent outline for effect)
          mapInstance.addLayer({
            id: `overlay-glow-${category}`,
            type: 'line',
            source: `overlay-source-${category}`,
            paint: {
              'line-color': config.color,
              'line-width': 8,
              'line-opacity': 0.3,
              'line-blur': 4
            }
          })

          // Add fill layer
          mapInstance.addLayer({
            id: `overlay-fill-${category}`,
            type: 'fill',
            source: `overlay-source-${category}`,
            paint: {
              'fill-color': config.color,
              'fill-opacity': 0.2
            }
          })

          // Add outline layer
          mapInstance.addLayer({
            id: `overlay-outline-${category}`,
            type: 'line',
            source: `overlay-source-${category}`,
            paint: {
              'line-color': config.color,
              'line-width': 3,
              'line-opacity': 0.9
            }
          })

          console.log(`✅ Added overlay layer for ${category} with ${features.length} features`)
        } catch (e) {
          console.error(`Failed to add overlay for ${category}:`, e)
        }
      })
    }

    // Check if style is loaded, if not wait for it
    if (mapInstance.isStyleLoaded()) {
      renderOverlays()
    } else {
      mapInstance.once('style.load', renderOverlays)
    }

    // Also re-render when style changes (theme toggle)
    const handleStyleData = () => {
      // Small delay to ensure style is fully loaded
      setTimeout(renderOverlays, 100)
    }
    mapInstance.on('styledata', handleStyleData)

    // Cleanup
    return () => {
      mapInstance.off('styledata', handleStyleData)
      ALL_CATEGORIES.forEach(category => {
        try {
          if (mapInstance.getLayer(`overlay-fill-${category}`)) {
            mapInstance.removeLayer(`overlay-fill-${category}`)
          }
          if (mapInstance.getLayer(`overlay-outline-${category}`)) {
            mapInstance.removeLayer(`overlay-outline-${category}`)
          }
          if (mapInstance.getLayer(`overlay-glow-${category}`)) {
            mapInstance.removeLayer(`overlay-glow-${category}`)
          }
          if (mapInstance.getSource(`overlay-source-${category}`)) {
            mapInstance.removeSource(`overlay-source-${category}`)
          }
        } catch (e) {
          // Ignore
        }
      })
    }
  }, [overlayData])

  // Update layer visibility based on selected categories and hover state
  useEffect(() => {
    if (!map.current) return
    const mapInstance = map.current

    ALL_CATEGORIES.forEach(category => {
      const isVisible = visibleCategories.has(category)
      const isHovered = hoveredCategory === category
      const isOtherHovered = hoveredCategory !== null && hoveredCategory !== category

      // Determine opacity
      let fillOpacity = isVisible ? 0.15 : 0
      let outlineOpacity = isVisible ? 0.9 : 0
      let glowOpacity = isVisible ? 0.3 : 0

      // Adjust for hover state - isolate hovered category
      if (isOtherHovered && isVisible) {
        fillOpacity = 0.05
        outlineOpacity = 0.2
        glowOpacity = 0.1
      } else if (isHovered && isVisible) {
        fillOpacity = 0.25
        outlineOpacity = 1
        glowOpacity = 0.5
      }

      // Apply to layers if they exist
      try {
        if (mapInstance.getLayer(`overlay-fill-${category}`)) {
          mapInstance.setPaintProperty(`overlay-fill-${category}`, 'fill-opacity', fillOpacity)
        }
        if (mapInstance.getLayer(`overlay-outline-${category}`)) {
          mapInstance.setPaintProperty(`overlay-outline-${category}`, 'line-opacity', outlineOpacity)
        }
        if (mapInstance.getLayer(`overlay-glow-${category}`)) {
          mapInstance.setPaintProperty(`overlay-glow-${category}`, 'line-opacity', glowOpacity)
        }
      } catch (e) {
        // Layers may not exist yet
      }
    })
  }, [visibleCategories, hoveredCategory])

  // Render satellite imagery overlay on the map
  useEffect(() => {
    if (!map.current || !selectedImagery || !imageryBounds || !showImagery) {
      // Remove imagery layer if it exists
      if (map.current) {
        try {
          if (map.current.getLayer('satellite-imagery-layer')) {
            map.current.removeLayer('satellite-imagery-layer')
          }
          if (map.current.getSource('satellite-imagery')) {
            map.current.removeSource('satellite-imagery')
          }
        } catch (e) {
          // Ignore
        }
      }
      return
    }

    const mapInstance = map.current

    const renderImagery = () => {
      // Remove existing imagery layer if present
      try {
        if (mapInstance.getLayer('satellite-imagery-layer')) {
          mapInstance.removeLayer('satellite-imagery-layer')
        }
        if (mapInstance.getSource('satellite-imagery')) {
          mapInstance.removeSource('satellite-imagery')
        }
      } catch (e) {
        // Ignore
      }

      // Add imagery source with coordinates from bounds
      const coordinates = imageryBounds.coordinates as [[number, number], [number, number], [number, number], [number, number]]

      try {
        mapInstance.addSource('satellite-imagery', {
          type: 'image',
          url: selectedImagery.url,
          coordinates: coordinates
        })

        // Add imagery layer - insert below overlay layers so overlays appear on top
        const firstOverlayLayer = ALL_CATEGORIES.find(cat =>
          mapInstance.getLayer(`overlay-glow-${cat}`)
        )

        if (firstOverlayLayer) {
          mapInstance.addLayer({
            id: 'satellite-imagery-layer',
            type: 'raster',
            source: 'satellite-imagery',
            paint: {
              'raster-opacity': 0.9,
              'raster-fade-duration': 300
            }
          }, `overlay-glow-${firstOverlayLayer}`)
        } else {
          mapInstance.addLayer({
            id: 'satellite-imagery-layer',
            type: 'raster',
            source: 'satellite-imagery',
            paint: {
              'raster-opacity': 0.9,
              'raster-fade-duration': 300
            }
          })
        }

        console.log('✅ Added satellite imagery overlay:', selectedImagery.filename)
      } catch (e) {
        console.error('Failed to add satellite imagery:', e)
      }
    }

    // Wait for style to be loaded, then render once
    if (mapInstance.isStyleLoaded()) {
      renderImagery()
    } else {
      mapInstance.once('style.load', renderImagery)
    }

    return () => {
      try {
        if (mapInstance.getLayer('satellite-imagery-layer')) {
          mapInstance.removeLayer('satellite-imagery-layer')
        }
        if (mapInstance.getSource('satellite-imagery')) {
          mapInstance.removeSource('satellite-imagery')
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [selectedImagery, imageryBounds, showImagery])

  // Update markers when sites change
  useEffect(() => {
    if (!map.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Add new markers
    sites.forEach(site => {
      if (!site.location?.lat || !site.location?.lng) return

      const isSelected = site.id === selectedSiteId
      const color = getCompanyColor(site.company)
      const metrics = site.latest_metrics || {}

      // Create marker element
      const el = document.createElement('div')
      el.className = `site-marker ${isSelected ? 'site-marker-active' : ''}`
      el.style.cssText = `
        width: ${isSelected ? '48px' : '40px'};
        height: ${isSelected ? '48px' : '40px'};
        background-color: ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 3px solid ${isSelected ? 'white' : 'rgba(255,255,255,0.3)'};
        transition: all 0.2s ease;
      `
      el.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M3 21h18M9 21v-6a2 2 0 012-2h2a2 2 0 012 2v6M9 3h6v6H9V3z"/>
        </svg>
      `

      el.addEventListener('click', () => {
        onSelectSite(site.id)
      })

      el.addEventListener('mouseenter', () => {
        if (!isSelected) {
          el.style.transform = 'scale(1.1)'
          el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)'
        }
      })

      el.addEventListener('mouseleave', () => {
        if (!isSelected) {
          el.style.transform = 'scale(1)'
          el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
        }
      })

      // Create popup
      const popupContent = `
        <div style="padding: 8px; min-width: 150px;">
          <div style="font-weight: 600; color: #1f2937;">${site.name}</div>
          ${site.project ? `<div style="font-size: 12px; color: #6b7280;">${site.project}</div>` : ''}
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
            ${site.company} • ${site.cadence}
          </div>
          ${metrics.estimated_mw ? `
            <div style="font-size: 12px; color: #059669; margin-top: 4px;">
              ~${metrics.estimated_mw} MW
            </div>
          ` : ''}
        </div>
      `

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
      }).setHTML(popupContent)

      // Add marker
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([site.location.lng, site.location.lat])
        .setPopup(popup)
        .addTo(map.current!)

      // Show popup on hover
      el.addEventListener('mouseenter', () => marker.togglePopup())
      el.addEventListener('mouseleave', () => marker.togglePopup())

      markersRef.current.push(marker)
    })
  }, [sites, selectedSiteId, onSelectSite])

  // Fly to selected site
  useEffect(() => {
    if (!map.current || !selectedSiteId) return

    const site = sites.find(s => s.id === selectedSiteId)
    if (site?.location) {
      map.current.flyTo({
        center: [site.location.lng, site.location.lat],
        zoom: 14,
        duration: 1500,
      })
    }
  }, [selectedSiteId, sites])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Imagery Selector - appears when imagery is available */}
      {selectedSiteId && availableImagery.length > 0 && (
        <div className={`absolute top-4 left-4 glass-card-solid shadow-lg theme-transition`}>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                📷 Satellite Imagery
              </div>
              <button
                onClick={() => setShowImagery(!showImagery)}
                className={`text-xs px-2 py-1 rounded ${
                  showImagery
                    ? 'bg-blue-500 text-white'
                    : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {showImagery ? 'ON' : 'OFF'}
              </button>
            </div>
            <select
              value={selectedImagery?.filename || ''}
              onChange={(e) => {
                const img = availableImagery.find(i => i.filename === e.target.value)
                setSelectedImagery(img || null)
              }}
              className={`w-full px-2 py-1.5 rounded text-sm min-w-[180px] ${
                isDark
                  ? 'bg-slate-700 border border-slate-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-900'
              }`}
            >
              {availableImagery.map(img => (
                <option key={img.filename} value={img.filename}>
                  {img.date || img.filename} ({img.size_mb} MB)
                </option>
              ))}
            </select>
          </div>

          {/* Image Preview */}
          {selectedImagery && showImagery && (
            <div className="border-t border-slate-600">
              <img
                src={selectedImagery.url}
                alt={selectedImagery.filename}
                className="w-full max-w-[300px] h-auto rounded-b-xl"
                style={{ maxHeight: '200px', objectFit: 'cover' }}
              />
              <div className={`px-3 py-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedImagery.date && <span className="font-medium">{selectedImagery.date}</span>}
                <span className="ml-2">{selectedImagery.filename}</span>
              </div>
              {imageryBounds ? (
                <div className={`px-3 pb-2 text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  ✓ Georeferenced • {imageryBounds.sqkm?.toFixed(2)} km²
                </div>
              ) : (
                <div className={`px-3 pb-2 text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  ⚠ No bounds configured - preview only
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No Imagery Available message */}
      {selectedSiteId && availableImagery.length === 0 && (
        <div className={`absolute top-4 left-4 glass-card-solid p-3 shadow-lg theme-transition`}>
          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            📷 No local imagery available
          </div>
          <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Add images to: <code className="text-xs">data/imagery/{selectedSiteId}/</code>
          </div>
        </div>
      )}

      {/* Infrastructure Overlay Legend - only show when a site is selected */}
      {selectedSiteId && overlayData && overlayData.features.length > 0 && (
        <OverlayLegend
          visibleCategories={visibleCategories}
          onToggleCategory={handleToggleCategory}
          onHoverCategory={setHoveredCategory}
          onToggleAll={handleToggleAll}
          allHidden={allHidden}
          hoveredCategory={hoveredCategory}
        />
      )}

      {/* Legend */}
      <div className={`absolute bottom-4 left-4 glass-card-solid p-4 shadow-lg theme-transition`}>
        <div className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Legend</div>
        <div className="space-y-2 text-sm">
          <LegendItem color="#3b82f6" label="xAI" isDark={isDark} />
          <LegendItem color="#10b981" label="OpenAI / Stargate" isDark={isDark} />
          <LegendItem color="#f97316" label="AWS" isDark={isDark} />
          <LegendItem color="#06b6d4" label="Microsoft" isDark={isDark} />
        </div>
      </div>

      {/* Site count badge */}
      <div className={`absolute bottom-4 right-4 glass-card-solid px-4 py-2 text-sm theme-transition`}>
        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Sites: </span>
        <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{sites.length}</span>
      </div>
    </div>
  )
}

function LegendItem({ color, label, isDark }: { color: string; label: string; isDark: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{label}</span>
    </div>
  )
}
