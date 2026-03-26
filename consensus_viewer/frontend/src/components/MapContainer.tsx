import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Feature, FilterState } from '../types'
import { useTheme } from '../context/ThemeContext'

interface MapContainerProps {
  features: Feature[]
  loading: boolean
  selectedFeature: Feature | null
  filters?: FilterState
  isBackground?: boolean
  onFeatureClick?: (feature: Feature) => void
}

// Basemap styles
const BASEMAPS = {
  dark: {
    tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
    attribution: '© CARTO © OpenStreetMap contributors'
  },
  light: {
    tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'],
    attribution: '© CARTO © OpenStreetMap contributors'
  }
}

// Company color mapping - using company_clean_filter values only (no duplicates)
const COMPANY_COLORS: Record<string, { primary: string; glow: string }> = {
  'AWS': { primary: '#FF9900', glow: 'rgba(255, 153, 0, 0.5)' }, // Orange
  'Microsoft': { primary: '#8dc63f', glow: 'rgba(141, 198, 63, 0.5)' }, // Green
  'Google': { primary: '#ea4335', glow: 'rgba(234, 67, 53, 0.5)' }, // Red
  'Meta': { primary: '#0064e0', glow: 'rgba(0, 100, 224, 0.5)' }, // Blue
  'Apple': { primary: '#A2AAAD', glow: 'rgba(162, 170, 173, 0.5)' }, // Gray
  'Oracle': { primary: '#c74634', glow: 'rgba(199, 70, 52, 0.5)' }, // Reddish
  'Alibaba': { primary: '#FF6A00', glow: 'rgba(255, 106, 0, 0.5)' },
  'Colo - All Other': { primary: '#6B7280', glow: 'rgba(107, 114, 128, 0.4)' },
}

// Status progress percentages (for arc fill)
const STATUS_PROGRESS: Record<string, number> = {
  'Active': 1.0,             // 100% - full circle
  'Under Construction': 0.75, // 75%
  'Announced': 0.50,          // 50%
  'Planned': 0.25,            // 25%
  'Land Acquisition': 0.10,   // 10%
  'Unknown': 0.05,            // 5% (minimal indicator)
}

// All status values in order
const STATUS_VALUES = ['Active', 'Under Construction', 'Announced', 'Planned', 'Land Acquisition', 'Unknown']

// Generate SVG arc path for a given percentage (0-1)
// Minimal design: thin stroke, tight to center
function generateArcSvg(percentage: number, size: number = 16, strokeWidth: number = 1.5): string {
  const radius = (size - strokeWidth) / 2
  const centerX = size / 2
  const centerY = size / 2

  // Start from top (12 o'clock position)
  const startAngle = -Math.PI / 2
  const endAngle = startAngle + (2 * Math.PI * percentage)

  // For 100%, draw a full circle
  if (percentage >= 0.99) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="${strokeWidth}"/></svg>`
  }

  // For less than 100%, draw an arc
  const startX = centerX + radius * Math.cos(startAngle)
  const startY = centerY + radius * Math.sin(startAngle)
  const endX = centerX + radius * Math.cos(endAngle)
  const endY = centerY + radius * Math.sin(endAngle)
  const largeArcFlag = percentage > 0.5 ? 1 : 0

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><path d="M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="${strokeWidth}" stroke-linecap="round"/></svg>`
}

// Load SVG as image into MapLibre
function loadSvgImage(map: maplibregl.Map, id: string, svg: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      if (!map.hasImage(id)) {
        map.addImage(id, img)
      }
      resolve()
    }
    img.onerror = reject
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  })
}

// Load all status arc images
async function loadStatusArcImages(map: maplibregl.Map): Promise<void> {
  const promises = STATUS_VALUES.map(status => {
    const percentage = STATUS_PROGRESS[status] || 0.05
    const svg = generateArcSvg(percentage, 16, 1.5)
    const imageId = `status-arc-${status.toLowerCase().replace(/\s+/g, '-')}`
    return loadSvgImage(map, imageId, svg)
  })
  await Promise.all(promises)
}

