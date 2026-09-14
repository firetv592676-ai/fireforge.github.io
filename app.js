const state={tab:'apps',items:[],query:''};
const grid=document.querySelector('#grid');
const empty=document.querySelector('#empty');
const count=document.querySelector('#count');
const status=document.querySelector('#syncStatus');

function driveUrl(id){return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`}
function iconUrl(path){return path ? `./${path.replace(/^\.\//,'')}` : ''}
function esc(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function render(){
  const q=state.query.toLowerCase().trim();
  const list=state.items.filter(x=>x.type===state.tab && [x.name,x.description,x.category,x.version].join(' ').toLowerCase().includes(q));
  count.textContent=`${list.length} item${list.length===1?'':'s'}`;
  empty.hidden=list.length!==0;
  grid.innerHTML=list.map(item=>{
    const icon=iconUrl(item.iconPath);
    return `<article class="card"><div class="cover">${icon?`<img loading="lazy" src="${esc(icon)}" alt="">`:`<div class="fallback">${esc((item.name||'?').slice(0,1).toUpperCase())}</div>`}</div><div class="body"><div class="kicker">${esc(item.type==='apps'?'APK':'Security research')}</div><div class="title">${esc(item.name)}</div><div class="desc">${esc(item.description||'No description provided.')}</div><div class="meta">${item.version?`<span class="pill">v${esc(item.version)}</span>`:''}${item.size?`<span class="pill">${esc(item.size)}</span>`:''}${item.category?`<span class="pill">${esc(item.category)}</span>`:''}</div><a class="download" href="${esc(item.downloadUrl||driveUrl(item.driveId))}" target="_blank" rel="noopener">${item.type==='apps'?'Download APK':'Open file'}</a></div></article>`;
  }).join('');
}

document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');state.tab=btn.dataset.tab;render()}));
document.querySelector('#search').addEventListener('input',e=>{state.query=e.target.value;render()});
fetch('./data/catalog.json',{cache:'no-store'}).then(r=>r.json()).then(data=>{state.items=data.items||[];status.textContent=`Synced ${data.generatedAt?new Date(data.generatedAt).toLocaleString():''}`;render()}).catch(err=>{status.textContent='Catalog unavailable';console.error(err)});
