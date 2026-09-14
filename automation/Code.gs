/** FireForge Google Drive -> GitHub Pages synchronizer.
 *
 * Drive folders used:
 *   Apps    = APKs/app files
 *   Exploit = security research files/tools
 *
 * Put this file into a Google Apps Script project attached to your Google account.
 * Configure Script Properties (Project Settings -> Script properties):
 *   GITHUB_TOKEN  = fine-grained GitHub token with Contents: Read and write
 *   GITHUB_OWNER  = GitHub username/org
 *   GITHUB_REPO   = repository name
 *   GITHUB_BRANCH = usually main
 */

const CONFIG = {
  APPS_FOLDER: 'Apps',
  EXPLOIT_FOLDER: 'Exploit',
  CATALOG_PATH: 'data/catalog.json',
  ICON_DIR: 'assets/icons',
  STATE_KEY: 'FIREFORGE_STATE_V1'
};

function setup() {
  getOrCreateFolder_(CONFIG.APPS_FOLDER);
  getOrCreateFolder_(CONFIG.EXPLOIT_FOLDER);
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncFireForge').timeBased().everyMinutes(10).create();
  syncFireForge();
}

function syncFireForge() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('GITHUB_TOKEN');
  const owner = props.getProperty('GITHUB_OWNER');
  const repo = props.getProperty('GITHUB_REPO');
  const branch = props.getProperty('GITHUB_BRANCH') || 'main';
  if (!token || !owner || !repo) throw new Error('Set GITHUB_TOKEN, GITHUB_OWNER and GITHUB_REPO in Script Properties.');

  const existing = loadCatalog_(token, owner, repo, branch);
  const byDriveId = {};
  existing.items.forEach(x => { if (x.driveId) byDriveId[x.driveId] = x; });

  const apps = getOrCreateFolder_(CONFIG.APPS_FOLDER);
  const exploits = getOrCreateFolder_(CONFIG.EXPLOIT_FOLDER);

  scanFolder_(apps, 'apps', byDriveId, token, owner, repo, branch);
  scanFolder_(exploits, 'exploits', byDriveId, token, owner, repo, branch);

  // Keep old entries, add new entries. Existing Drive files are not duplicated.
  const items = Object.keys(byDriveId).map(id => byDriveId[id]);
  items.sort((a,b) => String(a.name).localeCompare(String(b.name)));

  const catalog = {generatedAt: new Date().toISOString(), items: items};
  updateRepoFile_(CONFIG.CATALOG_PATH, JSON.stringify(catalog, null, 2), 'Auto-update FireForge catalog', token, owner, repo, branch);
}

function scanFolder_(folder, type, byDriveId, token, owner, repo, branch) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const id = file.getId();
    if (byDriveId[id]) continue;

    const isApk = type === 'apps' && /\.apk$/i.test(file.getName());
    let iconPath = '';
    let iconBlob = null;

    if (isApk) {
      try {
        iconBlob = extractApkIcon_(file.getBlob());
        if (iconBlob) {
          const ext = getExtensionFromMime_(iconBlob.getContentType());
          const iconName = id + '.' + ext;
          const repoPath = CONFIG.ICON_DIR + '/' + iconName;
          updateBinaryRepoFile_(repoPath, iconBlob.getBytes(), 'Add icon for ' + file.getName(), token, owner, repo, branch);
          iconPath = repoPath;
        }
      } catch (err) {
        console.log('Icon extraction failed for ' + file.getName() + ': ' + err);
      }
    }

    const category = type === 'apps' ? 'APK' : 'Security research';
    const name = cleanName_(file.getName());
    const description = type === 'apps'
      ? 'Automatically imported from the Google Drive Apps folder.'
      : 'Automatically imported from the Google Drive Exploit folder.';

    byDriveId[id] = {
      id: id,
      driveId: id,
      type: type,
      name: name,
      version: guessVersion_(file.getName()),
      description: description,
      category: category,
      size: formatBytes_(file.getSize()),
      iconPath: iconPath,
      downloadUrl: 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(id),
      modifiedAt: file.getLastUpdated().toISOString()
    };
  }
}

