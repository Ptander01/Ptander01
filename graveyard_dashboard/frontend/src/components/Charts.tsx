import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Feature, Statistics } from '../types'
import { useTheme } from '../contexts/ThemeContext'
import { Info, ExternalLink } from 'lucide-react'

interface ChartsProps {
  features: Feature[]
  statistics: Statistics | null
  loading: boolean
}

// =========================================================================
// COLORBLIND-ACCESSIBLE COLOR PALETTE (Wong Palette)
// =========================================================================
const COLORS = {
  // Status colors for bars (ordered by severity: low to high)
  delayed: {
    fill: '#FDE68A',      // Light yellow
    border: '#F59E0B',
    text: '#B8860B'
  },
  withdrawn: {
    fill: '#E69F00',      // Orange (Wong palette)
    border: '#CC8800',
    text: '#E69F00'
  },
  blocked: {
    fill: '#CC3311',      // Red (colorblind-safe)
    border: '#AA2200',
    text: '#CC3311'
  },
  // Total failures line
  totalFailures: {
    line: '#D55E00',      // Vermillion (Wong palette)
    point: '#D55E00'
  },
  // Stage exit analysis
  stageExit: {
    fill: '#0064E0',      // Meta blue
    area: 'rgba(0, 100, 224, 0.15)'
  },
  // Treemap category colors (colorblind-friendly)
  treemap: {
    Water: '#0072B2',           // Blue
    Electricity: '#E69F00',     // Orange
    Noise: '#56B4E9',           // Sky blue
    Environment: '#009E73',     // Teal
    'Air Quality': '#CC79A7',   // Pink
    'Property Value': '#D55E00', // Vermillion
    Health: '#F0E442',          // Yellow
    Aesthetic: '#332288',       // Indigo
    Other: '#7F7F7F'            // Gray
  }
}

// =========================================================================
// CHART DESCRIPTIONS
// =========================================================================
const CHART_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  'status-time': {
    title: 'Project Status per Period with Total At-Risk/Failures',
    description: `This combo chart displays incremental project status counts per time period (not cumulative totals).

Bars (grouped, touching):
• Delayed (Light Yellow): Projects that experienced timeline setbacks in this period
• Withdrawn (Orange): Projects that have been cancelled or abandoned in this period
• Blocked (Red): Projects that cannot proceed due to regulatory or community opposition in this period

Line:
• Total At-Risk/Fails (Vermillion): Sum of all status changes for each period

Color palette is colorblind-accessible (Wong palette). Use the dropdown to view data by Year, Quarter, or Month.`
  },
  'stage-exit': {
    title: 'Project Stage Exit Analysis',
    description: `This step-down chart shows projects exiting (withdrawn or blocked) at each development stage:

• Site Selection: Initial location identification
• Land Acquisition: Property purchase/lease negotiations
• Zoning/Permitting: Local government approval process
• Environmental Review: Environmental impact assessments
• Legal/Litigation: Legal challenges and court proceedings

The chart shows remaining projects after each stage exit point.`
  },
  'opposition': {
    title: 'Community Opposition Categories',
    description: `This treemap visualization shows the distribution of community concerns across all projects with opposition:

• Water: Concerns about water usage and aquifer depletion
• Electricity: Power grid capacity and energy consumption
• Noise: Sound pollution from cooling systems
• Air Quality: Emissions and air pollution concerns
• Environment: General environmental impact
• Aesthetics: Visual impact on the community
• Property Value: Impact on nearby real estate values
• Health: Community health concerns

Larger cells indicate more prevalent concerns.`
  },
  'watchlist': {
    title: 'Watch List - Delayed Projects',
    description: `This table displays currently delayed data center projects, sorted by opposition level:

• Facility: Project name
• Location: City and state
• Opposition: Level of community opposition (Critical, High, Medium, Low, or None)
• Stage: Current stage gate in the approval process

Click any row to view detailed project information.`
  }
}

