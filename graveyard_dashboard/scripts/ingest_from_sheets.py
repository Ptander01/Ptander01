"""
Data Ingestion Script for Failed/Delayed Datacenter Dashboard

Fetches data from Google Sheets and converts to GeoJSON format for the dashboard.
Supports Phase 2 analytics with status history, stage gate tracking, and milestones.

Usage:
    python ingest_from_sheets.py

Author: Patrick Anderson
Date: 2026-01-21 (Updated for Phase 2)
"""

import pandas as pd
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
from dateutil import parser as date_parser

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")  # For manually exported CSVs

# Google Sheets ID and tab names
SHEET_ID = "YOUR_GOOGLE_SHEET_ID_HERE"
TABS = {
    "data_center": "DATA_CENTER",
    "project_status": "PROJECT_STATUS",
    "community_opposition": "COMMUNITY_OPPOSITION",
    "key_milestones": "KEY_MILESTONES"
}

# Local CSV file names (for manual export)
CSV_FILES = {
    "data_center": "DATA_CENTER.csv",
    "project_status": "PROJECT_STATUS.csv",
    "community_opposition": "COMMUNITY_OPPOSITION.csv",
    "key_milestones": "KEY_MILESTONES.csv"
}

# Excel file path (for direct Excel import)
EXCEL_FILE = None  # Will be set via command line or detected automatically


def get_sheet_url(sheet_id: str, tab_name: str) -> str:
    """Generate CSV export URL for a Google Sheet tab."""
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={tab_name}"


def load_from_excel(excel_path: str, sheet_name: str) -> pd.DataFrame:
    """Load data from an Excel file sheet."""
    try:
        df = pd.read_excel(excel_path, sheet_name=sheet_name)
        print(f"   [OK] Loaded {len(df)} records from sheet '{sheet_name}'")
        return df
    except Exception as e:
        print(f"   [ERROR] Error loading sheet '{sheet_name}' from Excel: {e}")
        return pd.DataFrame()


def load_from_local_csv(table_name: str) -> pd.DataFrame:
    """Load data from locally exported CSV files."""
    csv_path = os.path.join(RAW_DIR, CSV_FILES[table_name])

    if not os.path.exists(csv_path):
        print(f"   [WARN] Local CSV not found: {csv_path}")
        return pd.DataFrame()

    try:
        df = pd.read_csv(csv_path)
        print(f"   [OK] Loaded {len(df)} records from {CSV_FILES[table_name]}")
        return df
    except Exception as e:
        print(f"   [ERROR] Error loading {csv_path}: {e}")
        return pd.DataFrame()


def load_data_center_table(sheet_id: str, use_local: bool = False) -> pd.DataFrame:
    """Load the main DATA_CENTER table from Google Sheets or local CSV."""
    if use_local:
        print(f"[Loading] DATA_CENTER table from local CSV...")
        return load_from_local_csv("data_center")

    url = get_sheet_url(sheet_id, TABS["data_center"])
    print(f"[Loading] DATA_CENTER table from Google Sheets...")

    try:
        df = pd.read_csv(url)
        print(f"   [OK] Loaded {len(df)} data center records")
        return df
    except Exception as e:
        print(f"   [ERROR] Error loading DATA_CENTER: {e}")
        print(f"   [INFO] Trying local CSV fallback...")
        return load_from_local_csv("data_center")


def load_project_status_table(sheet_id: str, use_local: bool = False) -> pd.DataFrame:
    """Load the PROJECT_STATUS table from Google Sheets or local CSV."""
    if use_local:
        print(f"[Loading] PROJECT_STATUS table from local CSV...")
        df = load_from_local_csv("project_status")
    else:
        url = get_sheet_url(sheet_id, TABS["project_status"])
        print(f"[Loading] PROJECT_STATUS table from Google Sheets...")

        try:
            df = pd.read_csv(url)
            print(f"   [OK] Loaded {len(df)} status records")
        except Exception as e:
            print(f"   [ERROR] Error loading PROJECT_STATUS: {e}")
            print(f"   [INFO] Trying local CSV fallback...")
            df = load_from_local_csv("project_status")

    if len(df) > 0:
        # Filter out empty rows
        df = df[df['data_center_UID'].notna() & (df['data_center_UID'] != '')]
    return df


