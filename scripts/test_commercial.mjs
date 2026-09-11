import fs from 'node:fs';
import assert from 'node:assert/strict';
import {filterRecords,summarize,normalizeSelection,revenueScenario,comparisonRows,toCSV} from '../dist/commercial-model.js';
const industry=JSON.parse(fs.readFileSync('dist/data/industry.json')),checks=[];
const check=(name,fn)=>{fn();checks.push({name,passed:true});console.log('PASS',name);};
const all=summarize(industry,industry.records);
check('Product buckets and operator groups account for every registry record exactly once',()=>{
 assert.equal(all.count,35);assert.equal(all.products.reduce((n,p)=>n+p.count,0),35);assert.equal(all.operators.reduce((n,o)=>n+o.count,0),35);
 assert.equal(all.operators.find(o=>o.name==='Not verified').count,2);
});
check('Production counts each complex once and keeps coverage explicit',()=>{
 assert.equal(all.complexes.length,3);assert.equal(all.productionRecords,5);assert(Math.abs(all.periods[0].saleableMt-40.944)<1e-10);
 const both=industry.records.filter(r=>r.complexId==='moolarben');assert.equal(both.length,2);
 assert.equal(summarize(industry,both).periods[0].saleableMt,19.1);
 assert.equal(summarize(industry,both.slice(0,1)).periods[0].saleableMt,19.1);
});
check('Different reporting periods are never silently combined',()=>{
 const changed=structuredClone(industry);changed.complexes.ulan.period='Calendar 2024';
 const result=summarize(changed,changed.records);assert.equal(result.periods.length,2);assert.equal(result.periods.find(p=>p.period==='Calendar 2024').saleableMt,10.044);
});
check('Missing production and empty filters remain missing rather than zero output',()=>{
 assert.equal(summarize(industry,[]).periods.length,0);assert.equal(summarize(industry,[industry.records.find(r=>r.id==='appin')]).complexes.length,0);
 assert.equal(filterRecords(industry,{query:'NO SUCH MINE'}).length,0);
});
check('Operator, product, region and query filters intersect without losing unverified operators',()=>{
 const result=filterRecords(industry,{operator:'Yancoal',region:'Hunter',product:'met',query:'ashton'});assert.deepEqual(result.map(r=>r.id),['ashton']);
 assert.equal(filterRecords(industry,{operator:'Not verified'}).length,2);
});
check('Destination filtering uses actual recorded relationships and distinct mine counts',()=>{
 assert.deepEqual(filterRecords(industry,{destination:'eraring'}).map(r=>r.id).sort(),['mandalong','myuna']);
 assert.equal(all.destinations.find(d=>d.id==='eraring').mineCount,2);assert.equal(all.linkedRecords+all.unlinkedRecords,35);
 const copy=structuredClone(industry);copy.routes.push(copy.routes[0]);assert.equal(summarize(copy,copy.records).destinations.find(d=>d.id===copy.routes[0].toId).mineCount,all.destinations.find(d=>d.id===copy.routes[0].toId).mineCount);
});
check('Shortlists discard malformed, stale and duplicate IDs and are capped at four',()=>{
 assert.deepEqual(normalizeSelection(null,industry.records),[]);assert.deepEqual(normalizeSelection({id:'appin'},industry.records),[]);
 assert.deepEqual(normalizeSelection(['appin','appin','nonexistent',3,'myuna'],industry.records),['appin','myuna']);
 assert.equal(normalizeSelection(industry.records.map(r=>r.id),industry.records).length,4);
});
check('Revenue units and FX direction agree with hand-calculated amounts',()=>{
 const result=revenueScenario({volumeMt:2,priceUSDperT:100,usdPerAUD:.5});assert.equal(result.revenueAUDm,400);assert.equal(result.priceStepAUDm,40);
 assert.equal(result.matrix[1].cells[1].revenueAUDm,400);assert(result.matrix[1].cells[2].revenueAUDm<400);
});
check('Zero volume and zero price are valid while malformed scenarios fail',()=>{
 assert.equal(revenueScenario({volumeMt:0,priceUSDperT:100,usdPerAUD:.65}).revenueAUDm,0);
 assert.equal(revenueScenario({volumeMt:1,priceUSDperT:0,usdPerAUD:.65}).revenueAUDm,0);
 for(const change of [{volumeMt:-1},{volumeMt:Infinity},{priceUSDperT:NaN},{usdPerAUD:0},{usdPerAUD:''},{volumeMt:1001}])assert.throws(()=>revenueScenario({volumeMt:1,priceUSDperT:100,usdPerAUD:.65,...change}),RangeError);
});
check('Comparison preserves complex basis, periods, missing values and primary source links',()=>{
 const rows=comparisonRows(industry,['moolarben-open-cut-mine','moolarben-underground-mine','appin']);assert.equal(rows.length,4);
 assert.equal(rows[1][7],19.1);assert.equal(rows[2][7],19.1);assert.equal(rows[3][7],'Not available');
 assert(rows[1][9].includes('combined'));assert(rows[1].at(-1).includes('Yancoal-P4-Report-2025.pdf'));
 const capacity=comparisonRows(industry,['narrabri-underground-mine'])[1];assert.equal(capacity[7],'Not available');assert(capacity[11].includes('not actual'));
});
check('CSV quotes separators and neutralizes formula prefixes including leading whitespace',()=>{
 const text=toCSV([['=1+1','  +SUM(A1)','a,"b"','line\nbreak']]);assert(text.includes('"\'=1+1"'));assert(text.includes('"  \'+SUM(A1)"'));assert(text.includes('"a,""b"""'));assert(text.includes('"line\nbreak"'));
});
check('Every production profile has a finite nonnegative value and resolvable source',()=>{
 for(const c of Object.values(industry.complexes)){assert(Number.isFinite(c.saleableMt)&&c.saleableMt>=0);assert(c.period&&c.basis);assert(industry.sources.some(s=>s.id===c.source&&s.url.startsWith('https://')));}
});
fs.writeFileSync('evidence/commercial-model-tests.json',JSON.stringify({date:new Date().toISOString(),checks},null,2));
