"""
FastAPI Backend Server for Data Center Consensus Dashboard

This server provides:
1. Static file serving for GeoJSON data
2. API endpoints for filtered data, statistics, and exports
3. CORS support for local development

Run with:
    cd web_dashboard/backend
    uvicorn main:app --reload --port 8000

Author: Patrick Anderson
Date: 2026-01-12
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import json
import os
import csv
import io
from datetime import datetime

# Initialize FastAPI app
app = FastAPI(
    title="Data Center Consensus Dashboard API",
    description="API for serving geospatial data center data with filtering and export capabilities",
    version="1.0.0"
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
# DATA_DIR is at web_dashboard/data/ (not web_dashboard/backend/data/)
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

# Cache for loaded data (loaded once at startup)
_cache = {
    "buildings": None,
    "campuses": None,
    "combined": None,
    "lookups": None,
    "statistics": None,
}


def load_data():
    """Load all data files into cache."""
    global _cache

    for key in ["buildings", "campuses", "combined"]:
        filepath = os.path.join(DATA_DIR, f"{key}.geojson")
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                _cache[key] = json.load(f)
            print(f"✅ Loaded {key}.geojson ({len(_cache[key].get('features', []))} features)")
        else:
            print(f"⚠️ {key}.geojson not found at {filepath}")

    # Load lookups
    lookups_path = os.path.join(DATA_DIR, "lookups.json")
    if os.path.exists(lookups_path):
        with open(lookups_path, 'r', encoding='utf-8') as f:
            _cache["lookups"] = json.load(f)
        print(f"✅ Loaded lookups.json")

    # Load statistics
    stats_path = os.path.join(DATA_DIR, "statistics.json")
    if os.path.exists(stats_path):
        with open(stats_path, 'r', encoding='utf-8') as f:
            _cache["statistics"] = json.load(f)
        print(f"✅ Loaded statistics.json")


@app.on_event("startup")
async def startup_event():
    """Load data on server startup."""
    print("\n" + "=" * 60)
    print("🚀 Starting Data Center Consensus Dashboard API")
    print("=" * 60)
    load_data()
    print("=" * 60 + "\n")


# ==============================================================================
# API ENDPOINTS
# ==============================================================================

@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "message": "Data Center Consensus Dashboard API",
        "version": "1.0.0",
        "endpoints": {
            "features": "/api/features/{layer}",
            "statistics": "/api/statistics",
            "lookups": "/api/lookups",
            "export_csv": "/api/export/csv/{layer}",
            "export_geojson": "/api/export/geojson/{layer}"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "data_loaded": {
            "buildings": _cache["buildings"] is not None,
            "campuses": _cache["campuses"] is not None,
            "combined": _cache["combined"] is not None,
            "lookups": _cache["lookups"] is not None,
            "statistics": _cache["statistics"] is not None,
        },
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/reload")
async def reload_cache():
    """Reload all data files into cache (use after re-exporting GeoJSON)."""
    print("\n🔄 Reloading data cache...")
    load_data()

    # Count essential records
    combined_data = _cache.get("combined")
    essential_count = 0
    if combined_data:
        essential_count = sum(1 for f in combined_data.get("features", [])
                              if f.get("properties", {}).get("is_essential") == 1)

    return {
        "status": "reloaded",
        "data_loaded": {
            "buildings": len(_cache["buildings"].get("features", [])) if _cache["buildings"] else 0,
            "campuses": len(_cache["campuses"].get("features", [])) if _cache["campuses"] else 0,
            "combined": len(_cache["combined"].get("features", [])) if _cache["combined"] else 0,
        },
        "essential_records": essential_count,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/features/{layer}")
async def get_features(
    layer: str,
    company: Optional[str] = Query(None, description="Filter by company (comma-separated)"),
    source: Optional[str] = Query(None, description="Filter by source (comma-separated)"),
    status: Optional[str] = Query(None, description="Filter by facility_status (comma-separated)"),
    region: Optional[str] = Query(None, description="Filter by region (comma-separated)"),
    country: Optional[str] = Query(None, description="Filter by country (comma-separated)"),
    tier: Optional[str] = Query(None, description="Filter by tier (comma-separated)"),
    min_mw: Optional[float] = Query(None, description="Minimum full_capacity_mw"),
    max_mw: Optional[float] = Query(None, description="Maximum full_capacity_mw"),
    essential_only: Optional[bool] = Query(False, description="Only show essential sites"),
    search: Optional[str] = Query(None, description="Search across multiple fields"),
    limit: Optional[int] = Query(None, description="Limit number of results"),
    offset: Optional[int] = Query(0, description="Offset for pagination"),
):
    """
    Get GeoJSON features with optional filtering.

    Layers: buildings, campuses, combined
    """
    if layer not in ["buildings", "campuses", "combined"]:
        raise HTTPException(status_code=400, detail=f"Invalid layer: {layer}")

    data = _cache.get(layer)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Data for layer '{layer}' not loaded")

    features = data.get("features", [])

    # Apply filters
    filtered = []
    for feature in features:
        props = feature.get("properties", {})

        # Company filter
        if company:
            companies = [c.strip() for c in company.split(",")]
            if props.get("company_clean_filter") not in companies and props.get("company_clean") not in companies:
                continue

        # Source filter - uses "contains" logic for individual sources
        if source:
            sources = [s.strip() for s in source.split(",")]
            source_value = props.get("source") or ""
            # Check if ANY of the requested sources are in the source field
            if not any(s in source_value for s in sources):
                continue

        # Status filter
        if status:
            statuses = [s.strip() for s in status.split(",")]
            if props.get("facility_status") not in statuses:
                continue

        # Region filter
        if region:
            regions = [r.strip() for r in region.split(",")]
            if props.get("region") not in regions:
                continue

        # Country filter
        if country:
            countries = [c.strip() for c in country.split(",")]
            if props.get("country") not in countries:
                continue

        # Tier filter
        if tier:
            tiers = [t.strip() for t in tier.split(",")]
            if props.get("tier") not in tiers:
                continue

        # Capacity filter
        capacity = props.get("full_capacity_mw") or 0
        if min_mw is not None and capacity < min_mw:
            continue
        if max_mw is not None and capacity > max_mw:
            continue

        # Essential only filter
        if essential_only and not props.get("is_essential"):
            continue

        # Text search (searches across multiple fields)
        if search:
            search_lower = search.lower()
            searchable = " ".join([
                str(props.get("company_clean") or ""),
                str(props.get("campus_name") or ""),
                str(props.get("building_name") or ""),
                str(props.get("city") or ""),
                str(props.get("ucid") or ""),
                str(props.get("unique_id") or ""),
            ]).lower()
            if search_lower not in searchable:
                continue

        filtered.append(feature)

    # Apply pagination
    total_count = len(filtered)
    if offset:
        filtered = filtered[offset:]
    if limit:
        filtered = filtered[:limit]

    return {
        "type": "FeatureCollection",
        "features": filtered,
        "metadata": {
            "total_count": total_count,
            "returned_count": len(filtered),
            "offset": offset,
            "limit": limit,
            "filters_applied": {
                "company": company,
                "source": source,
                "status": status,
                "region": region,
                "country": country,
                "tier": tier,
                "min_mw": min_mw,
                "max_mw": max_mw,
                "essential_only": essential_only,
                "search": search,
            }
        }
    }


@app.get("/api/statistics")
async def get_statistics(
    company: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
):
    """
    Get aggregated statistics, optionally filtered.

    For unfiltered statistics, returns pre-computed values.
    For filtered statistics, computes on-the-fly from buildings data.
    """
    # If no filters, return pre-computed stats
    if not any([company, source, region]):
        if _cache["statistics"]:
            return _cache["statistics"]
        raise HTTPException(status_code=404, detail="Statistics not loaded")

    # Compute filtered statistics
    buildings_data = _cache.get("buildings")
    if not buildings_data:
        raise HTTPException(status_code=404, detail="Buildings data not loaded")

    features = buildings_data.get("features", [])

    # Apply filters and aggregate
    total_mw = 0
    total_commissioned = 0
    total_uc = 0
    total_planned = 0
    count = 0

    for feature in features:
        props = feature.get("properties", {})

        # Apply filters
        if company:
            companies = [c.strip() for c in company.split(",")]
            if props.get("company_clean_filter") not in companies:
                continue

        if source:
            sources = [s.strip() for s in source.split(",")]
            if props.get("source") not in sources:
                continue

        if region:
            regions = [r.strip() for r in region.split(",")]
            if props.get("region") not in regions:
                continue

        # Aggregate
        count += 1
        total_mw += props.get("full_capacity_mw") or 0
        total_commissioned += props.get("commissioned_power_mw") or 0
        total_uc += props.get("capacity_under_construction_mw") or 0
        total_planned += props.get("planned_capacity_mw") or 0

    return {
        "filtered": True,
        "filters": {"company": company, "source": source, "region": region},
        "summary": {
            "total_buildings": count,
            "total_capacity_mw": round(total_mw, 1),
            "total_capacity_gw": round(total_mw / 1000, 2),
            "commissioned_mw": round(total_commissioned, 1),
            "under_construction_mw": round(total_uc, 1),
            "planned_mw": round(total_planned, 1),
        }
    }


@app.get("/api/lookups")
async def get_lookups():
    """Get lookup values for filter dropdowns."""
    if _cache["lookups"]:
        return _cache["lookups"]
    raise HTTPException(status_code=404, detail="Lookups not loaded")


@app.get("/api/export/csv/{layer}")
async def export_csv(
    layer: str,
    company: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    min_mw: Optional[float] = Query(None),
    max_mw: Optional[float] = Query(None),
    essential_only: Optional[bool] = Query(False),
    search: Optional[str] = Query(None),
):
    """
    Export filtered features as CSV download.
    """
    # Get filtered features
    features_response = await get_features(
        layer=layer,
        company=company,
        source=source,
        status=status,
        region=region,
        country=country,
        min_mw=min_mw,
        max_mw=max_mw,
        essential_only=essential_only,
        search=search,
    )

    features = features_response.get("features", [])
    if not features:
        raise HTTPException(status_code=404, detail="No features match the filter criteria")

    # Get all property keys for CSV headers
    all_keys = set()
    for f in features:
        all_keys.update(f.get("properties", {}).keys())

    # Add geometry columns
    headers = ["longitude", "latitude"] + sorted(all_keys)

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()

    for feature in features:
        row = feature.get("properties", {}).copy()
        coords = feature.get("geometry", {}).get("coordinates", [None, None])
        row["longitude"] = coords[0]
        row["latitude"] = coords[1]
        writer.writerow(row)

    output.seek(0)

    filename = f"datacenter_{layer}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/export/geojson/{layer}")
async def export_geojson(
    layer: str,
    company: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    min_mw: Optional[float] = Query(None),
    max_mw: Optional[float] = Query(None),
    essential_only: Optional[bool] = Query(False),
    search: Optional[str] = Query(None),
):
    """
    Export filtered features as GeoJSON download.
    """
    # Get filtered features
    features_response = await get_features(
        layer=layer,
        company=company,
        source=source,
        status=status,
        region=region,
        country=country,
        min_mw=min_mw,
        max_mw=max_mw,
        essential_only=essential_only,
        search=search,
    )

    filename = f"datacenter_{layer}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.geojson"

    return StreamingResponse(
        iter([json.dumps(features_response, indent=2)]),
        media_type="application/geo+json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ==============================================================================
# STATIC FILE SERVING
# ==============================================================================

# Mount static files for the frontend (if exists)
FRONTEND_DIST = os.path.join(PROJECT_ROOT, "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