def load_community_opposition_table(sheet_id: str, use_local: bool = False) -> pd.DataFrame:
    """Load the COMMUNITY_OPPOSITION table from Google Sheets or local CSV."""
    if use_local:
        print(f"[Loading] COMMUNITY_OPPOSITION table from local CSV...")
        df = load_from_local_csv("community_opposition")
    else:
        url = get_sheet_url(sheet_id, TABS["community_opposition"])
        print(f"[Loading] COMMUNITY_OPPOSITION table from Google Sheets...")

        try:
            df = pd.read_csv(url)
            print(f"   [OK] Loaded {len(df)} opposition records")
        except Exception as e:
            print(f"   [ERROR] Error loading COMMUNITY_OPPOSITION: {e}")
            print(f"   [INFO] Trying local CSV fallback...")
            df = load_from_local_csv("community_opposition")

    if len(df) > 0:
        # Filter out empty rows
        df = df[df['data_center_UID'].notna() & (df['data_center_UID'] != '')]
    return df


def load_key_milestones_table(sheet_id: str, use_local: bool = False) -> pd.DataFrame:
    """Load the KEY_MILESTONES table from Google Sheets or local CSV."""
    if use_local:
        print(f"[Loading] KEY_MILESTONES table from local CSV...")
        df = load_from_local_csv("key_milestones")
    else:
        url = get_sheet_url(sheet_id, TABS["key_milestones"])
        print(f"[Loading] KEY_MILESTONES table from Google Sheets...")

        try:
            df = pd.read_csv(url)
            print(f"   [OK] Loaded {len(df)} milestone records")
        except Exception as e:
            print(f"   [ERROR] Error loading KEY_MILESTONES: {e}")
            print(f"   [INFO] Trying local CSV fallback...")
            df = load_from_local_csv("key_milestones")

    if len(df) > 0:
        # Filter out empty rows
        df = df[df['data_center_UID'].notna() & (df['data_center_UID'] != '')]
    return df


def clean_numeric(value: Any) -> Optional[float]:
    """Clean and convert numeric values."""
    if pd.isna(value) or value == '' or value == '--':
        return None
    try:
        # Remove commas from numbers
        if isinstance(value, str):
            value = value.replace(',', '').strip()
        return float(value)
    except (ValueError, TypeError):
        return None


def clean_string(value: Any) -> Optional[str]:
    """Clean string values."""
    if pd.isna(value) or value == '' or value == '--':
        return None
    return str(value).strip()


def parse_source_links(value: Any) -> List[str]:
    """Parse source links from a cell value. Handles comma-separated URLs."""
    if pd.isna(value) or value == '' or value == '--':
        return []

    # Split by common delimiters (comma, semicolon, newline)
    raw = str(value).strip()
    links = []

    # Try splitting by common delimiters
    for delimiter in ['\n', ';', ', ', ',']:
        if delimiter in raw:
            parts = raw.split(delimiter)
            for part in parts:
                part = part.strip()
                if part and (part.startswith('http://') or part.startswith('https://')):
                    links.append(part)
            if links:
                return links

    # Single URL
    if raw.startswith('http://') or raw.startswith('https://'):
        return [raw]

    return []


def aggregate_status_info(uid: str, status_df: pd.DataFrame) -> Dict[str, Any]:
    """Aggregate status information for a data center."""
    records = status_df[status_df['data_center_UID'] == uid]

    if len(records) == 0:
        return {
            "current_status": None,
            "status_date": None,
            "stage_gate": None,
            "phase_detail": None,
            "reviewing_authority": None,
            "primary_source": None,
            "supporting_sources": [],
            "status_history": []
        }

    # Get the most recent status (last row for this UID)
    latest = records.iloc[-1]

    # Build status history
    history = []
    for _, row in records.iterrows():
        history.append({
            "status": clean_string(row.get('status')),
            "status_date": clean_string(row.get('status_date')),
            "stage_gate": clean_string(row.get('stage_gate')),
            "phase_detail": clean_string(row.get('phase_detail')),
            "reviewing_authority": clean_string(row.get('reviewing_authority')),
            "primary_source": clean_string(row.get('status_primary_source')),
            "supporting_sources": parse_source_links(row.get('status_supporting_sources'))
        })

    # Get source links from the most recent status
    primary_source = clean_string(latest.get('status_primary_source'))
    supporting_sources = parse_source_links(latest.get('status_supporting_sources'))

    return {
        "current_status": clean_string(latest.get('status')),
        "status_date": clean_string(latest.get('status_date')),
        "stage_gate": clean_string(latest.get('stage_gate')),
        "phase_detail": clean_string(latest.get('phase_detail')),
        "reviewing_authority": clean_string(latest.get('reviewing_authority')),
        "primary_source": primary_source,
        "supporting_sources": supporting_sources,
        "status_count": len(records),
        "status_history": history
    }


