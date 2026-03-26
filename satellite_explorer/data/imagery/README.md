# Testing with Local Satellite Imagery

This guide explains how to add satellite imagery from Google Drive to test the DCII Satellite Explorer.

## Folder Structure

Images should be placed in the following folders:

```
data/imagery/
├── microsoft_fairwater_mt_pleasant/
│   ├── 2025-09-08_clipped.jpg
│   ├── 2025-10-28_clipped.jpg
│   └── 2025-11-28_clipped.jpg
├── xai_memphis_colossus_1/
│   ├── 2025-06-15_clipped.jpg
│   ├── 2025-09-22_clipped.jpg
│   └── 2025-11-27_clipped.jpg
├── openai_stargate_abilene/
│   └── ...
└── ... (other sites)
```

## File Naming Convention

For best results, name your imagery files with the date prefix:
- `YYYY-MM-DD_description.jpg` (e.g., `2025-09-08_clipped.jpg`)
- `YYYY-MM-DD.tif` (e.g., `2025-09-08.tif`)

The app will automatically parse the date from the filename for the timeline.

## Supported Formats

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- TIFF/GeoTIFF (`.tif`, `.tiff`)
- WebP (`.webp`)

## How to Download from Google Drive

1. Go to your GDrive imagery folder: https://drive.google.com/drive/folders/1fczhsokCEjy_u4Q4jS3nxC_uZRtaOjHK

2. Navigate to the site you want to test (e.g., "Microsoft Fairwater")

3. Find the "clipped" images (these are smaller and load faster)

4. Right-click → Download

5. Move the downloaded file to the appropriate folder:
   ```
   .\data\imagery\<site_id>\
   ```

## Site ID Mapping

| Site Name | Folder Name (site_id) |
|-----------|----------------------|
| Microsoft Fairwater | `microsoft_fairwater_mt_pleasant` |
| xAI Memphis Colossus 1 | `xai_memphis_colossus_1` |
| xAI Memphis Colossus 2 | `xai_memphis_colossus_2` |
| xAI Memphis Colossus 3 | `xai_memphis_colossus_3` |
| OpenAI Stargate Abilene | `openai_stargate_abilene` |
| AWS Rainier 1 (Indiana) | `aws_rainier_1_indiana` |
| AWS Rainier 2 (Jackson) | `aws_rainier_2_jackson` |

## Quick Test

After adding images, restart the backend:
```powershell
curl http://localhost:8000/api/reload
```

Then check available imagery for a site:
```powershell
curl http://localhost:8000/api/imagery/microsoft_fairwater_mt_pleasant/available
```

You should see a list of your uploaded images!

## In the App

1. Open http://localhost:5174/
2. Click on a site that has imagery
3. The "📷 Satellite Imagery" panel will appear in the top-left
4. Use the dropdown to switch between dates
5. Toggle the ON/OFF button to show/hide the imagery overlay
