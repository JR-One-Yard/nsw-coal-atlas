// Calculations use registry records and whole-complex production, never inferred mine output.
export const UNKNOWN_OPERATOR = 'Not verified';
export const productLabel = r => r.tags.includes('thermal') && r.tags.includes('met') ? 'Mixed thermal + metallurgical' : r.tags.includes('met') ? 'Metallurgical' : r.tags.includes('thermal') ? 'Thermal' : 'Not classified';

export function filterRecords(industry, {query='', region='all', product='all', operator='all', destination='all'}={}) {
  const q=query.trim().toLowerCase();
  const linked=new Set(industry.routes.filter(r=>r.toId===destination).map(r=>r.fromId));
  return industry.records.filter(r => (region==='all'||r.region===region) &&
    (product==='all'||r.tags.includes(product)) && (operator==='all'||(r.operator??UNKNOWN_OPERATOR)===operator) &&
    (destination==='all'||linked.has(r.id)) && [r.name,r.registryName,r.operator,r.region].join(' ').toLowerCase().includes(q));
}

export function summarize(industry, records) {
  const ids=new Set(records.map(r=>r.id));
  const complexes=[...new Set(records.map(r=>r.complexId).filter(id=>industry.complexes[id]))]
    .map(id=>({id,...industry.complexes[id], selectedComponents:records.filter(r=>r.complexId===id).length}));
  const periods=[...new Set(complexes.map(c=>c.period))].map(period=>({period,
    saleableMt:complexes.filter(c=>c.period===period).reduce((s,c)=>s+c.saleableMt,0),
    count:complexes.filter(c=>c.period===period).length}));
  const operators=[...new Set(records.map(r=>r.operator??UNKNOWN_OPERATOR))].map(name=>({name,
    count:records.filter(r=>(r.operator??UNKNOWN_OPERATOR)===name).length})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
  const destinations=industry.destinations.map(d=>({...d, routes:industry.routes.filter(r=>r.toId===d.id&&ids.has(r.fromId))}))
    .map(d=>({...d, mineCount:new Set(d.routes.map(r=>r.fromId)).size}));
  const linked=new Set(industry.routes.filter(r=>ids.has(r.fromId)).map(r=>r.fromId));
  const products=['Thermal','Metallurgical','Mixed thermal + metallurgical','Not classified'].map(name=>({name,count:records.filter(r=>productLabel(r)===name).length}));
  return {count:records.length,operators,products,complexes,periods,destinations,
    productionRecords:records.filter(r=>industry.complexes[r.complexId]).length,
    linkedRecords:linked.size,unlinkedRecords:records.length-linked.size};
}

export function normalizeSelection(value, records) {
  const known=new Set(records.map(r=>r.id));
  return Array.isArray(value)?[...new Set(value)].filter(id=>typeof id==='string'&&known.has(id)).slice(0,4):[];
}

export function revenueScenario({volumeMt,priceUSDperT,usdPerAUD}) {
  if (![volumeMt,priceUSDperT,usdPerAUD].every(v=>typeof v==='number'&&Number.isFinite(v)) ||
      volumeMt<0 || volumeMt>1000 || priceUSDperT<0 || priceUSDperT>10000 || usdPerAUD<.01 || usdPerAUD>10)
    throw new RangeError('Enter volume 0–1,000 Mt, price 0–10,000 USD/t and FX 0.01–10 USD per AUD.');
  const revenueAUDm=volumeMt*priceUSDperT/usdPerAUD;
  return {revenueAUDm,priceStepAUDm:volumeMt*10/usdPerAUD,
    matrix:[.8,1,1.2].map(priceFactor=>({priceUSDperT:priceUSDperT*priceFactor,
      cells:[.9,1,1.1].map(fxFactor=>({usdPerAUD:usdPerAUD*fxFactor,revenueAUDm:volumeMt*priceUSDperT*priceFactor/(usdPerAUD*fxFactor)}))}))};
}

export function toCSV(rows) {
  const cell=value=>'"'+String(value??'').replace(/^(\s*)([=+@-])/,"$1'$2").replaceAll('"','""')+'"';
  return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n');
}

export function comparisonRows(industry, ids) {
  return [['Mine','Operator / group','Region','Coal use','Method','Ownership','Complex','Whole-complex saleable Mt','Production period','Production basis','Approved capacity','Capacity basis','Destinations','Inventory snapshot','Source URLs'],
    ...normalizeSelection(ids,industry.records).map(id=>{
      const r=industry.records.find(r=>r.id===id),c=industry.complexes[r.complexId];
      const links=industry.routes.filter(l=>l.fromId===id);
      const sources=[...new Set([...r.sources,...(c?[c.source]:[]),...(r.capacity?[r.capacity.source]:[]),...links.flatMap(l=>l.sources)])];
      return [r.name,r.operator??UNKNOWN_OPERATOR,r.region,productLabel(r),r.method??'Not recorded',r.ownership??'Not verified',c?.name??'Not available',c?.saleableMt??'Not available',c?.period??'',c?.basis??'',r.capacity?`${r.capacity.value} ${r.capacity.unit}`:'Not available',r.capacity?.basis??'',links.map(l=>`${industry.destinations.find(d=>d.id===l.toId)?.name??l.toId} — ${l.mode}`).join('; ')||'Not recorded',industry.date,sources.map(id=>industry.sources.find(s=>s.id===id)?.url).filter(Boolean).join(' | ')];
    })];
}
