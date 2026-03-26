"""
ESRI Client Service

Handles communication with ESRI ArcGIS Enterprise Portal:
- Authentication with Portal
- Image Service queries (available dates, tile URLs)
- Feature Service queries (SAM-extracted polygons)

Portal: your-portal.example.com

Author: Patrick Anderson
Date: February 2026
"""

import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime
import os

# ESRI Portal Configuration
ESRI_PORTAL_URL = "https://your-portal.example.com/portal"
ESRI_SERVER_URL = "https://your-portal.example.com/server/rest/services"

# Image Service IDs for each site (to be populated)
SITE_IMAGE_SERVICES = {
    "xai_memphis_colossus_1": None,  # TBD - get from [team member]
    "xai_memphis_colossus_2": None,
    "xai_memphis_colossus_3": None,
    "openai_stargate_abilene": None,
    "aws_rainier_1_indiana": None,
    "aws_rainier_2_jackson_canton": None,
    "aws_rainier_2_jackson_ridgeland": None,
    "microsoft_fairwater_mt_pleasant": None,
}


class ESRIClient:
    """Client for ESRI ArcGIS Enterprise REST API."""

    def __init__(self, portal_url: str = ESRI_PORTAL_URL):
        self.portal_url = portal_url
        self.token: Optional[str] = None
        self.token_expiry: Optional[datetime] = None
        self._client = httpx.AsyncClient(timeout=30.0)

    async def authenticate(self, username: str, password: str) -> bool:
        """
        Authenticate with ESRI Portal and get a token.
        For local dev, we'll use stored credentials or skip auth.
        """
        # TODO: Implement OAuth or token-based auth
        # For now, placeholder that would use generateToken endpoint
        token_url = f"{self.portal_url}/sharing/rest/generateToken"

        data = {
            "username": username,
            "password": password,
            "client": "referer",
            "referer": "http://localhost:5173",
            "f": "json"
        }

        try:
            response = await self._client.post(token_url, data=data)
            result = response.json()

            if "token" in result:
                self.token = result["token"]
                self.token_expiry = datetime.fromtimestamp(result.get("expires", 0) / 1000)
                return True
            else:
                print(f"Auth failed: {result.get('error', {}).get('message', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"Auth error: {e}")
            return False

    async def get_image_service_info(self, service_id: str) -> Dict[str, Any]:
        """
        Get metadata about an Image Service.
        """
        url = f"{ESRI_SERVER_URL}/Hosted/{service_id}/ImageServer?f=json"
        if self.token:
            url += f"&token={self.token}"

        response = await self._client.get(url)
        return response.json()

    async def query_available_dates(self, service_id: str) -> List[str]:
        """
        Query an Image Service to get list of available imagery dates.
        Uses the multidimensional info or time extent.
        """
        info = await self.get_image_service_info(service_id)

        # Parse time extent if available
        time_info = info.get("timeInfo", {})
        time_extent = time_info.get("timeExtent", [])

        # This is simplified - actual implementation would query raster catalog
        # and extract unique dates from the imagery
        dates = []

        # TODO: Query raster catalog for actual dates
        # Would use: /query?where=1=1&outFields=AcquisitionDate&returnDistinctValues=true

        return dates

    async def get_tile_url(
        self,
        service_id: str,
        date: str,
        z: int,
        x: int,
        y: int
    ) -> str:
        """
        Generate tile URL for a specific date's imagery.
        """
        # Standard ESRI tile endpoint
        base_url = f"{ESRI_SERVER_URL}/Hosted/{service_id}/ImageServer/tile/{z}/{y}/{x}"

        # Add time parameter for date filtering
        params = [f"time={date}"]
        if self.token:
            params.append(f"token={self.token}")

        return f"{base_url}?{'&'.join(params)}"

    async def get_feature_service(
        self,
        service_id: str,
        layer_id: int = 0,
        where: str = "1=1",
        out_fields: str = "*",
        return_geometry: bool = True
    ) -> Dict[str, Any]:
        """
        Query a Feature Service for SAM-extracted polygons.
        """
        url = f"{ESRI_SERVER_URL}/Hosted/{service_id}/FeatureServer/{layer_id}/query"

        params = {
            "where": where,
            "outFields": out_fields,
            "returnGeometry": str(return_geometry).lower(),
            "f": "geojson"
        }
        if self.token:
            params["token"] = self.token

        response = await self._client.get(url, params=params)
        return response.json()

    async def close(self):
        """Close the HTTP client."""
        await self._client.aclose()


# Singleton instance
_esri_client: Optional[ESRIClient] = None


def get_esri_client() -> ESRIClient:
    """Get or create ESRI client singleton."""
    global _esri_client
    if _esri_client is None:
        _esri_client = ESRIClient()
    return _esri_client
