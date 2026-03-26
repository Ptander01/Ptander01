import {
  X, ExternalLink, Zap, Cpu, Building2, Snowflake,
  Flame, Wind, FileText, FileSpreadsheet, Presentation,
  TrendingUp, AlertCircle, CheckCircle, Clock
} from 'lucide-react'
import { Site, Snapshot, ChangeDetection, getCompanyColor } from '../types'
import { useTimeline } from '../context/TimelineContext'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts'

interface SitePanelProps {
  site: Site
  onClose: () => void
}

export default function SitePanel({ site, onClose }: SitePanelProps) {
  const { currentDate } = useTimeline()
  const companyColor = getCompanyColor(site.company)

  // Find current snapshot based on timeline date
  const currentSnapshot = site.snapshots.find(s => s.date === currentDate)
    || site.snapshots[site.snapshots.length - 1]

  const metrics = currentSnapshot?.metrics || {}

  // Prepare chart data
  const chartData = site.snapshots.map(s => ({
    date: s.date,
    mw: s.metrics.estimated_mw || 0,
  }))

  return (
    <aside className="w-[420px] bg-white border-l border-slate-200 flex flex-col shrink-0 animate-slide-in-right">
      {/* Header */}
      <div
        className="p-4 border-b border-slate-200 text-white"
        style={{ background: `linear-gradient(135deg, ${companyColor} 0%, ${companyColor}dd 100%)` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-80">{site.company}</div>
            <h2 className="text-xl font-semibold">{site.name}</h2>
            {site.project && (
              <div className="text-sm opacity-80">{site.project}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30">
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button className="flex-1 px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-500">
          Overview
        </button>
        <button className="flex-1 px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-700">
          Imagery
        </button>
        <button className="flex-1 px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-700">
          Changes
        </button>
        <button className="flex-1 px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-700">
          Data
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Key Metrics */}
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Current Metrics ({currentSnapshot?.date || 'Latest'})
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={<Zap className="w-4 h-4 text-yellow-500" />}
              label="Estimated Power"
              value={metrics.estimated_mw ? `~${metrics.estimated_mw}` : 'TBD'}
              unit="MW"
              trend={calculateTrend(site.snapshots, 'estimated_mw')}
            />
            <MetricCard
              icon={<Cpu className="w-4 h-4 text-blue-500" />}
              label="GPU Count (Est.)"
              value={metrics.gpu_count ? formatNumber(metrics.gpu_count) : 'TBD'}
              trend={calculateTrend(site.snapshots, 'gpu_count')}
            />
            <MetricCard
              icon={<Building2 className="w-4 h-4 text-purple-500" />}
              label="Building Area"
              value={metrics.building_sqft ? formatNumber(metrics.building_sqft) : 'TBD'}
              unit="sqft"
            />
            <MetricCard
              icon={<TrendingUp className="w-4 h-4 text-green-500" />}
              label="Construction"
              value={metrics.percent_complete !== undefined ? `${metrics.percent_complete}` : 'TBD'}
              unit="%"
              progress={metrics.percent_complete}
            />
          </div>
        </section>

        {/* Capacity Chart */}
        {chartData.length > 1 && (
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Capacity Growth Over Time
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short' })}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} MW`, 'Capacity']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="mw"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMw)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Equipment Counts */}
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Equipment Detected
          </h3>
          <div className="space-y-2">
            {metrics.cooling_towers !== undefined && (
              <EquipmentRow
                icon={<Snowflake className="w-4 h-4 text-blue-500" />}
                label="Cooling Towers"
                count={metrics.cooling_towers}
              />
            )}
            {metrics.generators !== undefined && (
              <EquipmentRow
                icon={<Flame className="w-4 h-4 text-red-500" />}
                label="Gas Generators"
                count={metrics.generators}
              />
            )}
            {metrics.turbines !== undefined && (
              <EquipmentRow
                icon={<Wind className="w-4 h-4 text-orange-500" />}
                label="Turbines"
                count={metrics.turbines}
              />
            )}
            {metrics.chillers !== undefined && (
              <EquipmentRow
                icon={<Snowflake className="w-4 h-4 text-cyan-500" />}
                label="Chillers"
                count={metrics.chillers}
              />
            )}
          </div>
        </section>

        {/* Recent Changes */}
        {currentSnapshot?.changes && currentSnapshot.changes.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Recent Changes Detected
            </h3>
            <div className="space-y-3">
              {currentSnapshot.changes.slice(0, 5).map((change, i) => (
                <ChangeCard key={i} change={change} />
              ))}
            </div>
          </section>
        )}

        {/* Related Documents */}
        {site.links && Object.keys(site.links).length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Related Documents
            </h3>
            <div className="space-y-2">
              {site.links.slides && (
                <DocLink
                  icon={<Presentation className="w-4 h-4 text-orange-500" />}
                  label="Satellite Imagery Deck"
                  href={site.links.slides}
                />
              )}
              {site.links.kiq_narrative && (
                <DocLink
                  icon={<FileText className="w-4 h-4 text-blue-500" />}
                  label="KIQ1 Narrative"
                  href={site.links.kiq_narrative}
                />
              )}
              {site.links.benchmarking && (
                <DocLink
                  icon={<FileSpreadsheet className="w-4 h-4 text-green-500" />}
                  label="DC Benchmarking Sheet"
                  href={site.links.benchmarking}
                />
              )}
            </div>
          </section>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">
            Add Annotation
          </button>
          <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
            Export Report
          </button>
        </div>
      </div>
    </aside>
  )
}

// Sub-components
interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  unit?: string
  trend?: { delta: number; direction: 'up' | 'down' | 'flat' } | null
  progress?: number
}

function MetricCard({ icon, label, value, unit, trend, progress }: MetricCardProps) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold text-slate-900">
        {value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </div>
      {trend && trend.delta !== 0 && (
        <div className={`text-xs mt-1 ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.delta > 0 ? '+' : ''}{trend.delta} vs last
        </div>
      )}
      {progress !== undefined && (
        <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full progress-gradient rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

function EquipmentRow({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm text-slate-700">{label}</span>
      </div>
      <span className="font-semibold text-slate-900">{count}</span>
    </div>
  )
}

function ChangeCard({ change }: { change: ChangeDetection }) {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    'equipment_added': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900' },
    'construction_progress': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
    'capacity_change': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900' },
    'new_structure': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900' },
  }

  const colors = colorMap[change.type] || { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900' }

  const iconMap: Record<string, React.ReactNode> = {
    'equipment_added': <CheckCircle className="w-4 h-4 text-green-500" />,
    'construction_progress': <TrendingUp className="w-4 h-4 text-blue-500" />,
    'capacity_change': <Zap className="w-4 h-4 text-purple-500" />,
    'new_structure': <Building2 className="w-4 h-4 text-emerald-500" />,
  }

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-3`}>
      <div className="flex items-start gap-2">
        {iconMap[change.type] || <AlertCircle className="w-4 h-4 text-slate-500" />}
        <div>
          <div className={`text-sm font-medium ${colors.text}`}>
            {change.description}
          </div>
          {change.confidence && (
            <div className="text-xs text-slate-500 mt-1">
              Confidence: {Math.round(change.confidence * 100)}%
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DocLink({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-sm text-blue-600 group"
    >
      {icon}
      <span className="group-hover:underline">{label}</span>
      <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
    </a>
  )
}

// Helper functions
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${Math.round(num / 1000)}K`
  return num.toString()
}

function calculateTrend(
  snapshots: Snapshot[],
  key: keyof Snapshot['metrics']
): { delta: number; direction: 'up' | 'down' | 'flat' } | null {
  if (snapshots.length < 2) return null

  const latest = snapshots[snapshots.length - 1]?.metrics[key] as number | undefined
  const previous = snapshots[snapshots.length - 2]?.metrics[key] as number | undefined

  if (latest === undefined || previous === undefined) return null

  const delta = latest - previous
  return {
    delta,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  }
}
