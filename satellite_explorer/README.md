# DCII Satellite Explorer

An Epoch AI-style satellite imagery interface for Data Center Industry Intelligence (DCII) analysis. Built with React, MapLibre GL JS, and FastAPI.

**Last Updated:** February 26, 2026

## Overview

This dashboard provides an interactive interface for viewing and analyzing satellite imagery of peer data center construction projects. Inspired by [Epoch AI's Satellite Explorer](https://epoch.ai/data/data-centers/satellite-explorer).

### Key Features

- **Interactive Map**: MapLibre GL JS map with site markers and company color coding
- **Timeline Slider**: Scrub through imagery dates with play/pause animation
- **Site Detail Panel**: Metrics, equipment counts, capacity charts, and change detection
- **Comparison View**: Before/after imagery swipe (coming soon)
- **SAM Integration Ready**: Designed to consume Segment Anything Model outputs for automated feature extraction

### Priority Sites (MVP)

| Site | Company | Cadence |
|------|---------|---------|
| Colossus 1, 2, 3 | xAI | Weekly |
| Stargate 1 | OpenAI | Monthly |
| Rainier 1 (Indiana) | AWS | Monthly |
| Rainier 2 (Jackson, MI) | AWS | Monthly |
| Fairwater (Mt. Pleasant, WI) | Microsoft | Monthly |

## Architecture

```
DCII_Satellite_Explorer/
├── backend/                 # FastAPI server
│   ├── main.py             # API endpoints
│   ├── requirements.txt    # Python dependencies
│   └── services/
│       ├── esri_client.py       # ESRI Portal integration
│       └── imagery_metadata.py  # Snapshot management
├── frontend/               # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── Header.tsx
│   │   │   ├── SiteList.tsx
│   │   │   ├── MapContainer.tsx
│   │   │   ├── TimelineSlider.tsx
│   │   │   └── SitePanel.tsx
│   │   ├── context/        # React contexts
│   │   ├── types/          # TypeScript interfaces
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── data/                   # JSON data files
│   ├── sites.json          # Site catalog with snapshots
│   └── lookups.json        # Filter dropdowns
├── docs/                   # Documentation
├── mockups/                # HTML mockup prototypes
├── run_server.bat          # Windows startup (batch)
├── run_server.ps1          # Windows startup (PowerShell)
└── README.md               # This file
```

## Quick Start

### Prerequisites

- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **Python** 3.10+ ([python.org](https://python.org))

### Installation

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Install Node dependencies:**
   ```bash
   cd frontend
   npm install
   ```

### Run the Dashboard

**Option A: One-click startup (Windows)**
```bash
.\run_server.bat
# or
.\run_server.ps1
```

**Option B: Manual startup**

Terminal 1 - Backend:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### Access the Dashboard

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/sites` | List all tracked sites |
| `GET /api/sites/{site_id}` | Get site detail with full snapshot history |
| `GET /api/sites/{site_id}/snapshots` | Get all imagery snapshots for a site |
| `GET /api/sites/{site_id}/changes` | Get detected changes for a site |
| `GET /api/sites/{site_id}/compare` | Compare two snapshots |
| `GET /api/timeline` | Get global timeline of all dates |
| `GET /api/lookups` | Get filter dropdown values |
| `GET /api/reload` | Refresh data cache |

## Data Model

### Site Structure
```json
{
  "id": "xai_memphis_colossus_1",
  "name": "xAI Memphis",
  "project": "Colossus 1",
  "company": "xAI",
  "location": { "lat": 35.0615, "lng": -90.0911 },
  "cadence": "weekly",
  "status": "under_construction",
  "snapshots": [
    {
      "date": "2026-02-22",
      "metrics": {
        "estimated_mw": 300,
        "gpu_count": 200000,
        "building_sqft": 780000,
        "cooling_towers": 12,
        "percent_complete": 75
      },
      "changes": [
        {
          "type": "equipment_added",
          "category": "cooling_towers",
          "delta": 2,
          "description": "+2 cooling towers installed"
        }
      ]
    }
  ],
  "links": {
    "slides": "https://docs.google.com/...",
    "kiq_narrative": "https://docs.google.com/..."
  }
}
```

## SAM Integration (Coming Soon)

When SAM automation is ready, the dashboard will consume auto-extracted features:

- **Building footprints** → sqft, construction stage
- **Cooling towers** → count, type (open/closed)
- **Generators** → count, type, MW estimate
- **Chillers** → count, estimated capacity
- **Change detection** → auto-generated delta between snapshots

## ESRI Integration

The backend includes scaffolding for ESRI Portal integration:

- `esri_client.py` - REST API client for Image Services and Feature Services
- Designed to query imagery from `your-portal.example.com`
- COG (Cloud Optimized GeoTIFF) tile serving for MapLibre

**Note**: [Portal integration requires VPN access]

## Development

### Adding a New Site

1. Add site entry to `data/sites.json`
2. Include at least one snapshot with metrics
3. Call `http://localhost:8000/api/reload` or restart backend

### Adding New Components

1. Create component in `frontend/src/components/`
2. Import and use in `App.tsx`
3. Add types to `frontend/src/types/index.ts` if needed

### Building for Production

```bash
cd frontend
npm run build
```

Built files go to `frontend/dist/`, which FastAPI serves automatically.

## Related Documents

- [Implementation Plan](./docs/dcii_satellite_explorer_implementation.plan.md)
- [Epoch UI Component Mapping](./docs/EPOCH_UI_COMPONENT_MAPPING.md)
- [Satellite Imagery Workflow]()
- [Deliverables Status Tracker]()

## License

MIT License - see LICENSE file.

## Author

Patrick Anderson
February 2026
