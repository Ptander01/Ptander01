import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { Feature, Statistics } from '../types'
import { useFilters } from '../App'

interface ChartsProps {
  features: Feature[]
  statistics: Statistics | null
  loading: boolean
}

// Capacity bucket definitions
const CAPACITY_BUCKETS = [
  { label: '0-25 MW', min: 0, max: 25 },
  { label: '25-100 MW', min: 25, max: 100 },
  { label: '100-250 MW', min: 100, max: 250 },
  { label: '250-500 MW', min: 250, max: 500 },
  { label: '500-1000 MW', min: 500, max: 1000 },
  { label: '1000+ MW', min: 1000, max: Infinity },
]

// Hyperscaler companies for the histogram (exclude "Colo - All Other" for cleaner view)
const HISTOGRAM_COMPANIES = ['AWS', 'Microsoft', 'Google', 'Meta', 'Apple', 'Oracle', 'xAI', 'Alibaba']

// Company colors - MUST match MapContainer.tsx legend colors exactly
const COMPANY_COLORS: Record<string, string> = {
  'AWS': '#FF9900',           // Orange
  'Microsoft': '#8dc63f',     // Green (matches map)
  'Google': '#ea4335',        // Red (matches map)
  'Meta': '#0064e0',          // Blue (matches map)
  'Apple': '#A2AAAD',         // Gray
  'Oracle': '#c74634',        // Reddish (matches map)
  'xAI': '#333333',           // Dark gray
  'Alibaba': '#FF6A00',       // Orange
  'Colo - All Other': '#6B7280', // Gray
}

// Capacity type labels for chart title
const CAPACITY_TYPE_LABELS: Record<string, string> = {
  'full_capacity_mw': 'Full Capacity',
  'commissioned_power_mw': 'Commissioned',
  'capacity_under_construction_mw': 'Under Construction',
  'planned_capacity_mw': 'Planned',
}

