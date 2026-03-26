# Data Center Graveyard Dashboard

An interactive geospatial dashboard for tracking at-risk, delayed, and failed data center projects. This dashboard visualizes the "Failed/Delayed Datacenter Database" maintained by the internal research team.

> **Last Updated:** January 16, 2026
> **Version:** 2.0
> **Status:** ✅ Local Working | ⏳ Manifold CDN Pending Allowlist

---

## Features

### Views
- **Interactive Map**: MapLibre GL JS with status-colored markers showing BLOCKED/DELAYED/WITHDRAWN projects
- **Data Table**: TanStack Table with sorting, filtering, and pagination
- **Analytics Dashboard**: ECharts-powered charts (status breakdown, state distribution, opposition factors)

### Theme System
- **Light Mode** (default): Clean neumorphic design with soft 3D shadows
- **Dark Mode**: Dark slate background with glowing elements
- **Toggle**: Sun/Moon icon in header, persists to localStorage

### Filters
- **Status**: BLOCKED, DELAYED, WITHDRAWN
- **Stage Gate**: Track where projects failed in approval process
- **State**: Filter by US state
- **Developer**: Filter by developer company
- **Community Opposition**: With/Without opposition, filterable by concern type
- **Search**: Text search across all fields

### Export
- Download filtered data as CSV or GeoJSON

---

## Architecture

```
graveyard_dashboard/
├── backend/                    # FastAPI server (port 8001)
│   ├── main.py                # API endpoints, CORS, data loading
│   └── requirements.txt       # Python dependencies
│
├── frontend/                   # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── components/        # Map, Table, Charts, Filters, Header
│   │   ├── contexts/          # ThemeContext (dark/light mode)
│   │   ├── types/             # TypeScript interfaces
│   │   ├── App.tsx            # Main app with filter context
│   │   └── index.css          # Tailwind + Neumorphic design system
│   ├── package.json           # Node dependencies
│   └── vite.config.ts         # Vite config with API proxy
│
├── data/                       # Generated data files
│   ├── projects.geojson       # All at-risk projects
│   ├── lookups.json           # Filter dropdown values
│   └── statistics.json        # Pre-computed KPIs
│
├── scripts/
│   └── ingest_from_sheets.py  # Fetch from Google Sheets
│
├── docs/
│   └── AI_CONTEXT_PROMPT.md   # AI context documentation
│
├── run_server.bat             # One-click startup (Windows CMD)
├── run_server.ps1             # PowerShell startup script
└── README.md                  # This file
```

---

## Quick Start

### Option A: One-Click Startup (Recommended)

```powershell
cd "."
.\run_server.ps1
```

### Option B: Manual Startup

**Terminal 1 - Backend:**
```bash
cd graveyard_dashboard/backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8001
```

**Terminal 2 - Frontend:**
```bash
cd graveyard_dashboard/frontend
npm install
npm run dev
```

### Access the Dashboard

| URL | Description |
|-----|-------------|
| http://localhost:5174 | Frontend Dashboard |
| http://localhost:8001/docs | API Documentation (Swagger) |
| http://localhost:8001/api/health | Health Check |

---

## Static Build Mode

The frontend can now run without the backend. Data is bundled into the build.

```powershell
# Build static version
cd frontend
npm run build

# Preview locally
npx serve dist
# Opens at http://localhost:3000
```

Build output (dist/):
- `index.html` - Entry point
- `assets/` - JS/CSS chunks (vendor, map, charts, table)
- `data/` - projects.geojson, lookups.json, statistics.json

---

## Data Refresh

To update with the latest data from Google Sheets:

```bash
cd graveyard_dashboard/scripts
python ingest_from_sheets.py
```

Then refresh the data cache:
- Option A: Visit http://localhost:8001/api/reload
- Option B: Restart the backend server

---

## Data Source

**Google Sheet:** [Failed/Delayed Datacenter Database]([Google Sheet URL - replace with your own])

| Table | Description |
|-------|-------------|
| `DATA_CENTER` | Core project info (name, location, capacity, developer, tenant) |
| `PROJECT_STATUS` | Status changes over time (BLOCKED, DELAYED, WITHDRAWN) |
| `COMMUNITY_OPPOSITION` | Opposition factors (water, electricity, noise, environment, etc.) |
| `KEY_MILESTONES` | Timeline events (protests, hearings, votes, withdrawals) |

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/features` | Get GeoJSON features with filtering |
| `GET /api/statistics` | Get aggregated statistics |
| `GET /api/lookups` | Get filter dropdown values |
| `GET /api/export/csv` | Download filtered CSV |
| `GET /api/export/geojson` | Download filtered GeoJSON |
| `GET /api/reload` | Refresh data cache |

### Query Parameters

| Parameter | Description |
|-----------|-------------|
| `status` | BLOCKED, DELAYED, WITHDRAWN |
| `stage_gate` | Stage where project failed |
| `state` | Filter by state |
| `developer` | Filter by developer name |
| `has_opposition` | true/false |
| `opposition_factor` | Water, Electricity, Noise, etc. |
| `search` | Text search across fields |

---

## Status Colors

| Status | Color | Description |
|--------|-------|-------------|
| 🔴 BLOCKED | Red | Project formally rejected/denied |
| 🟠 DELAYED | Amber | Project facing delays or moratorium |
| ⚪ WITHDRAWN | Gray | Developer withdrew application |
| 🟢 APPROVED | Green | Project approved (rare in this dataset) |

---

## Opposition Factors

| Factor | Icon | Description |
|--------|------|-------------|
| Water | 💧 | Water usage/aquifer concerns |
| Electricity | ⚡ | Grid/power infrastructure concerns |
| Noise | 🔊 | Noise pollution from cooling systems |
| Air Quality | 🌫️ | Air quality/emissions concerns |
| Environment | 🌳 | General environmental impact |
| Aesthetic | 👁️ | Visual/landscape concerns |
| Property Value | 🏠 | Impact on nearby property values |
| Health | ❤️ | Health-related concerns |
| Other | 📋 | Other opposition factors |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Mapping** | MapLibre GL JS 4.x (free, no API key) |
| **Charts** | Apache ECharts 5.4 via echarts-for-react |
| **Data Table** | TanStack Table 8.x |
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + Neumorphic design system |
| **Backend** | FastAPI + Uvicorn |
| **Icons** | Lucide React |

---

## Design System

The dashboard uses a **neumorphic (soft UI) design** with:
- Raised panels with dual-direction shadows
- Inset effect for input fields
- Subtle hover animations
- Theme-aware light/dark mode

---

## Documentation

| Document | Location | Description |
|----------|----------|-------------|
| README.md | `graveyard_dashboard/` | This file |
| AI_CONTEXT_PROMPT.md | `graveyard_dashboard/docs/` | Full AI context for continuing development |

---

## License

MIT License - see LICENSE file.

---

## Author

Patrick Anderson
January 2026