def aggregate_opposition_info(uid: str, opposition_df: pd.DataFrame) -> Dict[str, Any]:
    """Aggregate community opposition information for a data center."""
    records = opposition_df[opposition_df['data_center_UID'] == uid]

    if len(records) == 0:
        return {
            "has_opposition": False,
            "opposition_factors": [],
            "opposition_count": 0,
            "community_groups": [],
            "community_detail": None
        }

    # Aggregate opposition factors
    factors = []
    factor_cols = [
        ('co_water', 'Water'),
        ('co_electricity', 'Electricity'),
        ('co_noise', 'Noise'),
        ('co_air', 'Air Quality'),
        ('co_environment', 'Environment'),
        ('co_aesthetic', 'Aesthetic'),
        ('co_prop_value', 'Property Value'),
        ('co_health', 'Health'),
        ('co_other', 'Other')
    ]

    for col, label in factor_cols:
        if records[col].sum() > 0:
            factors.append(label)

    # Get community groups and spokespeople
    groups = []
    details = []
    for _, row in records.iterrows():
        if pd.notna(row.get('community_group')) and row.get('community_group') != '':
            groups.append(str(row['community_group']))
        if pd.notna(row.get('community_detail')) and row.get('community_detail') != '':
            details.append(str(row['community_detail']))

    return {
        "has_opposition": len(records) > 0,
        "opposition_factors": factors,
        "opposition_count": len(factors),
        "community_groups": list(set(groups)),
        "community_detail": "; ".join(details) if details else None
    }


def aggregate_milestone_info(uid: str, milestone_df: pd.DataFrame) -> Dict[str, Any]:
    """Aggregate milestone information for a data center."""
    records = milestone_df[milestone_df['data_center_UID'] == uid]

    if len(records) == 0:
        return {
            "milestone_count": 0,
            "milestones": []
        }

    milestones = []
    for _, row in records.iterrows():
        milestones.append({
            "date": clean_string(row.get('milestone_date')),
            "type": clean_string(row.get('milestone_type')),
            "sentiment": clean_string(row.get('sentiment')),
            "details": clean_string(row.get('milestone_details'))
        })

    return {
        "milestone_count": len(milestones),
        "milestones": milestones
    }


def build_geojson_features(
    dc_df: pd.DataFrame,
    status_df: pd.DataFrame,
    opposition_df: pd.DataFrame,
    milestone_df: pd.DataFrame
) -> List[Dict[str, Any]]:
    """Build GeoJSON features from the data tables."""
    features = []

    for idx, row in dc_df.iterrows():
        uid = clean_string(row.get('UID'))
        if not uid:
            continue

        # Get coordinates
        lat = clean_numeric(row.get('latitude'))
        lng = clean_numeric(row.get('longitude'))

        if lat is None or lng is None:
            print(f"   [WARN] Skipping {uid}: missing coordinates")
            continue

        # Get aggregated information
        status_info = aggregate_status_info(uid, status_df)
        opposition_info = aggregate_opposition_info(uid, opposition_df)
        milestone_info = aggregate_milestone_info(uid, milestone_df)

        # Build properties
        properties = {
            # Identifiers
            "uid": uid,
            "fractracker_id": clean_string(row.get('FracTracker_ID')),
            "facility_name": clean_string(row.get('facility_name')),

            # Company info
            "developer": clean_string(row.get('developer')),
            "operator": clean_string(row.get('operator')),
            "tenant": clean_string(row.get('tenant')),

            # Location
            "address": clean_string(row.get('address')),
            "city": clean_string(row.get('city')),
            "state": clean_string(row.get('state')),
            "zip": clean_string(row.get('zip')),
            "county": clean_string(row.get('county')),
            "latitude": lat,
            "longitude": lng,

            # Capacity
            "capacity_mw": clean_numeric(row.get('capacity_mw')),
            "capacity_def": clean_string(row.get('capacity_def')),
            "facility_size_sqft": clean_numeric(row.get('facility_size_sqft')),
            "property_acres": clean_numeric(row.get('property_acres')),
            "cost_billions_usd": clean_numeric(row.get('cost_billions_usd')),

            # Sources
            "primary_data_source": clean_string(row.get('primary_data_source')),

            # Status (from status table)
            "current_status": status_info["current_status"],
            "status_date": status_info["status_date"],
            "stage_gate": status_info["stage_gate"],
            "phase_detail": status_info["phase_detail"],
            "reviewing_authority": status_info["reviewing_authority"],
            "primary_source": status_info["primary_source"],
            "supporting_sources": status_info["supporting_sources"],
            "status_count": status_info["status_count"],

            # Opposition (from opposition table)
            "has_opposition": opposition_info["has_opposition"],
            "opposition_factors": opposition_info["opposition_factors"],
            "opposition_count": opposition_info["opposition_count"],
            "community_groups": opposition_info["community_groups"],
            "community_detail": opposition_info["community_detail"],

            # Milestones
            "milestone_count": milestone_info["milestone_count"],
        }

        # Build feature
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lng, lat]
            },
            "properties": properties
        }

        features.append(feature)

    return features


