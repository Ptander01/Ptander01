# 📋 Product Requirements Document (PRD)
# Data Center Graveyard Dashboard v2.0

**Document Version:** 1.0
**Last Updated:** January 20, 2026
**Status:** Draft
**Owner:** internal team & Team

---

## 📌 Executive Summary

### Problem Statement

Data center development faces increasing challenges from non-technical factors (community opposition, policy changes), resulting in project delays, withdrawals, and blocks. There is no centralized system to track, analyze, or predict these impacts.

### Business Objectives

| Objective | Description |
|-----------|-------------|
| **Data-Driven Site Selection** | Support site selection with geographic risk assessment |
| **Early Warning System** | Provide early warnings for project risks using historical patterns |
| **Centralized Tracking** | Track and analyze failed, delayed, and withdrawn projects |
| **Strategic Planning** | Support planning with trend analysis and attribution |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| User Adoption | 50+ active users | Monthly active users |
| Risk Identification | 80% accuracy | Projects flagged before status change |
| Time to Insight | < 5 minutes | Time to answer key questions |
| Data Currency | < 24 hours | Lag between event and dashboard update |

---

## 👥 User Stories

### Community Development Specialist

> *"As a Community Development specialist, I want to view all data centers with community opposition in a specific state so that I can identify patterns in local concerns and develop targeted engagement strategies. I want to anticipate and proactively address community concerns when possible."*

**Acceptance Criteria:**
- [ ] Filter projects by state and community opposition status
- [ ] View breakdown of opposition factors (water, noise, health, etc.)
- [ ] See timeline of community events for each project
- [ ] Export filtered data for engagement planning

### Site Selection Analyst

> *"As a Site Selection analyst, I want to see a geographic heatmap of project delays and blocks so that I can avoid high-risk regions for future projects. I want to understand why projects failed and determine if factors can be proactively addressed."*

**Acceptance Criteria:**
- [ ] View choropleth map showing risk scores by region
- [ ] Drill down from state → county → city → project level
- [ ] See historical success/failure rates by geography
- [ ] Compare regions side-by-side
- [ ] Access root cause analysis for failed projects

### Policy Analyst

> *"As a Policy analyst, I want to see which regulatory changes correlate with project delays so that I can inform advocacy efforts and prioritize policy engagement."*

> *"As a Policy analyst, I want to track community opposition events in relation to legislative timelines so I can better anticipate risks for future projects."*

**Acceptance Criteria:**
- [ ] View timeline of policy changes alongside project outcomes
- [ ] Filter by regulatory authority and policy type
- [ ] See correlation analysis between policy events and project status
- [ ] Track upcoming hearings and decision points

### Executive Leadership

> *"As a VP, I want a summary dashboard to quickly assess risk hotspots and overall project health across the portfolio."*

> *"As an Executive, I want trend analysis reports that summarize geographic risks and show progress toward strategic objectives."*

**Acceptance Criteria:**
- [ ] Executive summary view with key KPIs
- [ ] At-a-glance risk assessment by region
- [ ] Trend charts showing portfolio health over time
- [ ] Exportable reports for leadership meetings

---

## 🔧 Functional Requirements

### FR-001: User Authentication and Secure Hosting

| Requirement | Description | Priority |
|-------------|-------------|----------|
| FR-001.1 | System access must be via Meta Server | P0 |
| FR-001.2 | System must not be publicly accessible | P0 |
| FR-001.3 | Users must authenticate using Meta SSO | P0 |

**Implementation Notes:**
- Migrate to InternalFB EntryPoints for SSO integration
- Alternative: Manifold CDN with corp-only ACL (current approach)

---

### FR-002: Core Dashboard Features

#### Dashboard Structure

The dashboard shall consist of two primary pages:

##### Page 1: Analytics Dashboard

| Section | Components |
|---------|------------|
| **Header** | Title, description, last updated timestamp |
| **Left Panel** | Filters (date range, location, company, status) |
| **Main Panel** | 4-square grid of interactive visualizations |

**Visual 1: Status Trend Line Chart**
- X-axis: Time (configurable granularity)
- Y-axis: Volume (count of projects)
- Lines: Delayed, Withdrawn, Blocked statuses
- Interaction: Hover for details, click to filter

**Visual 2: Stage Gate Decay Chart**
- X-axis: Project stages (Site Selection → Planning → Permitting → Construction)
- Y-axis: Volume of exited projects (withdrawn or blocked)
- Note: Excludes delays (only terminal states)

