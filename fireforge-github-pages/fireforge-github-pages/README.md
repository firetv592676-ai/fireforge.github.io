# FireForge — GitHub Pages + Google Drive

Static Fire Tablet APK/research website for GitHub Pages.

## Deploy
1. Create a GitHub repository. For GitHub Pages on GitHub Free, use a public repository.
2. Upload everything in this folder to the repository root.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then Save.

## Google Drive APKs
Upload each APK to Google Drive, set the file to **Anyone with the link → Viewer**, and copy its file ID.

Edit `data/catalog.json`:

```json
{
  "id": "my-apk",
  "name": "My APK",
  "version": "1.0.0",
  "description": "Description",
  "size": "25 MB",
  "iconUrl": "https://drive.google.com/thumbnail?id=ICON_FILE_ID&sz=w256",
  "downloadUrl": "https://drive.google.com/uc?export=download&id=APK_FILE_ID",
  "category": "Utilities"
}
```

The icon can be another Drive image, or any publicly reachable image URL.

## Notes
- There is no backend and no environment-variable setup.
- Do not put private credentials, API keys, or secrets in the repository.
- The public Exploits section is intended for CVEs, research notes, references and mitigations rather than operational exploit payloads.
