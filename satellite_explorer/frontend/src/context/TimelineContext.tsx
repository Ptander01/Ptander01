import { createContext, useContext, useState, ReactNode } from 'react'

interface TimelineContextType {
  currentDate: string | null
  setCurrentDate: (date: string | null) => void
  availableDates: string[]
  setAvailableDates: (dates: string[]) => void
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
}

const TimelineContext = createContext<TimelineContextType | null>(null)

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [currentDate, setCurrentDate] = useState<string | null>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <TimelineContext.Provider value={{
      currentDate,
      setCurrentDate,
      availableDates,
      setAvailableDates,
      isPlaying,
      setIsPlaying,
    }}>
      {children}
    </TimelineContext.Provider>
  )
}

export function useTimeline() {
  const context = useContext(TimelineContext)
  if (!context) {
    throw new Error('useTimeline must be used within TimelineProvider')
  }
  return context
}