**Visual 3: Opposition Factors (Waffle Chart / Tree Map)**
- Categories: Water, Noise, Health, Environmental, Traffic, Other
- Shows relative frequency of each opposition type
- Interaction: Click to filter projects by factor

**Visual 4: Watch List Table**
- Highlights delayed projects with high community opposition
- Columns: Project, Location, Status, Opposition Score, Next Hearing Date
- Sortable and filterable
- Links to project detail view

##### Page 2: Map Visualization

| Feature | Description |
|---------|-------------|
| **Interactive Map** | MapLibre-based with zoom/pan |
| **Status Indicators** | Color-coded markers by status |
| **Drill-Down** | National → State → County → City → Project |
| **Filtering** | All filters apply to map view |
| **Pop-ups** | Facility details, opposition info, sources |

##### Page 3: Data Table

| Feature | Description |
|---------|-------------|
| **Full Dataset** | All projects in tabular format |
| **Sorting** | Click column headers to sort |
| **Filtering** | Filters apply automatically |
| **Export** | CSV, PDF export options |
| **Links** | Source documentation hyperlinks |

---

### FR-003: Data Processing and Updates

| Requirement | Description | Priority |
|-------------|-------------|----------|
| FR-003.1 | Support real-time updates to existing fields | P1 |
| FR-003.2 | Controlled publishing (staging before release) | P2 |
| FR-003.3 | Data refresh indicator showing last update time | P1 |

---

### Future Requirements (Priority 2)

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-006 | Predictive Analytics | Early warning indicators based on historical patterns |
| FR-007 | Milestone Timeline | Project timelines with community events correlation |
| FR-008 | Comparative Analysis | Side-by-side comparison across regions/time periods |
| FR-009 | Automated Alerting | Notifications when projects meet risk thresholds |
| FR-010 | Custom Reports | Create, save, and export custom filtered views |

---

## 🎨 Design & User Experience

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Simplify & Streamline** | Clear visual hierarchy, consistent navigation, minimal cognitive load |
| **Orient & Guide** | Context and next steps for non-technical users, progressive disclosure |
| **Support Expertise** | Power users can drill into details while maintaining accessibility |
| **Provide Context** | Clear titles, subtitles, footnotes; assumptions explicitly stated |

### Visual Design Standards

#### Color Codes

| Status | Color | Hex |
|--------|-------|-----|
| Operating/Approved | Green | `#22c55e` |
| Delayed | Yellow/Amber | `#f59e0b` |
| Blocked | Red | `#ef4444` |
| Withdrawn | Gray | `#6b7280` |

#### Community Opposition Gradient

| Level | Color | Description |
|-------|-------|-------------|
| Low | Green | `#22c55e` - Minimal opposition |
| Medium | Yellow | `#f59e0b` - Moderate concerns |
| High | Orange | `#f97316` - Significant opposition |
| Critical | Red | `#dc2626` - Severe/organized opposition |

### Accessibility Requirements (WCAG 2.1 AA)

| Requirement | Description |
|-------------|-------------|
| Section 508 Compliance | Readability for color blindness |
| Keyboard Navigation | Full functionality without mouse |
| Screen Reader Support | Proper ARIA labels and structure |
| Color Contrast | Minimum 4.5:1 ratio for text |
| Alternative Text | Alt text for all maps and charts |
| Progressive Enhancement | Core functions work without JavaScript |

### Responsive Design

| Screen Size | Support Level |
|-------------|---------------|
| 13" Laptop | Full support (primary target) |
| External Monitor | Full support |
| Tablet | Best effort |
| Mobile | Nice to have |

### Navigation Design

| Feature | Description |
|---------|-------------|
| Breadcrumb Navigation | Orient users, enable drill-down |
| Quick Filters | Always accessible (time, status, region, opposition) |
| Contextual Help | Hover tooltips for technical terms |

---

## 📊 Visualization Requirements

### Interactive Mapping Capabilities

#### Multi-layer Geographic Display

| Layer Type | Description |
|------------|-------------|
| Choropleth | Regional risk scores with adjustable thresholds |
| Point Mapping | Individual projects with status symbols |
| Heat Map Overlay | Concentration of community opposition events |
| Cluster Analysis | Geographic patterns in outcomes |

#### Aggregation Levels

```
National Overview
    └── State Level
        └── County Level
            └── City Level
                └── Project Detail
```

#### Drill-Down Functionality

| Feature | Description |
|---------|-------------|
| Zoom In/Out | National to street-level navigation |
| Click-Through | Access full project info from map |
| Multi-Region Selection | Compare areas side-by-side |
| Custom Boundaries | Utility areas, political districts, economic regions |