def generate_lookups(features: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """Generate lookup values for filter dropdowns."""
    lookups: Dict[str, set] = {
        "status": set(),
        "stage_gate": set(),
        "reviewing_authority": set(),
        "state": set(),
        "developer": set(),
        "tenant": set(),
        "opposition_factors": set()
    }

    for feature in features:
        props = feature["properties"]

        if props.get("current_status"):
            lookups["status"].add(props["current_status"])
        if props.get("stage_gate"):
            lookups["stage_gate"].add(props["stage_gate"])
        if props.get("reviewing_authority"):
            lookups["reviewing_authority"].add(props["reviewing_authority"])
        if props.get("state"):
            lookups["state"].add(props["state"])
        if props.get("developer"):
            lookups["developer"].add(props["developer"])
        if props.get("tenant"):
            lookups["tenant"].add(props["tenant"])
        if props.get("opposition_factors"):
            for factor in props["opposition_factors"]:
                lookups["opposition_factors"].add(factor)

    # Convert sets to sorted lists
    return {k: sorted(list(v)) for k, v in lookups.items()}


def generate_statistics(features: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate pre-computed statistics for the dashboard."""
    total_capacity_mw = 0
    total_cost_billions = 0
    total_acres = 0

    by_status: Dict[str, int] = {}
    by_stage_gate: Dict[str, int] = {}
    by_state: Dict[str, int] = {}
    by_opposition_factor: Dict[str, int] = {}

    for feature in features:
        props = feature["properties"]

        # Capacity
        if props.get("capacity_mw"):
            total_capacity_mw += props["capacity_mw"]
        if props.get("cost_billions_usd"):
            total_cost_billions += props["cost_billions_usd"]
        if props.get("property_acres"):
            total_acres += props["property_acres"]

        # Status counts
        status = props.get("current_status") or "Unknown"
        by_status[status] = by_status.get(status, 0) + 1

        # Stage gate counts
        stage = props.get("stage_gate") or "Unknown"
        by_stage_gate[stage] = by_stage_gate.get(stage, 0) + 1

        # State counts
        state = props.get("state") or "Unknown"
        by_state[state] = by_state.get(state, 0) + 1

        # Opposition factor counts
        factors = props.get("opposition_factors") or []
        for factor in factors:
            by_opposition_factor[factor] = by_opposition_factor.get(factor, 0) + 1

    # Count projects with opposition
    with_opposition = sum(1 for f in features if f["properties"].get("has_opposition"))

    return {
        "generated": datetime.now().isoformat(),
        "summary": {
            "total_projects": len(features),
            "total_capacity_mw": round(total_capacity_mw, 1),
            "total_capacity_gw": round(total_capacity_mw / 1000, 2),
            "total_cost_billions": round(total_cost_billions, 2),
            "total_acres": round(total_acres, 0),
            "with_opposition": with_opposition,
            "blocked_count": by_status.get("BLOCKED", 0),
            "delayed_count": by_status.get("DELAYED", 0),
            "withdrawn_count": by_status.get("WITHDRAWN", 0),
        },
        "by_status": by_status,
        "by_stage_gate": by_stage_gate,
        "by_state": by_state,
        "by_opposition_factor": by_opposition_factor
    }


def main():
    """Main ingestion function."""
    import sys

    # Check for --local flag or --excel flag
    use_local = '--local' in sys.argv
    excel_file = None

    # Check for --excel=path argument
    for arg in sys.argv:
        if arg.startswith('--excel='):
            excel_file = arg.split('=', 1)[1]
            break

    print("\n" + "=" * 60)
    print("  Data Center Graveyard - Data Ingestion")
    print("=" * 60)

    if excel_file:
        print("  Mode: EXCEL file")
        print(f"  File: {excel_file}")
    elif use_local:
        print("  Mode: LOCAL CSV files")
        print(f"  CSV folder: {RAW_DIR}")
    else:
        print("  Mode: Google Sheets (with CSV fallback)")
    print("=" * 60 + "\n")

    # Create directories if they don't exist
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(RAW_DIR, exist_ok=True)

    # Load all tables
    if excel_file:
        if not os.path.exists(excel_file):
            print(f"[ERROR] Excel file not found: {excel_file}")
            return
        print(f"[Loading] DATA_CENTER table from Excel...")
        dc_df = load_from_excel(excel_file, "DATA_CENTER")
        print(f"[Loading] PROJECT_STATUS table from Excel...")
        status_df = load_from_excel(excel_file, "PROJECT_STATUS")
        # Filter out empty rows
        if len(status_df) > 0 and 'data_center_UID' in status_df.columns:
            status_df = status_df[status_df['data_center_UID'].notna() & (status_df['data_center_UID'] != '')]
        print(f"[Loading] COMMUNITY_OPPOSITION table from Excel...")
        opposition_df = load_from_excel(excel_file, "COMMUNITY_OPPOSITION")
        # Filter out empty rows
        if len(opposition_df) > 0 and 'data_center_UID' in opposition_df.columns:
            opposition_df = opposition_df[opposition_df['data_center_UID'].notna() & (opposition_df['data_center_UID'] != '')]
        print(f"[Loading] KEY_MILESTONES table from Excel...")
        milestone_df = load_from_excel(excel_file, "KEY_MILESTONES")
        # Filter out empty rows
        if len(milestone_df) > 0 and 'data_center_UID' in milestone_df.columns:
            milestone_df = milestone_df[milestone_df['data_center_UID'].notna() & (milestone_df['data_center_UID'] != '')]
    else:
        dc_df = load_data_center_table(SHEET_ID, use_local=use_local)
        status_df = load_project_status_table(SHEET_ID, use_local=use_local)
        opposition_df = load_community_opposition_table(SHEET_ID, use_local=use_local)
        milestone_df = load_key_milestones_table(SHEET_ID, use_local=use_local)

    if len(dc_df) == 0:
        print("\n[ERROR] No data center records loaded. Exiting.")
        print("\nOptions:")
        print("  1. Use --excel=path/to/file.xlsx to load from Excel")
        print("  2. Use --local to load from CSV files in:")
        print(f"     {RAW_DIR}")
        print(f"     Required files:")
        for name, filename in CSV_FILES.items():
            print(f"       - {filename}")
        return

    print(f"\n[Building] GeoJSON features...")
    features = build_geojson_features(dc_df, status_df, opposition_df, milestone_df)
    print(f"   [OK] Created {len(features)} features with valid coordinates")

    # Build GeoJSON FeatureCollection
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    # Generate lookups
    print(f"\n[Generating] filter lookups...")
    lookups = generate_lookups(features)

    # Generate statistics
    print(f"[Generating] statistics...")
    statistics = generate_statistics(features)

    # Write output files
    print(f"\n[Saving] output files to {DATA_DIR}...")

    geojson_path = os.path.join(DATA_DIR, "projects.geojson")
    with open(geojson_path, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, indent=2)
    print(f"   [OK] projects.geojson ({len(features)} features)")

    lookups_path = os.path.join(DATA_DIR, "lookups.json")
    with open(lookups_path, 'w', encoding='utf-8') as f:
        json.dump(lookups, f, indent=2)
    print(f"   [OK] lookups.json")

    stats_path = os.path.join(DATA_DIR, "statistics.json")
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(statistics, f, indent=2)
    print(f"   [OK] statistics.json")

    # Print summary
    print(f"\n" + "=" * 60)
    print(f"SUMMARY")
    print(f"=" * 60)
    print(f"   Total Projects: {statistics['summary']['total_projects']}")
    print(f"   Total Capacity: {statistics['summary']['total_capacity_gw']:.2f} GW")
    print(f"   Total Investment: ${statistics['summary']['total_cost_billions']:.1f}B")
    print(f"   Projects with Opposition: {statistics['summary']['with_opposition']}")
    print(f"\n   Status Breakdown:")
    for status, count in sorted(statistics['by_status'].items(), key=lambda x: -x[1]):
        print(f"      {status}: {count}")
    print(f"\n" + "=" * 60 + "\n")


if __name__ == "__main__":
    main()
