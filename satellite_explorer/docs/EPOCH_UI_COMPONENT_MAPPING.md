# Epoch AI Satellite Explorer → DCII UI Component Mapping

**Project**: DCII Satellite Imagery Interface Revamp
**Date**: February 26, 2026
**Author**: Patrick Anderson

---

## Executive Summary

This document maps the key UI/UX components from Epoch AI's Satellite Explorer to two implementation approaches:
1. **ESRI-Native** (ArcGIS Experience Builder + custom widgets)
2. **Standalone Web App** (React + Mapbox/Leaflet + D3)

**Recommendation**: Hybrid approach - ESRI backend for data/imagery management, custom React frontend for user experience.

---

## Component Mapping Matrix

| Epoch AI Component | Description | ESRI Implementation | Standalone Implementation | Complexity | Priority |
|-------------------|-------------|---------------------|--------------------------|------------|----------|
| **Interactive Map** | Base map with satellite imagery layers | ArcGIS JS API MapView, hosted tile layers | Mapbox GL JS or Leaflet with COG tiles | Low | P0 |
| **Site Markers** | Clickable data center pins with popups | FeatureLayer with PopupTemplate | GeoJSON layer with custom markers | Low | P0 |
| **Timeline Slider** | Scrub through dates, syncs imagery + data | TimeSlider widget (limited styling) | Custom React component + D3 | Medium | P0 |
| **Imagery Swipe/Compare** | Side-by-side or overlay comparison | Swipe widget | react-compare-image or custom | Low | P1 |
| **Metrics Overlay** | GPU counts, MW, sq ft badges on map | Custom graphic overlays | Mapbox markers or SVG overlays | Medium | P0 |
| **Site Detail Panel** | Slide-out panel with charts + stats | Custom Experience Builder widget | React panel component | Medium | P0 |
| **Trend Charts** | Line/area charts showing growth over time | ArcGIS Charts (limited) | D3.js or Chart.js or Recharts | Medium | P1 |
| **Building Footprints** | Polygon overlays showing construction | FeatureLayer from SAM outputs | GeoJSON polygons with styling | Low | P1 |
| **Change Detection Highlights** | Visual diff between time periods | ImageryLayer with raster functions | Canvas overlay with diff computation | High | P2 |
| **Data Table/Export** | Tabular view of all sites | FeatureTable widget | AG Grid or TanStack Table | Low | P2 |
| **Search/Filter** | Filter by company, status, region | Filter widget | Custom search component | Low | P1 |
| **Animation/Playback** | Auto-play through timeline | TimeSlider autoplay | Custom animation controller | Medium | P2 |

---

## Tech Stack Deep Dive

### Option A: ESRI-Native (ArcGIS Experience Builder)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ArcGIS Experience Builder                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Map Widget  │  │ TimeSlider   │  │  Custom Widgets      │   │
│  │  (MapView)   │  │  Widget      │  │  (Site Panel, Charts)│   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      ArcGIS JS API 4.x                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Hosted Tile  │  │ Feature      │  │  Image Service       │   │
│  │ Layers (COG) │  │ Services     │  │  (Imagery catalog)   │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    ArcGIS Enterprise Portal                     │
│                    (your-portal.example.com)                  │
└─────────────────────────────────────────────────────────────────┘
```

**Pros:**
- Leverages existing ESRI infrastructure & Portal SSO
- Native integration with SAM outputs from ArcGIS Pro
- Built-in time-aware layer support
- No separate hosting needed

**Cons:**
- Limited UI/UX customization (widgets look "ESRI-like")
- TimeSlider styling is constrained
- Custom widget development requires TypeScript + ESRI SDK knowledge
- Performance with large imagery catalogs can lag

---

### Option B: Standalone Web App (React + Mapbox)

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Mapbox GL   │  │ Custom       │  │  Recharts/D3         │   │
│  │  JS Map      │  │ TimeSlider   │  │  Charts              │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Site Panel  │  │ Metrics      │  │  Filter/Search       │   │
│  │  Component   │  │ Overlays     │  │  Component           │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                        REST API Layer                           │
│              (FastAPI or Express connecting to ESRI)            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ COG Tiles    │  │ Feature      │  │  PostgreSQL/         │   │
│  │ (S3/Azure)   │  │ Service API  │  │  Metrics DB          │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    ArcGIS Enterprise (Backend only)             │
└─────────────────────────────────────────────────────────────────┘
```

