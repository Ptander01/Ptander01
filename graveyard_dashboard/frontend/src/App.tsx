import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react'
import Header from './components/Header'
import KPICards from './components/KPICards'
import MapContainer from './components/MapContainer'
import FilterPanel from './components/FilterPanel'
import DataTable from './components/DataTable'
import Charts from './components/Charts'
import { Feature, Statistics, Lookups, FilterState, FeatureCollection } from './types'
import { useTheme } from './contexts/ThemeContext'

// Static data path (no backend required)
// Uses Vite's BASE_URL for flexible deployment paths
const DATA_BASE = import.meta.env.BASE_URL + 'data'

// Filter Context
interface FilterContextType {
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
  clearFilters: () => void
}

export const FilterContext = createContext<FilterContextType | null>(null)

export function useFilters() {
  const context = useContext(FilterContext)
  if (!context) throw new Error('useFilters must be used within FilterProvider')
  return context
}

// Initial filter state
const initialFilters: FilterState = {
  status: '',
  stageGate: '',
  state: '',
  developer: '',
  tenant: '',
  hasOpposition: null,
  oppositionFactor: '',
  minMw: 0,
  maxMw: 5000,
  search: '',
}

function App() {
  const { isDark } = useTheme()

  // State - raw data from static files
  const [allFeatures, setAllFeatures] = useState<Feature[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [lookups, setLookups] = useState<Lookups | null>(null)
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'map' | 'table' | 'charts'>('map')
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [])

  // Load all static data on mount
  useEffect(() => {
    async function loadStaticData() {
      setLoading(true)
      setError(null)

      try {
        // Fetch all data files in parallel
        const [projectsRes, lookupsRes, statsRes] = await Promise.all([
          fetch(`${DATA_BASE}/projects.geojson`),
          fetch(`${DATA_BASE}/lookups.json`),
          fetch(`${DATA_BASE}/statistics.json`),
        ])

        if (!projectsRes.ok) throw new Error('Failed to load projects.geojson')

        const projectsData: FeatureCollection = await projectsRes.json()
        setAllFeatures(projectsData.features || [])

        if (lookupsRes.ok) {
          const lookupsData = await lookupsRes.json()
          setLookups(lookupsData)
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStatistics(statsData)
        }
      } catch (err) {
        console.error('Failed to load static data:', err)
        setError('Failed to load data files.')
        setAllFeatures([])
      } finally {
        setLoading(false)
      }
    }

    loadStaticData()
  }, [])

  // Client-side filtering (replaces backend filtering)
  const features = useMemo(() => {
    return allFeatures.filter(feature => {
      const props = feature.properties

      // Status filter
      if (filters.status && props.current_status !== filters.status) return false

      // Stage Gate filter
      if (filters.stageGate && props.stage_gate !== filters.stageGate) return false

      // State filter
      if (filters.state && props.state !== filters.state) return false

      // Developer filter
      if (filters.developer && props.developer !== filters.developer) return false

      // Tenant filter
      if (filters.tenant && props.tenant !== filters.tenant) return false

      // Opposition filter
      if (filters.hasOpposition !== null && props.has_opposition !== filters.hasOpposition) return false

      // Opposition factor filter
      if (filters.oppositionFactor) {
        const factors = props.opposition_factors || []
        if (!factors.includes(filters.oppositionFactor)) return false
      }

      // Capacity range filter
      const capacity = props.capacity_mw || 0
      if (capacity < filters.minMw || capacity > filters.maxMw) return false

      // Search filter (searches multiple fields)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchFields = [
          props.facility_name,
          props.developer,
          props.tenant,
          props.city,
          props.state,
          props.county,
        ].filter(Boolean).map(s => s?.toLowerCase() || '')

        if (!searchFields.some(field => field.includes(searchLower))) return false
      }

      return true
    })
  }, [allFeatures, filters])

  // Export handlers - download filtered data as files
  const handleExportCSV = useCallback(() => {
    // Convert features to CSV
    const headers = [
      'facility_name', 'current_status', 'developer', 'tenant', 'city', 'state',
      'capacity_mw', 'cost_billions_usd', 'stage_gate', 'has_opposition'
    ]
    const csvRows = [headers.join(',')]

    features.forEach(f => {
      const row = headers.map(h => {
        const val = f.properties[h as keyof typeof f.properties]
        if (val === null || val === undefined) return ''
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`
        return String(val)
      })
      csvRows.push(row.join(','))
    })

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'graveyard_projects.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [features])

  const handleExportGeoJSON = useCallback(() => {
    const geojson = {
      type: 'FeatureCollection',
      features: features
    }
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'graveyard_projects.geojson'
    a.click()
    URL.revokeObjectURL(url)
  }, [features])

  return (
    <FilterContext.Provider value={{ filters, setFilters, clearFilters }}>
      <div className="min-h-screen relative">
        {/* Background - Theme aware */}
        <div className={`fixed inset-0 transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900'
            : 'bg-gradient-to-br from-slate-200 via-gray-200 to-slate-300'
        }`} />
        <div className="bg-orbs">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="bg-orb bg-orb-3" />
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          {/* Header */}
          <Header
            activeView={activeView}
            setActiveView={setActiveView}
            onExportCSV={handleExportCSV}
            onExportGeoJSON={handleExportGeoJSON}
          />

          {/* Main Layout */}
          <div className="flex">
            {/* Filter Sidebar */}
            <aside className="w-80 flex-shrink-0 p-4 h-[calc(100vh-64px)] overflow-y-auto">
              <FilterPanel lookups={lookups} />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 h-[calc(100vh-64px)] overflow-y-auto">
              {/* KPI Cards */}
              <KPICards
                statistics={statistics}
                filteredCount={features.length}
                loading={loading}
              />

              {/* Error State */}
              {error && (
                <div className="glass-card p-6 mt-4 text-center">
                  <p className="text-red-400 mb-2">{error}</p>
                  <p className="text-sm text-gray-400">
                    Run <code className="bg-slate-700 px-2 py-1 rounded">run_server.bat</code> to start the backend
                  </p>
                </div>
              )}

              {/* Content Views */}
              <div className="mt-4 relative min-h-[calc(100vh-280px)]">
                {/* Map View */}
                {activeView === 'map' && (
                  <div className="relative z-10">
                    <MapContainer
                      features={features}
                      loading={loading}
                      selectedFeature={selectedFeature}
                      onSelectFeature={setSelectedFeature}
                    />
                  </div>
                )}

                {/* Table View */}
                {activeView === 'table' && (
                  <div className="relative z-10 glass-card p-6 animate-fade-in">
                    <DataTable
                      features={features}
                      loading={loading}
                      selectedFeature={selectedFeature}
                      onSelectFeature={setSelectedFeature}
                    />
                  </div>
                )}

                {/* Charts View */}
                {activeView === 'charts' && (
                  <div className="relative z-10 glass-card p-6 animate-fade-in">
                    <Charts
                      features={features}
                      statistics={statistics}
                      loading={loading}
                    />
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </FilterContext.Provider>
  )
}

export default App
