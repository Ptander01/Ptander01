import { AlertTriangle, XCircle, Clock, DollarSign, Zap, Users } from 'lucide-react'
import { Statistics } from '../types'
import { useTheme } from '../contexts/ThemeContext'

interface KPICardsProps {
  statistics: Statistics | null
  filteredCount: number
  loading: boolean
}

export default function KPICards({ statistics, filteredCount, loading }: KPICardsProps) {
  const { isDark } = useTheme()
  const summary = statistics?.summary

  const cards = [
    {
      label: 'At-Risk Projects',
      value: filteredCount,
      total: summary?.total_projects || 0,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      label: 'Blocked',
      value: summary?.blocked_count || 0,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
    {
      label: 'Delayed',
      value: summary?.delayed_count || 0,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      label: 'Withdrawn',
      value: summary?.withdrawn_count || 0,
      icon: XCircle,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/30',
    },
    {
      label: 'Capacity at Risk',
      value: summary?.total_capacity_gw?.toFixed(1) || '0',
      suffix: 'GW',
      icon: Zap,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
    },
    {
      label: 'Investment at Risk',
      value: summary?.total_cost_billions?.toFixed(1) || '0',
      prefix: '$',
      suffix: 'B',
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
    },
    {
      label: 'Community Opposition',
      value: summary?.with_opposition || 0,
      icon: Users,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
  ]

  return (
    <div className="grid grid-cols-7 gap-3">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`glass-card p-4 border ${card.borderColor} transition-all duration-200 hover:scale-[1.02]`}
        >
          {loading ? (
            <div className="animate-pulse flex flex-col items-center">
              <div className={`h-4 rounded w-20 mb-2 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
              <div className={`h-8 rounded w-16 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
                <span className={`text-xs uppercase tracking-wide font-semibold ${isDark ? 'text-white/50' : 'text-slate-600'}`}>{card.label}</span>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                {card.prefix && <span className={`text-lg font-bold ${card.color}`}>{card.prefix}</span>}
                <span className={`text-2xl font-bold ${card.color}`}>
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </span>
                {card.suffix && <span className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{card.suffix}</span>}
                {card.total && card.total > 0 && (
                  <span className={`text-xs ml-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>/ {card.total}</span>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
