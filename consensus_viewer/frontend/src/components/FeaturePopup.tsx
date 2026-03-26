import { useState, useMemo } from 'react'
import {
  X, MapPin, Building2, Zap, Calendar, TrendingUp, Shield,
  ChevronDown, ChevronRight, Star, Activity,
  Database, BarChart3, Globe, CheckCircle2, AlertCircle
} from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import { Feature } from '../types'

interface FeaturePopupProps {
  feature: Feature | null
  onClose: () => void
}

// Source authority ranking for display
const SOURCE_AUTHORITY: Record<string, { rank: number; color: string; description: string }> = {
  'Meta Canonical': { rank: 1, color: '#3b82f6', description: 'Internal ground truth' },
  'Semianalysis': { rank: 2, color: '#8b5cf6', description: 'IT capacity forecasts' },
  'DataCenterHawk': { rank: 3, color: '#06b6d4', description: 'Building-level data' },
  'DCH Lease': { rank: 4, color: '#14b8a6', description: 'Leased facilities' },
  'NewProjectMedia': { rank: 5, color: '#f59e0b', description: 'US projects' },
  'DataCenterMap': { rank: 6, color: '#64748b', description: 'Global coverage' },
}

// Company colors for branding
const COMPANY_COLORS: Record<string, string> = {
  'AWS': '#ff9900',
  'Microsoft': '#00a4ef',
  'Google': '#4285f4',
  'Meta': '#0866ff',
  'Apple': '#555555',
  'Oracle': '#f80000',
  'xAI': '#000000',
  'Alibaba': '#ff6a00',
  'Colo - All Other': '#64748b',
}

// Status colors
const STATUS_COLORS: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  'Active': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2 },
  'Under Construction': { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Activity },
  'Announced': { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Star },
  'Planned': { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: Calendar },
  'Unknown': { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: AlertCircle },
}

