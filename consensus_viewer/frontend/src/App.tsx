import { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef } from 'react'
import Header from './components/Header'
import KPICards from './components/KPICards'
import MapContainer from './components/MapContainer'
import FilterPanel from './components/FilterPanel'
import DataTable from './components/DataTable'
import Charts from './components/Charts'
import FeaturePopup from './components/FeaturePopup'
import { Feature, Statistics, Lookups, FilterState } from './types'

// API Base URL
const API_BASE = '/api'

// Hyperscaler companies (excludes "Colo - All Other")
const HYPERSCALER_COMPANIES = [
  'AWS',
  'Microsoft',
  'Google',
  'Meta',
  'Apple',
  'Oracle',
  'Alibaba',
  'xAI'
]

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
  company: '',
  source: '',
  status: '',
  region: '',
  country: '',
  tier: '',
  minMw: 0,
  maxMw: 10000,
  essentialOnly: false,
  hyperscalersOnly: false,
  search: '',
  capacityType: 'full_capacity_mw',
}

function App() {
  // State
  const [features, setFeatures] = useState<Feature[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [lookups, setLookups] = useState<Lookups | null>(null)
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'map' | 'table' | 'charts'>('map')
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const [popupFeature, setPopupFeature] = useState<Feature | null>(null)
  // Use combined XB layer as single source - filter by record_level if needed
  const [layer, setLayer] = useState<'combined' | 'campuses' | 'buildings'>('combined')

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [])

  // Check if any filters are active
  const isFiltered = useMemo(() => {
    return (
      filters.company !== '' ||
      filters.source !== '' ||
      filters.status !== '' ||
      filters.region !== '' ||
      filters.country !== '' ||
      filters.tier !== '' ||
      filters.minMw > 0 ||
      filters.maxMw < 10000 ||
      filters.essentialOnly ||
      filters.hyperscalersOnly ||
      filters.search !== ''
    )
  }, [filters])

  // Fetch lookups on mount
  useEffect(() => {
    async function fetchLookups() {
      try {
        const res = await fetch(`${API_BASE}/lookups`)
        if (res.ok) {
          const data = await res.json()
          setLookups(data)
        }
      } catch (err) {
        console.error('Failed to fetch lookups:', err)
      }
    }
    fetchLookups()
  }, [])

  // Fetch statistics on mount
  useEffect(() => {
    async function fetchStatistics() {
      try {
        const res = await fetch(`${API_BASE}/statistics`)
        if (res.ok) {
          const data = await res.json()
          setStatistics(data)
        }
      } catch (err) {
        console.error('Failed to fetch statistics:', err)
      }
    }
    fetchStatistics()
  }, [])

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch features with filters (debounced for better performance)
  useEffect(() => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set up debounced fetch - 300ms delay for text inputs, immediate for other filters
    const isTextFilter = filters.search !== ''
    const debounceMs = isTextFilter ? 300 : 100

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        // Build query params
        const params = new URLSearchParams()
        if (filters.company) params.set('company', filters.company)
        if (filters.source) params.set('source', filters.source)
        if (filters.status) params.set('status', filters.status)
        if (filters.region) params.set('region', filters.region)
        if (filters.country) params.set('country', filters.country)
        if (filters.tier) params.set('tier', filters.tier)
        if (filters.minMw > 0) params.set('min_mw', filters.minMw.toString())
        if (filters.maxMw < 10000) params.set('max_mw', filters.maxMw.toString())
        if (filters.essentialOnly) params.set('essential_only', 'true')
        if (filters.search) params.set('search', filters.search)

        const url = `${API_BASE}/features/${layer}?${params.toString()}`
        const res = await fetch(url)

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        let filteredFeatures = data.features || []

        // Apply hyperscalersOnly filter client-side (not supported by backend)
        if (filters.hyperscalersOnly) {
          filteredFeatures = filteredFeatures.filter((f: Feature) =>
            HYPERSCALER_COMPANIES.includes(f.properties.company_clean_filter || '')
          )
        }

        setFeatures(filteredFeatures)
      } catch (err) {
        console.error('Failed to fetch features:', err)
        setError('Failed to load data. Make sure the backend server is running.')
        setFeatures([])
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    // Cleanup on unmount or filter change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [filters, layer])

  // Export handlers
  const handleExportCSV = useCallback(async () => {
    const params = new URLSearchParams()
    if (filters.company) params.set('company', filters.company)
    if (filters.source) params.set('source', filters.source)
    if (filters.status) params.set('status', filters.status)
    if (filters.search) params.set('search', filters.search)

    window.open(`${API_BASE}/export/csv/${layer}?${params.toString()}`, '_blank')
  }, [filters, layer])

  const handleExportGeoJSON = useCallback(async () => {
    const params = new URLSearchParams()
    if (filters.company) params.set('company', filters.company)
    if (filters.source) params.set('source', filters.source)
    if (filters.status) params.set('status', filters.status)
    if (filters.search) params.set('search', filters.search)

    window.open(`${API_BASE}/export/geojson/${layer}?${params.toString()}`, '_blank')
  }, [filters, layer])

  return (
    <FilterContext.Provider value={{ filters, setFilters, clearFilters }}>
      <div className="min-h-screen relative">
        {/* Background Orbs */}
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
            layer={layer}
            setLayer={setLayer}
            onExportCSV={handleExportCSV}
            onExportGeoJSON={handleExportGeoJSON}
          />

          {/* Main Layout */}
          <div className="flex">
            {/* Filter Sidebar */}
            <aside className="w-72 flex-shrink-0 p-4 h-[calc(100vh-64px)] overflow-y-auto">
              <FilterPanel lookups={lookups} />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 h-[calc(100vh-64px)] overflow-y-auto">
              {/* KPI Cards */}
              <KPICards
                statistics={statistics}
                features={features}
                loading={loading}
                isFiltered={isFiltered}
              />

              {/* Error State */}
              {error && (
                <div className="glass-card p-6 mt-4 text-center">
                  <p className="text-red-400 mb-2">{error}</p>
                  <p className="text-sm text-gray-400">
                    Run <code className="bg-navy-700 px-2 py-1 rounded">run_server.bat</code> to start the backend
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
                      filters={filters}
                      isBackground={false}
                      onFeatureClick={setPopupFeature}
                    />
                  </div>
                )}

                {/* Frosted Glass Overlay for Table View */}
                {activeView === 'table' && (
                  <div className="relative z-10 floating-sheet p-6 animate-fade-in">
                    <DataTable
                      features={features}
                      loading={loading}
                      selectedFeature={selectedFeature}
                      onSelectFeature={setSelectedFeature}
                      onRowClick={setPopupFeature}
                    />
                  </div>
                )}

                {/* Frosted Glass Overlay for Charts View */}
                {activeView === 'charts' && (
                  <div className="relative z-10 floating-sheet p-6 animate-fade-in">
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

        {/* Feature Popup - Full screen slide-in panel */}
        <FeaturePopup
          feature={popupFeature}
          onClose={() => setPopupFeature(null)}
        />
      </div>
    </FilterContext.Provider>
  )
}

export default App
