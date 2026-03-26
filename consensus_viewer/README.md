# Data Center Consensus Dashboard

A modern, self-hosted geospatial dashboard for infrastructure planning analysis. This dashboard replaces ESRI Experience Builder with a custom React + MapLibre GL JS solution featuring world-class UI design.

**Last Updated:** January 14, 2026

## Features

### Map & Visualization
- **Interactive Map**: MapLibre GL JS with zoom-based symbology (campus points at all zoom levels, buildings at zoom 14+)
- **Company-Colored Points**: 8 hyperscaler/colo companies with distinct brand colors
- **Arc/Pie Status Indicators**: Progress ring visualization showing development stage:
  - Active: 100% (full circle)
  - Under Construction: 75%
  - Announced: 50%
  - Planned: 25%
  - Land Acquisition: 10%
- **Feature Popup Panel**: Slide-in executive summary with drill-down sections and 10-year capacity trend chart

### Filtering
- **Advanced Filtering**: Filter by company, source, status, region, state, tier, capacity range
- **Hyperscalers Only Toggle**: Quick filter for AWS, Microsoft, Google, Meta, Apple, Oracle, Alibaba, xAI
- **Essential Sites Toggle**: Filter to curated strategic sites
- **Capacity Type Selector**: Switch between Full, Commissioned, Under Construction, or Planned capacity

### Analytics
- **Analytics Dashboard**: ECharts-powered charts (capacity by company, status, region, forecast)
- **Capacity Distribution Histogram**: Grouped bar chart by capacity bucket, color-coded by company
- **Data Table**: TanStack Table with sorting, filtering, pagination, and export

### Export & Design
- **Export Options**: Download filtered data as CSV or GeoJSON
- **Apple-Inspired UI**: Glassmorphism design with animated backgrounds and neomorphic buttons

## Architecture

```
web_dashboard/
├── backend/                 # FastAPI server
│   ├── main.py             # API endpoints, CORS, static file serving
│   └── requirements.txt    # Python dependencies
├── frontend/               # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # React components (Map, Table, Charts, Filters)
│   │   ├── types/          # TypeScript interfaces
│   │   ├── App.tsx         # Main app with filter context
│   │   └── index.css       # Glassmorphism CSS design system
│   ├── package.json        # Node dependencies
│   └── vite.config.ts      # Vite configuration with API proxy
├── data/                   # GeoJSON data files (generated)
│   ├── buildings.geojson   # ~22,696 building features
│   ├── campuses.geojson    # ~11,715 campus features
│   ├── combined.geojson    # XB combined layer
│   ├── lookups.json        # Filter dropdown values
│   └── statistics.json     # Pre-computed KPIs
├── 08_web_export/          # ArcGIS export scripts
│   └── export_to_geojson.py
├── run_server.bat          # One-click startup (Windows)
├── run_server.ps1          # PowerShell startup script
└── README.md               # This file
```

## Quick Start

### Step 1: Export GeoJSON from ArcGIS Pro

Open ArcGIS Pro Python window and run:

```python
exec(open(r".\08_web_export\export_to_geojson.py", encoding='utf-8').read())
```

This exports `gold_buildings_full`, `gold_campus_full`, and `gold_combined_xb` to GeoJSON format.

### Step 2: Install Dependencies

**Backend (Python):**
```bash
cd web_dashboard/backend
pip install -r requirements.txt
```

**Frontend (Node.js):**
```bash
cd web_dashboard/frontend
npm install
```

### Step 3: Start the Dashboard

**Option A: One-click startup (Windows)**
```bash
cd web_dashboard
run_server.bat
```

**Option B: Manual startup**

Terminal 1 - Backend:
```bash
cd web_dashboard/backend
uvicorn main:app --reload --port 8000
```

Terminal 2 - Frontend:
```bash
cd web_dashboard/frontend
npm run dev
```

### Step 4: Open the Dashboard

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/features/{layer}` | Get GeoJSON features (buildings, campuses, combined) |
| `GET /api/statistics` | Get aggregated statistics |
| `GET /api/lookups` | Get filter dropdown values |
| `GET /api/export/csv/{layer}` | Download filtered CSV |
| `GET /api/export/geojson/{layer}` | Download filtered GeoJSON |
| `GET /api/reload` | Refresh data cache (use after re-exporting GeoJSON) |

### Query Parameters

All `/api/features/{layer}` requests support:

| Parameter | Type | Description |
|-----------|------|-------------|
| `company` | string | Filter by company (comma-separated) |
| `source` | string | Filter by data source |
| `status` | string | Filter by facility status |
| `region` | string | Filter by region (AMER, EMEA, APAC) |
| `state` | string | Filter by state abbreviation |
| `tier` | string | Filter by tier (Hyperscaler, Major Colo, Other) |
| `min_mw` | float | Minimum capacity |
| `max_mw` | float | Maximum capacity |
| `essential_only` | bool | Only show essential sites |
| `search` | string | Search across multiple fields |

Example:
```
/api/features/campuses?company=AWS,Microsoft&region=AMER&min_mw=100
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Mapping** | MapLibre GL JS 4.0 (free, no API key) |
| **Charts** | Apache ECharts 5.4 via echarts-for-react |
| **Data Table** | TanStack Table 8.11 |
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + Custom glassmorphism |
| **Backend** | FastAPI + Uvicorn |
| **Icons** | Lucide React |

## Design System

The UI features a glassmorphism design inspired by Apple's macOS:

