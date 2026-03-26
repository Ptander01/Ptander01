import { Satellite, Settings, HelpCircle, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Header() {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <header className={`px-6 py-3 flex items-center justify-between shrink-0 theme-transition ${
      isDark
        ? 'bg-slate-900 text-white border-b border-slate-700'
        : 'bg-white text-slate-900 border-b border-slate-200 shadow-sm'
    }`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Satellite className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-lg">DCII Satellite Explorer</span>
        </div>
        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>|</span>
        <span className={isDark ? 'text-slate-400' : 'text-slate-500'} style={{ fontSize: '0.875rem' }}>Infra Intelligence</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Last Updated:</span>
          <span className="text-green-500 font-medium">{new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDark
                ? 'hover:bg-slate-700 text-slate-400 hover:text-yellow-400'
                : 'hover:bg-slate-100 text-slate-500 hover:text-blue-600'
            }`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 theme-toggle-icon" />
            ) : (
              <Moon className="w-4 h-4 theme-toggle-icon" />
            )}
          </button>

          <button className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
          }`}>
            <Settings className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </button>
          <button className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
          }`}>
            <HelpCircle className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </button>
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-medium text-white">
            PA
          </div>
        </div>
      </div>
    </header>
  )
}
