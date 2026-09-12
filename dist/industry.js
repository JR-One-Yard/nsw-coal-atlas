import {geologicalProfile} from './mine-geology.js';
import {showPage} from './navigation.js';
import {filterRecords,UNKNOWN_OPERATOR} from './commercial-model.js';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const product=r=>r.tags.map(t=>({met:'Metallurgical',thermal:'Thermal',unknown:'Not classified'})[t]).join(' + ');
export async function initIndustry({data,depositRegister,industry,boreholes,select,focusFeature,pause}){

  let selected=null,filtered=industry.records;
  const regions=[...new Set(industry.records.map(r=>r.region))].sort();
  $('app').insertAdjacentHTML('beforeend',`<section id="industryPanel" hidden aria-label="NSW mines"><div class="industry-head"><h2 tabindex="-1" id="mineTitle">NSW mines</h2><p>35 coal records from the GSNSW registry, downloaded 11 September 2026. </p></div><div id="mineBrowser"><div id="mineList"><div class="industry-filters"><label class="sr-only" for="mineSearch">Search mines, operators and regions</label><input id="mineSearch" type="search" placeholder="Search mines or operators"><label class="sr-only" for="mineRegion">Region</label><select id="mineRegion"><option value="all">All regions</option>${regions.map(r=>`<option>${r}</option>`).join('')}</select></div><details class="more-filters"><summary>More filters</summary><div><label>Coal use<select id="mineProduct"><option value="all">All coal uses</option><option value="thermal">Thermal</option><option value="met">Metallurgical</option><option value="unknown">Not classified</option></select></label><label>Operator<select id="mineOperator"><option value="all">All operators</option>${[...new Set(industry.records.map(r=>r.operator??UNKNOWN_OPERATOR))].sort().map(o=>`<option value="${esc(o)}">${esc(o===UNKNOWN_OPERATOR?'No data':o)}</option>`).join('')}</select></label><label>Destination<select id="mineDestination"><option value="all">All destinations</option>${industry.destinations.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</select></label></div></details><div class="list-meta"><p id="industryCount" class="micro" aria-live="polite"></p><button id="resetIndustryFilters" hidden>Clear filters</button></div><div class="industry-table-wrap"><table class="industry-table"><thead><tr><th scope="col">Mine / operation</th><th scope="col">Region</th><th scope="col">Operator</th><th scope="col">Coal use</th></tr></thead><tbody id="mineRows"></tbody></table></div><button id="exportMines" class="subtle">Download list (CSV)</button></div><article id="industryDetail" hidden></article></div></section>`);
  function open(value=true){pause();showPage(value?'mines':'map');if(value){$('industryDetail').hidden=true;$('mineBrowser').classList.remove('has-detail');render();$('mineTitle').focus();}}
  function render(){
    const query=$('mineSearch').value.trim().toLowerCase(),region=$('mineRegion').value,tag=$('mineProduct').value;
    filtered=filterRecords(industry,{query,region,product:tag,operator:$('mineOperator').value,destination:$('mineDestination').value});
    $('industryCount').textContent=`${filtered.length} of ${industry.records.length} registry records · source snapshot ${industry.date}`;
    $('mineRows').innerHTML=filtered.length?filtered.map(r=>`<tr class="${selected===r.id?'selected':''}"><td><button data-mine="${r.id}">${esc(r.name)}</button></td><td>${esc(r.region)}</td><td>${esc(r.operator??'No data')}</td><td>${product(r)}</td></tr>`).join(''):'<tr><td colspan="4">No mines match. Clear the search or choose a different filter.</td></tr>';
    $('mineRows').querySelectorAll('[data-mine]').forEach(el=>el.onclick=()=>show(el.dataset.mine));
    $('resetIndustryFilters').hidden=!query&&[region,tag,$('mineOperator').value,$('mineDestination').value].every(v=>v==='all');

  }
  function show(id){
    const r=industry.records.find(r=>r.id===id);if(!r)return;selected=id;render();$('industryDetail').hidden=false;$('mineBrowser').classList.add('has-detail');
    const routes=industry.routes.filter(l=>l.fromId===id),complex=industry.complexes[r.complexId];
    const nearby=boreholes.data.bores.map(b=>({b,km:Math.hypot((b.lon-r.lon)*111.32*Math.cos(r.lat*Math.PI/180),(b.lat-r.lat)*111.32)})).filter(b=>b.km<=10).sort((a,b)=>a.km-b.km);
    const sourceIds=[...new Set([...r.sources,...(complex?[complex.source]:[]),...routes.flatMap(r=>r.sources)])];
    const sourceLinks=sourceIds.map(id=>industry.sources.find(s=>s.id===id)).filter(Boolean).map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join('');
    $('industryDetail').innerHTML=`<button id="closeMine" class="subtle">← Back to list</button><span class="eyebrow">${esc(r.region)} COALFIELD</span><h3>${esc(r.name)}</h3>${r.description?`<p>${esc(r.description)}</p>`:''}<dl><dt>Operator / group</dt><dd>${esc(r.operator??'No data')}</dd><dt>Coal use</dt><dd>${product(r)}</dd><dt>Method</dt><dd>${esc(r.method??'No data')}</dd><dt>Location</dt><dd>${r.lat.toFixed(5)}°, ${r.lon.toFixed(5)}°</dd><dt>Registry status</dt><dd>${esc(r.registryStatus)}</dd></dl><p class="source-date">Registry snapshot ${industry.date}.</p><p class="micro">${esc(r.statusNote)}</p><p class="micro">${esc(data.mines.find(m=>m.id===r.id)?.coverage)}</p><h4>Ownership</h4><p>${esc(r.ownership??'No data')}</p>${complex?`<h4>${esc(complex.name)} · ${complex.period}</h4><p><strong>${complex.saleableMt} Mt saleable coal</strong>${complex.romMt!==null?` · ${complex.romMt} Mt run-of-mine`:''}</p><p class="source-date">${esc(complex.basis)}. Whole-complex production.</p>`:'<h4>Production</h4><p>No data</p>'}${r.capacity?`<h4>Approved capacity</h4><p>${r.capacity.value} ${r.capacity.unit} · ${esc(r.capacity.basis)}</p>`:''}${geologicalProfile(depositRegister.records.find(g=>g.id===r.id))}<h4>Nearby borehole logs</h4>${nearby.length?`<p class="micro">${nearby.length} compiled logs within 10 km. Nearest locations below; proximity does not establish a mine or seam correlation.</p>${nearby.slice(0,3).map(({b,km})=>`<p><button data-nearby-bore="${esc(b.id)}">${esc(b.name)} · ${km.toFixed(1)} km ↗</button></p>`).join('')}`:'<p>No compiled logs within 10 km in this atlas dataset.</p>'}<h4>Documented destinations</h4>${routes.length?routes.map(l=>`<p>↗ ${esc(industry.destinations.find(d=>d.id===l.toId)?.name)}<br><span class="source-date">${esc(l.mode)}</span></p>`).join(''):'<p>No data</p>'}${data.mines.some(m=>m.id===r.id)?'<button id="viewMine3D" class="primary">Show on map ↗</button>':'<p class="source-date">3D view unavailable.</p>'}<details><summary>Sources & provenance</summary><p class="source-date">GSNSW record ${r.registryId}. Operator evidence reviewed ${r.reviewedAt}.</p><ul>${sourceLinks}</ul></details>`;
    $('closeMine').onclick=()=>{$('industryDetail').hidden=true;$('mineBrowser').classList.remove('has-detail');document.querySelector(`[data-mine="${id}"]`)?.focus();};
    $('industryDetail').querySelectorAll('[data-nearby-bore]').forEach(button=>button.onclick=()=>{open(false);boreholes.open(button.dataset.nearbyBore);});
    $('industryDetail').scrollTop=0;$('closeMine').focus({preventScroll:true});
    if($('viewMine3D'))$('viewMine3D').onclick=()=>{open(false);select(id);focusFeature(id);};
  }
  $('industryToggle').onclick=()=>open(true);
  for(const id of ['mineSearch','mineRegion','mineProduct','mineOperator','mineDestination'])$(id).addEventListener('input',render);
  $('exportMines').onclick=()=>{
    const csvCell=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
    const rows=[['Mine','Region','Operator / group','Coal use','Registry status','Snapshot','Longitude','Latitude','Complex ID','Source URLs'],...filtered.map(r=>[r.name,r.region,r.operator,product(r),r.registryStatus,industry.date,r.lon,r.lat,r.complexId,r.sources.map(id=>industry.sources.find(s=>s.id===id)?.url).filter(Boolean).join(' | ')])];
    const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='NSW-coal-industry.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  $('resetIndustryFilters').onclick=()=>{$('mineSearch').value='';for(const id of ['mineRegion','mineProduct','mineOperator','mineDestination'])$(id).value='all';render();};
  window.coalIndustry={getState:()=>({total:industry.records.length,filtered:filtered.map(r=>r.id),selected,open:!$('industryPanel').hidden})};
  return {open,show:id=>{open(true);show(id);}};
}
