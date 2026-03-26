import { Map, Table, BarChart3, Download, Sun, Moon, Sparkles } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface HeaderProps {
  activeView: 'map' | 'table' | 'charts'
  setActiveView: (view: 'map' | 'table' | 'charts') => void
  onExportCSV: () => void
  onExportGeoJSON: () => void
}

export default function Header({
  activeView,
  setActiveView,
  onExportCSV,
  onExportGeoJSON,
}: HeaderProps) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="h-16 glass-card-solid flex items-center justify-between px-6">
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Proposed & At Risk Data Centers
          </h1>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Infra Intel Opposition, Outcomes, and Mitigation Strategies Tracker</p>
        </div>
      </div>

      {/* View Switcher */}
      <div className={`flex items-center gap-2 rounded-xl p-1.5 ${
        isDark
          ? 'bg-slate-800/50'
          : 'bg-slate-200/80 shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.9)]'
      }`}>
        <button
          onClick={() => setActiveView('map')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            activeView === 'map'
              ? isDark
                ? 'bg-white/10 text-white shadow-lg'
                : 'bg-white text-slate-800 shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.9)]'
              : isDark
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Map className="w-4 h-4" />
          <span className="text-sm font-medium">Map</span>
        </button>
        <button
          onClick={() => setActiveView('table')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            activeView === 'table'
              ? isDark
                ? 'bg-white/10 text-white shadow-lg'
                : 'bg-white text-slate-800 shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.9)]'
              : isDark
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Table className="w-4 h-4" />
          <span className="text-sm font-medium">Table</span>
        </button>
        <button
          onClick={() => setActiveView('charts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            activeView === 'charts'
              ? isDark
                ? 'bg-white/10 text-white shadow-lg'
                : 'bg-white text-slate-800 shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.9)]'
              : isDark
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-sm font-medium">Charts</span>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`theme-toggle p-2.5 rounded-xl ${
            isDark
              ? 'bg-white/5 hover:bg-white/10 text-amber-400'
              : 'bg-black/5 hover:bg-black/10 text-slate-600'
          }`}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Export Buttons */}
        <button
          onClick={onExportCSV}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
            isDark
              ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
              : 'bg-black/5 hover:bg-black/10 text-slate-600 hover:text-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">CSV</span>
        </button>
        <button
          onClick={onExportGeoJSON}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
            isDark
              ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
              : 'bg-black/5 hover:bg-black/10 text-slate-600 hover:text-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">GeoJSON</span>
        </button>
      </div>
    </header>
  )
}
