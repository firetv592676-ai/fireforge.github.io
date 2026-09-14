# FireForge Google Drive automation

This Google Apps Script connects the two Drive folders to the GitHub Pages site.

## Drive folders

Create (or let the script create) these exact folders in your Google Drive:

- `Apps` — put APK files here.
- `Exploit` — put research files/tools here.

The script scans them every 10 minutes.

## GitHub setup

The target repository should be the same repository that hosts the FireForge Pages site. It must contain the `site/` contents at the repository root.

Create a GitHub fine-grained personal access token with repository access to this repo and **Contents: Read and write** permission. Do not put the token in the website files.

## Apps Script setup

1. Open https://script.google.com/ and create a new project.
2. Replace the default code with `Code.gs` from this folder.
3. In Project Settings -> Script properties, add:

   - `GITHUB_TOKEN` — your GitHub token
   - `GITHUB_OWNER` — your GitHub username or organization
   - `GITHUB_REPO` — repository name, e.g. `fireforge`
   - `GITHUB_BRANCH` — normally `main`

4. Run `setup()` once from the Apps Script editor and approve the Google permissions.
5. Put an APK in the `Apps` folder and wait for the next scan, or run `syncFireForge()` manually.

## What happens automatically

For a new APK in `Apps`, the script:

- reads the Google Drive file
- creates an item in `data/catalog.json`
- tries to extract a launcher/icon PNG/WebP/JPEG from common `res/mipmap*` or `res/drawable*` APK resources
- stores the extracted image under `assets/icons/`
- creates a Google Drive download link
- commits the changes to GitHub

For a new file in `Exploit`, it creates an `Exploits` catalog card and uses a generated first-letter cover when no image is provided.

## Important limitations

GitHub Pages is static, so it does not run the APK parser. The Apps Script performs the synchronization instead.

APK icons are extracted on a best-effort basis from common image resources inside the APK. Adaptive icons that exist only as compiled Android resources may not extract perfectly. Those files still get added to the catalog.

Files already in a folder before the first sync are also imported.
