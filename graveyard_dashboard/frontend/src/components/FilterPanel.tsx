import { Search, X, Filter } from 'lucide-react'
import { useFilters } from '../App'
import { useTheme } from '../contexts/ThemeContext'
import { Lookups, OPPOSITION_FACTORS } from '../types'

interface FilterPanelProps {
  lookups: Lookups | null
}

export default function FilterPanel({ lookups }: FilterPanelProps) {
  const { filters, setFilters, clearFilters } = useFilters()
  const { isDark } = useTheme()

  const hasActiveFilters =
    filters.status ||
    filters.stageGate ||
    filters.state ||
    filters.developer ||
    filters.hasOpposition !== null ||
    filters.oppositionFactor ||
    filters.search

  return (
    <div className="glass-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-slate-500'}`} />
          <span className={`text-sm font-bold ${isDark ? 'text-white/80' : 'text-slate-800'}`}>Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
        <input
          type="text"
          placeholder="Search projects..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
            isDark
              ? 'bg-slate-800/50 border border-white/10 text-white placeholder-white/40 focus:border-white/30 focus:ring-white/10'
              : 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-slate-300 focus:ring-slate-200 shadow-[inset_2px_2px_4px_rgba(163,177,198,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]'
          }`}
        />
      </div>

      {/* Status Filter */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/50' : 'text-slate-700'}`}>
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {['BLOCKED', 'DELAYED', 'WITHDRAWN'].map(status => (
            <button
              key={status}
              onClick={() => setFilters(prev => ({
                ...prev,
                status: prev.status === status ? '' : status
              }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filters.status === status
                  ? status === 'BLOCKED'
                    ? 'bg-red-500/20 text-red-500 border border-red-500/50'
                    : status === 'DELAYED'
                    ? 'bg-amber-500/20 text-amber-600 border border-amber-500/50'
                    : 'bg-gray-500/20 text-gray-500 border border-gray-500/50'
                  : isDark
                    ? 'bg-white/5 text-white/60 hover:bg-white/10'
                    : 'bg-black/5 text-slate-600 hover:bg-black/10'
              }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stage Gate Filter */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/50' : 'text-slate-700'}`}>
          Stage Gate
        </label>
        <select
          value={filters.stageGate}
          onChange={(e) => setFilters(prev => ({ ...prev, stageGate: e.target.value }))}
          className={`w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
            isDark
              ? 'bg-slate-800/50 border border-white/10 text-white focus:border-white/30 focus:ring-white/10'
              : 'bg-white border border-slate-200 text-slate-800 focus:border-slate-300 focus:ring-slate-200 shadow-[inset_2px_2px_4px_rgba(163,177,198,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]'
          }`}
        >
          <option value="">All Stages</option>
          {lookups?.stage_gate?.map(stage => (
            <option key={stage} value={stage}>
              {stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* State Filter */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/50' : 'text-slate-700'}`}>
          State
        </label>
        <select
          value={filters.state}
          onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
          className={`w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
            isDark
              ? 'bg-slate-800/50 border border-white/10 text-white focus:border-white/30 focus:ring-white/10'
              : 'bg-white border border-slate-200 text-slate-800 focus:border-slate-300 focus:ring-slate-200 shadow-[inset_2px_2px_4px_rgba(163,177,198,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]'
          }`}
        >
          <option value="">All States</option>
          {lookups?.state?.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      {/* Opposition Toggle */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/50' : 'text-slate-700'}`}>
          Community Opposition
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setFilters(prev => ({
              ...prev,
              hasOpposition: prev.hasOpposition === true ? null : true
            }))}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              filters.hasOpposition === true
                ? 'bg-red-500/20 text-red-500 border border-red-500/50'
                : isDark
                  ? 'bg-white/5 text-white/60 hover:bg-white/10'
                  : 'bg-black/5 text-slate-600 hover:bg-black/10'
            }`}
          >
            With Opposition
          </button>
          <button
            onClick={() => setFilters(prev => ({
              ...prev,
              hasOpposition: prev.hasOpposition === false ? null : false
            }))}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              filters.hasOpposition === false
                ? 'bg-green-500/20 text-green-500 border border-green-500/50'
                : isDark
                  ? 'bg-white/5 text-white/60 hover:bg-white/10'
                  : 'bg-black/5 text-slate-600 hover:bg-black/10'
            }`}
          >
            No Opposition
          </button>
        </div>
      </div>

      {/* Opposition Factors */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/50' : 'text-slate-700'}`}>
          Opposition Factor
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(OPPOSITION_FACTORS).map(([key, { icon, color }]) => (
            <button
              key={key}
              onClick={() => setFilters(prev => ({
                ...prev,
                oppositionFactor: prev.oppositionFactor === key ? '' : key
              }))}
              className={`px-2 py-1 rounded-lg text-xs transition-all ${
                filters.oppositionFactor === key
                  ? 'border'
                  : isDark
                    ? 'bg-white/5 text-white/60 hover:bg-white/10'
                    : 'bg-black/5 text-slate-600 hover:bg-black/10'
              }`}
              style={filters.oppositionFactor === key ? {
                backgroundColor: `${color}20`,
                color: color,
                borderColor: `${color}50`
              } : {}}
            >
              {icon} {key}
            </button>
          ))}
        </div>
      </div>

      {/* Developer Filter */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/50' : 'text-slate-700'}`}>
          Developer
        </label>
        <select
          value={filters.developer}
          onChange={(e) => setFilters(prev => ({ ...prev, developer: e.target.value }))}
          className={`w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
            isDark
              ? 'bg-slate-800/50 border border-white/10 text-white focus:border-white/30 focus:ring-white/10'
              : 'bg-white border border-slate-200 text-slate-800 focus:border-slate-300 focus:ring-slate-200 shadow-[inset_2px_2px_4px_rgba(163,177,198,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]'
          }`}
        >
          <option value="">All Developers</option>
          {lookups?.developer?.slice(0, 20).map(dev => (
            <option key={dev} value={dev}>{dev}</option>
          ))}
        </select>
      </div>

      {/* Active Filter Summary */}
      {hasActiveFilters && (
        <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <div className={`text-xs mb-2 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Active Filters:</div>
          <div className="flex flex-wrap gap-1">
            {filters.status && (
              <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded text-xs">
                {filters.status}
              </span>
            )}
            {filters.stageGate && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs">
                {filters.stageGate.replace(/_/g, ' ')}
              </span>
            )}
            {filters.state && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-500 rounded text-xs">
                {filters.state}
              </span>
            )}
            {filters.hasOpposition !== null && (
              <span className="px-2 py-1 bg-orange-500/20 text-orange-500 rounded text-xs">
                {filters.hasOpposition ? 'Has Opposition' : 'No Opposition'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