// =========================================================================
// STAGE GATE LABELS
// =========================================================================
const STAGE_LABELS: Record<string, string> = {
  SITE_SELECTION: 'Site Selection',
  LAND_ACQUISITION: 'Land Acquisition',
  LEGISLATIVE_ZONING: 'Zoning/Permitting',
  PLANNING_LAND_USE_REVIEW: 'Zoning/Permitting',
  ZONING_PERMITTING: 'Zoning/Permitting',
  ENVIRONMENTAL_REGULATORY_REVIEW: 'Environmental Review',
  ENVIRONMENTAL_REVIEW: 'Environmental Review',
  LEGAL_LITIGATION: 'Legal/Litigation',
  UTILITY_INFRASTRUCTURE_APPROVAL: 'Utility Approval',
  CONSTRUCTION_PERMITTING: 'Construction',
  UNKNOWN: 'Unknown'
}

// =========================================================================
// HELPER: Get Quarter from date
// =========================================================================
function getQuarter(dateStr: string): string {
  const date = new Date(dateStr)
  const quarter = Math.ceil((date.getMonth() + 1) / 3)
  return `Q${quarter} ${date.getFullYear()}`
}

// =========================================================================
// HELPER: Get opposition level
// =========================================================================
function getOppositionLevel(count: number): { label: string; class: string } {
  if (count >= 6) return { label: 'Critical', class: 'critical' }
  if (count >= 4) return { label: 'High', class: 'high' }
  if (count >= 2) return { label: 'Medium', class: 'medium' }
  if (count >= 1) return { label: 'Low', class: 'low' }
  return { label: 'None', class: 'none' }
}

