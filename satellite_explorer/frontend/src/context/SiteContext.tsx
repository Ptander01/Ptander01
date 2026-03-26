import { createContext, useContext, useState, ReactNode } from 'react'
import { Site, SiteSummary } from '../types'

interface SiteContextType {
  sites: SiteSummary[]
  setSites: (sites: SiteSummary[]) => void
  selectedSite: Site | null
  setSelectedSite: (site: Site | null) => void
  selectedSiteId: string | null
  setSelectedSiteId: (id: string | null) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

const SiteContext = createContext<SiteContextType | null>(null)

export function SiteProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<SiteSummary[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  return (
    <SiteContext.Provider value={{
      sites,
      setSites,
      selectedSite,
      setSelectedSite,
      selectedSiteId,
      setSelectedSiteId,
      loading,
      setLoading,
    }}>
      {children}
    </SiteContext.Provider>
  )
}

export function useSites() {
  const context = useContext(SiteContext)
  if (!context) {
    throw new Error('useSites must be used within SiteProvider')
  }
  return context
}
