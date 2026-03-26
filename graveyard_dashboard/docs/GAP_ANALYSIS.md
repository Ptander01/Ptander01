# 📊 Gap Analysis: Current State vs. Target State
# Data Center Graveyard Dashboard

**Last Updated:** January 20, 2026
**Purpose:** Identify development gaps and prioritize Phase 2 work

---

## 📋 Executive Summary

| Category | Current (v1.0) | Target (v2.0) | Gap Level |
|----------|----------------|---------------|-----------|
| **Authentication** | None | Meta SSO | 🔴 High |
| **Hosting** | Local/Network Share | InternalFB or CDN | 🟡 Medium |
| **Analytics** | Basic KPIs | Full analytics suite | 🔴 High |
| **Mapping** | Point markers | Choropleth + Heat maps | 🟡 Medium |
| **Data Model** | Flat structure | Relational tables | 🟡 Medium |
| **Export** | Basic CSV | CSV + PDF + Reports | 🟡 Medium |

---

## ✅ What's Built (Phase 1 Complete)

### Frontend Components

| Component | Status | Notes |
|-----------|--------|-------|
| `Header.tsx` | ✅ Complete | Title, description, last updated |
| `FilterPanel.tsx` | ✅ Complete | Status, State, Developer, Opposition filters |
| `KPICards.tsx` | ✅ Complete | Total projects, capacity, investment at risk |
| `MapContainer.tsx` | ✅ Complete | MapLibre with status markers, popups, zoom to extent |
| `DataTable.tsx` | ✅ Complete | Sortable table with source links |
| `Charts.tsx` | ✅ Complete | Basic status breakdown charts |
| `ThemeContext.tsx` | ✅ Complete | Light/Dark mode with persistence |

### Features

| Feature | Status | Notes |
|---------|--------|-------|
| Interactive Map | ✅ Complete | Pan, zoom, click for details |
| Status Filtering | ✅ Complete | BLOCKED, DELAYED, WITHDRAWN |
| State Filtering | ✅ Complete | Filter by US state |
| Developer Filtering | ✅ Complete | Filter by developer company |
| Opposition Filtering | ✅ Complete | With/Without opposition |
| Source Links | ✅ Complete | Primary + supporting sources |
| CSV Export | ✅ Complete | Export filtered data |
| Theme Toggle | ✅ Complete | Light/Dark mode |
| Zoom to Extent | ✅ Complete | Fit all projects in view |

### Data Model

| Field | Status | Notes |
|-------|--------|-------|
| facility_name | ✅ Present | Project name |
| current_status | ✅ Present | BLOCKED, DELAYED, WITHDRAWN |
| city, state, country | ✅ Present | Location fields |
| developer | ✅ Present | Development company |
| tenant | ✅ Present | Expected tenant |
| planned_capacity_mw | ✅ Present | Capacity in MW |
| estimated_investment | ✅ Present | Investment in USD |
| has_community_opposition | ✅ Present | Boolean |
| opposition_factors | ✅ Present | Array of factors |
| primary_source | ✅ Present | Source URL |
| supporting_sources | ✅ Present | Additional URLs |
| latitude, longitude | ✅ Present | Coordinates |

---

## 🔴 Critical Gaps (Phase 2 Priority)

### 1. Status Trend Line Chart
**Requirement:** FR-002 Visual 1

| Aspect | Current | Required | Gap |
|--------|---------|----------|-----|
| Time-series data | ❌ Missing | Track status changes over time | Need `status_date` field |
| Trend visualization | ❌ Missing | Line chart with Delayed/Blocked/Withdrawn | Need `TrendLineChart.tsx` |
| Date range filter | ❌ Missing | Filter by custom date range | Need `DateRangePicker.tsx` |
| Granularity toggle | ❌ Missing | Day/Week/Month/Quarter/Year | Need UI controls |

**Data Gap:**
```
MISSING FIELD: status_date
- When did the project change to current status?
- Need historical status tracking for trends
```

**Action Items:**
- [ ] Add `status_date` to data model
- [ ] Backfill dates from source documents
- [ ] Create `TrendLineChart.tsx` component
- [ ] Add date range filter to FilterPanel

---

### 2. Stage Gate Decay Chart
**Requirement:** FR-002 Visual 2

