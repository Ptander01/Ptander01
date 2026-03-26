import { Map, Download, Table2, BarChart3, Layers, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface HeaderProps {
  activeView: 'map' | 'table' | 'charts'
  setActiveView: (view: 'map' | 'table' | 'charts') => void
  layer: 'combined' | 'campuses' | 'buildings'
  setLayer: (layer: 'combined' | 'campuses' | 'buildings') => void
  onExportCSV: () => void
  onExportGeoJSON: () => void
}

export default function Header({
  activeView,
  setActiveView,
  layer,
  setLayer,
  onExportCSV,
  onExportGeoJSON
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="h-16 px-6 flex items-center justify-between frosted-header sticky top-0 z-50">
      {/* Logo & Title */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
          <span className="text-white font-bold text-lg">DC</span>
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Global Data Center Locations - Consensus Model
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Infra Comp Intel</p>
        </div>
      </div>

      {/* Center - View Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
        <button
          onClick={() => setActiveView('map')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'map'
              ? 'bg-accent-blue text-white shadow-lg'
              : 'hover:bg-white/5'
          }`}
          style={activeView !== 'map' ? { color: 'var(--text-secondary)' } : {}}
        >
          <Map size={16} />
          Map
        </button>
        <button
          onClick={() => setActiveView('table')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'table'
              ? 'bg-accent-blue text-white shadow-lg'
              : 'hover:bg-white/5'
          }`}
          style={activeView !== 'table' ? { color: 'var(--text-secondary)' } : {}}
        >
          <Table2 size={16} />
          Table
        </button>
        <button
          onClick={() => setActiveView('charts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'charts'
              ? 'bg-accent-blue text-white shadow-lg'
              : 'hover:bg-white/5'
          }`}
          style={activeView !== 'charts' ? { color: 'var(--text-secondary)' } : {}}
        >
          <BarChart3 size={16} />
          Charts
        </button>
      </div>

      {/* Right - Layer Toggle & Export */}
      <div className="flex items-center gap-3">
        {/* Layer Toggle */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          <Layers size={14} style={{ color: 'var(--text-muted)' }} />
          <select
            value={layer}
            onChange={(e) => setLayer(e.target.value as 'combined' | 'campuses' | 'buildings')}
            className="bg-transparent text-sm border-none outline-none cursor-pointer"
            style={{ color: 'var(--text-primary)' }}
          >
            <option value="combined" style={{ background: 'var(--dropdown-bg)', color: 'var(--text-primary)' }}>All Records (XB)</option>
            <option value="campuses" style={{ background: 'var(--dropdown-bg)', color: 'var(--text-primary)' }}>Campuses Only</option>
            <option value="buildings" style={{ background: 'var(--dropdown-bg)', color: 'var(--text-primary)' }}>Buildings Only</option>
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:opacity-80 transition-all"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={18} className="text-amber-400" />
          ) : (
            <Moon size={18} className="text-blue-500" />
          )}
        </button>

        {/* Export Dropdown */}
        <div className="relative group">
          <button className="neo-button flex items-center gap-2 text-sm">
            <Download size={16} />
            Export
          </button>
          <div className="absolute right-0 top-full mt-2 py-2 w-48 rounded-xl backdrop-blur-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50"
               style={{ background: 'var(--dropdown-bg)', border: '1px solid var(--glass-border)' }}>
            <button
              onClick={onExportCSV}
              className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Export as CSV
            </button>
            <button
              onClick={onExportGeoJSON}
              className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Export as GeoJSON
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