- **Background**: Animated gradient with floating blur orbs
- **Cards**: Frosted glass effect (`backdrop-filter: blur(20px)`)
- **Buttons**: Neomorphic styling with soft shadows
- **Colors**: Navy base with blue/purple/cyan accents
- **Typography**: SF Pro Display / Inter font stack
- **Animations**: Smooth transitions, slide-up reveals, shimmer loading states

## Development

### Frontend Development

```bash
cd frontend
npm run dev     # Start dev server with HMR
npm run build   # Build for production
npm run preview # Preview production build
```

### Backend Development

```bash
cd backend
uvicorn main:app --reload  # Hot reload on code changes
```

### Adding New Features

1. **New Filter**: Add to `FilterState` type, `FilterPanel` component, and API query params
2. **New Chart**: Add to `Charts.tsx` with ECharts configuration
3. **New Column**: Add to `DataTable.tsx` column definitions
4. **New API Endpoint**: Add to `backend/main.py`

## Data Refresh

When source data changes in ArcGIS:

1. Re-run the export script in ArcGIS Pro
2. Refresh the data cache (choose one method):
   - **Quick**: Call `http://localhost:8000/api/reload` in browser
   - **Full restart**: Restart the backend server
3. Refresh the frontend browser tab to see new data

## Troubleshooting

**"Failed to load data" error:**
- Ensure backend is running on port 8000
- Check that GeoJSON files exist in `web_dashboard/data/`

**Map doesn't load:**
- Check browser console for errors
- Ensure CORS is enabled (it is by default)

**Charts show no data:**
- Verify `statistics.json` was generated
- Check that features have capacity values

---

## Deployment to Shared Server

### What to Copy vs. Regenerate Locally

When migrating the dashboard to a shared network server, **copy these essential files** and **regenerate the rest locally** on the target machine.

#### ✅ COPY These (Essential Files)

| Folder/File | Size | Purpose |
|-------------|------|---------|
| `backend/main.py` | ~15 KB | FastAPI server code |
| `backend/requirements.txt` | ~200 B | Python dependencies list |
| `frontend/src/` | ~50 KB | React source code |
| `frontend/package.json` | ~2 KB | Node dependencies list |
| `frontend/vite.config.ts` | ~500 B | Vite configuration |
| `frontend/tsconfig*.json` | ~1 KB | TypeScript config |
| `frontend/index.html` | ~500 B | HTML entry point |
| `frontend/tailwind.config.js` | ~1 KB | Tailwind CSS config |
| `frontend/postcss.config.js` | ~200 B | PostCSS config |
| `data/*.geojson` | ~50 MB | GeoJSON data files |
| `data/*.json` | ~100 KB | Lookups and statistics |
| `08_web_export/export_to_geojson.py` | ~10 KB | Export script |
| `start_dashboard.ps1` | ~2 KB | Startup script |
| `README.md` | ~8 KB | This documentation |

**Total to copy: ~50-60 MB**

#### ❌ DO NOT Copy (Regenerate Locally)

| Folder | Size | Why Skip | Regenerate With |
|--------|------|----------|-----------------|
| `frontend/node_modules/` | ~300 MB | Platform-specific binaries | `npm install` |
| `frontend/dist/` | ~5 MB | Build output | `npm run build` |
| `frontend/.vite/` | ~1 MB | Vite cache | Auto-generated |
| `backend/__pycache__/` | ~100 KB | Python bytecode | Auto-generated |

### Migration Steps

#### Step 1: Copy Essential Files

Using robocopy (Windows):
```powershell
$SOURCE = "C:\path\to\web_dashboard"
$TARGET = "\\server\share\ICI_ConsensusDashboard"

robocopy $SOURCE $TARGET /E /XD node_modules __pycache__ .vite dist
```

Or manually copy the folders listed above.

#### Step 2: Install Dependencies on Target Server

**Prerequisites on target server:**
- Node.js v18+ (https://nodejs.org)
- Python 3.10+ (https://python.org)
- Network ports 5173 and 8000 open in firewall

**Install Node dependencies:**
```powershell
cd \\server\share\ICI_ConsensusDashboard\frontend
npm install
```

**Install Python dependencies:**
```powershell
cd \\server\share\ICI_ConsensusDashboard\backend
pip install -r requirements.txt
```

#### Step 3: Start the Dashboard

```powershell
cd \\server\share\ICI_ConsensusDashboard
.\start_dashboard.ps1
```

Or start manually:

**Terminal 1 (Backend):**
```powershell
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev -- --host 0.0.0.0
```

#### Step 4: Access the Dashboard

- **Local:** http://localhost:5173
- **Network:** http://<server-ip>:5173
- **API Docs:** http://<server-ip>:8000/docs

### Updating Data on the Server

When source data changes:

1. Re-run the export script in ArcGIS Pro (on your local machine)
2. Copy the updated `data/*.geojson` and `data/*.json` files to the server
3. Reload the backend cache: `http://<server-ip>:8000/api/reload`

---

## Automated Migration Script

Use `migrate_to_server.ps1` to automate the copy process:

```powershell
cd web_dashboard
.\migrate_to_server.ps1
```

This script:
- Copies all essential files using robocopy
- Excludes node_modules, __pycache__, .vite
- Creates a server-specific startup script
- Preserves newer files (won't overwrite if target is newer)

**Note:** Requires network share access. Connect via VPN if needed.

---

## License

MIT License - see LICENSE file.

## Author

Patrick Anderson
January 2026
