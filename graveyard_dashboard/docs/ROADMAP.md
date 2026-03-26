# 🗺️ Implementation Roadmap
# Data Center Graveyard Dashboard v2.0

**Last Updated:** January 20, 2026
**Target Completion:** Q2 2026
**Status:** Planning

---

## 📊 Roadmap Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1 (Current)     PHASE 2           PHASE 3           PHASE 4         │
│  Foundation            Analytics         Advanced          Enterprise      │
│  ─────────────         ─────────         ────────          ──────────      │
│  ✅ Basic Map          □ Trend Charts    □ Choropleth      □ Predictive    │
│  ✅ Status Filters     □ Decay Chart     □ Heat Maps       □ Alerts        │
│  ✅ Data Table         □ Waffle Chart    □ Drill-Down      □ Custom Reports│
│  ⏳ CDN Hosting        □ Watch List      □ Comparisons     □ API Access    │
│                        □ Date Filters    □ Timeline View                   │
│                                                                             │
│  Jan 2026              Feb 2026          Mar 2026          Apr-May 2026    │
│  ~2 weeks              ~3 weeks          ~3 weeks          ~4 weeks        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Phase 1: Foundation (Current State)

**Timeline:** Complete
**Status:** ✅ Deployed locally, ⏳ CDN pending

### Completed Features

| Feature | Status | Notes |
|---------|--------|-------|
| Interactive Map | ✅ Done | MapLibre with status-colored markers |
| Basic Filters | ✅ Done | Status, State, Developer, Opposition |
| Data Table | ✅ Done | Sortable with source links |
| KPI Cards | ✅ Done | Total projects, capacity, investment |
| Theme Toggle | ✅ Done | Light/Dark mode with persistence |
| Source Links | ✅ Done | Primary and supporting sources |
| Zoom to Extent | ✅ Done | Fit all projects in view |
| Export to CSV | ✅ Done | Basic export functionality |

### Pending

| Item | Status | Blocker |
|------|--------|---------|
| Manifold CDN Hosting | ⏳ Waiting | CDN allowlist approval |
| Network Share Sync | ✅ Done | Available at `\[network path removed]\...` |

---

## 📈 Phase 2: Analytics Dashboard

**Timeline:** ~3 weeks
**Target:** February 2026
**Priority:** P0

### New Features

#### 2.1 Status Trend Line Chart
**Effort:** 3-4 days

| Task | Description |
|------|-------------|
| Add time-series data | Ensure status_date captured for all projects |
| Create TrendChart component | ECharts line chart with multi-series |
| Add date range filter | Filter by custom date range |
| Implement granularity toggle | Day/Week/Month/Quarter/Year |

**Mockup:**
```
Volume ▲
   30 ┤                              ╭──── Delayed
   20 ┤        ╭─────╮         ╭────╯
   10 ┤───╮───╯     ╰─────────╯           ──── Blocked
    0 ┼────────────────────────────────── .... Withdrawn
      Jan   Mar   May   Jul   Sep   Nov
```

#### 2.2 Stage Gate Decay Chart
**Effort:** 2-3 days

| Task | Description |
|------|-------------|
| Add stage_gate field | Ensure all projects have stage gate data |
| Create DecayChart component | Funnel/waterfall visualization |
| Calculate exit rates | Withdrawn + Blocked at each stage |

**Mockup:**
```
Site Selection  ████████████████████████████ 100%
Planning        ██████████████████████       85%
Permitting      ████████████████             65%
Construction    ████████████                 50%
Operating       ████████                     35%
```

#### 2.3 Opposition Factors Visualization
**Effort:** 2-3 days

| Task | Description |
|------|-------------|
| Aggregate opposition factors | Count occurrences by category |
| Create WaffleChart component | Or TreeMap alternative |
| Add click-to-filter | Filter projects by opposition type |

**Categories:**
- Water Usage/Rights
- Noise Pollution
- Health Concerns
- Environmental Impact
- Traffic/Infrastructure
- Property Values
- Energy Grid Strain
- Other

#### 2.4 Watch List Table
**Effort:** 3-4 days

| Task | Description |
|------|-------------|
| Define "high risk" criteria | Opposition score + status + recency |
| Add next_hearing_date field | Track upcoming decision points |
| Create WatchList component | Filtered table with priority indicators |
| Add sort by risk score | Highlight most critical projects |

**Columns:**
| Project | Location | Status | Opposition | Risk Score | Next Hearing |
|---------|----------|--------|------------|------------|--------------|

#### 2.5 Enhanced Filters
**Effort:** 2-3 days

| Task | Description |
|------|-------------|
| Date range picker | Filter by status change date |
| Company filter | Filter by developer/tenant |
| Stage gate filter | Filter by project stage |
| Quick filter presets | "Last 30 days", "High Risk Only" |