// Status colors for popup display
const STATUS_COLORS: Record<string, string> = {
  'Active': '#10B981',
  'Under Construction': '#F59E0B',
  'Announced': '#3B82F6',
  'Planned': '#8B5CF6',
  'Land Acquisition': '#06B6D4',
  'Unknown': '#6B7280',
}

// Region bounding boxes for auto-zoom
const REGION_BOUNDS: Record<string, [[number, number], [number, number]]> = {
  'AMER': [[-170, -55], [-30, 72]],
  'EMEA': [[-25, 20], [60, 72]],
  'APAC': [[60, -50], [180, 60]],
}

// Calculate bounding box from features
function calculateBounds(features: Feature[]): [[number, number], [number, number]] | null {
  if (features.length === 0) return null

  let minLng = Infinity, maxLng = -Infinity
  let minLat = Infinity, maxLat = -Infinity

  for (const f of features) {
    const [lng, lat] = f.geometry.coordinates
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }

  // Add small padding if all points are at same location
  if (minLng === maxLng) {
    minLng -= 0.5
    maxLng += 0.5
  }
  if (minLat === maxLat) {
    minLat -= 0.5
    maxLat += 0.5
  }

  return [[minLng, minLat], [maxLng, maxLat]]
}

const getCompanyColor = (company: string | undefined): { primary: string; glow: string } => {
  if (!company) return COMPANY_COLORS['Colo - All Other']
  return COMPANY_COLORS[company] || COMPANY_COLORS['Colo - All Other']
}