function extractApkIcon_(blob) {
  const entries = Utilities.unzip(blob);
  const candidates = [];
  entries.forEach(entry => {
    const name = entry.getName();
    if (!/^res\/(?:mipmap[^/]*|drawable[^/]*)\/[^/]+\.(png|webp|jpg|jpeg)$/i.test(name)) return;
    if (entry.getBytes().length > 2 * 1024 * 1024) return;
    const lower = name.toLowerCase();
    let score = 0;
    if (/ic_launcher|launcher|app_icon|appicon|icon/.test(lower)) score += 100;
    if (/mipmap/.test(lower)) score += 30;
    if (/xxxhdpi/.test(lower)) score += 10;
    if (/xxhdpi/.test(lower)) score += 8;
    if (/xhdpi/.test(lower)) score += 6;
    score += Math.min(20, Math.floor(entry.getBytes().length / 5000));
    candidates.push({entry: entry, score: score});
  });
  if (!candidates.length) return null;
  candidates.sort((a,b) => b.score - a.score);
  const selected = candidates[0].entry;
  const lower = selected.getName().toLowerCase();
  const ext = lower.endsWith('.webp') ? 'webp' : (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) ? 'jpg' : 'png';
  return selected.setName('icon.' + ext);
}

function loadCatalog_(token, owner, repo, branch) {
  const result = getRepoFile_(CONFIG.CATALOG_PATH, token, owner, repo, branch);
  if (!result || !result.content) return {items: []};
  try {
    return JSON.parse(Utilities.newBlob(Utilities.base64Decode(result.content.replace(/\n/g, ''))).getDataAsString('UTF-8'));
  } catch (e) {
    return {items: []};
  }
}

function getRepoFile_(path, token, owner, repo, branch) {
  const url = 'https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo) + '/contents/' + path + '?ref=' + encodeURIComponent(branch);
  const res = UrlFetchApp.fetch(url, githubOptions_(token, 'get', null, true));
  if (res.getResponseCode() === 404) return null;
  if (res.getResponseCode() >= 300) throw new Error('GitHub GET failed: ' + res.getContentText());
  return JSON.parse(res.getContentText());
}

function updateRepoFile_(path, text, message, token, owner, repo, branch) {
  const existing = getRepoFile_(path, token, owner, repo, branch);
  const body = {
    message: message,
    content: Utilities.base64Encode(Utilities.newBlob(text, 'text/plain', path).getBytes()),
    branch: branch
  };
  if (existing && existing.sha) body.sha = existing.sha;
  putRepoFile_(path, body, token, owner, repo);
}

function updateBinaryRepoFile_(path, bytes, message, token, owner, repo, branch) {
  const existing = getRepoFile_(path, token, owner, repo, branch);
  const body = {
    message: message,
    content: Utilities.base64Encode(bytes),
    branch: branch
  };
  if (existing && existing.sha) return; // icon already exists
  putRepoFile_(path, body, token, owner, repo);
}

function putRepoFile_(path, body, token, owner, repo) {
  const url = 'https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo) + '/contents/' + path;
  const res = UrlFetchApp.fetch(url, githubOptions_(token, 'put', body, false));
  if (res.getResponseCode() >= 300) throw new Error('GitHub PUT failed: ' + res.getContentText());
}

function githubOptions_(token, method, payload, mute) {
  return {
    method: method,
    contentType: 'application/json',
    muteHttpExceptions: !!mute,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    payload: payload ? JSON.stringify(payload) : undefined
  };
}

function getOrCreateFolder_(name) {
  const it = DriveApp.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(name);
}

function cleanName_(name) {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || name;
}

function guessVersion_(name) {
  const m = name.match(/(?:^|[ _-])v?(\d+(?:\.\d+){1,3})(?:[ _-]|$)/i);
  return m ? m[1] : '';
}

function formatBytes_(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const units = ['KB','MB','GB'];
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return n.toFixed(n >= 10 ? 0 : 1) + ' ' + units[i];
}

function getExtensionFromMime_(mime) {
  if (/webp/i.test(mime)) return 'webp';
  if (/jpe?g/i.test(mime)) return 'jpg';
  return 'png';
}
