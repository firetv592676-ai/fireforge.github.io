# FireForge — Google Drive automated catalog

This project is designed for GitHub Pages + Google Drive.

## Folders

Use these exact Google Drive folders:

- `Apps` — APKs
- `Exploit` — exploits/security-research files

## Deployment

1. Upload everything inside `site/` to the root of your GitHub repository.
2. Enable GitHub Pages from the `main` branch and `/ (root)`.
3. Create the Apps Script using `automation/Code.gs`.
4. Set the GitHub token/owner/repository/branch in Apps Script properties.
5. Run `setup()` once.
6. Upload APKs to the Google Drive `Apps` folder.

The script updates the site's generated `data/catalog.json` and icon files automatically.