| Aspect | Current | Required | Gap |
|--------|---------|----------|-----|
| Stage gate data | ❌ Missing | Track project stage (Site Selection → Construction) | Need `stage_gate` field |
| Decay visualization | ❌ Missing | Funnel/waterfall chart | Need `DecayChart.tsx` |
| Exit tracking | ❌ Missing | Count exits at each stage | Need aggregation logic |

**Data Gap:**
```
MISSING FIELD: stage_gate
- At what stage did the project fail/delay?
- Options: Site Selection, Planning, Permitting, Construction
```

**Action Items:**
- [ ] Add `stage_gate` to data model
- [ ] Classify existing projects by stage
- [ ] Create `DecayChart.tsx` component
- [ ] Calculate exit rates at each stage

---

### 3. Opposition Factors Visualization
**Requirement:** FR-002 Visual 3

| Aspect | Current | Required | Gap |
|--------|---------|----------|-----|
| Factor aggregation | ✅ Partial | Count by category | Have data, need viz |
| Waffle/TreeMap | ❌ Missing | Visual breakdown | Need component |
| Click-to-filter | ❌ Missing | Filter by factor | Need interaction |

**Action Items:**
- [ ] Create `WaffleChart.tsx` or `TreeMapChart.tsx` component
- [ ] Aggregate opposition factors from data
- [ ] Add click-to-filter interactivity

---

### 4. Watch List Table
**Requirement:** FR-002 Visual 4

| Aspect | Current | Required | Gap |
|--------|---------|----------|-----|
| High-risk definition | ❌ Missing | Score based on opposition + status | Need scoring logic |
| Next hearing date | ❌ Missing | Track upcoming decisions | Need `next_hearing_date` field |
| Watch list view | ❌ Missing | Filtered high-priority table | Need `WatchListTable.tsx` |
| Risk score | ❌ Missing | Calculated score | Need algorithm |

**Data Gap:**
```
MISSING FIELDS:
- next_hearing_date: When is the next decision point?
- opposition_score: Severity of opposition (calculated)
- risk_score: Overall risk level (calculated)
```

**Action Items:**
- [ ] Add `next_hearing_date` to data model
- [ ] Define risk scoring algorithm
- [ ] Create `WatchListTable.tsx` component
- [ ] Add risk score to project data

---

### 5. Enhanced Filters
**Requirement:** FR-002 Filters

| Aspect | Current | Required | Gap |
|--------|---------|----------|-----|
| Date range | ❌ Missing | Filter by status change date | Need date picker |
| Company filter | ✅ Present | Filter by developer/tenant | ✅ Complete |
| Stage gate filter | ❌ Missing | Filter by project stage | Need stage_gate data |
| Quick presets | ❌ Missing | "Last 30 days", "High Risk Only" | Need preset logic |

**Action Items:**
- [ ] Add date range picker component
- [ ] Add stage gate filter (after data available)
- [ ] Add quick filter presets

---

## 🟡 Medium Gaps (Phase 3)

### 6. Choropleth Map Layer
**Requirement:** Visualization Requirements

| Aspect | Current | Required | Gap |
|--------|---------|----------|-----|
| Boundary data | ❌ Missing | State/County GeoJSON | Need boundary files |
| Regional aggregation | ❌ Missing | Risk scores by region | Need calculation |
| Choropleth layer | ❌ Missing | Color-coded regions | Need map layer |

### 7. Heat Map Overlay
**Requirement:** Visualization Requirements

| Aspect | Current | Required | Gap |
|--------|---------|----------|-----|
| Heat map layer | ❌ Missing | Opposition density | Need map layer |
| Toggle control | ❌ Missing | Show/hide heat map | Need UI toggle |

### 8. Geographic Drill-Down
**Requirement:** Visualization Requirements

| Aspect | Current | Required | Gap |
|--------|---------|----------|-----|
| Drill-down navigation | ❌ Missing | National → State → County → City | Need navigation |
| Breadcrumb | ❌ Missing | Track drill path | Need component |
| Aggregation at levels | ❌ Missing | Stats by region | Need calculation |

### 9. Timeline View
**Requirement:** FR-007

| Aspect | Current | Required | Gap |
|--------|---------|----------|-----|
| Timeline component | ❌ Missing | Horizontal timeline | Need component |
| Milestone data | ❌ Missing | Events per project | Need `KEY_MILESTONES` table |
| Event correlation | ❌ Missing | Link events to outcomes | Need analysis |