export default function FeaturePopup({ feature, onClose }: FeaturePopupProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    capacity: true,
    location: false,
    sources: false,
  })

  const props = feature?.properties

  // Parse sources from the feature
  const sources = useMemo(() => {
    if (!props?.source) return []
    const sourceStr = props.source || ''
    return sourceStr.split(';').map((s: string) => s.trim()).filter(Boolean)
  }, [props])

  // Get company color
  const companyColor = useMemo(() => {
    const company = props?.company_clean_filter || props?.company_clean || ''
    return COMPANY_COLORS[company] || COMPANY_COLORS['Colo - All Other']
  }, [props])

  // Get status info
  const statusInfo = useMemo(() => {
    const status = props?.facility_status || 'Unknown'
    return STATUS_COLORS[status] || STATUS_COLORS['Unknown']
  }, [props])

  // Calculate confidence level
  const confidence = useMemo(() => {
    const sourceCount = sources.length || 1
    const hasCapacity = (props?.full_capacity_mw ?? 0) > 0
    const hasStatus = props?.facility_status && props.facility_status !== 'Unknown'

    let score = 0
    if (sourceCount >= 3) score += 40
    else if (sourceCount >= 2) score += 25
    else score += 10

    if (hasCapacity) score += 30
    if (hasStatus) score += 20
    if (props?.is_essential) score += 10

    if (score >= 70) return { level: 'High', color: 'text-emerald-400', bg: 'bg-emerald-500/20' }
    if (score >= 40) return { level: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/20' }
    return { level: 'Low', color: 'text-red-400', bg: 'bg-red-500/20' }
  }, [sources, props])

  // Build capacity trend data for mini chart - uses mw_YYYY fields from Semianalysis
  const capacityTrendData = useMemo(() => {
    if (!props) return null

    const yearlyCapacities: Record<string, number | undefined> = {
      '2023': props.mw_2023,
      '2024': props.mw_2024,
      '2025': props.mw_2025,
      '2026': props.mw_2026,
      '2027': props.mw_2027,
      '2028': props.mw_2028,
      '2029': props.mw_2029,
      '2030': props.mw_2030,
      '2031': props.mw_2031,
      '2032': props.mw_2032,
    }

    const data = Object.entries(yearlyCapacities)
      .filter(([, value]) => value !== undefined && value !== null && value > 0)
      .map(([year, value]) => ({ year, value: value as number }))

    // Need at least 2 data points for a meaningful chart
    if (data.length < 2) return null
    return data
  }, [props])

  // ECharts options for mini trend chart
  const chartOptions = useMemo(() => {
    if (!capacityTrendData) return null

    return {
      grid: { top: 10, right: 10, bottom: 20, left: 40 },
      xAxis: {
        type: 'category',
        data: capacityTrendData.map(d => d.year),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        axisLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: {
          color: 'rgba(255,255,255,0.6)',
          fontSize: 10,
          formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}GW` : `${v}MW`
        },
      },
      series: [{
        type: 'line',
        data: capacityTrendData.map(d => d.value),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: companyColor, width: 2 },
        itemStyle: { color: companyColor },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${companyColor}40` },
              { offset: 1, color: `${companyColor}05` }
            ]
          }
        }
      }],
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const d = params[0]
          return `<b>${d.name}</b><br/>Capacity: ${d.value.toLocaleString()} MW`
        }
      }
    }
  }, [capacityTrendData, companyColor])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (!feature || !props) return null

  const recordLevel = props.record_level || 'Building'
  const isEssential = props.is_essential === 1
  const StatusIcon = statusInfo.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Popup Panel */}
      <div className="relative w-full max-w-md h-[calc(100vh-2rem)] bg-navy-800/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-left">
        {/* Gradient accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(to right, ${companyColor}, ${companyColor}80)` }}
        />

        {/* Header */}
        <div className="relative p-4 border-b border-white/10">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, ${companyColor} 0%, transparent 50%)`
            }} />
          </div>

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex flex-wrap gap-2 mb-2">
                {/* Record Level Badge */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/80">
                  {recordLevel === 'Campus' ? <MapPin size={12} /> : <Building2 size={12} />}
                  {recordLevel}
                </span>

                {/* Essential Badge */}
                {isEssential && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 animate-pulse-subtle">
                    <Star size={12} className="fill-current" />
                    Essential
                  </span>
                )}

                {/* Source Count Badge */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent-blue/20 text-accent-blue">
                  <Database size={12} />
                  {sources.length} source{sources.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Name */}
              <h2 className="text-lg font-semibold text-white truncate">
                {props.campus_name || props.building_designation || props.ucid || 'Unknown Site'}
              </h2>

              {/* Company */}
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: companyColor }}
                />
                <span className="text-sm text-white/70">
                  {props.company_clean || 'Unknown Company'}
                </span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto h-[calc(100%-80px)] p-4 space-y-4 custom-scrollbar">

          {/* Executive Summary Section */}
          <div className="glass-card p-4 rounded-xl border border-white/5">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart3 size={14} />
              Executive Summary
            </h3>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Capacity */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                  <Zap size={12} className="text-amber-400" />
                  Full Capacity
                </div>
                <div className="text-xl font-bold text-white">
                  {props.full_capacity_mw
                    ? `${props.full_capacity_mw >= 1000
                        ? (props.full_capacity_mw / 1000).toFixed(1) + ' GW'
                        : props.full_capacity_mw.toLocaleString() + ' MW'}`
                    : '—'}
                </div>
              </div>

              {/* Status */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                  <Activity size={12} className="text-emerald-400" />
                  Status
                </div>
                <div className={`flex items-center gap-2 ${statusInfo.text}`}>
                  <StatusIcon size={16} />
                  <span className="text-lg font-semibold">
                    {props.facility_status || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Commissioned */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  Commissioned
                </div>
                <div className="text-lg font-semibold text-white">
                  {props.commissioned_power_mw
                    ? `${props.commissioned_power_mw.toLocaleString()} MW`
                    : '—'}
                </div>
              </div>

              {/* Confidence */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                  <Shield size={12} className="text-blue-400" />
                  Confidence
                </div>
                <div className={`flex items-center gap-2 ${confidence.color}`}>
                  <div className={`w-2 h-2 rounded-full ${confidence.bg}`}
                       style={{ boxShadow: `0 0 8px currentColor` }} />
                  <span className="text-lg font-semibold">{confidence.level}</span>
                </div>
              </div>
            </div>

            {/* Building Count for Campuses */}
            {recordLevel === 'Campus' && (props.building_count ?? 0) > 0 && (
              <div className="mt-3 flex items-center justify-between bg-white/5 rounded-lg p-3">
                <span className="text-white/50 text-sm flex items-center gap-2">
                  <Building2 size={14} />
                  Buildings in Campus
                </span>
                <span className="text-white font-semibold">{props.building_count}</span>
              </div>
            )}
          </div>

          {/* Capacity Trend Chart */}
          {chartOptions && (
            <div className="glass-card p-4 rounded-xl border border-white/5">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp size={14} />
                Capacity Forecast (MW)
              </h3>
              <ReactECharts
                option={chartOptions}
                style={{ height: 150 }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          )}

          {/* Capacity Details Section */}
          <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
            <button
              onClick={() => toggleSection('capacity')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                <Zap size={14} />
                Capacity Details
              </h3>
              {expandedSections.capacity ? <ChevronDown size={16} className="text-white/50" /> : <ChevronRight size={16} className="text-white/50" />}
            </button>

            {expandedSections.capacity && (
              <div className="px-4 pb-4 space-y-2">
                <DetailRow label="Full Capacity" value={props.full_capacity_mw} unit="MW" />
                <DetailRow label="Commissioned" value={props.commissioned_power_mw} unit="MW" highlight="green" />
                <DetailRow label="Under Construction" value={props.uc_power_mw} unit="MW" highlight="amber" />
                <DetailRow label="Planned" value={props.planned_power_mw} unit="MW" highlight="blue" />
                <DetailRow label="Facility Size" value={props.facility_sqft} unit="sq ft" />
              </div>
            )}
          </div>

          {/* Location Section */}
          <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
            <button
              onClick={() => toggleSection('location')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                <Globe size={14} />
                Location
              </h3>
              {expandedSections.location ? <ChevronDown size={16} className="text-white/50" /> : <ChevronRight size={16} className="text-white/50" />}
            </button>

            {expandedSections.location && (
              <div className="px-4 pb-4 space-y-2">
                <DetailRow label="City" value={props.city} />
                <DetailRow label="State" value={props.state_abbr || props.state} />
                <DetailRow label="Country" value={props.country} />
                <DetailRow label="Region" value={props.region} />
                <DetailRow label="Coordinates" value={
                  props.latitude && props.longitude
                    ? `${props.latitude.toFixed(4)}, ${props.longitude.toFixed(4)}`
                    : null
                } />
              </div>
            )}
          </div>

          {/* Sources Section */}
          <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
            <button
              onClick={() => toggleSection('sources')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                <Database size={14} />
                Data Sources ({sources.length})
              </h3>
              {expandedSections.sources ? <ChevronDown size={16} className="text-white/50" /> : <ChevronRight size={16} className="text-white/50" />}
            </button>

            {expandedSections.sources && (
              <div className="px-4 pb-4 space-y-2">
                {sources.length > 0 ? (
                  sources.map((source: string) => {
                    const info = SOURCE_AUTHORITY[source] || { rank: 99, color: '#64748b', description: 'Unknown' }
                    return (
                      <div
                        key={source}
                        className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: `${info.color}30`, borderLeft: `3px solid ${info.color}` }}
                        >
                          #{info.rank}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">{source}</div>
                          <div className="text-xs text-white/50">{info.description}</div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-sm text-white/50 italic">No source information available</div>
                )}
              </div>
            )}
          </div>

          {/* Metadata Footer */}
          <div className="text-xs text-white/30 text-center pt-2 space-y-1">
            {props.ucid && <div>UCID: {props.ucid}</div>}
            {props.data_vintage && <div>Data Vintage: {new Date(props.data_vintage).toLocaleDateString()}</div>}
          </div>

        </div>
      </div>
    </div>
  )
}

// Helper component for detail rows
function DetailRow({
  label,
  value,
  unit,
  highlight
}: {
  label: string
  value: any
  unit?: string
  highlight?: 'green' | 'amber' | 'blue' | 'red'
}) {
  if (value === null || value === undefined || value === '' || value === 0) {
    return (
      <div className="flex items-center justify-between py-1.5 border-b border-white/5">
        <span className="text-sm text-white/50">{label}</span>
        <span className="text-sm text-white/30">—</span>
      </div>
    )
  }

  const highlightClasses = {
    green: 'text-emerald-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    red: 'text-red-400',
  }

  const displayValue = typeof value === 'number'
    ? value.toLocaleString()
    : value

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
      <span className="text-sm text-white/50">{label}</span>
      <span className={`text-sm font-medium ${highlight ? highlightClasses[highlight] : 'text-white'}`}>
        {displayValue}{unit ? ` ${unit}` : ''}
      </span>
    </div>
  )
}
