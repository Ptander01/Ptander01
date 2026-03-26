import { useState } from 'react'
import { Search, Zap, Cpu } from 'lucide-react'
import { SiteSummary, getCompanyColor } from '../types'
import { useTheme } from '../context/ThemeContext'

interface SiteListProps {
  sites: SiteSummary[]
  loading: boolean
  selectedSiteId: string | null
  onSelectSite: (siteId: string) => void
}

export default function SiteList({ sites, loading, selectedSiteId, onSelectSite }: SiteListProps) {
  const [search, setSearch] = useState('')
  const [filterCompany, setFilterCompany] = useState('')
  const [filterCadence, setFilterCadence] = useState('')
  const { isDark } = useTheme()

  // Filter sites
  const filteredSites = sites.filter(site => {
    if (search) {
      const searchLower = search.toLowerCase()
      const searchable = `${site.name} ${site.project || ''} ${site.company}`.toLowerCase()
      if (!searchable.includes(searchLower)) return false
    }
    if (filterCompany && site.company !== filterCompany) return false
    if (filterCadence && site.cadence !== filterCadence) return false
    return true
  })

  // Group by cadence
  const weeklySites = filteredSites.filter(s => s.cadence === 'weekly')
  const monthlySites = filteredSites.filter(s => s.cadence === 'monthly')
  const irregularSites = filteredSites.filter(s => s.cadence === 'irregular')

  const companies = [...new Set(sites.map(s => s.company))].sort()

  return (
    <aside className={`w-80 flex flex-col shrink-0 theme-transition ${
      isDark
        ? 'bg-slate-800 border-r border-slate-700'
        : 'bg-white border-r border-slate-200'
    }`}>
      {/* Search & Filters */}
      <div className={`p-4 theme-transition ${
        isDark ? 'border-b border-slate-700' : 'border-b border-slate-200'
      }`}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search sites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 theme-transition ${
              isDark
                ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400'
                : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDark ? 'text-slate-400' : 'text-slate-400'
          }`} />
        </div>
        <div className="flex gap-2 mt-3">
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm theme-transition ${
              isDark
                ? 'bg-slate-700 border border-slate-600 text-white'
                : 'bg-slate-50 border border-slate-200 text-slate-900'
            }`}
          >
            <option value="">All Companies</option>
            {companies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterCadence}
            onChange={(e) => setFilterCadence(e.target.value)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm theme-transition ${
              isDark
                ? 'bg-slate-700 border border-slate-600 text-white'
                : 'bg-slate-50 border border-slate-200 text-slate-900'
            }`}
          >
            <option value="">All Cadence</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="irregular">Irregular</option>
          </select>
        </div>
      </div>

      {/* Site List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className={`p-4 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <div className="animate-pulse">Loading sites...</div>
          </div>
        ) : (
          <div className="p-2">
            {/* Weekly Sites */}
            {weeklySites.length > 0 && (
              <>
                <div className={`text-xs font-semibold uppercase px-3 py-2 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Weekly Updates ({weeklySites.length})
                </div>
                {weeklySites.map(site => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    isSelected={site.id === selectedSiteId}
                    onClick={() => onSelectSite(site.id)}
                    isDark={isDark}
                  />
                ))}
              </>
            )}

            {/* Monthly Sites */}
            {monthlySites.length > 0 && (
              <>
                <div className={`text-xs font-semibold uppercase px-3 py-2 mt-4 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Monthly Updates ({monthlySites.length})
                </div>
                {monthlySites.map(site => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    isSelected={site.id === selectedSiteId}
                    onClick={() => onSelectSite(site.id)}
                    isDark={isDark}
                  />
                ))}
              </>
            )}

            {/* Irregular Sites */}
            {irregularSites.length > 0 && (
              <>
                <div className={`text-xs font-semibold uppercase px-3 py-2 mt-4 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Irregular Updates ({irregularSites.length})
                </div>
                {irregularSites.map(site => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    isSelected={site.id === selectedSiteId}
                    onClick={() => onSelectSite(site.id)}
                    isDark={isDark}
                  />
                ))}
              </>
            )}

            {filteredSites.length === 0 && (
              <div className={`p-4 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No sites match your filters
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`p-4 theme-transition ${
        isDark
          ? 'border-t border-slate-700 bg-slate-800/50'
          : 'border-t border-slate-200 bg-slate-50'
      }`}>
        <div className="flex items-center justify-between text-sm">
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Total Sites Tracked</span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{sites.length}</span>
        </div>
      </div>
    </aside>
  )
}

interface SiteCardProps {
  site: SiteSummary
  isSelected: boolean
  onClick: () => void
  isDark: boolean
}

function SiteCard({ site, isSelected, onClick, isDark }: SiteCardProps) {
  const companyColor = getCompanyColor(site.company)
  const metrics = site.latest_metrics || {}

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg mb-2 cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-500/20 border-2 border-blue-500'
          : isDark
            ? 'hover:bg-slate-700/50 border-2 border-transparent'
            : 'hover:bg-slate-100 border-2 border-transparent'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <div
            className="w-3 h-3 rounded-full mt-1.5 shrink-0"
            style={{ backgroundColor: companyColor }}
          />
          <div>
            <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{site.name}</div>
            {site.project && (
              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{site.project}</div>
            )}
          </div>
        </div>
        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
          site.cadence === 'weekly'
            ? 'bg-green-500/20 text-green-500'
            : site.cadence === 'monthly'
            ? 'bg-blue-500/20 text-blue-500'
            : isDark
              ? 'bg-slate-500/20 text-slate-400'
              : 'bg-slate-200 text-slate-500'
        }`}>
          {site.cadence.charAt(0).toUpperCase() + site.cadence.slice(1)}
        </span>
      </div>

      {/* Metrics row */}
      <div className={`mt-2 flex items-center gap-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {metrics.estimated_mw && (
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-500" />
            ~{metrics.estimated_mw} MW
          </span>
        )}
        {metrics.gpu_count && (
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-blue-400" />
            {metrics.gpu_count >= 1000 ? `${Math.round(metrics.gpu_count / 1000)}K` : metrics.gpu_count}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {metrics.percent_complete !== undefined && (
        <div className="mt-2 flex items-center gap-2">
          <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${
            isDark ? 'bg-slate-600' : 'bg-slate-200'
          }`}>
            <div
              className="h-full progress-gradient rounded-full"
              style={{ width: `${metrics.percent_complete}%` }}
            />
          </div>
          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {metrics.percent_complete}%
          </span>
        </div>
      )}
    </div>
  )
}