### Time Series Analysis

| Feature | Description |
|---------|-------------|
| Multiple Scales | Day, week, month, quarter, year |
| Historical Trends | 3-year rolling patterns |
| Seasonality Detection | Cyclical trends in opposition/approvals |
| Event Correlation | Link external events to outcomes |
| Forecasting | 6-12 month projections (P2) |

### Advanced Analytics (Priority 2)

| Analysis Type | Description |
|---------------|-------------|
| Statistical Significance | Highlight real changes vs. noise |
| Anomaly Detection | Flag unusual spikes or drops |
| Correlation Analysis | Opposition drivers ↔ outcomes |
| Cohort Analysis | Group projects by strategy/timeline/location |

---

## 🗄️ Data Architecture

### Primary Data Tables

#### DATA_CENTER Table
Master record for each facility.

| Field | Type | Description |
|-------|------|-------------|
| facility_id | UUID | Primary key |
| facility_name | String | Project/facility name |
| developer | String | Development company |
| tenant | String | Expected tenant (if known) |
| capacity_mw | Float | Planned capacity in MW |
| investment_usd | Float | Estimated investment |
| latitude | Float | Location latitude |
| longitude | Float | Location longitude |
| city | String | City name |
| county | String | County name |
| state | String | State code |
| country | String | Country code |

#### PROJECT_STATUS Table
Time-series tracking of status changes.

| Field | Type | Description |
|-------|------|-------------|
| status_id | UUID | Primary key |
| facility_id | UUID | Foreign key to DATA_CENTER |
| status | Enum | OPERATING, APPROVED, DELAYED, BLOCKED, WITHDRAWN |
| status_date | DateTime | When status changed |
| reviewing_authority | String | Regulatory body |
| stage_gate | String | Current project stage |
| primary_source | URL | Source documentation |
| supporting_sources | Array[URL] | Additional sources |

#### COMMUNITY_OPPOSITION Table
Detailed tracking of community concerns.

| Field | Type | Description |
|-------|------|-------------|
| opposition_id | UUID | Primary key |
| facility_id | UUID | Foreign key to DATA_CENTER |
| has_opposition | Boolean | Opposition exists |
| opposition_factors | Array[String] | Water, Noise, Health, etc. |
| organized_groups | Array[String] | Named opposition groups |
| spokespeople | Array[String] | Key individuals |
| sentiment_score | Float | -1 to +1 sentiment |
| last_updated | DateTime | Last sentiment update |

#### KEY_MILESTONES Table
Event tracking for project timeline.

| Field | Type | Description |
|-------|------|-------------|
| milestone_id | UUID | Primary key |
| facility_id | UUID | Foreign key to DATA_CENTER |
| event_type | Enum | PETITION, PROTEST, HEARING, LEGAL, POLICY, APPROVAL |
| event_date | DateTime | When event occurred |
| description | String | Event description |
| outcome | String | Result of event |
| source_url | URL | Documentation link |

---

## 📎 Appendix

### A. Current State vs. Target State

| Feature | Current (v1) | Target (v2) |
|---------|--------------|-------------|
| Authentication | None (local) | Meta SSO |
| Hosting | Local/Network Share | InternalFB or Manifold CDN |
| Map | Basic markers | Multi-layer with choropleth |
| Charts | Status breakdown | Trend lines, decay, waffle |
| Table | Basic sortable | Watch list with hearings |
| Filters | Status, State | Date, Company, Opposition, Stage |
| Analytics | None | Correlation, prediction (P2) |
| Alerts | None | Threshold-based (P2) |
| Export | None | CSV, PDF |

### B. Glossary

| Term | Definition |
|------|------------|
| Stage Gate | Project phase (Site Selection, Planning, Permitting, Construction) |
| Decay Chart | Visualization showing where projects exit the pipeline |
| Choropleth | Map with regions colored by data values |
| Watch List | High-priority projects requiring attention |
| Opposition Factor | Category of community concern (water, noise, etc.) |

### C. Related Documents

| Document | Location |
|----------|----------|
| AI Context Prompt | `docs/AI_CONTEXT_PROMPT.md` |
| Roadmap | `docs/ROADMAP.md` |
| Static Deployment | `docs/STATIC_DEPLOYMENT_MIGRATION.md` |
| Internal Hosting Options | `docs/INTERNAL_HOSTING_OPTIONS.md` |

---

*Document maintained by the Data Center Research Team*