**Pros:**
- Full UI/UX control - can match Epoch AI exactly
- Modern React ecosystem (fast dev, good tooling)
- Better performance for custom interactions
- Can still consume ESRI services as data backend

**Cons:**
- Need separate hosting (internal web server)
- Requires building auth integration with Meta SSO
- More upfront development effort
- Two systems to maintain (ESRI + custom app)

---

### Option C: Hybrid (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│            Custom React App (Vite + Tailwind)                   │
│                 Hosted on internal Meta infra                    │
├─────────────────────────────────────────────────────────────────┤
│           ↓ Consumes services via ArcGIS REST API ↓             │
├─────────────────────────────────────────────────────────────────┤
│                    ArcGIS Enterprise Portal                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Image        │  │ Feature      │  │  SAM Processing      │   │
│  │ Service      │  │ Service      │  │  (ArcGIS Pro)        │   │
│  │ (Imagery)    │  │ (Metrics)    │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Why Hybrid:**
- Best of both worlds: ESRI for data management, custom UI for experience
- SAM automation outputs go directly to ESRI Feature Services
- React app queries ESRI REST endpoints for imagery + metrics
- Can iterate on UI without touching backend data pipeline
- Future-proof: can swap ESRI for other imagery backends if needed

---

## Priority Sites for Prototyping

Based on your status tracker, these sites have the most complete data and highest update frequency:

| Priority | Site | Cadence | Why |
|----------|------|---------|-----|
| **P1** | xAI Memphis (Colossus 1 & 2) | Weekly | Most frequent updates, rapid construction, high visibility |
| **P2** | OpenAI Stargate Abilene | Monthly | Major Stargate project, complete imagery history |
| **P3** | AWS Rainier (South Bend, IN) | Monthly | Good construction progression data |

---

## Data Model for Time-Synced Metrics

```json
{
  "site_id": "xai_memphis_colossus_1",
  "site_name": "xAI Memphis - Colossus 1",
  "company": "xAI",
  "location": {
    "lat": 35.0844,
    "lng": -90.0511,
    "address": "3231 Riverport Rd, Memphis, TN 38109"
  },
  "snapshots": [
    {
      "date": "2025-11-27",
      "imagery_url": "https://your-portal.example.com/.../colossus1_20251127.tif",
      "metrics": {
        "estimated_mw": 150,
        "gpu_count": 100000,
        "building_sqft": 450000,
        "cooling_towers": 12,
        "generators": 14,
        "turbines": 5,
        "construction_stage": "Phase 2 - IT Install",
        "percent_complete": 75
      },
      "features": {
        "buildings": ["geojson_url"],
        "equipment": ["geojson_url"],
        "change_polygons": ["geojson_url"]
      },
      "annotations": [
        {
          "type": "observation",
          "text": "5 additional 16MW turbines visible",
          "author": "Daniel Vargas",
          "geometry": {...}
        }
      ]
    }
  ]
}
```

---

## Next Steps

1. **Review mockups** (see `01_mockups/` folder)
2. **Decide on tech stack** (ESRI-native vs Hybrid)
3. **Define MVP scope** (which components for v1?)
4. **Identify dev resources** (who builds this?)
5. **Plan SAM integration** (how do extracted features flow to the UI?)

---

## Files in This Package

```
satellite_imagery_ui/
├── 00_planning/
│   └── EPOCH_UI_COMPONENT_MAPPING.md  (this file)
├── 01_mockups/
│   ├── dcii_explorer_mockup.html      (interactive prototype)
│   ├── xai_memphis_site_panel.html    (site detail mockup)
│   └── assets/
│       └── styles.css
└── 02_technical/
    └── DATA_MODEL_SPEC.md
```
