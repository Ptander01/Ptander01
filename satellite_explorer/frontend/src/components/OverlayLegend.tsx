import { useState } from 'react'
import {
  Building2, Zap, Flame, Battery, Snowflake, Database, Wifi, EyeOff, Eye
} from 'lucide-react'
import { InfrastructureCategory, INFRASTRUCTURE_CATEGORIES } from '../types'
import { useTheme } from '../context/ThemeContext'

interface OverlayLegendProps {
  visibleCategories: Set<InfrastructureCategory>
  onToggleCategory: (category: InfrastructureCategory) => void
  onHoverCategory: (category: InfrastructureCategory | null) => void
  onToggleAll: () => void
  allHidden: boolean
  hoveredCategory: InfrastructureCategory | null
}

const CATEGORY_ICONS: Record<InfrastructureCategory, React.ReactNode> = {
  building: <Building2 className="w-3.5 h-3.5" />,
  grid_power: <Zap className="w-3.5 h-3.5" />,
  onsite_power: <Flame className="w-3.5 h-3.5" />,
  backup_power: <Battery className="w-3.5 h-3.5" />,
  cooling: <Snowflake className="w-3.5 h-3.5" />,
  storage: <Database className="w-3.5 h-3.5" />,
  network: <Wifi className="w-3.5 h-3.5" />,
}

const CATEGORY_ORDER: InfrastructureCategory[] = [
  'building',
  'grid_power',
  'onsite_power',
  'backup_power',
  'cooling',
  'storage',
  'network'
]

export default function OverlayLegend({
  visibleCategories,
  onToggleCategory,
  onHoverCategory,
  onToggleAll,
  allHidden,
  hoveredCategory
}: OverlayLegendProps) {
  const { isDark } = useTheme()

  return (
    <div className={`
      absolute bottom-20 left-1/2 -translate-x-1/2 z-20
      flex items-center gap-1 px-3 py-2 rounded-xl
      backdrop-blur-xl shadow-2xl
      transition-all duration-300
      ${isDark
        ? 'bg-slate-900/90 border border-slate-700/50'
        : 'bg-white/95 border border-slate-200/80 shadow-lg'
      }
    `}>
      {CATEGORY_ORDER.map((category) => {
        const config = INFRASTRUCTURE_CATEGORIES[category]
        const isVisible = visibleCategories.has(category)
        const isHovered = hoveredCategory === category
        const isOtherHovered = hoveredCategory !== null && hoveredCategory !== category

        return (
          <button
            key={category}
            onClick={() => onToggleCategory(category)}
            onMouseEnter={() => onHoverCategory(category)}
            onMouseLeave={() => onHoverCategory(null)}
            className={`
              group relative flex items-center gap-2 px-3 py-2 rounded-lg
              transition-all duration-200 ease-out
              ${isVisible ? 'opacity-100' : 'opacity-40'}
              ${isHovered ? 'scale-105' : isOtherHovered ? 'opacity-30 scale-95' : ''}
              ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}
            `}
            title={`${isVisible ? 'Hide' : 'Show'} ${config.label}`}
          >
            {/* Color indicator with glow effect */}
            <div
              className={`
                w-3 h-3 rounded-sm transition-all duration-200
                ${isHovered ? 'scale-125 shadow-lg' : ''}
              `}
              style={{
                backgroundColor: config.color,
                boxShadow: isHovered ? `0 0 12px ${config.glowColor}` : 'none'
              }}
            />

            {/* Icon */}
            <span
              className="transition-colors duration-200"
              style={{ color: isHovered ? config.color : isDark ? '#94a3b8' : '#64748b' }}
            >
              {CATEGORY_ICONS[category]}
            </span>

            {/* Label */}
            <span className={`
              text-xs font-medium whitespace-nowrap
              transition-colors duration-200
              ${isDark ? 'text-slate-300' : 'text-slate-600'}
              ${isHovered ? 'text-white' : ''}
            `}
              style={{ color: isHovered ? config.color : undefined }}
            >
              {config.label}
            </span>

            {/* Active indicator bar */}
            {isVisible && (
              <div
                className={`
                  absolute bottom-0 left-2 right-2 h-0.5 rounded-full
                  transition-all duration-200
                  ${isHovered ? 'opacity-100' : 'opacity-60'}
                `}
                style={{ backgroundColor: config.color }}
              />
            )}
          </button>
        )
      })}

      {/* Divider */}
      <div className={`w-px h-6 mx-1 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />

      {/* Toggle All Button */}
      <button
        onClick={onToggleAll}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          transition-all duration-200
          ${isDark
            ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
          }
        `}
        title={allHidden ? 'Show all overlays' : 'Hide all overlays'}
      >
        {allHidden ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
        <span className="text-xs font-medium">
          {allHidden ? 'Show all' : 'Hide all'}
        </span>
      </button>
    </div>
  )
}
