// GeoJSON FeatureCollection type
export interface FeatureCollection {
  type: 'FeatureCollection'
  features: Feature[]
}

// GeoJSON Feature type for at-risk data center projects
export interface Feature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
  }
  properties: FeatureProperties
}

// Feature properties from the graveyard database
export interface FeatureProperties {
  // Identifiers
  uid?: string
  fractracker_id?: string
  facility_name?: string

  // Company info
  developer?: string
  operator?: string
  tenant?: string

  // Location
  address?: string
  city?: string
  state?: string
  zip?: string
  county?: string
  latitude?: number
  longitude?: number

  // Capacity & Investment
  capacity_mw?: number
  capacity_def?: string
  facility_size_sqft?: number
  property_acres?: number
  cost_billions_usd?: number

  // Sources
  primary_data_source?: string

  // Project Status
  current_status?: 'BLOCKED' | 'DELAYED' | 'WITHDRAWN' | 'APPROVED' | 'OPERATING' | string
  status_date?: string
  stage_gate?: string
  phase_detail?: string
  reviewing_authority?: string
  status_count?: number

  // Source Documentation
  primary_source?: string
  supporting_sources?: string[]

  // Community Opposition
  has_opposition?: boolean
  opposition_factors?: string[]
  opposition_count?: number
  community_groups?: string[]
  community_detail?: string

  // Milestones
  milestone_count?: number
}

// Status colors for visualization
export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'BLOCKED': { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444', border: '#ef4444' },
  'DELAYED': { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b', border: '#f59e0b' },
  'WITHDRAWN': { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280', border: '#6b7280' },
  'APPROVED': { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e', border: '#22c55e' },
  'OPERATING': { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6', border: '#3b82f6' },
}

// Opposition factor icons/colors
export const OPPOSITION_FACTORS: Record<string, { icon: string; color: string; label: string }> = {
  'Water': { icon: '💧', color: '#06b6d4', label: 'Water Usage' },
  'Electricity': { icon: '⚡', color: '#eab308', label: 'Electricity/Grid' },
  'Noise': { icon: '🔊', color: '#8b5cf6', label: 'Noise Pollution' },
  'Air Quality': { icon: '🌫️', color: '#64748b', label: 'Air Quality' },
  'Environment': { icon: '🌳', color: '#22c55e', label: 'Environmental' },
  'Aesthetic': { icon: '👁️', color: '#ec4899', label: 'Visual/Aesthetic' },
  'Property Value': { icon: '🏠', color: '#f97316', label: 'Property Values' },
  'Health': { icon: '❤️', color: '#ef4444', label: 'Health Concerns' },
  'Other': { icon: '📋', color: '#6b7280', label: 'Other' },
}

// Stage gate progression
export const STAGE_GATES = [
  'LEGISLATIVE_ZONING',
  'PLANNING_LAND_USE_REVIEW',
  'ENVIRONMENTAL_REGULATORY_REVIEW',
  'SITE_PLAN_DEVELOPMENT_APPROVAL',
  'UTILITY_INFRASTRUCTURE_APPROVAL',
  'CONSTRUCTION_PERMITTING',
  'LEGAL_LITIGATION',
  'UNKNOWN',
] as const

export type StageGate = typeof STAGE_GATES[number]

// Statistics response
export interface Statistics {
  generated?: string
  summary: {
    total_projects: number
    total_capacity_mw: number
    total_capacity_gw: number
    total_cost_billions: number
    total_acres: number
    with_opposition: number
    blocked_count: number
    delayed_count: number
    withdrawn_count: number
  }
  by_status: Record<string, number>
  by_stage_gate: Record<string, number>
  by_state: Record<string, number>
  by_opposition_factor: Record<string, number>
}

// Lookup values for filters
export interface Lookups {
  status?: string[]
  stage_gate?: string[]
  reviewing_authority?: string[]
  state?: string[]
  developer?: string[]
  tenant?: string[]
  opposition_factors?: string[]
}

// Filter state
export interface FilterState {
  status: string
  stageGate: string
  state: string
  developer: string
  tenant: string
  hasOpposition: boolean | null
  oppositionFactor: string
  minMw: number
  maxMw: number
  search: string
}

// API Response
export interface FeaturesResponse {
  type: 'FeatureCollection'
  features: Feature[]
  metadata: {
    total_count: number
    returned_count: number
    offset: number
    limit: number | null
    filters_applied: Record<string, string | number | boolean | null>
  }
}
