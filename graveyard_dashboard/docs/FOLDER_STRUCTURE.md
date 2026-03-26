# Data Center Graveyard Dashboard — Folder Structure

**Last Updated:** January 14, 2026

---

## Project Structure

```
graveyard_dashboard/
│
├── 📁 backend/                          # Python FastAPI Backend
│   ├── main.py                         # API endpoints, CORS, data loading
│   └── requirements.txt                # Python dependencies
│       ├── fastapi                     # Web framework
│       ├── uvicorn                     # ASGI server
│       └── pandas                      # Data processing
│
├── 📁 frontend/                         # React + TypeScript Frontend
│   ├── 📁 src/
│   │   ├── 📁 components/              # UI Components
│   │   │   ├── Header.tsx              # Navigation, view switcher, theme toggle
│   │   │   ├── FilterPanel.tsx         # Status, stage, state filters
│   │   │   ├── KPICards.tsx            # Summary statistics cards
│   │   │   ├── MapContainer.tsx        # MapLibre GL map
│   │   │   ├── DataTable.tsx           # TanStack sortable table
│   │   │   └── Charts.tsx              # ECharts visualizations
│   │   │
│   │   ├── 📁 contexts/                # React Contexts
│   │   │   └── ThemeContext.tsx        # Dark/Light theme management
│   │   │
│   │   ├── 📁 types/                   # TypeScript Interfaces
│   │   │   └── index.ts                # Feature, Statistics, Lookups types
│   │   │
│   │   ├── App.tsx                     # Main app, filter context, layout
│   │   ├── main.tsx                    # Entry point, ThemeProvider
│   │   └── index.css                   # Tailwind + Neumorphic design system
│   │
│   ├── index.html                      # HTML entry point
│   ├── package.json                    # Node dependencies
│   ├── tsconfig.json                   # TypeScript config
│   ├── tailwind.config.js              # Tailwind CSS config
│   ├── postcss.config.js               # PostCSS config
│   └── vite.config.ts                  # Vite config with API proxy
│
├── 📁 data/                             # Generated Data Files
│   ├── projects.geojson                # GeoJSON with all projects (~20 features)
│   ├── lookups.json                    # Filter dropdown values
│   └── statistics.json                 # Pre-computed KPIs
│
├── 📁 scripts/                          # Data Processing Scripts
│   └── ingest_from_sheets.py           # Fetch from Google Sheets
│
├── 📁 docs/                             # Documentation
│   ├── AI_CONTEXT_PROMPT.md            # AI assistant context
│   └── FOLDER_STRUCTURE.md             # This file
│
├── run_server.bat                      # One-click startup (CMD)
├── run_server.ps1                      # One-click startup (PowerShell)
└── README.md                           # Quick start guide
```

---

## Component Hierarchy

```
App (App.tsx)
├── ThemeProvider (contexts/ThemeContext.tsx)
│   └── FilterContext.Provider
│       │
│       ├── Header
│       │   ├── Logo & Title
│       │   ├── View Switcher (Map | Table | Charts)
│       │   ├── Theme Toggle (Sun/Moon)
│       │   └── Export Buttons (CSV | GeoJSON)
│       │
│       ├── FilterPanel (sidebar)
│       │   ├── Search input
│       │   ├── Status buttons (BLOCKED | DELAYED | WITHDRAWN)
│       │   ├── Stage Gate dropdown
│       │   ├── State dropdown
│       │   ├── Opposition toggle (With | Without)
│       │   ├── Opposition Factor buttons
│       │   └── Developer dropdown
│       │
│       ├── KPICards
│       │   ├── At-Risk Projects
│       │   ├── Blocked
│       │   ├── Delayed
│       │   ├── Withdrawn
│       │   ├── Capacity at Risk
│       │   ├── Investment at Risk
│       │   └── Community Opposition
│       │
│       └── Content Area (conditional render)
│           ├── [Map View] MapContainer
│           │   ├── MapLibre GL Map
│           │   ├── Status-colored markers
│           │   ├── Opposition glow rings
│           │   ├── Feature popup on click
│           │   ├── Legend (Status colors)
│           │   └── Feature count badge
│           │
│           ├── [Table View] DataTable
│           │   ├── TanStack Table
│           │   ├── Sortable columns
│           │   ├── Pagination
│           │   └── Row selection → map fly-to
│           │
│           └── [Charts View] Charts
│               ├── Projects by Status (donut)
│               ├── Failure by Stage Gate (bar)
│               ├── Top States (bar)
│               ├── Opposition Factors (pie)
│               └── Capacity by State (bar)
```

---

## Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Google Sheets  │────►│ ingest_from_    │────►│     data/       │
│  (internal team)   │     │ sheets.py       │     │ projects.geojson│
└─────────────────┘     └─────────────────┘     │ lookups.json    │
                                                │ statistics.json │
                                                └────────┬────────┘
                                                         │
                        ┌─────────────────┐              │
                        │  Backend API    │◄─────────────┘
                        │  (FastAPI)      │
                        │  :8001          │
                        └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │  /api/features          │
                    │  /api/statistics        │
                    │  /api/lookups           │
                    │  /api/export/csv        │
                    │  /api/export/geojson    │
                    └────────────┬────────────┘
                                 │
                        ┌────────▼────────┐
                        │  Frontend       │
                        │  (React+Vite)   │
                        │  :5174          │
                        └────────┬────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
      ┌─────▼─────┐       ┌──────▼─────┐      ┌──────▼──────┐
      │   Map     │       │   Table    │      │   Charts    │
      │ (MapLibre)│       │ (TanStack) │      │ (ECharts)   │
      └───────────┘       └────────────┘      └─────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI server with all endpoints |
| `frontend/src/App.tsx` | Main app component, filter context |
| `frontend/src/index.css` | Design system (neumorphic, theme vars) |
| `frontend/src/contexts/ThemeContext.tsx` | Theme state + localStorage |
| `frontend/src/components/MapContainer.tsx` | MapLibre map with markers |
| `frontend/src/components/Charts.tsx` | ECharts visualizations |
| `data/projects.geojson` | All project data with geometry |
| `docs/AI_CONTEXT_PROMPT.md` | Full AI context for development |

---

## Ports & URLs

| Service | Port | URL |
|---------|------|-----|
| Backend API | 8001 | http://localhost:8001 |
| API Docs | 8001 | http://localhost:8001/docs |
| Frontend | 5174 | http://localhost:5174 |

---

## Dependencies

### Python (backend/requirements.txt)
- fastapi
- uvicorn[standard]
- pandas

### Node (frontend/package.json)
- react, react-dom
- typescript, vite
- tailwindcss, postcss, autoprefixer
- maplibre-gl
- echarts, echarts-for-react
- @tanstack/react-table
- lucide-react

---

*Updated: January 14, 2026*