export default function MapContainer({ features, loading, selectedFeature, filters, isBackground, onFeatureClick }: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const popup = useRef<maplibregl.Popup | null>(null)
  const prevFiltersRef = useRef<FilterState | undefined>(undefined)
  const onFeatureClickRef = useRef(onFeatureClick)
  const featuresRef = useRef(features)
  const { theme } = useTheme()

  // Keep refs updated
  useEffect(() => {
    onFeatureClickRef.current = onFeatureClick
    featuresRef.current = features
  }, [onFeatureClick, features])

  // Switch basemap when theme changes
  useEffect(() => {
    if (!map.current) return

    const basemap = BASEMAPS[theme]
    const source = map.current.getSource('carto-basemap') as maplibregl.RasterTileSource

    if (source) {
      // Update the tiles URL for the existing source
      map.current.removeLayer('carto-basemap-layer')
      map.current.removeSource('carto-basemap')

      map.current.addSource('carto-basemap', {
        type: 'raster',
        tiles: basemap.tiles,
        tileSize: 256,
        attribution: basemap.attribution
      })

      // Add layer at index 0 (bottom)
      const layers = map.current.getStyle().layers
      const firstLayerId = layers && layers.length > 0 ? layers[0].id : undefined

      map.current.addLayer({
        id: 'carto-basemap-layer',
        type: 'raster',
        source: 'carto-basemap',
        minzoom: 0,
        maxzoom: 19
      }, firstLayerId !== 'carto-basemap-layer' ? firstLayerId : undefined)
    }
  }, [theme])

  // Auto pan/zoom when filters change - zoom to extent of filtered features
  const handleFilterZoom = useCallback(() => {
    if (!map.current || !filters) return

    const prevFilters = prevFiltersRef.current
    const regionChanged = prevFilters?.region !== filters.region
    const countryChanged = prevFilters?.country !== filters.country
    const companyChanged = prevFilters?.company !== filters.company
    const statusChanged = prevFilters?.status !== filters.status

    // Zoom to region bounds if region changed
    if (regionChanged && filters.region && REGION_BOUNDS[filters.region]) {
      const bounds = REGION_BOUNDS[filters.region]
      map.current.fitBounds(bounds, {
        padding: 50,
        duration: 1500
      })
    }
    // Zoom to extent of filtered features for country, company, or status changes
    else if ((countryChanged && filters.country) ||
             (companyChanged && filters.company) ||
             (statusChanged && filters.status)) {
      // Calculate bounds from current features (already filtered)
      const bounds = calculateBounds(featuresRef.current)
      if (bounds) {
        map.current.fitBounds(bounds, {
          padding: 80,
          duration: 1500,
          maxZoom: 12
        })
      }
    }
    // Reset to world view when clearing all location filters
    else if ((regionChanged && !filters.region && !filters.country) ||
             (countryChanged && !filters.country && !filters.region)) {
      map.current.flyTo({
        center: [-20, 30],
        zoom: 2,
        duration: 1500
      })
    }

    prevFiltersRef.current = filters
  }, [filters])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const basemap = BASEMAPS[theme]

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-basemap': {
            type: 'raster',
            tiles: basemap.tiles,
            tileSize: 256,
            attribution: basemap.attribution
          }
        },
        layers: [
          {
            id: 'carto-basemap-layer',
            type: 'raster',
            source: 'carto-basemap',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [-98, 39], // Center of US
      zoom: 4,
      attributionControl: false
    })

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'imperial' }), 'bottom-right')

    // Create popup with enhanced styling
    popup.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '380px',
      className: 'dc-popup'
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Effect for filter-based zoom
  useEffect(() => {
    handleFilterZoom()
  }, [handleFilterZoom])

  // Update data source when features change
  useEffect(() => {
    if (!map.current) return

    const updateSource = () => {
      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: features.map(f => ({
          type: 'Feature' as const,
          geometry: f.geometry,
          properties: f.properties
        }))
      }

      // Check if there are any campuses in the features - if not, show buildings at all zooms
      const hasCampuses = features.some(f => f.properties?.record_level === 'Campus')
      const buildingMinZoom = hasCampuses ? 14 : 0

      const source = map.current!.getSource('datacenters') as maplibregl.GeoJSONSource

      if (source) {
        source.setData(geojson)

        // Dynamically update building layer minzoom based on whether campuses exist
        // When only buildings are present (e.g., essential sites filter), show them at all zooms
        if (map.current!.getLayer('building-status-ring')) {
          map.current!.setLayerZoomRange('building-status-ring', buildingMinZoom, 24)
        }
        if (map.current!.getLayer('building-point')) {
          map.current!.setLayerZoomRange('building-point', buildingMinZoom, 24)
        }
      } else {
        // Add source and layers if they don't exist
        // NO CLUSTERING - show campus points at all zooms, buildings only at zoom 14+
        map.current!.addSource('datacenters', {
          type: 'geojson',
          data: geojson
        })

        // ========== CAMPUS LAYERS (visible at all zoom levels) ==========

        // Campus main point - company color (underneath the arc)
        map.current!.addLayer({
          id: 'campus-point',
          type: 'circle',
          source: 'datacenters',
          filter: ['==', ['get', 'record_level'], 'Campus'],
          paint: {
            'circle-color': [
              'match',
              ['get', 'company_clean_filter'],
              'AWS', '#FF9900',
              'Microsoft', '#8dc63f',
              'Google', '#ea4335',
              'Meta', '#0064e0',
              'Apple', '#A2AAAD',
              'Oracle', '#c74634',
              'Alibaba', '#FF6A00',
              '#6B7280'
            ],
            'circle-radius': 6,
            'circle-stroke-width': 1,
            'circle-stroke-color': 'rgba(255, 255, 255, 0.2)',
            'circle-opacity': 0.95
          }
        })

        // Campus status arc - symbol layer with SVG arc icons
        map.current!.addLayer({
          id: 'campus-status-arc',
          type: 'symbol',
          source: 'datacenters',
          filter: ['==', ['get', 'record_level'], 'Campus'],
          layout: {
            'icon-image': [
              'match',
              ['get', 'facility_status'],
              'Active', 'status-arc-active',
              'Under Construction', 'status-arc-under-construction',
              'Announced', 'status-arc-announced',
              'Planned', 'status-arc-planned',
              'Land Acquisition', 'status-arc-land-acquisition',
              'status-arc-unknown'
            ],
            'icon-size': 0.75,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          }
        })


        // ========== BUILDING LAYERS (visible only at zoom 14+) ==========

        // Building outer status ring - grayscale gradient (dark=incomplete, white=active)
        map.current!.addLayer({
          id: 'building-status-ring',
          type: 'circle',
          source: 'datacenters',
          filter: ['==', ['get', 'record_level'], 'Building'],
          minzoom: 14,
          paint: {
            'circle-color': [
              'match',
              ['get', 'facility_status'],
              'Active', '#FFFFFF',
              'Under Construction', '#BBBBBB',
              'Announced', '#888888',
              'Planned', '#666666',
              'Land Acquisition', '#444444',
              '#555555'
            ],
            'circle-radius': 7,
            'circle-opacity': [
              'match',
              ['get', 'facility_status'],
              'Active', 0.9,
              'Under Construction', 0.7,
              'Announced', 0.5,
              'Planned', 0.4,
              'Land Acquisition', 0.3,
              0.3
            ],
            'circle-blur': [
              'match',
              ['get', 'facility_status'],
              'Active', 0,
              'Under Construction', 0.2,
              'Announced', 0.4,
              'Planned', 0.5,
              'Land Acquisition', 0.6,
              0.5
            ]
          }
        })

        // Building main point - company color
        map.current!.addLayer({
          id: 'building-point',
          type: 'circle',
          source: 'datacenters',
          filter: ['==', ['get', 'record_level'], 'Building'],
          minzoom: 14,
          paint: {
            'circle-color': [
              'match',
              ['get', 'company_clean_filter'],
              'AWS', '#FF9900',
              'Microsoft', '#8dc63f',
              'Google', '#ea4335',
              'Meta', '#0064e0',
              'Apple', '#A2AAAD',
              'Oracle', '#c74634',
              'Alibaba', '#FF6A00',
              '#6B7280'
            ],
            'circle-radius': 5,
            'circle-stroke-width': 1,
            'circle-stroke-color': 'rgba(255, 255, 255, 0.2)',
            'circle-opacity': 0.9
          }
        })


        // Enhanced popup for campus points
        map.current!.on('click', 'campus-point', (e) => {
          if (!e.features || e.features.length === 0) return
          showPopup(e.features[0], e.lngLat)
          // Also trigger the detailed popup panel if callback provided
          if (onFeatureClickRef.current) {
            // Use coordinates to find the matching feature since MapLibre doesn't include all properties
            const clickedCoords = e.lngLat

            // Find closest feature within tolerance
            let closestFeature: Feature | null = null
            let minDistance = Infinity

            for (const f of featuresRef.current) {
              const [lng, lat] = f.geometry.coordinates
              const distance = Math.sqrt(
                Math.pow(lng - clickedCoords.lng, 2) +
                Math.pow(lat - clickedCoords.lat, 2)
              )
              if (distance < minDistance) {
                minDistance = distance
                closestFeature = f
              }
            }

            // Use tolerance of 0.2 degrees (~20km) to account for MapLibre coordinate offsets
            if (closestFeature && minDistance < 0.2) {
              onFeatureClickRef.current(closestFeature)
            }
          }
        })

        // Enhanced popup for building points
        map.current!.on('click', 'building-point', (e) => {
          if (!e.features || e.features.length === 0) return
          showPopup(e.features[0], e.lngLat)
          // Also trigger the detailed popup panel if callback provided
          if (onFeatureClickRef.current) {
            // Use coordinates to find the matching feature
            const clickedCoords = e.lngLat
            const clickedFeature = featuresRef.current.find(f => {
              const [lng, lat] = f.geometry.coordinates
              return Math.abs(lng - clickedCoords.lng) < 0.0001 && Math.abs(lat - clickedCoords.lat) < 0.0001
            })
            if (clickedFeature) onFeatureClickRef.current(clickedFeature)
          }
        })

        // Cursor changes
        map.current!.on('mouseenter', 'campus-point', () => {
          map.current!.getCanvas().style.cursor = 'pointer'
        })
        map.current!.on('mouseleave', 'campus-point', () => {
          map.current!.getCanvas().style.cursor = ''
        })
        map.current!.on('mouseenter', 'building-point', () => {
          map.current!.getCanvas().style.cursor = 'pointer'
        })
        map.current!.on('mouseleave', 'building-point', () => {
          map.current!.getCanvas().style.cursor = ''
        })
      }
    }

    // Helper function to show popup
    const showPopup = (feature: maplibregl.MapGeoJSONFeature, lngLat: maplibregl.LngLat) => {
      const props = feature.properties || {}
      const coordinates: [number, number] = [lngLat.lng, lngLat.lat]

      // Build enhanced popup content
      const company = props.company_clean_filter || props.company_clean || 'Unknown'
      const name = props.campus_name || props.building_name || 'Unknown'
      const fullCapacity = props.full_capacity_mw ? Number(props.full_capacity_mw).toFixed(1) : null
        const commissioned = props.commissioned_power_mw ? Number(props.commissioned_power_mw).toFixed(1) : null
        const ucCapacity = props.uc_power_mw ? Number(props.uc_power_mw).toFixed(1) : null
        const planned = props.planned_power_mw ? Number(props.planned_power_mw).toFixed(1) : null
      const status = props.facility_status || 'Unknown'
      const source = props.source || 'Unknown'
      const city = props.city || ''
      const state = props.state_abbr || ''
      const country = props.country || ''
      const location = [city, state, country].filter(Boolean).join(', ')
      const isEssential = props.is_essential === 1 || props.is_essential === true || props.is_essential === '1'
      const recordLevel = props.record_level || 'Unknown'
      const vintage = props.data_vintage ? new Date(props.data_vintage).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null

      const companyColors = getCompanyColor(company)
      const statusColor = STATUS_COLORS[status] || '#6B7280'

      const html = `
        <div class="popup-content" style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;">
          <!-- Header -->
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${companyColors.primary}; box-shadow: 0 0 8px ${companyColors.glow};"></div>
            <span style="font-size: 13px; font-weight: 600; color: ${companyColors.primary};">${company}</span>
            <span style="background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); font-size: 10px; padding: 2px 6px; border-radius: 10px;">${recordLevel}</span>
            ${isEssential ? '<span style="background: rgba(16, 185, 129, 0.2); color: #10B981; font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: auto;">Essential</span>' : ''}
          </div>

          <!-- Name & Location -->
          <div style="font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 4px;">${name}</div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 16px;">${location}</div>

          <!-- Status Badge -->
          <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: ${statusColor}20; border-radius: 12px; margin-bottom: 16px;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: ${statusColor};"></div>
            <span style="font-size: 11px; font-weight: 500; color: ${statusColor};">${status}</span>
          </div>

          <!-- Capacity Grid -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px;">
              <div style="font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Total Capacity</div>
              <div style="font-size: 18px; font-weight: 700; color: #F59E0B;">${fullCapacity || '-'} <span style="font-size: 11px; font-weight: 400;">MW</span></div>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px;">
              <div style="font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Commissioned</div>
              <div style="font-size: 18px; font-weight: 700; color: #10B981;">${commissioned || '-'} <span style="font-size: 11px; font-weight: 400;">MW</span></div>
            </div>
            ${ucCapacity ? `
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px;">
              <div style="font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Under Construction</div>
              <div style="font-size: 16px; font-weight: 600; color: #F59E0B;">${ucCapacity} MW</div>
            </div>
            ` : ''}
            ${planned ? `
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px;">
              <div style="font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Planned</div>
              <div style="font-size: 16px; font-weight: 600; color: #3B82F6;">${planned} MW</div>
            </div>
            ` : ''}
          </div>

          <!-- Source Info -->
          <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em;">Data Source</div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 2px;">${source.split(';')[0]}</div>
              </div>
              ${vintage ? `
              <div style="text-align: right;">
                <div style="font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em;">Vintage</div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px;">${vintage}</div>
              </div>
              ` : ''}
            </div>
            ${source.includes(';') ? `
            <div style="margin-top: 8px; font-size: 10px; color: rgba(255,255,255,0.3);">
              Multi-source: ${source.split(';').length} sources matched
            </div>
            ` : ''}
          </div>
        </div>
      `

      popup.current!
        .setLngLat(coordinates)
        .setHTML(html)
        .addTo(map.current!)
    }

    // Wait for style to load, then load arc images and update source
    const initializeMap = async () => {
      await loadStatusArcImages(map.current!)
      updateSource()
    }

    if (map.current.isStyleLoaded()) {
      initializeMap()
    } else {
      map.current.on('load', initializeMap)
    }
  }, [features])

  // Fly to selected feature
  useEffect(() => {
    if (!map.current || !selectedFeature) return

    const coords = selectedFeature.geometry.coordinates
    map.current.flyTo({
      center: coords,
      zoom: 13,
      duration: 1500
    })
  }, [selectedFeature])

  return (
    <div className="relative h-[calc(100vh-280px)] rounded-2xl overflow-hidden">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-navy-900/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-white/10 border-t-accent-blue rounded-full animate-spin" />
            <span className="text-sm text-white/60">Loading data...</span>
          </div>
        </div>
      )}

      {/* Map */}
      <div
        ref={mapContainer}
        className="map-container w-full h-full"
      />

      {/* Enhanced Legend */}
      <div className="absolute bottom-4 left-4 glass-card-solid p-4 max-w-[180px]">
        <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3">
          Company
        </div>
        <div className="space-y-2 mb-4">
          {Object.entries(COMPANY_COLORS).map(([company, colors]) => (
            <div key={company} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors.primary, boxShadow: `0 0 6px ${colors.glow}` }}
              />
              <span className="text-xs text-white/80">{company}</span>
            </div>
          ))}
        </div>

        <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3 pt-3 border-t border-white/10">
          Status (Arc)
        </div>
        <div className="space-y-2">
          {[
            { status: 'Active', progress: 100, label: 'Active' },
            { status: 'Under Construction', progress: 75, label: 'Under Const.' },
            { status: 'Announced', progress: 50, label: 'Announced' },
            { status: 'Planned', progress: 25, label: 'Planned' },
            { status: 'Land Acquisition', progress: 10, label: 'Land Acq.' },
          ].map(({ status, progress, label }) => (
            <div key={status} className="flex items-center gap-2">
              <div className="relative w-3 h-3">
                {/* Progress arc - minimal design */}
                <svg width="12" height="12" viewBox="0 0 12 12" className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="6"
                    cy="6"
                    r="5"
                    fill="none"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="1"
                    strokeDasharray={`${(progress / 100) * 31.4} 31.4`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-xs text-white/70">{label}</span>
            </div>
          ))}
        </div>

        <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3 pt-3 border-t border-white/10">
          Zoom Level
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white/30" />
            <span className="text-xs text-white/60">Campus (all zooms)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/30" />
            <span className="text-xs text-white/60">Building (zoom 14+)</span>
          </div>
        </div>
      </div>

      {/* Feature count badge */}
      <div className="absolute top-4 left-4 glass-card-solid px-4 py-2 flex items-center gap-3">
        <span className="text-sm font-medium text-white/80">
          {features.length.toLocaleString()} sites
        </span>
        {features.length > 0 && (
          <span className="text-xs text-white/40">
            {(features.reduce((sum, f) => sum + (f.properties.full_capacity_mw || 0), 0) / 1000).toFixed(1)} GW
          </span>
        )}
      </div>

      {/* Zoom hint when filters applied */}
      {(filters?.region || filters?.country) && (
        <div className="absolute top-4 right-16 glass-card-solid px-3 py-1.5 text-xs text-white/60">
          {filters.country || filters.region} view
        </div>
      )}
    </div>
  )
}
