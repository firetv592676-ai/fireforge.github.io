let catalog = { apks: [], exploits: [] };
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
function showTab(tab) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === tab));
  $$('.nav[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  history.replaceState(null, '', `#${tab}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function apkCard(x) {
  const icon = x.iconUrl ? `<img src="${esc(x.iconUrl)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">` : '';
  return `<article class="card"><div class="icon-wrap">${icon}<span class="fallback" style="${x.iconUrl ? 'display:none' : ''}">APK</span></div><div class="card-body"><div class="pill">${esc(x.category || 'APK')}</div><h3>${esc(x.name)}</h3><p>${esc(x.description || '')}</p><div class="meta"><span>v${esc(x.version || '—')}</span><span>${esc(x.size || '—')}</span></div>${x.downloadUrl ? `<a class="download" href="${esc(x.downloadUrl)}" target="_blank" rel="noopener noreferrer">Download APK ↓</a>` : `<span class="download disabled">Download link missing</span>`}</div></article>`;
}
function exploitCard(x) { return `<article class="card research"><div class="research-top"><span class="pill">${esc(x.status || 'Research')}</span><span>${esc(x.device || '')}</span></div><h3>${esc(x.name)}</h3><p>${esc(x.description || '')}</p>${x.link ? `<a class="download" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">Open reference ↗</a>` : ''}</article>`; }
function render() {
  const aq = ($('#apkSearch')?.value || '').toLowerCase();
  const eq = ($('#exploitSearch')?.value || '').toLowerCase();
  $('#apkGrid').innerHTML = catalog.apks.filter(x => `${x.name} ${x.description} ${x.packageName || ''} ${x.category || ''}`.toLowerCase().includes(aq)).map(apkCard).join('') || `<div class="empty">No APKs match your search.</div>`;
  $('#exploitGrid').innerHTML = catalog.exploits.filter(x => `${x.name} ${x.description} ${x.device} ${x.status}`.toLowerCase().includes(eq)).map(exploitCard).join('') || `<div class="empty">No research entries match your search.</div>`;
  $('#apkCount').textContent = catalog.apks.length; $('#exploitCount').textContent = catalog.exploits.length;
}
function esc(v) { return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
$$('[data-tab]').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
$('#apkSearch').addEventListener('input', render); $('#exploitSearch').addEventListener('input', render);
fetch('./data/catalog.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('Catalog request failed'); return r.json(); }).then(d => { catalog = d; render(); const tab = location.hash.slice(1); if (['home','apks','exploits'].includes(tab)) showTab(tab); }).catch(() => render());
