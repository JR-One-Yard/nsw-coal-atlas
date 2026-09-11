import {PICK_SEAMS,sectionPicks,acceptedInterval} from './borehole-model.js';
const $=id=>document.getElementById(id),esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>Number.isFinite(v)?v.toFixed(1):'—';
export async function initBoreholes(api){
 const response=await fetch('./data/borehole-picks.json');if(!response.ok)throw Error('Borehole evidence unavailable');const data=await response.json();let current=null;
 $('openStrata').parentElement.insertAdjacentHTML('afterend','<button id="openBoreholes" class="bore-launch">Borehole evidence ↗</button>');
 $('sectionCoordinates').insertAdjacentHTML('beforebegin','<label class="pick-control"><input id="sectionPicks" type="checkbox"> Reported coal tops within 1 km of section</label><p id="pickWarning" class="micro" hidden>Diamonds are reported AHD picks projected onto the line. Depths are not deviation-corrected; known horizontal/deviated holes are excluded. Model height references have not been reconciled to AHD. These picks have not been used to fit the model.</p>');
 $('sectionPicks').onchange=()=>{$('pickWarning').hidden=!$('sectionPicks').checked;api.renderSection();};
 $('sourceBody').insertAdjacentHTML('afterbegin',`<h3>Borehole stratigraphic evidence · ABSUC 2024 v2</h3><p>${data.stats.bores} boreholes and ${data.stats.preferredTops.toLocaleString()} preferred top picks fall inside the atlas. They retain measured depth, AHD elevation, drill reference, compiler flags and source identifiers. The collection includes coal and non-coal units.</p><p>${esc(data.warning)}</p><p>${esc(data.citation)} CC BY 4.0. <a href="${data.url}" target="_blank" rel="noopener">Dataset</a> · <a href="${data.metadataUrl}#page=5" target="_blank" rel="noopener">Method and limitations (p. 5)</a> · <a href="./data/borehole-picks.json" download>Download regional picks</a></p>`);
 function open(id){
  current=data.bores.find(b=>b.id===id)||data.bores.find(b=>b.name==='Cordeaux River 1')||data.bores[0];api.showPanel();$('details').classList.add('bore-active');$('details').scrollTop=0;
  $('detailBody').innerHTML=`<span class="evidence-badge mapped">PUBLISHED BOREHOLE INTERPRETATIONS</span><h2>Read a borehole</h2><p class="micro">${data.stats.bores} locations · ${data.stats.preferredTops.toLocaleString()} preferred formation tops</p><label for="boreSearch" class="sr-only">Search boreholes</label><input id="boreSearch" type="search" placeholder="Search borehole or unit…"><label class="sr-only" for="boreSelect">Choose a borehole</label><select id="boreSelect"></select><p id="boreCount" class="micro" aria-live="polite"></p><div id="boreProfile"></div>`;
  $('boreSearch').oninput=filter;filter();profile();
 }
 function filter(){
  const q=$('boreSearch').value.toLowerCase().trim(),bores=data.bores.filter(b=>[b.name,b.uwi,...b.picks.map(p=>p.unit)].join(' ').toLowerCase().includes(q));
  $('boreSelect').innerHTML=bores.map(b=>`<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('');$('boreCount').textContent=`${bores.length} matching boreholes`;
  $('boreSelect').disabled=!bores.length;
  if(bores.some(b=>b.id===current?.id))$('boreSelect').value=current.id;
  else if(bores.length){current=bores[0];profile();}else{$('boreProfile').innerHTML='<p>No matching borehole. Try a name or formation.</p>';}
  $('boreSelect').onchange=()=>{current=data.bores.find(b=>b.id===$('boreSelect').value);profile();};
 }
 function profile(){
  const b=current,tops=b.picks.filter(p=>p.preferredTop&&Number.isFinite(p.topMD)),max=Math.max(1,b.totalMD||0,...tops.map(p=>p.topMD)),y=d=>25+d/max*270;
  let svg='<rect width="260" height="320" fill="#102530"/><path d="M75 25V295" stroke="#829fac"/>';
  for(let i=0;i<=4;i++)svg+=`<text x="65" y="${y(max*i/4)+4}" fill="#9ab4c1" font-size="10" text-anchor="end">${Math.round(max*i/4)} m</text>`;
  tops.forEach((p,i)=>{const seam=api.seams.find(s=>s.id===PICK_SEAMS[p.unit]);svg+=`<g data-log-pick="${i}" role="button" tabindex="0" aria-label="${esc(p.unit)} top at ${number(p.topMD)} metres measured depth"><title>${esc(p.unit)} · ${number(p.topMD)} m MD</title><path d="M80 ${y(p.topMD)}h${seam?145:65}" stroke="${seam?.color||'#91b9b0'}" stroke-width="${seam?3:1}"/><path d="M75 ${y(p.topMD)}h160" stroke="transparent" stroke-width="7"/></g>`;});
  svg+='<text x="75" y="14" fill="#a8c0c9" font-size="10">Depth from drilling reference</text><text x="75" y="314" fill="#a8c0c9" font-size="9">Ticks = preferred formation tops</text>';
  $('boreProfile').innerHTML=`<h3>${esc(b.name)}</h3><dl><dt>Coordinates</dt><dd>${b.lat.toFixed(5)}, ${b.lon.toFixed(5)} · GDA94</dd><dt>Reference</dt><dd>${esc(b.datumName)} · ${number(b.datumAHD)} m AHD</dd><dt>Ground level</dt><dd>${number(b.groundAHD)} m AHD</dd><dt>Total depth</dt><dd>${number(b.totalMD)} m MD</dd></dl><p class="notice">MD is distance down the hole from its drilling reference. It is not automatically vertical depth below ground. ${b.datumName==='SRTM_HE'?'The reference elevation is DEM-derived. ':''}${esc(b.comment||'Deviation information is not supplied in this collar record.')}</p><button id="locateBore">Locate on terrain</button><svg id="boreLog" viewBox="0 0 260 320" role="img" aria-label="Preferred formation-top depths for ${esc(b.name)}">${svg}</svg><p id="logReadout" class="micro" aria-live="polite">Select a tick or table row to inspect its source.</p><div class="bore-table-wrap"><table class="bore-table"><thead><tr><th>Preferred top</th><th>m MD</th><th>m AHD</th></tr></thead><tbody>${tops.map((p,i)=>`<tr><td><button data-log-pick="${i}">${esc(p.unit)}</button></td><td>${number(p.topMD)}</td><td>${number(p.topAHD)}</td></tr>`).join('')}</tbody></table></div><div id="pickDetail"></div><p class="micro">${b.picks.length-tops.length} additional base-only records are retained in the downloadable data. Source selection is the compiler’s preference, not independent verification.</p><p class="micro">Collar source: ${esc(b.source)} · UWI ${esc(b.uwi)}<br>GA borehole GUID: ${esc(b.id)}</p><p><a href="${data.metadataUrl}#page=5" target="_blank" rel="noopener">Read the compilation method</a> · <a href="${data.url}" target="_blank" rel="noopener">GA source dataset</a></p>`;
  $('locateBore').onclick=()=>api.locate(b);
  $('boreProfile').querySelectorAll('[data-log-pick]').forEach(el=>{const show=()=>{
   const p=tops[+el.dataset.logPick],valid=acceptedInterval(p);
   $('logReadout').textContent=`${p.unit}: ${number(p.topMD)} m MD; ${number(p.topAHD)} m AHD`;
   $('pickDetail').innerHTML=`<h4>${esc(p.unit)}</h4><p>${valid?`Reported interval: ${number(p.topMD)}–${number(p.baseMD)} m MD. This is a down-hole interval, not true stratigraphic thickness.`:'No accepted paired base is drawn for this top.'}</p><p class="micro">Preference: ${esc(p.preference)}${p.preference.includes('S')?' · suspect base':''}<br>Source: ${esc(p.source)}<br>Original unit: ${esc(p.sourceUnit)}<br>ASUD: ${number(p.asud)}<br>Pick GUID: ${esc(p.id)}<br>${esc(p.comment)}</p>`;
  };el.onclick=show;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show();}};});
 }
 $('openBoreholes').onclick=()=>open();
 window.coalBoreholes={getState:()=>({ready:true,...data.stats,selected:current?.id||null,sectionEnabled:$('sectionPicks').checked}),open};
 return {open,getSectionPicks:(a,b)=>$('sectionPicks').checked?sectionPicks(data,a,b):[],reset:()=>{$('sectionPicks').checked=false;$('pickWarning').hidden=true;},data};
}