// =========================================================================
// CHART INFO BUTTON COMPONENT
// =========================================================================
function ChartInfoButton({ chartId, isDark }: { chartId: string; isDark: boolean }) {
  const [showInfo, setShowInfo] = useState(false)
  const info = CHART_DESCRIPTIONS[chartId]

  if (!info) return null

  return (
    <>
      <button
        onClick={() => setShowInfo(true)}
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
          isDark
            ? 'bg-white/10 hover:bg-white/20 text-white/60'
            : 'bg-black/5 hover:bg-black/10 text-slate-500'
        }`}
        title="Click for chart description"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {showInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowInfo(false)}
        >
          <div
            className={`max-w-lg mx-4 p-6 rounded-2xl shadow-2xl ${
              isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{info.title}</h3>
              <button
                onClick={() => setShowInfo(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
              >
                ×
              </button>
            </div>
            <p className={`text-sm whitespace-pre-line leading-relaxed ${
              isDark ? 'text-white/70' : 'text-slate-600'
            }`}>
              {info.description}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

// =========================================================================
// MAIN CHARTS COMPONENT
// =========================================================================
export default function Charts({ features, statistics, loading }: ChartsProps) {
  const { isDark } = useTheme()
  const [timeGranularity, setTimeGranularity] = useState<'quarter' | 'year' | 'month'>('quarter')
  const [selectedProject, setSelectedProject] = useState<Feature | null>(null)

  // Theme colors
  const textColor = isDark ? '#fff' : '#1e293b'
  const subTextColor = isDark ? '#94a3b8' : '#64748b'
  const axisLineColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const splitLineColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)'
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  // =========================================================================
  // VISUAL 1: PROJECT STATUS OVER TIME (Combo Chart)
  // =========================================================================
  const statusTimeChartOption = useMemo(() => {
    if (!features.length) return null

    // Group by time period
    const groupedData: Record<string, { delayed: number; withdrawn: number; blocked: number; sortKey: string }> = {}

    features.forEach(f => {
      const statusDate = f.properties.status_date
      if (!statusDate) return

      let key: string
      if (timeGranularity === 'year') {
        key = new Date(statusDate).getFullYear().toString()
      } else if (timeGranularity === 'month') {
        const date = new Date(statusDate)
        const month = date.toLocaleString('default', { month: 'short' })
        key = `${month} ${date.getFullYear()}`
      } else {
        key = getQuarter(statusDate)
      }

      if (!groupedData[key]) {
        groupedData[key] = { delayed: 0, withdrawn: 0, blocked: 0, sortKey: statusDate }
      }

      const status = f.properties.current_status
      if (status === 'DELAYED') groupedData[key].delayed++
      else if (status === 'WITHDRAWN') groupedData[key].withdrawn++
      else if (status === 'BLOCKED') groupedData[key].blocked++
    })

    // Sort by date
    const sortedKeys = Object.keys(groupedData).sort((a, b) => {
      if (timeGranularity === 'year') {
        return parseInt(a) - parseInt(b)
      } else if (timeGranularity === 'quarter') {
        const [qa, ya] = a.replace('Q', '').split(' ')
        const [qb, yb] = b.replace('Q', '').split(' ')
        if (ya !== yb) return parseInt(ya) - parseInt(yb)
        return parseInt(qa) - parseInt(qb)
      } else {
        return new Date(groupedData[a].sortKey).getTime() - new Date(groupedData[b].sortKey).getTime()
      }
    })

    const delayedData = sortedKeys.map(k => groupedData[k].delayed)
    const withdrawnData = sortedKeys.map(k => groupedData[k].withdrawn)
    const blockedData = sortedKeys.map(k => groupedData[k].blocked)
    const totalData = sortedKeys.map((_, i) => delayedData[i] + withdrawnData[i] + blockedData[i])

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: textColor, fontSize: 12 },
        formatter: (params: any) => {
          const period = params[0].axisValue
          let html = `<div style="font-weight:600;margin-bottom:8px;">${period}</div>`

          params.forEach((p: any) => {
            const color = p.color
            const isLine = p.seriesType === 'line'
            const marker = isLine
              ? `<span style="display:inline-block;width:14px;height:3px;background:${color};margin-right:8px;vertical-align:middle;"></span>`
              : `<span style="display:inline-block;width:10px;height:10px;background:${color};margin-right:8px;border-radius:2px;"></span>`
            html += `<div style="margin:4px 0;">${marker}${p.seriesName}: <b>${p.value}</b></div>`
          })

          const total = params.find((p: any) => p.seriesName === 'Total At-Risk/Fails')?.value || 0
          html += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};font-size:11px;color:${subTextColor};">Period Total: ${total}</div>`

          return html
        }
      },
      legend: {
        bottom: 0,
        textStyle: { color: subTextColor, fontSize: 11 },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 16
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: sortedKeys,
        axisLabel: { color: subTextColor, fontSize: 10 },
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: subTextColor },
        splitLine: { lineStyle: { color: splitLineColor } },
        name: 'Facilities (Count)',
        nameTextStyle: { color: subTextColor, fontSize: 11 }
      },
      series: [
        {
          name: 'Delayed',
          type: 'bar',
          stack: undefined,
          data: delayedData,
          itemStyle: {
            color: COLORS.delayed.fill,
            borderColor: COLORS.delayed.border,
            borderWidth: 1
          },
          barGap: '0%',
          barCategoryGap: '20%'
        },
        {
          name: 'Withdrawn',
          type: 'bar',
          data: withdrawnData,
          itemStyle: {
            color: COLORS.withdrawn.fill,
            borderColor: COLORS.withdrawn.border,
            borderWidth: 1
          }
        },
        {
          name: 'Blocked',
          type: 'bar',
          data: blockedData,
          itemStyle: {
            color: COLORS.blocked.fill,
            borderColor: COLORS.blocked.border,
            borderWidth: 1
          }
        },
        {
          name: 'Total At-Risk/Fails',
          type: 'line',
          data: totalData,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: COLORS.totalFailures.line,
            width: 3
          },
          itemStyle: {
            color: COLORS.totalFailures.point,
            borderColor: '#fff',
            borderWidth: 2
          },
          z: 10
        }
      ]
    }
  }, [features, timeGranularity, textColor, subTextColor, axisLineColor, splitLineColor, tooltipBg, tooltipBorder, isDark])

  // =========================================================================
  // VISUAL 2: PROJECT STAGE EXIT ANALYSIS (Step-Down Area Chart)
  // =========================================================================
  const stageExitChartOption = useMemo(() => {
    if (!features.length) return null

    // Count exits at each stage (only WITHDRAWN or BLOCKED)
    const stageCounts: Record<string, number> = {
      'Site Selection': 0,
      'Land Acquisition': 0,
      'Zoning/Permitting': 0,
      'Environmental Review': 0,
      'Legal/Litigation': 0
    }

    features.forEach(f => {
      const status = f.properties.current_status
      if (status !== 'WITHDRAWN' && status !== 'BLOCKED') return

      const stageRaw = f.properties.stage_gate || 'UNKNOWN'
      const stageLabel = STAGE_LABELS[stageRaw] || 'Unknown'

      if (stageCounts.hasOwnProperty(stageLabel)) {
        stageCounts[stageLabel]++
      }
    })

    const stages = Object.keys(stageCounts)
    const exitCounts = stages.map(s => stageCounts[s])

    // Calculate step-down (remaining after each stage)
    const totalExited = exitCounts.reduce((a, b) => a + b, 0)
    let remaining = totalExited
    const remainingData = [totalExited]
    exitCounts.forEach(count => {
      remaining -= count
      remainingData.push(remaining)
    })

    const chartLabels = ['All Exited', ...stages]

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: textColor, fontSize: 12 },
        formatter: (params: any) => {
          const p = params[0]
          const idx = p.dataIndex
          const remainingVal = p.value
          const pct = totalExited > 0 ? Math.round((remainingVal / totalExited) * 100) : 0
          const exited = idx === 0 ? 0 : exitCounts[idx - 1]

          let html = `<div style="font-weight:600;margin-bottom:8px;">${p.name}</div>`
          html += `<div>Remaining: <b>${remainingVal}</b> (${pct}%)</div>`
          if (idx > 0) {
            html += `<div style="margin-top:4px;color:${subTextColor};">${exited} exited at this stage</div>`
          }
          return html
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartLabels,
        axisLabel: {
          color: subTextColor,
          fontSize: 10,
          rotate: 25,
          interval: 0
        },
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: false },
        name: 'Exit Stage',
        nameLocation: 'middle',
        nameGap: 45,
        nameTextStyle: { color: subTextColor, fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: subTextColor },
        splitLine: { lineStyle: { color: splitLineColor } },
        name: 'Facilities Remaining',
        nameTextStyle: { color: subTextColor, fontSize: 11 }
      },
      series: [{
        type: 'line',
        data: remainingData,
        step: 'end',
        areaStyle: {
          color: COLORS.stageExit.area
        },
        lineStyle: {
          color: COLORS.stageExit.fill,
          width: 2
        },
        itemStyle: {
          color: COLORS.stageExit.fill,
          borderColor: '#fff',
          borderWidth: 2
        },
        symbol: 'circle',
        symbolSize: 10
      }]
    }
  }, [features, textColor, subTextColor, axisLineColor, splitLineColor, tooltipBg, tooltipBorder])

  // =========================================================================
  // VISUAL 3: COMMUNITY OPPOSITION TREEMAP
  // =========================================================================
  const oppositionTreemapOption = useMemo(() => {
    if (!statistics?.by_opposition_factor) return null

    const data = Object.entries(statistics.by_opposition_factor)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([factor, count]) => ({
        name: factor,
        value: count,
        itemStyle: {
          color: COLORS.treemap[factor as keyof typeof COLORS.treemap] || COLORS.treemap.Other
        }
      }))

    const total = data.reduce((sum, d) => sum + d.value, 0)

    return {
      tooltip: {
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: textColor, fontSize: 12 },
        formatter: (params: any) => {
          const pct = total > 0 ? Math.round((params.value / total) * 100) : 0
          return `<div style="font-weight:600;">${params.name}</div>
                  <div style="margin-top:4px;">${params.value} projects (${pct}%)</div>`
        }
      },
      series: [{
        type: 'treemap',
        data,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: {
          show: true,
          formatter: (params: any) => {
            const pct = total > 0 ? Math.round((params.value / total) * 100) : 0
            return `{name|${params.name}}\n{value|${params.value}}\n{pct|${pct}%}`
          },
          rich: {
            name: {
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              textShadowColor: 'rgba(0,0,0,0.3)',
              textShadowBlur: 2
            },
            value: {
              fontSize: 18,
              fontWeight: 700,
              color: '#fff',
              textShadowColor: 'rgba(0,0,0,0.3)',
              textShadowBlur: 2,
              padding: [4, 0, 2, 0]
            },
            pct: {
              fontSize: 10,
              color: 'rgba(255,255,255,0.8)'
            }
          },
          position: 'inside',
          align: 'center',
          verticalAlign: 'middle'
        },
        itemStyle: {
          borderColor: isDark ? '#1e293b' : '#fff',
          borderWidth: 2,
          gapWidth: 2
        },
        levels: [{
          itemStyle: {
            borderWidth: 0,
            gapWidth: 4
          }
        }]
      }]
    }
  }, [statistics, textColor, tooltipBg, tooltipBorder, isDark])

  // =========================================================================
  // WATCH LIST DATA
  // =========================================================================
  const watchListData = useMemo(() => {
    return features
      .filter(f => f.properties.current_status === 'DELAYED')
      .sort((a, b) => {
        // Sort by opposition count (desc), then by date (desc)
        const aOpp = a.properties.opposition_count || 0
        const bOpp = b.properties.opposition_count || 0
        if (aOpp !== bOpp) return bOpp - aOpp

        const aDate = a.properties.status_date || ''
        const bDate = b.properties.status_date || ''
        return bDate.localeCompare(aDate)
      })
      .slice(0, 15)
  }, [features])

  // =========================================================================
  // LOADING STATE
  // =========================================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`w-10 h-10 border-3 rounded-full animate-spin ${isDark ? 'border-white/10 border-t-indigo-500' : 'border-black/10 border-t-indigo-500'}`} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Status Over Time + Stage Exit */}
      <div className="grid grid-cols-2 gap-6">
        {/* Chart 1: Project Status Over Time */}
        <div className="glass-card-solid p-4 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              At-Risk + Failed Projects Over Time
            </h3>
            <div className="flex items-center gap-3">
              <select
                value={timeGranularity}
                onChange={(e) => setTimeGranularity(e.target.value as 'quarter' | 'year' | 'month')}
                className={`text-xs px-2 py-1 rounded-lg border ${
                  isDark
                    ? 'bg-slate-700 border-white/10 text-white'
                    : 'bg-white border-black/10 text-slate-800'
                }`}
              >
                <option value="quarter">By Quarter</option>
                <option value="year">By Year</option>
                <option value="month">By Month</option>
              </select>
              <ChartInfoButton chartId="status-time" isDark={isDark} />
            </div>
          </div>
          {statusTimeChartOption && (
            <ReactECharts option={statusTimeChartOption} style={{ height: '320px' }} />
          )}
        </div>

        {/* Chart 2: Stage Exit Analysis */}
        <div className="glass-card-solid p-4 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Project Stage Exit Analysis
            </h3>
            <ChartInfoButton chartId="stage-exit" isDark={isDark} />
          </div>
          {stageExitChartOption && (
            <ReactECharts option={stageExitChartOption} style={{ height: '320px' }} />
          )}
        </div>
      </div>

      {/* Row 2: Opposition Treemap + Watch List */}
      <div className="grid grid-cols-2 gap-6">
        {/* Chart 3: Community Opposition Treemap */}
        <div className="glass-card-solid p-4 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Community Opposition Categories
            </h3>
            <ChartInfoButton chartId="opposition" isDark={isDark} />
          </div>
          {oppositionTreemapOption && (
            <ReactECharts option={oppositionTreemapOption} style={{ height: '320px' }} />
          )}
        </div>

        {/* Chart 4: Watch List Table */}
        <div className="glass-card-solid p-4 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Watch List - Delayed Projects
            </h3>
            <ChartInfoButton chartId="watchlist" isDark={isDark} />
          </div>
          <div className="overflow-auto max-h-[320px]">
            <table className="w-full text-xs">
              <thead className={`sticky top-0 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <tr className={`border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                  <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Facility</th>
                  <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Location</th>
                  <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Opposition</th>
                  <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Stage</th>
                </tr>
              </thead>
              <tbody>
                {watchListData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={`text-center py-8 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                      No delayed projects found
                    </td>
                  </tr>
                ) : (
                  watchListData.map((f, idx) => {
                    const oppLevel = getOppositionLevel(f.properties.opposition_count || 0)
                    const shortName = (f.properties.facility_name || 'Unknown').split(':')[0]
                    const stageLabel = STAGE_LABELS[f.properties.stage_gate || 'UNKNOWN'] || 'Unknown'

                    return (
                      <tr
                        key={f.properties.uid || idx}
                        className={`border-b cursor-pointer transition-colors ${
                          isDark
                            ? 'border-white/5 hover:bg-white/5'
                            : 'border-black/5 hover:bg-black/5'
                        }`}
                        onClick={() => setSelectedProject(f)}
                        title={f.properties.facility_name}
                      >
                        <td className={`py-2 px-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          <div className="truncate max-w-[140px]">{shortName}</div>
                        </td>
                        <td className={`py-2 px-2 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                          {f.properties.city}, {f.properties.state}
                        </td>
                        <td className="py-2 px-2">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            oppLevel.class === 'critical' ? 'bg-red-500/20 text-red-400' :
                            oppLevel.class === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            oppLevel.class === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                            oppLevel.class === 'low' ? 'bg-blue-500/20 text-blue-400' :
                            isDark ? 'bg-white/10 text-white/50' : 'bg-black/5 text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              oppLevel.class === 'critical' ? 'bg-red-400' :
                              oppLevel.class === 'high' ? 'bg-orange-400' :
                              oppLevel.class === 'medium' ? 'bg-yellow-500' :
                              oppLevel.class === 'low' ? 'bg-blue-400' :
                              isDark ? 'bg-white/30' : 'bg-slate-300'
                            }`} />
                            {oppLevel.label}
                          </span>
                        </td>
                        <td className={`py-2 px-2 text-[10px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                          {stageLabel}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className={`max-w-xl mx-4 p-6 rounded-2xl shadow-2xl ${
              isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold pr-8">{selectedProject.properties.facility_name}</h3>
              <button
                onClick={() => setSelectedProject(null)}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {/* Project Info */}
              <div>
                <h4 className={`font-medium mb-2 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Project Information</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className={isDark ? 'text-white/50' : 'text-slate-400'}>Location:</span> {selectedProject.properties.city}, {selectedProject.properties.state}</div>
                  <div><span className={isDark ? 'text-white/50' : 'text-slate-400'}>County:</span> {selectedProject.properties.county || 'N/A'}</div>
                  <div><span className={isDark ? 'text-white/50' : 'text-slate-400'}>Developer:</span> {selectedProject.properties.developer || 'N/A'}</div>
                  <div><span className={isDark ? 'text-white/50' : 'text-slate-400'}>Status Date:</span> {selectedProject.properties.status_date || 'N/A'}</div>
                  {selectedProject.properties.capacity_mw && (
                    <div><span className={isDark ? 'text-white/50' : 'text-slate-400'}>Capacity:</span> {selectedProject.properties.capacity_mw} MW</div>
                  )}
                  {selectedProject.properties.cost_billions_usd && (
                    <div><span className={isDark ? 'text-white/50' : 'text-slate-400'}>Est. Cost:</span> ${selectedProject.properties.cost_billions_usd}B</div>
                  )}
                </div>
              </div>

              {/* Phase Detail */}
              {selectedProject.properties.phase_detail && (
                <div>
                  <h4 className={`font-medium mb-2 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Status Details</h4>
                  <p className={isDark ? 'text-white/80' : 'text-slate-700'}>{selectedProject.properties.phase_detail}</p>
                </div>
              )}

              {/* Opposition */}
              {selectedProject.properties.has_opposition && (
                <div>
                  <h4 className={`font-medium mb-2 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Community Opposition</h4>
                  {selectedProject.properties.opposition_factors && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedProject.properties.opposition_factors.map(factor => (
                        <span
                          key={factor}
                          className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-white/10' : 'bg-black/5'}`}
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  )}
                  {selectedProject.properties.community_detail && (
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                      {selectedProject.properties.community_detail}
                    </p>
                  )}
                </div>
              )}

              {/* Source Link */}
              {selectedProject.properties.primary_source && (
                <div className="pt-2">
                  <a
                    href={selectedProject.properties.primary_source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Primary Source
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