### Phase 2 Deliverables

- [ ] Analytics page with 4-square grid layout
- [ ] Status Trend Line Chart (interactive)
- [ ] Stage Gate Decay Chart
- [ ] Opposition Factors Waffle/TreeMap
- [ ] Watch List Table with upcoming hearings
- [ ] Enhanced date and company filters
- [ ] All charts interactive with cross-filtering

---

## 🗺️ Phase 3: Advanced Mapping

**Timeline:** ~3 weeks
**Target:** March 2026
**Priority:** P1

### New Features

#### 3.1 Choropleth Map Layer
**Effort:** 4-5 days

| Task | Description |
|------|-------------|
| Obtain boundary data | State/County GeoJSON boundaries |
| Calculate regional risk scores | Aggregate project outcomes by region |
| Implement choropleth layer | Color regions by risk score |
| Add threshold controls | Adjust color scale thresholds |

#### 3.2 Heat Map Overlay
**Effort:** 2-3 days

| Task | Description |
|------|-------------|
| Implement heat map layer | Opposition event density |
| Add toggle control | Show/hide heat map |
| Adjust radius/intensity | Based on zoom level |

#### 3.3 Geographic Drill-Down
**Effort:** 4-5 days

| Task | Description |
|------|-------------|
| National → State view | Click state to zoom |
| State → County view | Show county boundaries |
| County → City view | Show city markers |
| City → Project view | Show individual projects |
| Breadcrumb navigation | Track drill-down path |

#### 3.4 Multi-Region Comparison
**Effort:** 3-4 days

| Task | Description |
|------|-------------|
| Region selection mode | Select multiple regions |
| Side-by-side comparison | Compare stats for selected regions |
| Comparison table | Metrics by region |

#### 3.5 Milestone Timeline View
**Effort:** 4-5 days

| Task | Description |
|------|-------------|
| Timeline component | Horizontal timeline visualization |
| Event markers | Petitions, protests, hearings, legal |
| Status overlay | Show status changes on timeline |
| Policy event integration | Mark policy changes |

### Phase 3 Deliverables

- [ ] Choropleth map with regional risk scores
- [ ] Heat map overlay for opposition density
- [ ] Full drill-down: National → State → County → City → Project
- [ ] Breadcrumb navigation
- [ ] Multi-region selection and comparison
- [ ] Project milestone timeline view
- [ ] Policy event correlation

---

## 🚀 Phase 4: Enterprise Features

**Timeline:** ~4 weeks
**Target:** April-May 2026
**Priority:** P2

### New Features

#### 4.1 Predictive Analytics (FR-006)
**Effort:** 1-2 weeks

| Task | Description |
|------|-------------|
| Historical pattern analysis | Identify risk indicators |
| Risk scoring model | Score projects based on patterns |
| Early warning dashboard | Flag at-risk projects |
| Confidence indicators | Show prediction confidence |

#### 4.2 Automated Alerts (FR-009)
**Effort:** 1 week

| Task | Description |
|------|-------------|
| Define alert thresholds | Risk score, status change, new opposition |
| Notification system | Email/Workplace notifications |
| Alert configuration UI | Users set their own alerts |
| Alert history | Track sent alerts |

#### 4.3 Custom Reports (FR-010)
**Effort:** 1 week

| Task | Description |
|------|-------------|
| Save filtered views | Persist filter configurations |
| Report templates | Pre-built report formats |
| PDF export | Generate formatted PDF reports |
| Scheduled reports | Automatic weekly/monthly reports |

#### 4.4 Meta SSO Integration (FR-001)
**Effort:** 1-2 weeks

| Task | Description |
|------|-------------|
| Migrate to EntryPoints | Or implement SSO with Manifold |
| Permission groups | Role-based access |
| Audit logging | Track who viewed what |

### Phase 4 Deliverables

- [ ] Risk prediction model with early warnings
- [ ] Automated alerting system
- [ ] Custom report builder
- [ ] PDF/CSV export with formatting
- [ ] Meta SSO authentication
- [ ] Role-based permissions
- [ ] Audit logging

---

## 📋 Implementation Details by Component

### Frontend Components to Build

| Component | Phase | Priority | Complexity |
|-----------|-------|----------|------------|
| `TrendLineChart.tsx` | 2 | P0 | Medium |
| `DecayChart.tsx` | 2 | P0 | Medium |
| `WaffleChart.tsx` | 2 | P0 | Medium |
| `WatchListTable.tsx` | 2 | P0 | Low |
| `DateRangePicker.tsx` | 2 | P0 | Low |
| `ChoroplethLayer.tsx` | 3 | P1 | High |
| `HeatMapLayer.tsx` | 3 | P1 | Medium |
| `DrillDownNav.tsx` | 3 | P1 | Medium |
| `TimelineView.tsx` | 3 | P1 | High |
| `ComparisonPanel.tsx` | 3 | P1 | Medium |
| `RiskScoreCard.tsx` | 4 | P2 | Medium |
| `AlertConfig.tsx` | 4 | P2 | Medium |
| `ReportBuilder.tsx` | 4 | P2 | High |

