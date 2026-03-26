import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, Columns, Download } from 'lucide-react'
import { useTimeline } from '../context/TimelineContext'
import { useTheme } from '../context/ThemeContext'

export default function TimelineSlider() {
  const {
    currentDate,
    setCurrentDate,
    availableDates,
    isPlaying,
    setIsPlaying
  } = useTimeline()

  const { isDark } = useTheme()

  const [sliderValue, setSliderValue] = useState(100)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Generate sample dates if none available (for demo purposes)
  const dates = availableDates.length > 0 ? availableDates : generateSampleDates()

  // Update current date when slider changes
  useEffect(() => {
    if (dates.length === 0) return
    const index = Math.floor((sliderValue / 100) * (dates.length - 1))
    setCurrentDate(dates[index])
  }, [sliderValue, dates, setCurrentDate])

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false)
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    } else {
      setIsPlaying(true)
      playIntervalRef.current = setInterval(() => {
        setSliderValue(prev => {
          if (prev >= 100) {
            setIsPlaying(false)
            return 100
          }
          return prev + (100 / dates.length)
        })
      }, 1000)
    }
  }, [isPlaying, setIsPlaying, dates.length])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Select date'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Generate tick marks
  const tickDates = dates.length > 0 ? [
    dates[0],
    dates[Math.floor(dates.length * 0.25)],
    dates[Math.floor(dates.length * 0.5)],
    dates[Math.floor(dates.length * 0.75)],
    dates[dates.length - 1],
  ] : []

  return (
    <div className={`px-6 py-4 shrink-0 theme-transition ${
      isDark
        ? 'bg-slate-900 border-t border-slate-700'
        : 'bg-white border-t border-slate-200 shadow-sm'
    }`}>
      <div className="flex items-center gap-6">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isDark
              ? 'bg-slate-700 hover:bg-slate-600'
              : 'bg-slate-100 hover:bg-slate-200'
          }`}
        >
          {isPlaying ? (
            <Pause className={`w-5 h-5 ${isDark ? 'text-white' : 'text-slate-700'}`} />
          ) : (
            <Play className={`w-5 h-5 ${isDark ? 'text-white' : 'text-slate-700'}`} />
          )}
        </button>

        {/* Slider */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Timeline</span>
            <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatDate(currentDate)}</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="timeline-slider"
          />

          <div className={`flex justify-between mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {tickDates.map((date, i) => (
              <span key={i}>{formatDate(date)}</span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 transition-colors ${
            isDark
              ? 'bg-slate-700 text-white hover:bg-slate-600'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}>
            <Columns className="w-4 h-4" />
            Compare
          </button>
          <button className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 flex items-center gap-1">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper to generate sample dates for demo
function generateSampleDates(): string[] {
  const dates: string[] = []
  const start = new Date('2025-01-15')
  const end = new Date('2026-02-22')

  let current = new Date(start)
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 7) // Weekly intervals
  }

  return dates
}
