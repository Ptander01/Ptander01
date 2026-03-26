import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Feature, OPPOSITION_FACTORS } from '../types'
import { useTheme } from '../contexts/ThemeContext'
import { Maximize2 } from 'lucide-react'

interface MapContainerProps {
  features: Feature[]
  loading: boolean
  selectedFeature: Feature | null
  onSelectFeature: (feature: Feature | null) => void
}

// Status color mapping for map points
const MAP_STATUS_COLORS: Record<string, string> = {
  'BLOCKED': '#ef4444',
  'DELAYED': '#f59e0b',
  'WITHDRAWN': '#6b7280',
  'APPROVED': '#22c55e',
  'OPERATING': '#3b82f6',
}

export default function MapContainer({ features, loading, selectedFeature, onSelectFeature }: MapContainerProps) {
  const { isDark } = useTheme()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const popup = useRef<maplibregl.Popup | null>(null)

  // Map style URLs for light/dark themes
  const darkTiles = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
  const lightTiles = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const tileUrl = isDark ? darkTiles : lightTiles

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-basemap': {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
            attribution: '© CARTO © OpenStreetMap contributors'
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
      center: [-98, 39],
      zoom: 4,
      attributionControl: false
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'imperial' }), 'bottom-right')

    popup.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '400px',
      className: 'graveyard-popup'
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update basemap when theme changes
  useEffect(() => {
    if (!map.current) return

    const updateBasemap = () => {
      const tileUrl = isDark ? darkTiles : lightTiles
      const source = map.current!.getSource('carto-basemap') as maplibregl.RasterTileSource

      if (source) {
        // Remove old source and layer, then re-add with new tiles
        if (map.current!.getLayer('carto-basemap-layer')) {
          map.current!.removeLayer('carto-basemap-layer')
        }
        map.current!.removeSource('carto-basemap')

        map.current!.addSource('carto-basemap', {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          attribution: '© CARTO © OpenStreetMap contributors'
        })

        // Add basemap layer at the bottom (before other layers)
        const layers = map.current!.getStyle().layers
        const firstSymbolId = layers?.find(layer => layer.type === 'circle')?.id

        map.current!.addLayer({
          id: 'carto-basemap-layer',
          type: 'raster',
          source: 'carto-basemap',
          minzoom: 0,
          maxzoom: 19
        }, firstSymbolId)
      }
    }

    if (map.current.isStyleLoaded()) {
      updateBasemap()
    } else {
      map.current.on('load', updateBasemap)
    }
  }, [isDark])

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

      const source = map.current!.getSource('projects') as maplibregl.GeoJSONSource

      if (source) {
        source.setData(geojson)
      } else {
        map.current!.addSource('projects', {
          type: 'geojson',
          data: geojson
        })

        // Outer glow ring based on opposition
        map.current!.addLayer({
          id: 'project-glow',
          type: 'circle',
          source: 'projects',
          paint: {
            'circle-color': [
              'case',
              ['get', 'has_opposition'],
              '#ef4444',
              'transparent'
            ],
            'circle-radius': 14,
            'circle-opacity': 0.3,
            'circle-blur': 0.8
          }
        })

        // Main point colored by status
        map.current!.addLayer({
          id: 'project-point',
          type: 'circle',
          source: 'projects',
          paint: {
            'circle-color': [
              'match',
              ['get', 'current_status'],
              'BLOCKED', '#ef4444',
              'DELAYED', '#f59e0b',
              'WITHDRAWN', '#6b7280',
              'APPROVED', '#22c55e',
              'OPERATING', '#3b82f6',
              '#94a3b8'
            ],
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              3, 6,
              8, 10,
              12, 14
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': 'rgba(255, 255, 255, 0.3)',
            'circle-opacity': 0.9
          }
        })

        // Status icon/label at high zoom
        map.current!.addLayer({
          id: 'project-label',
          type: 'symbol',
          source: 'projects',
          minzoom: 8,
          layout: {
            'text-field': ['get', 'facility_name'],
            'text-size': 11,
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
            'text-max-width': 15
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(0,0,0,0.8)',
            'text-halo-width': 1
          }
        })

        // Click handler
        map.current!.on('click', 'project-point', (e) => {
          if (!e.features || e.features.length === 0) return
          showPopup(e.features[0], e.lngLat)

          // Notify parent component of selection
          const clickedFeature = features.find(
            f => f.properties.uid === e.features![0].properties?.uid
          )
          if (clickedFeature) {
            onSelectFeature(clickedFeature)
          }
        })

        // Cursor changes
        map.current!.on('mouseenter', 'project-point', () => {
          map.current!.getCanvas().style.cursor = 'pointer'
        })
        map.current!.on('mouseleave', 'project-point', () => {
          map.current!.getCanvas().style.cursor = ''
        })
      }
    }

    const showPopup = (feature: maplibregl.MapGeoJSONFeature, lngLat: maplibregl.LngLat) => {
      const props = feature.properties || {}
      const coordinates: [number, number] = [lngLat.lng, lngLat.lat]

      // Check current theme from document class
      const isCurrentlyDark = document.documentElement.classList.contains('dark')

      // Theme-aware colors
      const theme = {
        textPrimary: isCurrentlyDark ? '#ffffff' : '#1e293b',
        textSecondary: isCurrentlyDark ? 'rgba(255,255,255,0.5)' : 'rgba(30,41,59,0.6)',
        textMuted: isCurrentlyDark ? 'rgba(255,255,255,0.4)' : 'rgba(30,41,59,0.5)',
        border: isCurrentlyDark ? 'rgba(255,255,255,0.1)' : 'rgba(30,41,59,0.15)',
        tableBg: isCurrentlyDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
        tableRowText: isCurrentlyDark ? 'rgba(255,255,255,0.9)' : '#1e293b',
        tableRowLabel: isCurrentlyDark ? 'rgba(255,255,255,0.5)' : 'rgba(30,41,59,0.6)',
      }

      const name = props.facility_name || 'Unknown Project'
      const status = props.current_status || 'Unknown'
      const statusColor = MAP_STATUS_COLORS[status] || '#94a3b8'
      const city = props.city || ''
      const state = props.state || ''
      const location = [city, state].filter(Boolean).join(', ')

      // Parse opposition factors for special rendering
      let oppositionFactors: string[] = []
      try {
        if (props.opposition_factors) {
          oppositionFactors = typeof props.opposition_factors === 'string'
            ? JSON.parse(props.opposition_factors)
            : props.opposition_factors
        }
      } catch {
        oppositionFactors = []
      }
      const hasOpposition = props.has_opposition === true || props.has_opposition === 'true'

      // Fields to exclude from the "all fields" table (already shown in header or not useful)
      const excludeFields = ['facility_name', 'current_status', 'city', 'state', 'latitude', 'longitude']

      // Format field name for display
      const formatFieldName = (key: string): string => {
        return key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())
      }

      // Format field value for display
      const formatFieldValue = (key: string, value: unknown): string => {
        if (value === null || value === undefined || value === '') return '-'

        // Handle arrays (like opposition_factors, community_groups)
        if (Array.isArray(value)) {
          return value.length > 0 ? value.join(', ') : '-'
        }

        // Handle JSON strings that might be arrays
        if (typeof value === 'string' && value.startsWith('[')) {
          try {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed)) return parsed.length > 0 ? parsed.join(', ') : '-'
          } catch {
            // Not valid JSON, continue with string handling
          }
        }

        // Handle booleans
        if (typeof value === 'boolean') {
          return value ? 'Yes' : 'No'
        }
        if (value === 'true') return 'Yes'
        if (value === 'false') return 'No'

        // Handle numbers with formatting
        if (typeof value === 'number') {
          if (key === 'cost_billions_usd') return `$${value.toFixed(2)}B`
          if (key === 'capacity_mw') return `${value.toLocaleString()} MW`
          if (key === 'property_acres' || key === 'facility_size_sqft') return value.toLocaleString()
          return value.toString()
        }

        // Handle stage_gate formatting
        if (key === 'stage_gate' && typeof value === 'string') {
          return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
        }

        return String(value)
      }

      // Build table rows for all properties
      const allFieldsHtml = Object.entries(props)
        .filter(([key]) => !excludeFields.includes(key))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `
          <tr>
            <td style="padding: 6px 8px; font-size: 11px; color: ${theme.tableRowLabel}; text-align: left; white-space: nowrap; vertical-align: top;">${formatFieldName(key)}</td>
            <td style="padding: 6px 8px; font-size: 11px; color: ${theme.tableRowText}; text-align: left; word-break: break-word;">${formatFieldValue(key, value)}</td>
          </tr>
        `)
        .join('')

      // Opposition factors with icons (if present)
      const oppositionHtml = hasOpposition && oppositionFactors.length > 0
        ? `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${theme.border};">
            <div style="font-size: 10px; color: ${theme.textSecondary}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Community Opposition</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${oppositionFactors.map(factor => {
                const info = OPPOSITION_FACTORS[factor] || { icon: '📋', color: '#6b7280' }
                return `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: ${info.color}20; color: ${info.color}; border-radius: 12px; font-size: 11px; font-weight: 500;">${info.icon} ${factor}</span>`
              }).join('')}
            </div>
          </div>
        `
        : ''

      // Source documentation links
      const primarySource = props.primary_source || null
      let supportingSources: string[] = []
      try {
        if (props.supporting_sources) {
          supportingSources = typeof props.supporting_sources === 'string'
            ? JSON.parse(props.supporting_sources)
            : props.supporting_sources
        }
      } catch {
        supportingSources = []
      }

      const hasAnySources = primarySource || supportingSources.length > 0

      const sourcesHtml = hasAnySources
        ? `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${theme.border};">
            <div style="font-size: 10px; color: ${theme.textSecondary}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">📎 Source Documentation</div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${primarySource ? `
                <a href="${primarySource}" target="_blank" rel="noopener noreferrer"
                   style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; background: ${isCurrentlyDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}; color: #3b82f6; border-radius: 8px; font-size: 12px; font-weight: 500; text-decoration: none; transition: background 0.15s;">
                  <span style="font-size: 14px;">📄</span>
                  <span>Primary Source</span>
                  <span style="font-size: 10px; opacity: 0.7;">↗</span>
                </a>
              ` : ''}
              ${supportingSources.length > 0 ? `
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                  ${supportingSources.map((url, idx) => `
                    <a href="${url}" target="_blank" rel="noopener noreferrer"
                       style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: ${isCurrentlyDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(100, 116, 139, 0.1)'}; color: ${isCurrentlyDark ? '#94a3b8' : '#64748b'}; border-radius: 6px; font-size: 11px; text-decoration: none; transition: background 0.15s;">
                      <span>Source ${idx + 1}</span>
                      <span style="font-size: 9px;">↗</span>
                    </a>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `
        : ''

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; min-width: 300px; max-width: 400px;">
          <!-- Status Badge -->
          <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: ${statusColor}30; border: 1px solid ${statusColor}50; border-radius: 16px; margin-bottom: 12px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${statusColor};"></div>
            <span style="font-size: 12px; font-weight: 600; color: ${statusColor};">${status}</span>
          </div>

          <!-- Name & Location -->
          <div style="font-size: 16px; font-weight: 600; color: ${theme.textPrimary}; margin-bottom: 4px;">${name}</div>
          <div style="font-size: 12px; color: ${theme.textSecondary}; margin-bottom: 16px;">${location}</div>

          ${oppositionHtml}

          ${sourcesHtml}

          <!-- All Attributes Table -->
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${theme.border};">
            <div style="font-size: 10px; color: ${theme.textSecondary}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">All Attributes</div>
            <div style="max-height: 300px; overflow-y: auto; background: ${theme.tableBg}; border-radius: 8px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                  ${allFieldsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `

      popup.current!
        .setLngLat(coordinates)
        .setHTML(html)
        .addTo(map.current!)
    }

    if (map.current.isStyleLoaded()) {
      updateSource()
    } else {
      map.current.on('load', updateSource)
    }
  }, [features, onSelectFeature])

  // Fly to selected feature
  useEffect(() => {
    if (!map.current || !selectedFeature) return

    const coords = selectedFeature.geometry.coordinates
    map.current.flyTo({
      center: coords,
      zoom: 10,
      duration: 1500
    })
  }, [selectedFeature])

  // Zoom to extent of all features
  const zoomToExtent = useCallback(() => {
    if (!map.current || features.length === 0) return

    // Calculate bounding box of all features
    let minLng = Infinity
    let maxLng = -Infinity
    let minLat = Infinity
    let maxLat = -Infinity

    features.forEach(feature => {
      const [lng, lat] = feature.geometry.coordinates
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    })

    // Add some padding to the bounds
    const padding = 0.5
    minLng -= padding
    maxLng += padding
    minLat -= padding
    maxLat += padding

    // Fit the map to the bounding box
    map.current.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        duration: 1000
      }
    )
  }, [features])

  return (
    <div className="relative h-[calc(100vh-280px)] rounded-2xl overflow-hidden glass-card">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-white/10 border-t-red-500 rounded-full animate-spin" />
            <span className="text-sm text-white/60">Loading projects...</span>
          </div>
        </div>
      )}

      {/* Map */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Legend */}
      <div className={`absolute bottom-4 left-4 p-4 max-w-[180px] rounded-xl backdrop-blur-xl ${
        isDark
          ? 'bg-slate-900/80 border border-white/10'
          : 'bg-white/90 border border-black/10 shadow-lg'
      }`}>
        <div className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
          isDark ? 'text-white/60' : 'text-slate-600'
        }`}>
          Project Status
        </div>
        <div className="space-y-2">
          {Object.entries(MAP_STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className={`text-xs capitalize ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                {status.toLowerCase()}
              </span>
            </div>
          ))}
        </div>

        <div className={`text-xs font-semibold uppercase tracking-wide mb-3 pt-3 mt-3 border-t ${
          isDark ? 'text-white/60 border-white/10' : 'text-slate-600 border-black/10'
        }`}>
          Opposition
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500/30 border border-red-500/50" />
          <span className={`text-xs ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Community Opposition</span>
        </div>
      </div>

      {/* Feature count badge */}
      <div className={`absolute top-4 left-4 px-4 py-2 flex items-center gap-3 rounded-xl backdrop-blur-xl ${
        isDark
          ? 'bg-slate-900/80 border border-white/10'
          : 'bg-white/90 border border-black/10 shadow-lg'
      }`}>
        <span className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
          {features.length.toLocaleString()} projects
        </span>
        {features.length > 0 && (
          <span className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
            {(features.reduce((sum, f) => sum + (f.properties.capacity_mw || 0), 0) / 1000).toFixed(1)} GW at risk
          </span>
        )}
      </div>

      {/* Zoom to Extent button - positioned next to MapLibre controls */}
      <button
        onClick={zoomToExtent}
        disabled={features.length === 0}
        title="Zoom to fit all projects"
        className={`absolute top-4 right-14 p-2.5 rounded-xl backdrop-blur-xl transition-all duration-200 ${
          isDark
            ? 'bg-slate-900/80 border border-white/10 text-white/70 hover:text-white hover:bg-slate-800/80'
            : 'bg-white/90 border border-black/10 shadow-lg text-slate-600 hover:text-slate-900 hover:bg-white'
        } ${features.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
      >
        <Maximize2 size={18} />
      </button>
    </div>
  )
}