### Data Schema Updates

| Field | Table | Phase | Description |
|-------|-------|-------|-------------|
| `status_date` | PROJECT_STATUS | 2 | When status changed |
| `stage_gate` | PROJECT_STATUS | 2 | Current project stage |
| `next_hearing_date` | KEY_MILESTONES | 2 | Upcoming decision date |
| `risk_score` | DATA_CENTER | 4 | Calculated risk score |
| `opposition_score` | COMMUNITY_OPPOSITION | 2 | Aggregated opposition level |

### API Endpoints to Add

| Endpoint | Phase | Description |
|----------|-------|-------------|
| `GET /api/trends` | 2 | Time-series status data |
| `GET /api/decay` | 2 | Stage gate exit data |
| `GET /api/opposition-summary` | 2 | Opposition factor counts |
| `GET /api/watchlist` | 2 | High-risk projects list |
| `GET /api/regions/{id}/stats` | 3 | Regional statistics |
| `GET /api/projects/{id}/timeline` | 3 | Project milestone timeline |
| `GET /api/predictions` | 4 | Risk predictions |
| `POST /api/alerts` | 4 | Create alert subscription |

---

## 🔄 Dependencies & Risks

### Dependencies

| Dependency | Phase | Risk Level | Mitigation |
|------------|-------|------------|------------|
| CDN Allowlist Approval | 1 | Medium | Network share fallback |
| County Boundary Data | 3 | Low | Public Census data available |
| Historical Status Dates | 2 | Medium | Backfill from sources |
| Stage Gate Data | 2 | Medium | Add to data entry process |

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| CDN never approved | Medium | Low | Use network share or EntryPoints |
| Incomplete historical data | Medium | Medium | Focus on new projects first |
| Scope creep | High | Medium | Strict phase boundaries |
| Performance with large dataset | Medium | Low | Pagination, lazy loading |

---

## 📅 Sprint Plan

### Sprint 1 (Week 1-2): Analytics Foundation
- [ ] Add status_date and stage_gate to data model
- [ ] Create TrendLineChart component
- [ ] Create DecayChart component
- [ ] Implement date range filter

### Sprint 2 (Week 3-4): Analytics Completion
- [ ] Create WaffleChart for opposition factors
- [ ] Create WatchListTable component
- [ ] Add next_hearing_date tracking
- [ ] Implement 4-square grid layout

### Sprint 3 (Week 5-6): Mapping Foundation
- [ ] Integrate county boundary data
- [ ] Implement choropleth layer
- [ ] Add regional statistics aggregation

### Sprint 4 (Week 7-8): Mapping Advanced
- [ ] Implement drill-down navigation
- [ ] Add heat map layer
- [ ] Create timeline component

### Sprint 5 (Week 9-10): Comparison & Polish
- [ ] Multi-region comparison
- [ ] Breadcrumb navigation
- [ ] Performance optimization
- [ ] Accessibility audit

### Sprint 6+ (Week 11+): Enterprise
- [ ] Predictive analytics model
- [ ] Alert system
- [ ] Report builder
- [ ] SSO integration

---

## ✅ Success Criteria

### Phase 2 Complete When:
- [ ] Analytics page loads in < 2 seconds
- [ ] All 4 visualizations render correctly
- [ ] Cross-filtering works between all components
- [ ] Date range filter affects all views
- [ ] Watch list shows correct high-risk projects

### Phase 3 Complete When:
- [ ] Choropleth shows risk scores for all states
- [ ] Drill-down works from national to project level
- [ ] Heat map accurately represents opposition density
- [ ] Timeline shows all milestones for each project

### Phase 4 Complete When:
- [ ] Risk predictions have > 70% accuracy
- [ ] Alerts trigger within 1 hour of threshold breach
- [ ] Reports export correctly to PDF/CSV
- [ ] SSO works for all users

---

## 📚 Related Documents

| Document | Purpose |
|----------|---------|
| [Product Requirements](PRODUCT_REQUIREMENTS.md) | Full requirements specification |
| [AI Context Prompt](AI_CONTEXT_PROMPT.md) | Development context for AI assistants |
| [Static Deployment](STATIC_DEPLOYMENT_MIGRATION.md) | Manifold CDN deployment guide |
| [Internal Hosting Options](INTERNAL_HOSTING_OPTIONS.md) | Meta hosting alternatives |

---

*Roadmap maintained by the Data Center Research Team*
