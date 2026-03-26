import { Search, X, SlidersHorizontal, Gauge, Building2, Star } from 'lucide-react'
import { useFilters } from '../App'
import { Lookups, FilterState } from '../types'
import { useTheme } from '../context/ThemeContext'

interface FilterPanelProps {
  lookups: Lookups | null
}

// Individual data sources for the source filter (derived from combined source values)
const INDIVIDUAL_SOURCES = [
  'DataCenterHawk',
  'DataCenterMap',
  'Meta Canonical',
  'NewProjectMedia',
  'Semianalysis'
]

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

// Capacity type options
const CAPACITY_TYPES: Array<{ value: FilterState['capacityType']; label: string; description: string }> = [
  { value: 'full_capacity_mw', label: 'Full Capacity', description: 'Total planned/design capacity' },
  { value: 'commissioned_power_mw', label: 'Commissioned', description: 'Currently operational capacity' },
  { value: 'capacity_under_construction_mw', label: 'Under Construction', description: 'Actively building' },
  { value: 'planned_capacity_mw', label: 'Planned', description: 'Future planned capacity' },
]

export default function FilterPanel({ lookups }: FilterPanelProps) {
  const { filters, setFilters, clearFilters } = useFilters()
  const { theme } = useTheme()

  const hasActiveFilters =
    filters.company ||
    filters.source ||
    filters.status ||
    filters.region ||
    filters.country ||
    filters.tier ||
    filters.minMw > 0 ||
    filters.maxMw < 10000 ||
    filters.essentialOnly ||
    filters.hyperscalersOnly ||
    filters.search

  return (
    <div className="filter-panel-themed rounded-2xl p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-accent-blue" />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-accent-blue hover:opacity-70 flex items-center gap-1 transition-colors"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="filter-section">
        <label className="filter-label">Search</label>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            placeholder="Search companies, campuses..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="search-input"
          />
        </div>
      </div>

      {/* Capacity Type Selector */}
      <div className="filter-section">
        <label className="filter-label flex items-center gap-2">
          <Gauge size={12} className="text-accent-purple" />
          Capacity Type
        </label>
        <select
          value={filters.capacityType}
          onChange={(e) => setFilters(prev => ({ ...prev, capacityType: e.target.value as FilterState['capacityType'] }))}
          className="filter-select"
        >
          {CAPACITY_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <p className="text-xs text-white/40 mt-1">
          {CAPACITY_TYPES.find(t => t.value === filters.capacityType)?.description}
        </p>
      </div>

      {/* Company Filter */}
      <div className="filter-section">
        <label className="filter-label flex items-center gap-2">
          <Building2 size={12} className="text-accent-blue" />
          Company
        </label>
        <select
          value={filters.company}
          onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
          className="filter-select"
          disabled={filters.hyperscalersOnly}
        >
          <option value="">All Companies</option>
          {lookups?.company_clean_filter?.map(company => (
            <option key={company} value={company}>{company}</option>
          ))}
        </select>

        {/* Hyperscalers Only Toggle */}
        <div className="flex items-center justify-between mt-3 p-2 rounded-lg bg-white/5">
          <div className="flex items-center gap-2">
            <Star size={12} className="text-purple-400" />
            <span className="text-xs text-white/70">Hyperscalers Only</span>
          </div>
          <button
            onClick={() => setFilters(prev => ({
              ...prev,
              hyperscalersOnly: !prev.hyperscalersOnly,
              company: !prev.hyperscalersOnly ? '' : prev.company
            }))}
            className={`toggle-switch ${filters.hyperscalersOnly ? 'active' : ''}`}
          />
        </div>
        {filters.hyperscalersOnly && (
          <p className="text-xs text-purple-400/70 mt-1">Showing: AWS, Microsoft, Google, Meta, Apple, Oracle, Alibaba, xAI</p>
        )}

        {/* Essential Sites Only Toggle */}
        <div className="flex items-center justify-between mt-3 p-2 rounded-lg bg-white/5">
          <div className="flex items-center gap-2">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-xs text-white/70">Essential Sites Only</span>
          </div>
          <button
            onClick={() => setFilters(prev => ({ ...prev, essentialOnly: !prev.essentialOnly }))}
            className={`toggle-switch ${filters.essentialOnly ? 'active' : ''}`}
          />
        </div>
        {filters.essentialOnly && (
          <p className="text-xs text-amber-400/70 mt-1">Showing Meta-flagged essential data centers</p>
        )}
      </div>

      {/* Source Filter - Individual sources with "contains" logic */}
      <div className="filter-section">
        <label className="filter-label">Data Source</label>
        <select
          value={filters.source}
          onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
          className="filter-select"
        >
          <option value="">All Sources</option>
          {INDIVIDUAL_SOURCES.map(source => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
        <p className="text-xs text-white/40 mt-1">Shows records reported by this source</p>
      </div>

      {/* Status Filter */}
      <div className="filter-section">
        <label className="filter-label">Facility Status</label>
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          {(lookups?.facility_status_order || lookups?.facility_status)?.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Region Filter */}
      <div className="filter-section">
        <label className="filter-label">Region</label>
        <select
          value={filters.region}
          onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
          className="filter-select"
        >
          <option value="">All Regions</option>
          {(lookups?.region_order || lookups?.region)?.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      {/* Country Filter */}
      <div className="filter-section">
        <label className="filter-label">Country</label>
        <select
          value={filters.country}
          onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
          className="filter-select"
        >
          <option value="">All Countries</option>
          {lookups?.country?.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>

      {/* Tier Filter */}
      <div className="filter-section">
        <label className="filter-label">Tier</label>
        <select
          value={filters.tier}
          onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value }))}
          className="filter-select"
        >
          <option value="">All Tiers</option>
          {(lookups?.tier_order || lookups?.tier)?.map(tier => (
            <option key={tier} value={tier}>{tier}</option>
          ))}
        </select>
      </div>

      {/* Capacity Range */}
      <div className="filter-section">
        <label className="filter-label">Capacity (MW)</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="Min"
            value={filters.minMw || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, minMw: Number(e.target.value) || 0 }))}
            className="filter-select w-1/2 text-center"
          />
          <span className="text-white/40">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxMw === 10000 ? '' : filters.maxMw}
            onChange={(e) => setFilters(prev => ({ ...prev, maxMw: Number(e.target.value) || 10000 }))}
            className="filter-select w-1/2 text-center"
          />
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="text-xs text-white/50 mb-2">Active filters:</div>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="badge badge-blue">Search: {filters.search}</span>
            )}
            {filters.company && (
              <span className="badge badge-purple">{filters.company}</span>
            )}
            {filters.hyperscalersOnly && (
              <span className="badge badge-purple">Hyperscalers</span>
            )}
            {filters.essentialOnly && (
              <span className="badge badge-amber">Essential</span>
            )}
            {filters.source && (
              <span className="badge badge-emerald">{filters.source}</span>
            )}
            {filters.status && (
              <span className="badge badge-amber">{filters.status}</span>
            )}
            {filters.region && (
              <span className="badge badge-rose">{filters.region}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
