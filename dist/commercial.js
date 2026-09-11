import {summarize,normalizeSelection,revenueScenario,comparisonRows,toCSV,UNKNOWN_OPERATOR,productLabel} from './commercial-model.js';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>new Intl.NumberFormat('en-AU',{maximumFractionDigits:3}).format(n);
const key='nsw-coal-atlas:commercial-shortlist:v1';
const download=(name,rows)=>{
  const url=URL.createObjectURL(new Blob([toCSV(rows)],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};

export function initCommercial({industry,refresh,setFilter}) {
  let ids=[],active='overview',filtered=industry.records;
  try {ids=normalizeSelection(JSON.parse(localStorage.getItem(key)),industry.records);} catch {}
  const sourceLink=id=>{const s=industry.sources.find(s=>s.id===id);return s?`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a>`:'Source not recorded';};
  $('industryPanel').querySelector('.industry-filters').insertAdjacentHTML('afterend',`
    <section class="commercial" aria-label="Commercial insights">
      <div class="commercial-title"><div><span class="eyebrow">MARKET STRUCTURE · ASSET COMPARISON · SCENARIOS</span><h3>The commercial picture</h3></div><div class="commercial-actions"><span class="commercial-snapshot">Registry snapshot · ${esc(industry.date)}</span><button id="browseCommercialMines">Browse operations ↓</button></div></div>
      <div id="commercialStats" class="commercial-stats" aria-live="polite"></div>
      <div class="commercial-tabs" role="tablist" aria-label="Commercial views">
        <button id="commercialTab-overview" role="tab" aria-controls="commercial-overview" aria-selected="true">Market overview</button>
        <button id="commercialTab-compare" role="tab" aria-controls="commercial-compare" aria-selected="false" tabindex="-1">Compare <span id="compareCount">0</span></button>
        <button id="commercialTab-scenario" role="tab" aria-controls="commercial-scenario" aria-selected="false" tabindex="-1">Revenue lab</button>
      </div>
      <div id="commercial-overview" role="tabpanel" aria-labelledby="commercialTab-overview"></div>
      <div id="commercial-compare" role="tabpanel" aria-labelledby="commercialTab-compare" hidden></div>
      <div id="commercial-scenario" role="tabpanel" aria-labelledby="commercialTab-scenario" hidden>
        <div class="commercial-panel-heading"><div><h4>What changes the revenue picture?</h4><p>Test saleable volume, realised price and currency assumptions. Gross revenue before costs, royalties, taxes and hedging.</p></div><span class="scenario-badge">ILLUSTRATIVE SCENARIO</span></div>
        <div class="scenario-layout"><form id="scenarioInputs" novalidate>
          <label>Starting volume<select id="scenarioPreset"><option value="manual">Manual assumption</option>${Object.entries(industry.complexes).map(([id,c])=>`<option value="${esc(id)}">${esc(c.name)} · ${esc(c.period)}</option>`).join('')}</select></label>
          <label>Saleable volume · million tonnes<input id="scenarioVolume" type="number" min="0" max="1000" step="0.001" value="1" required></label>
          <label>Realised price · USD / tonne<input id="scenarioPrice" type="number" min="0" max="10000" step="1" value="100" required></label>
          <label>Exchange rate · USD per AUD<input id="scenarioFX" type="number" min="0.01" max="10" step="0.01" value="0.65" required></label>
          <p class="commercial-note">Price and FX defaults are teaching assumptions, not current market quotes. Reported production is a volume reference, not evidence of realised sales.</p>
          <p id="scenarioSource" class="commercial-note"></p><button id="exportScenario" type="button">Export scenario CSV</button>
        </form><div id="scenarioResult" aria-live="polite"></div></div>
      </div>
      <p id="commercialMessage" class="commercial-note" role="status"></p>
    </section>`);

  $('industryCount').insertAdjacentHTML('afterend','<button id="jumpToComparison" class="comparison-jump">Open comparison ↑</button>');
  $('browseCommercialMines').onclick=()=>{$('industryCount').scrollIntoView({block:'start'});};
  $('jumpToComparison').onclick=()=>{tab('compare');$('commercialTab-compare').scrollIntoView({block:'start'});$('commercialTab-compare').focus();};
  function tab(name,focus=false) {
    active=name;
    for(const id of ['overview','compare','scenario']) {
      $(`commercial-${id}`).hidden=id!==name;
      const button=$(`commercialTab-${id}`);button.setAttribute('aria-selected',String(id===name));button.tabIndex=id===name?0:-1;
    }
    if(focus)$(`commercialTab-${name}`).focus();
  }
  const tabs=['overview','compare','scenario'];
  for(const name of tabs) {
    $(`commercialTab-${name}`).onclick=()=>tab(name);
    $(`commercialTab-${name}`).onkeydown=e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();
      const next=e.key==='Home'?0:e.key==='End'?2:(tabs.indexOf(name)+(e.key==='ArrowRight'?1:2))%3;tab(tabs[next],true);
    };
  }
  function persist(){try{localStorage.setItem(key,JSON.stringify(ids));}catch{$('commercialMessage').textContent='Comparison works for this visit; browser storage is unavailable.';}}
  function toggle(id){
    if(ids.includes(id))ids=ids.filter(x=>x!==id);
    else if(ids.length<4&&industry.records.some(r=>r.id===id))ids.push(id);
    else {$('commercialMessage').textContent='Compare up to four operations. Remove one to add another.';refresh();return;}
    $('commercialMessage').textContent=`${ids.length} operations in your comparison. Selections remain when filters change.`;
    persist();refresh();
    document.querySelector(`[data-compare="${id}"]`)?.focus();
  }
  function comparison(){
    $('compareCount').textContent=ids.length;
    $('jumpToComparison').textContent=`Open comparison (${ids.length}/4) ↑`;
    const rows=comparisonRows(industry,ids),selected=ids.map(id=>industry.records.find(r=>r.id===id));
    const headings=['Operator / group','Region','Coal use','Method','Ownership','Complex','Whole-complex saleable Mt','Production period','Production basis','Approved capacity','Capacity basis','Destinations'];
    $('commercial-compare').innerHTML=`<div class="commercial-panel-heading"><div><h4>Your asset shortlist</h4><p>Select up to four operations in the inventory below. Your selection stays on this browser.</p></div><div><button id="exportComparison" ${ids.length?'':'disabled'}>Export comparison CSV</button> <button id="clearComparison" ${ids.length?'':'disabled'}>Clear</button></div></div>`+
      (ids.length?`<div class="comparison-scroll"><table class="comparison-table"><caption>Side-by-side operation profiles · snapshot ${esc(industry.date)}</caption><thead><tr><th scope="col">Commercial attribute</th>${selected.map(r=>`<th scope="col">${esc(r.name)}<button data-remove="${r.id}" aria-label="Remove ${esc(r.name)} from comparison">Remove</button></th>`).join('')}</tr></thead><tbody>${headings.map((h,i)=>`<tr><th scope="row">${h}</th>${rows.slice(1).map(row=>`<td>${esc(row[i+1])||'—'}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">Sources</th>${selected.map(r=>`<td>${[...new Set([...r.sources,...(industry.complexes[r.complexId]?[industry.complexes[r.complexId].source]:[])])].map(sourceLink).join('<br>')}</td>`).join('')}</tr></tbody></table></div><p class="commercial-note">Production is the whole complex total, repeated for context when component mines share a complex. It must not be added across those columns. Approved capacity is shown separately from actual output.</p>`:
      '<div class="commercial-empty">Build a comparison with the checkboxes beside mine names below. Try the two Moolarben operations to see their shared complex production.</div>');
    $('exportComparison').onclick=()=>download('NSW-coal-comparison.csv',comparisonRows(industry,ids));
    $('clearComparison').onclick=()=>{ids=[];persist();refresh();};
    $('commercial-compare').querySelectorAll('[data-remove]').forEach(el=>el.onclick=()=>{toggle(el.dataset.remove);$('commercialTab-compare').focus();});
  }
  function render(records) {
    filtered=records;const s=summarize(industry,records),known=s.operators.filter(o=>o.name!==UNKNOWN_OPERATOR).length;
    const production=s.periods.length===1?`${fmt(s.periods[0].saleableMt)} <small>Mt</small>`:s.periods.length?'By period':'—';
    $('commercialStats').innerHTML=[
      [s.count,'Selected mine records',`of ${industry.records.length} in the inventory`],
      [known,'Operator / group labels',`${s.operators.find(o=>o.name===UNKNOWN_OPERATOR)?.count??0} records unverified`],
      [production,'Reported complex production',`${s.complexes.length} complexes · ${s.periods.length===1?esc(s.periods[0].period):'by period'} · ${s.productionRecords}/${s.count} records represented`],
      [s.linkedRecords,'Records with destination links',`${s.unlinkedRecords} have no link recorded`]
    ].map(([value,label,note])=>`<div class="commercial-stat"><strong>${value}</strong><span>${label}</span><small>${note}</small></div>`).join('');
    $('commercial-overview').innerHTML=`<p class="commercial-note">Counts describe the selected registry records, not market share. Production covers only the linked complexes, counted once each in full; it is not a NSW total or an allocation to selected component mines.</p><div class="commercial-grid">
      <article class="commercial-card"><h4>Who operates these assets?</h4><p>Choose a group to filter the inventory.</p><div class="operator-bars">${s.operators.length?s.operators.map(o=>`<button data-operator="${esc(o.name)}"><span>${esc(o.name)}</span><span class="bar-track"><i style="width:${o.count/Math.max(...s.operators.map(x=>x.count))*100}%"></i></span><strong>${o.count}</strong></button>`).join(''):'<p>No matching operations.</p>'}</div><p class="commercial-note">Operator/group associations, not equity ownership.</p></article>
      <article class="commercial-card"><h4>Products & destinations</h4><div class="product-summary">${s.products.map(p=>`<span>${p.name}<strong>${p.count}</strong></span>`).join('')}</div><div class="destination-list">${s.destinations.map(d=>`<button data-destination="${esc(d.id)}" ${d.mineCount?'':'disabled'}><span>${esc(d.name)}</span><strong>${d.mineCount} linked</strong></button>`).join('')}</div><p class="commercial-note">Known schematic relationships only; links are not customer revenue or transport capacity. The regional Hunter export connection is illustrative.</p></article>
      <article class="commercial-card commercial-production"><h4>Production behind the numbers</h4>${s.periods.map(p=>`<p><strong>${fmt(p.saleableMt)} Mt</strong> · ${esc(p.period)} · ${p.count} represented complexes</p>`).join('')}${s.complexes.length?`<div class="commercial-production-grid">${s.complexes.map(c=>`<div><h5>${esc(c.name)}</h5><strong>${fmt(c.saleableMt)} Mt saleable</strong><p>${esc(c.period)} · ${esc(c.basis)}</p><p>${c.romMt==null?'ROM not populated':`${fmt(c.romMt)} Mt ROM · ${fmt(c.saleableMt/c.romMt*100)}% saleable / ROM ratio`}</p>${sourceLink(c.source)}</div>`).join('')}</div>`:'<p>No comparable production is populated for this selection.</p>'}</article></div>`;
    $('commercial-overview').querySelectorAll('[data-operator]').forEach(el=>el.onclick=()=>setFilter('mineOperator',el.dataset.operator));
    $('commercial-overview').querySelectorAll('[data-destination]').forEach(el=>el.onclick=()=>setFilter('mineDestination',el.dataset.destination));
    comparison();tab(active);
  }
  function scenarioInputs(){return {volumeMt:$('scenarioVolume').valueAsNumber,priceUSDperT:$('scenarioPrice').valueAsNumber,usdPerAUD:$('scenarioFX').valueAsNumber};}
  function scenario(){
    const c=industry.complexes[$('scenarioPreset').value];
    $('scenarioSource').innerHTML=c?`Volume loaded from ${esc(c.name)}, ${esc(c.period)}, ${esc(c.basis)}. ${sourceLink(c.source)}`:'Manual volume assumption. No operation or reporting period is implied.';
    try {
      const inputs=scenarioInputs(),result=revenueScenario(inputs);$('exportScenario').disabled=false;
      for(const id of ['scenarioVolume','scenarioPrice','scenarioFX'])$(id).removeAttribute('aria-invalid');
      $('scenarioResult').innerHTML=`<div class="scenario-answer"><span>Illustrative gross revenue</span><strong>A$${fmt(result.revenueAUDm)}m</strong><p>${fmt(inputs.volumeMt)} Mt × US$${fmt(inputs.priceUSDperT)}/t ÷ ${fmt(inputs.usdPerAUD)} USD per AUD</p><p>A US$10/t price increase adds <b>A$${fmt(result.priceStepAUDm)}m</b> at this volume and FX.</p></div><div class="comparison-scroll"><table class="sensitivity-table"><caption>Price / FX sensitivity · gross revenue in A$ million · volume held constant</caption><thead><tr><th scope="col">USD / tonne</th>${[.9,1,1.1].map(f=>`<th scope="col">${fmt(inputs.usdPerAUD*f)} USD/AUD</th>`).join('')}</tr></thead><tbody>${result.matrix.map((r,i)=>`<tr><th scope="row">${fmt(r.priceUSDperT)}</th>${r.cells.map((c,j)=>`<td class="${i===1&&j===1?'scenario-base':''}">${fmt(c.revenueAUDm)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="commercial-note">Rows vary price ±20%; columns vary FX ±10%. This is sensitivity analysis, not a forecast or profit estimate.</p>`;
    } catch(e) {
      $('scenarioResult').innerHTML=`<p class="commercial-error" role="alert">${esc(e.message)}</p>`;$('exportScenario').disabled=true;
      for(const id of ['scenarioVolume','scenarioPrice','scenarioFX'])$(id).setAttribute('aria-invalid',String(!$(id).validity.valid));
    }
  }
  $('scenarioInputs').onsubmit=e=>e.preventDefault();
  for(const id of ['scenarioVolume','scenarioPrice','scenarioFX'])$(id).oninput=()=>{if(id==='scenarioVolume')$('scenarioPreset').value='manual';scenario();};
  $('scenarioPreset').onchange=()=>{const c=industry.complexes[$('scenarioPreset').value];if(c)$('scenarioVolume').value=c.saleableMt;scenario();};
  $('exportScenario').onclick=()=>{
    const inputs=scenarioInputs();let result;try{result=revenueScenario(inputs);}catch{return;}
    const c=industry.complexes[$('scenarioPreset').value];
    download('NSW-coal-revenue-scenario.csv',[['Scenario','Illustrative gross revenue; not profit or forecast'],['Volume Mt',inputs.volumeMt],['Assumed price USD per tonne',inputs.priceUSDperT],['Assumed FX USD per AUD',inputs.usdPerAUD],['Gross revenue AUD million',result.revenueAUDm],['Volume reference',c?.name??'Manual'],['Reference period',c?.period??'Not specified'],['Volume basis',c?.basis??'User assumption'],['Source URL',c?industry.sources.find(s=>s.id===c.source)?.url:''],['Excluded','Costs, royalties, taxes, hedging, product mix and differences between production and sales'],[],['Price USD per tonne','FX USD per AUD','Gross revenue AUD million'],...result.matrix.flatMap(r=>r.cells.map(c=>[r.priceUSDperT,c.usdPerAUD,c.revenueAUDm]))]);
  };
  scenario();render(filtered);
  window.coalCommercial={getState:()=>({selected:[...ids],tab:active,summary:summarize(industry,filtered)})};
  return {render,toggle,has:id=>ids.includes(id)};
}
