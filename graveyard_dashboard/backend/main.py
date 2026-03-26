"""
FastAPI Backend Server for Data Center Graveyard Dashboard

This server provides:
1. API endpoints for at-risk/failed data center projects
2. Filtering by status, stage gate, state, opposition factors
3. Export capabilities (CSV, GeoJSON)
4. CORS support for local development

Run with:
    cd graveyard_dashboard/backend
    uvicorn main:app --reload --port 8001

Author: Patrick Anderson
Date: 2026-01-14
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from typing import Optional, List
import json
import os
import csv
import io
from datetime import datetime

# Initialize FastAPI app
app = FastAPI(
    title="Data Center Graveyard Dashboard API",
    description="API for tracking at-risk, delayed, and failed data center projects",
    version="1.0.0"
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

# Cache for loaded data
_cache = {
    "projects": None,
    "lookups": None,
    "statistics": None,
}


def load_data():
    """Load all data files into cache."""
    global _cache

    # Load projects GeoJSON
    projects_path = os.path.join(DATA_DIR, "projects.geojson")
    if os.path.exists(projects_path):
        with open(projects_path, 'r', encoding='utf-8') as f:
            _cache["projects"] = json.load(f)
        print(f"[OK] Loaded projects.geojson ({len(_cache['projects'].get('features', []))} features)")
    else:
        print(f"[WARN] projects.geojson not found at {projects_path}")

    # Load lookups
    lookups_path = os.path.join(DATA_DIR, "lookups.json")
    if os.path.exists(lookups_path):
        with open(lookups_path, 'r', encoding='utf-8') as f:
            _cache["lookups"] = json.load(f)
        print(f"[OK] Loaded lookups.json")

    # Load statistics
    stats_path = os.path.join(DATA_DIR, "statistics.json")
    if os.path.exists(stats_path):
        with open(stats_path, 'r', encoding='utf-8') as f:
            _cache["statistics"] = json.load(f)
        print(f"[OK] Loaded statistics.json")


@app.on_event("startup")
async def startup_event():
    """Load data on server startup."""
    print("\n" + "=" * 60)
    print("Starting Data Center Graveyard Dashboard API")
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
        "message": "Data Center Graveyard Dashboard API",
        "version": "1.0.0",
        "description": "Tracking at-risk, delayed, and failed data center projects",
        "endpoints": {
            "features": "/api/features",
            "statistics": "/api/statistics",
            "lookups": "/api/lookups",
            "export_csv": "/api/export/csv",
            "export_geojson": "/api/export/geojson"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "data_loaded": {
            "projects": _cache["projects"] is not None,
            "lookups": _cache["lookups"] is not None,
            "statistics": _cache["statistics"] is not None,
        },
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/reload")
async def reload_cache():
    """Reload all data files into cache."""
    print("[RELOAD] Reloading data cache...")
    load_data()

    return {
        "status": "reloaded",
        "data_loaded": {
            "projects": len(_cache["projects"].get("features", [])) if _cache["projects"] else 0,
        },
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/features")
async def get_features(
    status: Optional[str] = Query(None, description="Filter by status (BLOCKED, DELAYED, WITHDRAWN)"),
    stage_gate: Optional[str] = Query(None, description="Filter by stage gate (comma-separated)"),
    state: Optional[str] = Query(None, description="Filter by state (comma-separated)"),
    developer: Optional[str] = Query(None, description="Filter by developer (comma-separated)"),
    tenant: Optional[str] = Query(None, description="Filter by tenant (comma-separated)"),
    has_opposition: Optional[bool] = Query(None, description="Filter by presence of community opposition"),
    opposition_factor: Optional[str] = Query(None, description="Filter by opposition factor (comma-separated)"),
    min_mw: Optional[float] = Query(None, description="Minimum capacity (MW)"),
    max_mw: Optional[float] = Query(None, description="Maximum capacity (MW)"),
    search: Optional[str] = Query(None, description="Search across multiple fields"),
    limit: Optional[int] = Query(None, description="Limit number of results"),
    offset: Optional[int] = Query(0, description="Offset for pagination"),
):
    """
    Get GeoJSON features with optional filtering.
    """
    data = _cache.get("projects")
    if data is None:
        raise HTTPException(status_code=404, detail="Projects data not loaded")

    features = data.get("features", [])

    # Apply filters
    filtered = []
    for feature in features:
        props = feature.get("properties", {})

        # Status filter
        if status:
            statuses = [s.strip().upper() for s in status.split(",")]
            current = (props.get("current_status") or "").upper()
            if current not in statuses:
                continue

        # Stage gate filter
        if stage_gate:
            gates = [g.strip() for g in stage_gate.split(",")]
            current_gate = props.get("stage_gate") or ""
            if current_gate not in gates:
                continue

        # State filter
        if state:
            states = [s.strip() for s in state.split(",")]
            current_state = props.get("state") or ""
            if current_state not in states:
                continue

        # Developer filter
        if developer:
            developers = [d.strip().lower() for d in developer.split(",")]
            current_dev = (props.get("developer") or "").lower()
            if not any(d in current_dev for d in developers):
                continue

        # Tenant filter
        if tenant:
            tenants = [t.strip().lower() for t in tenant.split(",")]
            current_tenant = (props.get("tenant") or "").lower()
            if not any(t in current_tenant for t in tenants):
                continue

        # Opposition filter
        if has_opposition is not None:
            if props.get("has_opposition") != has_opposition:
                continue

        # Opposition factor filter
        if opposition_factor:
            factors = [f.strip() for f in opposition_factor.split(",")]
            project_factors = props.get("opposition_factors") or []
            if not any(f in project_factors for f in factors):
                continue

        # Capacity filters
        capacity = props.get("capacity_mw") or 0
        if min_mw is not None and capacity < min_mw:
            continue
        if max_mw is not None and capacity > max_mw:
            continue

        # Text search
        if search:
            search_lower = search.lower()
            searchable = " ".join([
                str(props.get("facility_name") or ""),
                str(props.get("developer") or ""),
                str(props.get("tenant") or ""),
                str(props.get("city") or ""),
                str(props.get("state") or ""),
                str(props.get("county") or ""),
                str(props.get("uid") or ""),
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
                "status": status,
                "stage_gate": stage_gate,
                "state": state,
                "developer": developer,
                "tenant": tenant,
                "has_opposition": has_opposition,
                "opposition_factor": opposition_factor,
                "min_mw": min_mw,
                "max_mw": max_mw,
                "search": search,
            }
        }
    }


@app.get("/api/statistics")
async def get_statistics():
    """Get aggregated statistics."""
    if _cache["statistics"]:
        return _cache["statistics"]
    raise HTTPException(status_code=404, detail="Statistics not loaded")


@app.get("/api/lookups")
async def get_lookups():
    """Get lookup values for filter dropdowns."""
    if _cache["lookups"]:
        return _cache["lookups"]
    raise HTTPException(status_code=404, detail="Lookups not loaded")


@app.get("/api/export/csv")
async def export_csv(
    status: Optional[str] = Query(None),
    stage_gate: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    developer: Optional[str] = Query(None),
    has_opposition: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
):
    """Export filtered features as CSV download."""
    features_response = await get_features(
        status=status,
        stage_gate=stage_gate,
        state=state,
        developer=developer,
        has_opposition=has_opposition,
        search=search,
    )

    features = features_response.get("features", [])
    if not features:
        raise HTTPException(status_code=404, detail="No features match the filter criteria")

    # Get all property keys for CSV headers
    all_keys = set()
    for f in features:
        props = f.get("properties", {})
        # Exclude list fields from CSV
        for k, v in props.items():
            if not isinstance(v, list):
                all_keys.add(k)

    headers = ["longitude", "latitude"] + sorted(all_keys)

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=headers, extrasaction='ignore')
    writer.writeheader()

    for feature in features:
        row = {}
        for k, v in feature.get("properties", {}).items():
            if not isinstance(v, list):
                row[k] = v
            else:
                row[k] = "; ".join(str(x) for x in v)
        coords = feature.get("geometry", {}).get("coordinates", [None, None])
        row["longitude"] = coords[0]
        row["latitude"] = coords[1]
        writer.writerow(row)

    output.seek(0)

    filename = f"graveyard_projects_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/export/geojson")
async def export_geojson(
    status: Optional[str] = Query(None),
    stage_gate: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    developer: Optional[str] = Query(None),
    has_opposition: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
):
    """Export filtered features as GeoJSON download."""
    features_response = await get_features(
        status=status,
        stage_gate=stage_gate,
        state=state,
        developer=developer,
        has_opposition=has_opposition,
        search=search,
    )

    filename = f"graveyard_projects_{datetime.now().strftime('%Y%m%d_%H%M%S')}.geojson"

    return StreamingResponse(
        iter([json.dumps(features_response, indent=2)]),
        media_type="application/geo+json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ==============================================================================
# STATIC FILE SERVING
# ==============================================================================

FRONTEND_DIST = os.path.join(PROJECT_ROOT, "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