export default function Charts({ features, statistics, loading }: ChartsProps) {
  const { filters } = useFilters()
  // Capacity Distribution Histogram - Grouped by Company
  const capacityDistributionData = useMemo(() => {
    if (!features.length) return null

    // Use the selected capacity type from filters
    const capacityField = filters.capacityType

    // Initialize bucket counts for each company
    const bucketData: Record<string, Record<string, number>> = {}
    HISTOGRAM_COMPANIES.forEach(company => {
      bucketData[company] = {}
      CAPACITY_BUCKETS.forEach(bucket => {
        bucketData[company][bucket.label] = 0
      })
    })

    // Count sites per bucket per company
    features.forEach(f => {
      const company = f.properties.company_clean_filter || 'Colo - All Other'
      if (!HISTOGRAM_COMPANIES.includes(company)) return // Skip non-hyperscalers

      const capacity = f.properties[capacityField] || 0
      if (capacity <= 0) return // Skip sites with no capacity data for this type

      // Find the right bucket
      for (const bucket of CAPACITY_BUCKETS) {
        if (capacity >= bucket.min && capacity < bucket.max) {
          bucketData[company][bucket.label]++
          break
        }
      }
    })

    return bucketData
  }, [features, filters.capacityType])

  // Capacity Distribution Histogram Chart
  const capacityDistributionOption = useMemo(() => {
    if (!capacityDistributionData) return null

    const capacityTypeLabel = CAPACITY_TYPE_LABELS[filters.capacityType] || 'Capacity'

    // Build series for each company
    const series = HISTOGRAM_COMPANIES.map(company => ({
      name: company,
      type: 'bar',
      data: CAPACITY_BUCKETS.map(bucket => capacityDistributionData[company][bucket.label]),
      itemStyle: {
        color: COMPANY_COLORS[company],
        borderRadius: [2, 2, 0, 0]
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.3)'
        }
      }
    }))

    return {
      backgroundColor: 'transparent',
      title: {
        text: `Sites by ${capacityTypeLabel} (Hyperscalers)`,
        subtext: 'Number of sites in each capacity range',
        textStyle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600 },
        subtextStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
        left: 16,
        top: 16,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#fff' },
        formatter: (params: any[]) => {
          let html = `<b>${params[0].axisValue}</b><br/>`
          params.forEach((p: any) => {
            if (p.value > 0) {
              html += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>${p.seriesName}: ${p.value} sites<br/>`
            }
          })
          return html
        }
      },
      legend: {
        data: HISTOGRAM_COMPANIES,
        textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
        top: 50,
        left: 'center',
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 15,
      },
      grid: {
        left: 60,
        right: 40,
        top: 100,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: CAPACITY_BUCKETS.map(b => b.label),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: {
          color: 'rgba(255,255,255,0.7)',
          fontSize: 11,
          rotate: 0
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'Number of Sites',
        nameTextStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)' },
      },
      series
    }
  }, [capacityDistributionData, filters.capacityType])
  const chartData = useMemo(() => {
    if (!features.length) return null

    // Capacity by company
    const byCompany: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    const byRegion: Record<string, number> = {}
    const bySource: Record<string, number> = {}

    features.forEach(f => {
      const props = f.properties
      const mw = props.full_capacity_mw || 0

      // By company
      const company = props.company_clean_filter || 'Other'
      byCompany[company] = (byCompany[company] || 0) + mw

      // By status
      const status = props.facility_status || 'Unknown'
      byStatus[status] = (byStatus[status] || 0) + mw

      // By region
      const region = props.region || 'Unknown'
      byRegion[region] = (byRegion[region] || 0) + mw

      // By source
      const source = props.source || 'Unknown'
      bySource[source] = (bySource[source] || 0) + 1
    })

    return { byCompany, byStatus, byRegion, bySource }
  }, [features])

  // Company colors - reuse the constant
  const companyColors = COMPANY_COLORS

  // Capacity by Company Chart
  const companyChartOption = useMemo(() => {
    if (!chartData) return {}

    const sortedData = Object.entries(chartData.byCompany)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    return {
      backgroundColor: 'transparent',
      title: {
        text: 'Capacity by Company',
        textStyle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600 },
        left: 16,
        top: 16,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#fff' },
        formatter: (params: { name: string; value: number }[]) => {
          const p = params[0]
          return `<b>${p.name}</b><br/>Capacity: ${(p.value / 1000).toFixed(1)} GW`
        }
      },
      grid: {
        left: 100,
        right: 40,
        top: 60,
        bottom: 20,
      },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: {
          color: 'rgba(255,255,255,0.5)',
          formatter: (val: number) => `${(val / 1000).toFixed(0)} GW`
        },
      },
      yAxis: {
        type: 'category',
        data: sortedData.map(d => d[0]).reverse(),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
      },
      series: [{
        type: 'bar',
        data: sortedData.map(d => ({
          value: d[1],
          itemStyle: { color: companyColors[d[0]] || '#6B7280' }
        })).reverse(),
        barWidth: 20,
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' }
        }
      }]
    }
  }, [chartData])

  // Status Pie Chart
  const statusChartOption = useMemo(() => {
    if (!chartData) return {}

    const statusColors: Record<string, string> = {
      'Active': '#10b981',
      'Under Construction': '#f59e0b',
      'Announced': '#3b82f6',
      'Planned': '#8b5cf6',
      'Cancelled': '#f43f5e',
    }

    const data = Object.entries(chartData.byStatus)
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
        itemStyle: { color: statusColors[name] || '#6B7280' }
      }))
      .sort((a, b) => b.value - a.value)

    return {
      backgroundColor: 'transparent',
      title: {
        text: 'Capacity by Status',
        textStyle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600 },
        left: 16,
        top: 16,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#fff' },
        formatter: (params: { name: string; value: number; percent: number }) =>
          `<b>${params.name}</b><br/>${(params.value / 1000).toFixed(1)} GW (${params.percent.toFixed(1)}%)`
      },
      legend: {
        orient: 'vertical',
        right: 20,
        top: 'middle',
        textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
      },
      series: [{
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['35%', '55%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: 600, color: '#fff' }
        },
        data,
      }]
    }
  }, [chartData])

  // Region Chart
  const regionChartOption = useMemo(() => {
    if (!chartData) return {}

    const regionColors: Record<string, string> = {
      'AMER': '#3b82f6',
      'EMEA': '#8b5cf6',
      'APAC': '#10b981',
    }

    const data = Object.entries(chartData.byRegion)
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
        itemStyle: { color: regionColors[name] || '#6B7280' }
      }))
      .sort((a, b) => b.value - a.value)

    return {
      backgroundColor: 'transparent',
      title: {
        text: 'Capacity by Region',
        textStyle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600 },
        left: 16,
        top: 16,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#fff' },
        formatter: (params: { name: string; value: number; percent: number }) =>
          `<b>${params.name}</b><br/>${(params.value / 1000).toFixed(1)} GW (${params.percent.toFixed(1)}%)`
      },
      series: [{
        type: 'pie',
        radius: '60%',
        center: ['50%', '55%'],
        roseType: 'radius',
        label: {
          color: 'rgba(255,255,255,0.8)',
          fontSize: 11,
          formatter: '{b}\n{d}%'
        },
        data,
      }]
    }
  }, [chartData])

  // Source Distribution Chart
  const sourceChartOption = useMemo(() => {
    if (!chartData) return {}

    const data = Object.entries(chartData.bySource)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    return {
      backgroundColor: 'transparent',
      title: {
        text: 'Records by Source',
        textStyle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600 },
        left: 16,
        top: 16,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#fff' },
      },
      grid: {
        left: 120,
        right: 40,
        top: 60,
        bottom: 20,
      },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)' },
      },
      yAxis: {
        type: 'category',
        data: data.map(d => d.name).reverse(),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
      },
      series: [{
        type: 'bar',
        data: data.map(d => d.value).reverse(),
        barWidth: 16,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#8b5cf6' }
            ]
          },
          borderRadius: [0, 4, 4, 0]
        },
      }]
    }
  }, [chartData])

  // Year-over-year forecast (from statistics)
  const yearChartOption = useMemo(() => {
    if (!statistics?.by_year) return null

    const years = Object.keys(statistics.by_year).sort()
    const values = years.map(y => statistics.by_year![y] / 1000) // Convert to GW

    return {
      backgroundColor: 'transparent',
      title: {
        text: 'Capacity Forecast (Semianalysis)',
        textStyle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600 },
        left: 16,
        top: 16,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#fff' },
        formatter: (params: { name: string; value: number }[]) => {
          const p = params[0]
          return `<b>${p.name}</b><br/>Capacity: ${p.value.toFixed(1)} GW`
        }
      },
      grid: {
        left: 60,
        right: 40,
        top: 60,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: years,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: 'rgba(255,255,255,0.7)' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: {
          color: 'rgba(255,255,255,0.5)',
          formatter: (val: number) => `${val.toFixed(0)} GW`
        },
      },
      series: [{
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#f59e0b' }
            ]
          }
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
            ]
          }
        },
        itemStyle: {
          color: '#3b82f6',
          borderWidth: 2,
          borderColor: '#fff'
        }
      }]
    }
  }, [statistics])

  if (loading) {
    return (
      <div className="h-[calc(100vh-280px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-white/10 border-t-accent-blue rounded-full animate-spin" />
          <span className="text-sm text-white/60">Loading charts...</span>
        </div>
      </div>
    )
  }

  if (!chartData) {
    return (
      <div className="h-[calc(100vh-280px)] flex items-center justify-center">
        <span className="text-white/50">No data available for charts</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-5 h-[calc(100vh-340px)] overflow-y-auto pb-4">
      {/* Capacity Distribution Histogram - Full Width */}
      {capacityDistributionOption && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl h-[380px] col-span-2 p-1 border border-white/10">
          <ReactECharts option={capacityDistributionOption} style={{ height: '100%' }} />
        </div>
      )}

      {/* Capacity by Company */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl h-[350px] p-1 border border-white/10">
        <ReactECharts option={companyChartOption} style={{ height: '100%' }} />
      </div>

      {/* Capacity by Status */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl h-[350px] p-1 border border-white/10">
        <ReactECharts option={statusChartOption} style={{ height: '100%' }} />
      </div>

      {/* Capacity by Region */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl h-[350px] p-1 border border-white/10">
        <ReactECharts option={regionChartOption} style={{ height: '100%' }} />
      </div>

      {/* Records by Source */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl h-[350px] p-1 border border-white/10">
        <ReactECharts option={sourceChartOption} style={{ height: '100%' }} />
      </div>

      {/* Year-over-year Forecast */}
      {yearChartOption && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl h-[350px] col-span-2 p-1 border border-white/10">
          <ReactECharts option={yearChartOption} style={{ height: '100%' }} />
        </div>
      )}
    </div>
  )
}
