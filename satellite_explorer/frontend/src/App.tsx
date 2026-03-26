import { useState, useEffect, useCallback } from 'react'
import { TimelineProvider } from './context/TimelineContext'
import { SiteProvider, useSites } from './context/SiteContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import Header from './components/Header'
import SiteList from './components/SiteList'
import MapContainer from './components/MapContainer'
import TimelineSlider from './components/TimelineSlider'
import SitePanel from './components/SitePanel'
import { Site } from './types'

const API_BASE = '/api'

function AppContent() {
  const {
    sites,
    setSites,
    selectedSite,
    setSelectedSite,
    selectedSiteId,
    setSelectedSiteId,
    loading,
    setLoading
  } = useSites()

  const { isDark } = useTheme()

  const [error, setError] = useState<string | null>(null)
  const [showPanel, setShowPanel] = useState(false)

  // Fetch sites on mount
  useEffect(() => {
    async function fetchSites() {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE}/sites`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setSites(data.sites || [])
        setError(null)
      } catch (err) {
        console.error('Failed to fetch sites:', err)
        setError('Failed to load sites. Make sure the backend server is running.')
        setSites([])
      } finally {
        setLoading(false)
      }
    }
    fetchSites()
  }, [setSites, setLoading])

  // Fetch full site detail when selected
  const handleSelectSite = useCallback(async (siteId: string) => {
    setSelectedSiteId(siteId)
    setShowPanel(true)

    try {
      const res = await fetch(`${API_BASE}/sites/${siteId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const site: Site = await res.json()
      setSelectedSite(site)
    } catch (err) {
      console.error('Failed to fetch site detail:', err)
    }
  }, [setSelectedSiteId, setSelectedSite])

  const handleClosePanel = useCallback(() => {
    setShowPanel(false)
    setSelectedSite(null)
    setSelectedSiteId(null)
  }, [setSelectedSite, setSelectedSiteId])

  return (
    <div className={`h-screen flex flex-col overflow-hidden theme-transition ${
      isDark ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Site List */}
        <SiteList
          sites={sites}
          loading={loading}
          selectedSiteId={selectedSiteId}
          onSelectSite={handleSelectSite}
        />

        {/* Main Map Area */}
        <main className="flex-1 flex flex-col">
          {/* Error State */}
          {error && (
            <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-50 glass-card-solid px-6 py-4`}>
              <p className="text-red-500 mb-2">{error}</p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Run <code className={`px-2 py-1 rounded ${
                  isDark ? 'bg-slate-700' : 'bg-slate-200'
                }`}>run_server.bat</code> to start the backend
              </p>
            </div>
          )}

          {/* Map */}
          <div className="flex-1 relative">
            <MapContainer
              sites={sites}
              selectedSiteId={selectedSiteId}
              onSelectSite={handleSelectSite}
            />
          </div>

          {/* Timeline */}
          <TimelineSlider />
        </main>

        {/* Right Panel - Site Details */}
        {showPanel && selectedSite && (
          <SitePanel
            site={selectedSite}
            onClose={handleClosePanel}
          />
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <TimelineProvider>
        <SiteProvider>
          <AppContent />
        </SiteProvider>
      </TimelineProvider>
    </ThemeProvider>
  )
}

export default App