---

## 🟢 Low Gaps (Phase 4)

### 10. Predictive Analytics (FR-006)

| Aspect | Current | Required |
|--------|---------|----------|
| Historical patterns | ❌ None | Pattern analysis |
| Risk prediction | ❌ None | ML model for predictions |
| Early warning | ❌ None | Flag at-risk projects |

### 11. Automated Alerting (FR-009)

| Aspect | Current | Required |
|--------|---------|----------|
| Alert thresholds | ❌ None | Configurable thresholds |
| Notifications | ❌ None | Email/Workplace alerts |
| Alert history | ❌ None | Track sent alerts |

### 12. Custom Reports (FR-010)

| Aspect | Current | Required |
|--------|---------|----------|
| Save views | ❌ None | Persist filter configs |
| PDF export | ❌ None | Formatted reports |
| Scheduled reports | ❌ None | Automated generation |

### 13. Meta SSO (FR-001)

| Aspect | Current | Required |
|--------|---------|----------|
| Authentication | ❌ None | Meta SSO login |
| Permissions | ❌ None | Role-based access |
| Audit logging | ❌ None | Track user activity |

---

## 📊 Data Schema Gaps

### Fields to Add

| Field | Table | Priority | Description |
|-------|-------|----------|-------------|
| `status_date` | PROJECT_STATUS | P0 | When status changed |
| `stage_gate` | PROJECT_STATUS | P0 | Current project stage |
| `next_hearing_date` | KEY_MILESTONES | P0 | Upcoming decision date |
| `opposition_score` | COMMUNITY_OPPOSITION | P1 | Calculated severity (1-10) |
| `risk_score` | DATA_CENTER | P1 | Overall risk level |
| `reviewing_authority` | PROJECT_STATUS | P2 | Regulatory body |

### Tables to Create

| Table | Priority | Purpose |
|-------|----------|---------|
| `KEY_MILESTONES` | P1 | Track events (hearings, protests, approvals) |
| `STATUS_HISTORY` | P2 | Historical status changes (for trends) |

---

## 🔧 API Endpoints to Add

### Phase 2

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/trends` | GET | Time-series status data |
| `/api/decay` | GET | Stage gate exit data |
| `/api/opposition-summary` | GET | Opposition factor counts |
| `/api/watchlist` | GET | High-risk projects |

### Phase 3

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/regions` | GET | List regions with stats |
| `/api/regions/{id}/stats` | GET | Stats for specific region |
| `/api/projects/{id}/timeline` | GET | Project milestones |

---

## 🎯 Recommended Next Steps

### Immediate (This Week)

1. **Data Model Updates**
   - Add `status_date` field to Google Sheet
   - Add `stage_gate` field to Google Sheet
   - Backfill historical data where possible

2. **Update Ingestion Script**
   - Parse new fields from Google Sheets
   - Add to `projects.geojson`

### Sprint 1 (Week 1-2)

3. **TrendLineChart Component**
   - Install ECharts (already present) or use recharts
   - Create line chart for status over time
   - Add to dashboard layout

4. **DecayChart Component**
   - Create funnel/waterfall visualization
   - Calculate exit rates at each stage

### Sprint 2 (Week 3-4)

5. **WaffleChart/TreeMap Component**
   - Aggregate opposition factors
   - Create interactive visualization

6. **WatchListTable Component**
   - Define risk scoring
   - Create filtered table view

---

## 📈 Progress Tracking

### Phase 1 Completion: 100%
```
████████████████████ 100%
```

### Phase 2 Completion: 0%
```
░░░░░░░░░░░░░░░░░░░░ 0%
```

**Blockers:**
- [ ] Missing `status_date` data
- [ ] Missing `stage_gate` data
- [ ] Missing `next_hearing_date` data

---

## 📚 Related Documents

| Document | Purpose |
|----------|---------|
| [Product Requirements](PRODUCT_REQUIREMENTS.md) | Full PRD |
| [Roadmap](ROADMAP.md) | Implementation timeline |
| [AI Context](AI_CONTEXT_PROMPT.md) | Development context |

---

*Gap analysis maintained by the Data Center Research Team*
