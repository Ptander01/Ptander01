"""
Imagery Metadata Service

Manages the catalog of satellite imagery snapshots:
- Load/save imagery metadata
- Track available dates per site
- Store SAM-extracted metrics per snapshot

Author: Patrick Anderson
Date: February 2026
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import os

# Path to data directory
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "data")


class ImageryMetadataService:
    """Manages imagery metadata and SAM-extracted metrics."""

    def __init__(self, data_dir: str = DATA_DIR):
        self.data_dir = data_dir
        self.sites: Dict[str, Dict] = {}
        self._load_sites()

    def _load_sites(self):
        """Load sites from JSON file."""
        sites_path = os.path.join(self.data_dir, "sites.json")
        if os.path.exists(sites_path):
            with open(sites_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for site in data.get("sites", []):
                    self.sites[site["id"]] = site

    def _save_sites(self):
        """Save sites to JSON file."""
        sites_path = os.path.join(self.data_dir, "sites.json")
        with open(sites_path, 'w', encoding='utf-8') as f:
            json.dump({"sites": list(self.sites.values())}, f, indent=2)

    def get_site(self, site_id: str) -> Optional[Dict]:
        """Get a site by ID."""
        return self.sites.get(site_id)

    def get_all_sites(self) -> List[Dict]:
        """Get all sites."""
        return list(self.sites.values())

    def add_snapshot(
        self,
        site_id: str,
        date: str,
        image_url: str,
        metrics: Optional[Dict] = None,
        changes: Optional[List[Dict]] = None,
        auto_extracted: Optional[Dict] = None,
        requires_review: Optional[List[str]] = None
    ) -> bool:
        """
        Add a new imagery snapshot for a site.

        Args:
            site_id: Site identifier
            date: Snapshot date (YYYY-MM-DD)
            image_url: URL to imagery (ESRI tile service or file path)
            metrics: Extracted metrics (MW, equipment counts, etc.)
            changes: List of detected changes from previous snapshot
            auto_extracted: Raw SAM extraction results
            requires_review: List of metric keys needing SME review

        Returns:
            True if added, False if site not found
        """
        if site_id not in self.sites:
            return False

        snapshot = {
            "date": date,
            "image_url": image_url,
            "metrics": metrics or {},
            "changes": changes or [],
            "created_at": datetime.now().isoformat(),
        }

        if auto_extracted:
            snapshot["auto_extracted"] = auto_extracted
        if requires_review:
            snapshot["requires_review"] = requires_review
            snapshot["reviewed"] = False

        # Insert in date order
        snapshots = self.sites[site_id].get("snapshots", [])
        snapshots.append(snapshot)
        snapshots.sort(key=lambda x: x["date"])
        self.sites[site_id]["snapshots"] = snapshots

        self._save_sites()
        return True

    def update_snapshot_metrics(
        self,
        site_id: str,
        date: str,
        metrics: Dict,
        mark_reviewed: bool = False
    ) -> bool:
        """
        Update metrics for an existing snapshot (e.g., after SME review).
        """
        if site_id not in self.sites:
            return False

        for snapshot in self.sites[site_id].get("snapshots", []):
            if snapshot["date"] == date:
                snapshot["metrics"].update(metrics)
                snapshot["updated_at"] = datetime.now().isoformat()
                if mark_reviewed:
                    snapshot["reviewed"] = True
                self._save_sites()
                return True

        return False

    def get_available_dates(self, site_id: str) -> List[str]:
        """Get all available imagery dates for a site."""
        if site_id not in self.sites:
            return []
        return [s["date"] for s in self.sites[site_id].get("snapshots", [])]

    def get_latest_snapshot(self, site_id: str) -> Optional[Dict]:
        """Get the most recent snapshot for a site."""
        if site_id not in self.sites:
            return None
        snapshots = self.sites[site_id].get("snapshots", [])
        return snapshots[-1] if snapshots else None

    def calculate_changes(
        self,
        site_id: str,
        date_before: str,
        date_after: str
    ) -> List[Dict]:
        """
        Calculate changes between two snapshots.
        Used to auto-generate change detection cards.
        """
        site = self.sites.get(site_id)
        if not site:
            return []

        snapshot_before = None
        snapshot_after = None

        for s in site.get("snapshots", []):
            if s["date"] == date_before:
                snapshot_before = s
            if s["date"] == date_after:
                snapshot_after = s

        if not snapshot_before or not snapshot_after:
            return []

        changes = []
        metrics_before = snapshot_before.get("metrics", {})
        metrics_after = snapshot_after.get("metrics", {})

        # Equipment changes
        equipment_keys = [
            "cooling_towers", "chillers", "generators", "turbines",
            "transformers", "substations"
        ]

        for key in equipment_keys:
            before = metrics_before.get(key, 0) or 0
            after = metrics_after.get(key, 0) or 0
            delta = after - before

            if delta > 0:
                changes.append({
                    "type": "equipment_added",
                    "category": key,
                    "delta": delta,
                    "previous": before,
                    "current": after,
                    "description": f"+{delta} {key.replace('_', ' ')} detected"
                })
            elif delta < 0:
                changes.append({
                    "type": "equipment_removed",
                    "category": key,
                    "delta": delta,
                    "previous": before,
                    "current": after,
                    "description": f"{delta} {key.replace('_', ' ')} (removed or reclassified)"
                })

        # Construction stage changes
        stage_before = metrics_before.get("construction_stage")
        stage_after = metrics_after.get("construction_stage")

        if stage_before and stage_after and stage_before != stage_after:
            changes.append({
                "type": "construction_progress",
                "previous_stage": stage_before,
                "current_stage": stage_after,
                "description": f"Construction stage: {stage_before} → {stage_after}"
            })

        # MW capacity changes
        mw_before = metrics_before.get("estimated_mw", 0) or 0
        mw_after = metrics_after.get("estimated_mw", 0) or 0
        mw_delta = mw_after - mw_before

        if abs(mw_delta) >= 10:  # Only flag significant changes
            changes.append({
                "type": "capacity_change",
                "delta_mw": mw_delta,
                "previous_mw": mw_before,
                "current_mw": mw_after,
                "description": f"Estimated capacity: {mw_before} MW → {mw_after} MW ({'+' if mw_delta > 0 else ''}{mw_delta} MW)"
            })

        return changes


# Singleton instance
_metadata_service: Optional[ImageryMetadataService] = None


def get_metadata_service() -> ImageryMetadataService:
    """Get or create metadata service singleton."""
    global _metadata_service
    if _metadata_service is None:
        _metadata_service = ImageryMetadataService()
    return _metadata_service
