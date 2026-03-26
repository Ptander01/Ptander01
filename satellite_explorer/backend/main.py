"""
FastAPI Backend Server for DCII Satellite Explorer

This server provides:
1. Site catalog and metadata API
2. Imagery snapshot management
3. SAM-extracted metrics and change detection
4. ESRI Image Service proxy for COG tiles
5. Export capabilities

Run with:
    cd backend
    uvicorn main:app --reload --port 8000

Author: Patrick Anderson
Date: February 2026
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from typing import Optional, List
import json
import os
from datetime import datetime

# Initialize FastAPI app
app = FastAPI(
    title="DCII Satellite Explorer API",
    description="API for satellite imagery visualization and change detection analysis",
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
    "sites": None,
    "lookups": None,
    "overlays": None,
}


def load_data():
    """Load all data files into cache."""
    global _cache

    # Load sites
    sites_path = os.path.join(DATA_DIR, "sites.json")
    if os.path.exists(sites_path):
        with open(sites_path, 'r', encoding='utf-8') as f:
            _cache["sites"] = json.load(f)
        print(f"✅ Loaded sites.json ({len(_cache['sites'].get('sites', []))} sites)")
    else:
        print(f"⚠️ sites.json not found at {sites_path}")
        _cache["sites"] = {"sites": []}

    # Load lookups
    lookups_path = os.path.join(DATA_DIR, "lookups.json")
    if os.path.exists(lookups_path):
        with open(lookups_path, 'r', encoding='utf-8') as f:
            _cache["lookups"] = json.load(f)
        print(f"✅ Loaded lookups.json")
    else:
        print(f"⚠️ lookups.json not found, using defaults")
        _cache["lookups"] = {
            "companies": ["xAI", "OpenAI", "AWS", "Microsoft"],
            "cadences": ["weekly", "monthly", "irregular"],
            "statuses": ["under_construction", "operational", "planned"]
        }

    # Load overlays
    overlays_path = os.path.join(DATA_DIR, "overlays.json")
    if os.path.exists(overlays_path):
        with open(overlays_path, 'r', encoding='utf-8') as f:
            _cache["overlays"] = json.load(f)
        print(f"✅ Loaded overlays.json ({len(_cache['overlays'])} sites with overlays)")
    else:
        print(f"⚠️ overlays.json not found")
        _cache["overlays"] = {}


@app.on_event("startup")
async def startup_event():
    """Load data on server startup."""
    print("\n" + "=" * 60)
    print("🛰️ Starting DCII Satellite Explorer API")
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
        "message": "DCII Satellite Explorer API",
        "version": "1.0.0",
        "endpoints": {
            "sites": "/api/sites",
            "site_detail": "/api/sites/{site_id}",
            "snapshots": "/api/sites/{site_id}/snapshots",
            "changes": "/api/sites/{site_id}/changes",
            "lookups": "/api/lookups",
            "health": "/api/health"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "data_loaded": {
            "sites": _cache["sites"] is not None,
            "lookups": _cache["lookups"] is not None,
        },
        "site_count": len(_cache["sites"].get("sites", [])) if _cache["sites"] else 0,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/reload")
async def reload_cache():
    """Reload all data files into cache."""
    print("\n🔄 Reloading data cache...")
    load_data()
    return {
        "status": "reloaded",
        "site_count": len(_cache["sites"].get("sites", [])) if _cache["sites"] else 0,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/lookups")
async def get_lookups():
    """Get lookup values for filter dropdowns."""
    return _cache["lookups"] or {}


@app.get("/api/sites")
async def get_sites(
    company: Optional[str] = Query(None, description="Filter by company"),
    cadence: Optional[str] = Query(None, description="Filter by update cadence"),
    status: Optional[str] = Query(None, description="Filter by construction status"),
    search: Optional[str] = Query(None, description="Search by name"),
):
    """
    Get all tracked sites with optional filtering.
    Returns summary info for list view (not full snapshot history).
    """
    if not _cache["sites"]:
        return {"sites": [], "count": 0}

    sites = _cache["sites"].get("sites", [])
    filtered = []

    for site in sites:
        # Apply filters
        if company and site.get("company") != company:
            continue
        if cadence and site.get("cadence") != cadence:
            continue
        if status and site.get("status") != status:
            continue
        if search:
            search_lower = search.lower()
            searchable = f"{site.get('name', '')} {site.get('project', '')} {site.get('company', '')}".lower()
            if search_lower not in searchable:
                continue

        # Return summary (without full snapshot history)
        latest_snapshot = site.get("snapshots", [{}])[-1] if site.get("snapshots") else {}

        filtered.append({
            "id": site.get("id"),
            "name": site.get("name"),
            "project": site.get("project"),
            "company": site.get("company"),
            "location": site.get("location"),
            "cadence": site.get("cadence"),
            "status": site.get("status"),
            "snapshot_count": len(site.get("snapshots", [])),
            "latest_snapshot_date": latest_snapshot.get("date"),
            "latest_metrics": latest_snapshot.get("metrics", {}),
        })

    return {
        "sites": filtered,
        "count": len(filtered),
        "filters_applied": {
            "company": company,
            "cadence": cadence,
            "status": status,
            "search": search,
        }
    }


@app.get("/api/sites/{site_id}")
async def get_site_detail(site_id: str):
    """
    Get full detail for a specific site including all snapshots.
    """
    if not _cache["sites"]:
        raise HTTPException(status_code=404, detail="No sites loaded")

    sites = _cache["sites"].get("sites", [])

    for site in sites:
        if site.get("id") == site_id:
            return site

    raise HTTPException(status_code=404, detail=f"Site '{site_id}' not found")


@app.get("/api/sites/{site_id}/snapshots")
async def get_site_snapshots(
    site_id: str,
    start_date: Optional[str] = Query(None, description="Filter snapshots after this date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter snapshots before this date (YYYY-MM-DD)"),
):
    """
    Get all imagery snapshots for a site with optional date filtering.
    """
    site = await get_site_detail(site_id)
    snapshots = site.get("snapshots", [])

    # Apply date filters
    if start_date:
        snapshots = [s for s in snapshots if s.get("date", "") >= start_date]
    if end_date:
        snapshots = [s for s in snapshots if s.get("date", "") <= end_date]

    return {
        "site_id": site_id,
        "snapshots": snapshots,
        "count": len(snapshots),
        "date_range": {
            "earliest": snapshots[0].get("date") if snapshots else None,
            "latest": snapshots[-1].get("date") if snapshots else None,
        }
    }


@app.get("/api/sites/{site_id}/snapshots/{date}")
async def get_snapshot_by_date(site_id: str, date: str):
    """
    Get a specific snapshot for a site by date.
    """
    site = await get_site_detail(site_id)
    snapshots = site.get("snapshots", [])

    for snapshot in snapshots:
        if snapshot.get("date") == date:
            return {
                "site_id": site_id,
                "site_name": site.get("name"),
                **snapshot
            }

    raise HTTPException(status_code=404, detail=f"No snapshot found for date '{date}'")


@app.get("/api/sites/{site_id}/changes")
async def get_site_changes(
    site_id: str,
    limit: Optional[int] = Query(10, description="Number of recent changes to return"),
):
    """
    Get recent changes detected for a site across all snapshots.
    """
    site = await get_site_detail(site_id)
    snapshots = site.get("snapshots", [])

    all_changes = []
    for snapshot in snapshots:
        for change in snapshot.get("changes", []):
            all_changes.append({
                "date": snapshot.get("date"),
                **change
            })

    # Sort by date descending (most recent first)
    all_changes.sort(key=lambda x: x.get("date", ""), reverse=True)

    return {
        "site_id": site_id,
        "changes": all_changes[:limit],
        "total_changes": len(all_changes),
    }


@app.get("/api/sites/{site_id}/overlays")
async def get_site_overlays(
    site_id: str,
    snapshot_date: Optional[str] = Query(None, description="Optional snapshot date for time-specific overlays"),
):
    """
    Get infrastructure overlay polygons for a site.
    Returns GeoJSON-compatible features for buildings, power, cooling, etc.
    """
    if not _cache["overlays"]:
        raise HTTPException(status_code=404, detail="No overlay data loaded")

    # Look up overlays by site_id
    overlay_data = _cache["overlays"].get(site_id)

    if not overlay_data:
        # Return empty but valid response
        return {
            "site_id": site_id,
            "snapshot_date": snapshot_date,
            "features": [],
            "message": "No overlays available for this site"
        }

    return overlay_data


@app.get("/api/sites/{site_id}/compare")
async def compare_snapshots(
    site_id: str,
    date_before: str = Query(..., description="Earlier snapshot date (YYYY-MM-DD)"),
    date_after: str = Query(..., description="Later snapshot date (YYYY-MM-DD)"),
):
    """
    Compare two snapshots and return the delta in metrics.
    """
    site = await get_site_detail(site_id)
    snapshots = site.get("snapshots", [])

    snapshot_before = None
    snapshot_after = None

    for snapshot in snapshots:
        if snapshot.get("date") == date_before:
            snapshot_before = snapshot
        if snapshot.get("date") == date_after:
            snapshot_after = snapshot

    if not snapshot_before:
        raise HTTPException(status_code=404, detail=f"No snapshot found for date '{date_before}'")
    if not snapshot_after:
        raise HTTPException(status_code=404, detail=f"No snapshot found for date '{date_after}'")

    # Calculate deltas
    metrics_before = snapshot_before.get("metrics", {})
    metrics_after = snapshot_after.get("metrics", {})

    deltas = {}
    all_keys = set(metrics_before.keys()) | set(metrics_after.keys())

    for key in all_keys:
        val_before = metrics_before.get(key, 0) or 0
        val_after = metrics_after.get(key, 0) or 0
        if isinstance(val_before, (int, float)) and isinstance(val_after, (int, float)):
            deltas[key] = {
                "before": val_before,
                "after": val_after,
                "delta": val_after - val_before,
                "percent_change": round((val_after - val_before) / val_before * 100, 1) if val_before else None
            }

    return {
        "site_id": site_id,
        "site_name": site.get("name"),
        "date_before": date_before,
        "date_after": date_after,
        "days_between": (datetime.fromisoformat(date_after) - datetime.fromisoformat(date_before)).days,
        "metrics_comparison": deltas,
        "changes_in_period": snapshot_after.get("changes", []),
    }


@app.get("/api/timeline")
async def get_global_timeline():
    """
    Get a global timeline of all snapshot dates across all sites.
    Useful for the main timeline slider.
    """
    if not _cache["sites"]:
        return {"dates": [], "sites_by_date": {}}

    sites = _cache["sites"].get("sites", [])
    dates_set = set()
    sites_by_date = {}

    for site in sites:
        for snapshot in site.get("snapshots", []):
            date = snapshot.get("date")
            if date:
                dates_set.add(date)
                if date not in sites_by_date:
                    sites_by_date[date] = []
                sites_by_date[date].append({
                    "site_id": site.get("id"),
                    "site_name": site.get("name"),
                    "company": site.get("company"),
                })

    sorted_dates = sorted(dates_set)

    return {
        "dates": sorted_dates,
        "date_count": len(sorted_dates),
        "date_range": {
            "earliest": sorted_dates[0] if sorted_dates else None,
            "latest": sorted_dates[-1] if sorted_dates else None,
        },
        "sites_by_date": sites_by_date,
    }


# ==============================================================================
# ESRI INTEGRATION (Placeholder for Image Service proxy)
# ==============================================================================

@app.get("/api/imagery/{site_id}/{date}/metadata")
async def get_imagery_metadata(site_id: str, date: str):
    """
    Get imagery metadata for a specific site and date.
    In production, this would query ESRI Image Service.
    """
    # Placeholder - would integrate with esri_client.py
    return {
        "site_id": site_id,
        "date": date,
        "provider": "Apollo Mapping",
        "resolution_cm": 30,
        "cloud_cover_pct": 5,
        "tile_url": f"/api/imagery/{site_id}/{date}/tiles/{{z}}/{{x}}/{{y}}",
        "bounds": None,  # Would come from ESRI
        "note": "ESRI Image Service integration pending"
    }


# ==============================================================================
# LOCAL IMAGERY SERVING (For GDrive downloads / testing)
# ==============================================================================

IMAGERY_DIR = os.path.join(DATA_DIR, "imagery")

@app.get("/api/imagery/{site_id}/available")
async def get_available_imagery(site_id: str):
    """
    Get list of available local imagery files for a site.
    Returns dates and file paths for images downloaded from GDrive.
    """
    site_imagery_dir = os.path.join(IMAGERY_DIR, site_id)

    if not os.path.exists(site_imagery_dir):
        return {
            "site_id": site_id,
            "images": [],
            "count": 0,
            "message": f"No imagery folder found. Add images to: data/imagery/{site_id}/"
        }

    images = []
    supported_extensions = {'.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp'}
    import re

    for filename in os.listdir(site_imagery_dir):
        ext = os.path.splitext(filename)[1].lower()
        if ext in supported_extensions:
            filepath = os.path.join(site_imagery_dir, filename)
            stat = os.stat(filepath)

            # Try to extract date from filename
            date_match = None

            # Pattern 1: YYYY-MM-DD (e.g., "2025-09-15_clipped.jpg")
            pattern1 = re.search(r'(\d{4})-(\d{2})-(\d{2})', filename)
            if pattern1:
                date_match = f"{pattern1.group(1)}-{pattern1.group(2)}-{pattern1.group(3)}"

            # Pattern 2: MM_DD_YYYY (e.g., "Fairwater_01_20_2026_Ortho.jpg")
            if not date_match:
                pattern2 = re.search(r'(\d{2})_(\d{2})_(\d{4})', filename)
                if pattern2:
                    date_match = f"{pattern2.group(3)}-{pattern2.group(1)}-{pattern2.group(2)}"

            # Pattern 3: MMDDYYYY (e.g., "01202026.jpg")
            if not date_match:
                pattern3 = re.search(r'(\d{2})(\d{2})(\d{4})', filename)
                if pattern3:
                    date_match = f"{pattern3.group(3)}-{pattern3.group(1)}-{pattern3.group(2)}"

            images.append({
                "filename": filename,
                "date": date_match,
                "url": f"/api/imagery/{site_id}/file/{filename}",
                "size_bytes": stat.st_size,
                "size_mb": round(stat.st_size / (1024 * 1024), 2)
            })

    # Sort by date if available (most recent first)
    images.sort(key=lambda x: x.get("date") or "9999", reverse=True)

    return {
        "site_id": site_id,
        "images": images,
        "count": len(images),
        "folder": f"data/imagery/{site_id}/"
    }


@app.get("/api/imagery/{site_id}/file/{filename}")
async def serve_imagery_file(site_id: str, filename: str):
    """
    Serve a local imagery file.
    """
    from fastapi.responses import FileResponse

    # Sanitize filename to prevent directory traversal
    safe_filename = os.path.basename(filename)
    filepath = os.path.join(IMAGERY_DIR, site_id, safe_filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Image not found: {filename}")

    # Determine media type
    ext = os.path.splitext(filename)[1].lower()
    media_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.tif': 'image/tiff',
        '.tiff': 'image/tiff',
        '.webp': 'image/webp'
    }
    media_type = media_types.get(ext, 'application/octet-stream')

    return FileResponse(filepath, media_type=media_type)


@app.get("/api/imagery/{site_id}/latest")
async def get_latest_imagery(site_id: str):
    """
    Get the most recent imagery for a site.
    """
    available = await get_available_imagery(site_id)
    images = available.get("images", [])

    if not images:
        raise HTTPException(status_code=404, detail="No imagery available for this site")

    # Return the first (most recent) image
    latest = images[0]
    return {
        "site_id": site_id,
        "image": latest,
        "url": latest["url"]
    }


# Cache for imagery bounds
_imagery_bounds_cache = None

def load_imagery_bounds():
    """Load imagery bounds configuration."""
    global _imagery_bounds_cache
    bounds_path = os.path.join(DATA_DIR, "imagery_bounds.json")
    if os.path.exists(bounds_path):
        with open(bounds_path, 'r', encoding='utf-8') as f:
            _imagery_bounds_cache = json.load(f)
        print(f"✅ Loaded imagery_bounds.json")
    else:
        _imagery_bounds_cache = {"bounds": {}}
    return _imagery_bounds_cache


@app.get("/api/imagery/{site_id}/bounds")
async def get_imagery_bounds(site_id: str, clip_name: Optional[str] = Query(None)):
    """
    Get bounding box coordinates for placing satellite imagery on the map.

    Args:
        site_id: Site identifier
        clip_name: Optional clip/phase name (e.g., "Phase1_Clip"). Defaults to "default".

    Returns:
        Bounds in format: [west, south, east, north] for MapLibre image source
    """
    global _imagery_bounds_cache
    if _imagery_bounds_cache is None:
        load_imagery_bounds()

    site_bounds = _imagery_bounds_cache.get("bounds", {}).get(site_id)

    if not site_bounds:
        raise HTTPException(status_code=404, detail=f"No bounds configured for site: {site_id}")

    clips = site_bounds.get("clips", {})

    # Try to match clip_name, fall back to default
    clip_key = clip_name or "default"
    clip_data = clips.get(clip_key) or clips.get("default")

    if not clip_data:
        raise HTTPException(status_code=404, detail=f"No bounds found for clip: {clip_key}")

    bounds = clip_data.get("bounds", {})

    # Return in MapLibre format: [[west, north], [east, north], [east, south], [west, south]]
    # This is the corners format for image source
    return {
        "site_id": site_id,
        "clip_name": clip_key,
        "bounds": bounds,
        "coordinates": [
            [bounds["west"], bounds["north"]],  # Top-left
            [bounds["east"], bounds["north"]],  # Top-right
            [bounds["east"], bounds["south"]],  # Bottom-right
            [bounds["west"], bounds["south"]]   # Bottom-left
        ],
        "sqkm": clip_data.get("sqkm"),
        "center": clip_data.get("center")
    }


# ==============================================================================
# STATIC FILE SERVING
# ==============================================================================

FRONTEND_DIST = os.path.join(PROJECT_ROOT, "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
