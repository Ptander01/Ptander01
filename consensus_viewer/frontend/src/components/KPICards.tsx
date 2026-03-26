import { Building2, MapPin, Zap, TrendingUp, Filter } from 'lucide-react'
import { Feature, Statistics } from '../types'
import { useMemo } from 'react'

interface KPICardsProps {
  statistics: Statistics | null
  features: Feature[]
  loading: boolean
  isFiltered: boolean
}

export default function KPICards({ statistics, features, loading, isFiltered }: KPICardsProps) {
  // Calculate filtered statistics from the current features array
  const filteredStats = useMemo(() => {
    if (!features || features.length === 0) {
      return {
        totalCampuses: 0,
        totalBuildings: 0,
        totalCapacityMw: 0,
        totalCapacityGw: 0,
        avgMwPerCampus: 0,
        commissionedMw: 0,
      }
    }

    let totalCampuses = 0
    let totalBuildings = 0
    let totalCapacityMw = 0
    let commissionedMw = 0

    features.forEach(feature => {
      const props = feature.properties
      const recordLevel = props?.record_level || 'Building'

      if (recordLevel === 'Campus') {
        totalCampuses++
      } else {
        totalBuildings++
      }

      // Sum capacity
      const fullCapacity = parseFloat(props?.full_capacity_mw) || 0
      const commissioned = parseFloat(props?.commissioned_power_mw) || 0

      totalCapacityMw += fullCapacity
      commissionedMw += commissioned
    })

    const avgMwPerCampus = totalCampuses > 0 ? totalCapacityMw / totalCampuses : 0

    return {
      totalCampuses,
      totalBuildings,
      totalCapacityMw,
      totalCapacityGw: totalCapacityMw / 1000,
      avgMwPerCampus,
      commissionedMw,
    }
  }, [features])

  // Use filtered stats if filters are active, otherwise use global statistics
  const displayStats = isFiltered ? filteredStats : {
    totalCampuses: statistics?.summary?.total_campuses ?? 0,
    totalBuildings: statistics?.summary?.total_buildings ?? 0,
    totalCapacityMw: statistics?.summary?.total_capacity_mw ?? 0,
    totalCapacityGw: statistics?.summary?.total_capacity_gw ?? 0,
    avgMwPerCampus: statistics?.summary?.avg_mw_per_campus ?? 0,
    commissionedMw: statistics?.summary?.commissioned_mw ?? 0,
  }

  const kpis = [
    {
      label: isFiltered ? 'Filtered Campuses' : 'Total Campuses',
      value: displayStats.totalCampuses.toLocaleString(),
      subtitle: isFiltered
        ? `of ${statistics?.summary?.total_campuses?.toLocaleString() ?? '-'} total`
        : 'Unique locations',
      icon: MapPin,
      color: 'text-accent-blue',
      bgColor: 'from-accent-blue/20',
    },
    {
      label: isFiltered ? 'Filtered Buildings' : 'Total Buildings',
      value: displayStats.totalBuildings.toLocaleString(),
      subtitle: isFiltered
        ? `of ${statistics?.summary?.total_buildings?.toLocaleString() ?? '-'} total`
        : 'Individual facilities',
      icon: Building2,
      color: 'text-accent-purple',
      bgColor: 'from-accent-purple/20',
    },
    {
      label: isFiltered ? 'Filtered Capacity' : 'Total Capacity',
      value: `${displayStats.totalCapacityGw.toFixed(1)} GW`,
      subtitle: isFiltered
        ? `${(displayStats.commissionedMw / 1000).toFixed(1)} GW commissioned`
        : `${(displayStats.commissionedMw / 1000).toFixed(0)} GW commissioned`,
      icon: Zap,
      color: 'text-accent-amber',
      bgColor: 'from-accent-amber/20',
    },
    {
      label: 'Avg Per Campus',
      value: displayStats.avgMwPerCampus > 0 ? `${displayStats.avgMwPerCampus.toFixed(0)} MW` : '-',
      subtitle: isFiltered ? 'Filtered mean' : 'Overall mean',
      icon: TrendingUp,
      color: 'text-accent-emerald',
      bgColor: 'from-accent-emerald/20',
    },
  ]

  return (
    <div className="relative">
      {/* Filter indicator badge */}
      {isFiltered && (
        <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 bg-accent-blue/20 backdrop-blur-sm border border-accent-blue/30 rounded-full px-3 py-1 text-xs text-accent-blue animate-fade-in">
          <Filter size={12} />
          <span>Filtered View</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div
            key={kpi.label}
            className={`kpi-card animate-slide-up opacity-0 ${isFiltered ? 'ring-1 ring-accent-blue/20' : ''}`}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
          >
            {loading ? (
              <>
                <div className="skeleton h-4 w-24 mb-2" />
                <div className="skeleton h-8 w-32 mb-1" />
                <div className="skeleton h-4 w-20" />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="kpi-label">{kpi.label}</span>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.bgColor} to-transparent flex items-center justify-center`}>
                    <kpi.icon size={16} className={kpi.color} />
                  </div>
                </div>
                <div className="kpi-value">{kpi.value}</div>
                <div className="kpi-subtitle">{kpi.subtitle}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
