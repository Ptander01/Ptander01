// GeoJSON Feature type
export interface Feature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
  }
  properties: FeatureProperties
}

// Complete XB Schema - 55+ fields across 11 categories
export interface FeatureProperties {
  // ============================================================================
  // CATEGORY 1: IDENTIFIERS
  // ============================================================================
  record_level?: string           // 'Building' or 'Campus'
  ucid?: string                   // Universal Campus ID
  building_ucid?: string          // Building-level UCID
  unique_id?: string              // Source-specific unique ID

  // ============================================================================
  // CATEGORY 2: COMPANY
  // ============================================================================
  company_source?: string         // Original company name from source
  company_clean?: string          // Standardized company name
  company_clean_filter?: string   // Hyperscaler or "Colo - All Other"
  developer?: string              // Developer company
  tenant?: string                 // Tenant company
  end_user?: string               // End user company
  developer_list?: string         // List of developers
  tenant_list?: string            // List of tenants
  end_user_list?: string          // List of end users

  // ============================================================================
  // CATEGORY 3: LOCATION
  // ============================================================================
  campus_name?: string            // Campus name
  building_name?: string          // Building name/designation
  building_designation?: string   // Building designation
  address?: string                // Street address
  city?: string                   // City
  market?: string                 // Market area
  county?: string                 // County
  state?: string                  // State full name
  state_abbr?: string             // State abbreviation
  postal_code?: string            // Postal/ZIP code
  country?: string                // Country
  region?: string                 // Region (AMER, EMEA, APAC)
  latitude?: number               // Latitude
  longitude?: number              // Longitude

  // ============================================================================
  // CATEGORY 4: CAPACITY - POWER
  // ============================================================================
  full_capacity_mw?: number       // Total capacity (sum of all)
  commissioned_power_mw?: number  // Operational capacity
  capacity_under_construction_mw?: number  // Under construction
  planned_capacity_mw?: number    // Planned capacity
  it_load_total?: number          // IT load (Meta)

  // ============================================================================
  // CATEGORY 5: CAPACITY - AREA
  // ============================================================================
  facility_sqft?: number          // Facility square footage
  whitespace_sqft?: number        // Whitespace available

  // ============================================================================
  // CATEGORY 6: STATUS
  // ============================================================================
  facility_status?: string        // Active, Under Construction, etc.
  is_essential?: boolean | number // Essential site flag (1/0)
  tier?: string                   // Hyperscaler, Major Colo, Other
  owned_leased?: string           // Owned or Leased

  // ============================================================================
  // CATEGORY 7: DATES
  // ============================================================================
  construction_start_date?: string  // Ground-breaking date
  construction_end_date?: string    // Construction end date
  actual_live_date?: string         // Operational date
  lease_start_date?: string         // Lease start
  lease_end_date?: string           // Lease end
  data_vintage?: string             // Source data publish date
  ingest_date?: string              // Pipeline ingest date

  // ============================================================================
  // CATEGORY 8: ENERGY
  // ============================================================================
  energy_source?: string          // Energy source
  ai_gpu_indicator?: string       // AI/GPU indicator
  pue?: number                    // Power Usage Effectiveness

  // ============================================================================
  // CATEGORY 9: CAMPUS AGGREGATES
  // ============================================================================
  building_count?: number         // Number of buildings in campus
  source_count?: number           // Number of sources matched

  // ============================================================================
  // CATEGORY 10: SOURCE
  // ============================================================================
  source?: string                 // Source system(s)
  source_id?: string              // Source record ID

  // ============================================================================
  // CATEGORY 11: YEAR FORECASTS (Semianalysis)
  // ============================================================================
  mw_2023?: number
  mw_2024?: number
  mw_2025?: number
  mw_2026?: number
  mw_2027?: number
  mw_2028?: number
  mw_2029?: number
  mw_2030?: number
  mw_2031?: number
  mw_2032?: number

  // ============================================================================
  // OTHER
  // ============================================================================
  notes?: string                  // Notes/comments
}

// Statistics response
export interface Statistics {
  generated?: string
  summary: {
    total_buildings: number
    total_campuses?: number
    total_capacity_mw: number
    total_capacity_gw: number
    commissioned_mw: number
    under_construction_mw: number
    planned_mw: number
    avg_mw_per_campus?: number
  }
  by_company: Record<string, number>
  by_source: Record<string, number>
  by_region: Record<string, number>
  by_status: Record<string, number>
  by_year?: Record<string, number>
}

// Lookup values for filters
export interface Lookups {
  company_clean?: string[]
  company_clean_filter?: string[]
  source?: string[]
  state_abbr?: string[]
  country?: string[]
  region?: string[]
  facility_status?: string[]
  tier?: string[]
  tier_order?: string[]
  region_order?: string[]
  facility_status_order?: string[]
}

// Filter state
export interface FilterState {
  company: string
  source: string
  status: string
  region: string
  country: string
  tier: string
  minMw: number
  maxMw: number
  essentialOnly: boolean
  hyperscalersOnly: boolean
  search: string
  capacityType: 'full_capacity_mw' | 'commissioned_power_mw' | 'capacity_under_construction_mw' | 'planned_capacity_mw'
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
