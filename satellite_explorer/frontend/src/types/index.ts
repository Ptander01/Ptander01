// Site types
export interface Location {
  lat: number
  lng: number
}

export interface SiteLinks {
  slides?: string
  kiq_narrative?: string
  benchmarking?: string
  raw_imagery?: string
}

export interface SnapshotMetrics {
  estimated_mw?: number
  gpu_count?: number
  building_sqft?: number
  cooling_towers?: number
  chillers?: number
  generators?: number
  turbines?: number
  transformers?: number
  substations?: number
  percent_complete?: number
  construction_stage?: string
}

export interface ChangeDetection {
  type: 'equipment_added' | 'equipment_removed' | 'construction_progress' | 'capacity_change' | 'new_structure'
  category?: string
  delta?: number
  previous?: number | string
  current?: number | string
  description: string
  confidence?: number
}

export interface Snapshot {
  date: string
  image_url?: string
  metrics: SnapshotMetrics
  changes: ChangeDetection[]
  auto_extracted?: {
    buildings?: Array<{
      id: string
      geometry: object
      sqft: number
      stage: string
      confidence: number
    }>
    equipment?: Record<string, {
      count: number
      type?: string
      confidence: number
    }>
  }
  requires_review?: string[]
  reviewed?: boolean
  created_at?: string
  updated_at?: string
}

export interface Site {
  id: string
  name: string
  project?: string
  company: string
  location: Location
  address?: string
  cadence: 'weekly' | 'monthly' | 'irregular'
  status: 'under_construction' | 'operational' | 'planned' | 'announced'
  esri_layer_id?: string
  snapshots: Snapshot[]
  links?: SiteLinks
}

// API Response types
export interface SiteSummary {
  id: string
  name: string
  project?: string
  company: string
  location: Location
  cadence: string
  status: string
  snapshot_count: number
  latest_snapshot_date?: string
  latest_metrics: SnapshotMetrics
}

export interface SitesResponse {
  sites: SiteSummary[]
  count: number
  filters_applied: {
    company?: string
    cadence?: string
    status?: string
    search?: string
  }
}

export interface TimelineResponse {
  dates: string[]
  date_count: number
  date_range: {
    earliest?: string
    latest?: string
  }
  sites_by_date: Record<string, Array<{
    site_id: string
    site_name: string
    company: string
  }>>
}

export interface CompareResponse {
  site_id: string
  site_name: string
  date_before: string
  date_after: string
  days_between: number
  metrics_comparison: Record<string, {
    before: number
    after: number
    delta: number
    percent_change?: number
  }>
  changes_in_period: ChangeDetection[]
}

// UI State types
export interface FilterState {
  company: string
  cadence: string
  status: string
  search: string
}

export interface ViewState {
  activeView: 'explorer' | 'comparison' | 'table'
  selectedSiteId: string | null
  currentDate: string | null
  compareMode: boolean
  compareDateBefore: string | null
  compareDateAfter: string | null
}

// Infrastructure Overlay Types
export type InfrastructureCategory =
  | 'building'
  | 'grid_power'
  | 'onsite_power'
  | 'backup_power'
  | 'cooling'
  | 'storage'
  | 'network'

export interface InfrastructureFeature {
  id: string
  category: InfrastructureCategory
  label?: string
  sublabel?: string
  geometry: {
    type: 'Polygon' | 'Point'
    coordinates: number[][] | number[] // [lng, lat] pairs for polygon, [lng, lat] for point
  }
  properties?: {
    sqft?: number
    capacity_mw?: number
    count?: number
    status?: 'operational' | 'construction' | 'planned'
    confidence?: number
  }
}

export interface SiteOverlays {
  site_id: string
  snapshot_date?: string
  features: InfrastructureFeature[]
}

export const INFRASTRUCTURE_CATEGORIES: Record<InfrastructureCategory, {
  label: string
  color: string
  glowColor: string
  icon: string
}> = {
  building: {
    label: 'Data Hall',
    color: '#14b8a6',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    icon: 'building'
  },
  grid_power: {
    label: 'Grid Power',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    icon: 'zap'
  },
  onsite_power: {
    label: 'On-site Power',
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    icon: 'flame'
  },
  backup_power: {
    label: 'Backup Power',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    icon: 'battery'
  },
  cooling: {
    label: 'Cooling',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    icon: 'snowflake'
  },
  storage: {
    label: 'Storage',
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    icon: 'database'
  },
  network: {
    label: 'Network',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    icon: 'wifi'
  }
}

// Company color mapping
export const COMPANY_COLORS: Record<string, string> = {
  'xAI': '#3b82f6',
  'OpenAI': '#10b981',
  'AWS': '#f97316',
  'Microsoft': '#06b6d4',
  'Google': '#8b5cf6',
  'Meta': '#0668e1',
  'Core 42': '#ec4899',
  'Reliance': '#eab308',
}

export function getCompanyColor(company: string): string {
  return COMPANY_COLORS[company] || '#6b7280'
}
