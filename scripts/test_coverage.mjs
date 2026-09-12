import fs from 'node:fs';
import assert from 'node:assert/strict';
import {depthQuality,markDirectionalFamilies} from '../dist/bore-quality.js';
import {terrainHeight} from '../dist/geology-model.js';
const read=f=>JSON.parse(fs.readFileSync(`dist/data/${f}.json`));
const atlas=read('atlas'),wide=read('terrain-wide'),old=read('terrain'),inventory=read('industry'),register=read('mine-geology');
const suspect=atlas.bores.find(b=>b.id==='COAL_004298');assert.equal(suspect.depth,9999);assert.equal(depthQuality(suspect).eligible,false);
const bores=markDirectionalFamilies(read('borehole-picks').bores);
for(const name of ['Dural South 1','East Maitland 1']){const b=bores.find(b=>b.name===name);assert(b.totalMD>3000);assert(depthQuality(b).eligible);assert.equal(depthQuality(b).status,'schematic-md');}
for(const name of ['Kay Park 6','Kay Park 6 Bulli Leg 3 ST3','Spring Farm 7'])assert.equal(depthQuality(bores.find(b=>b.name===name)).eligible,false);
for(const depth of [null,0,-3,NaN,Infinity])assert.equal(depthQuality({depth}).eligible,false);
assert.equal(register.records.length,35);
for(const mine of inventory.records){const h=terrainHeight(wide,mine.lon,mine.lat);assert(Number.isFinite(h)&&h>0,`${mine.name}: valid land elevation`);assert(register.records.find(r=>r.id===mine.id)?.sourceUrl.startsWith('https://'));}
for(let j=0;j<old.ny;j++)for(let i=0;i<old.nx;i++)assert.equal(wide.elevations[(j+288)*wide.nx+i+96],old.elevations[j*old.nx+i]);
const ledger=read('borehole-quality');ledger.absuc={rawCount:bores.length,depthBasis:'m MD, original per-record datum retained in borehole-picks.json',displayCounts:bores.reduce((a,b)=>(a[depthQuality(b).status]=(a[depthQuality(b).status]||0)+1,a),{}),withheld:bores.filter(b=>!depthQuality(b).eligible).map(b=>({id:b.id,name:b.name,totalMD:b.totalMD,datum:b.datumName,comment:b.comment,quality:depthQuality(b)}))};
// Audit artefact complements the Python raw-source inventory.
fs.writeFileSync('evidence/absuc-depth-quality.json',JSON.stringify(ledger.absuc,null,2)+'\n');
fs.writeFileSync('evidence/coverage-tests.json',JSON.stringify({checkedAt:new Date().toISOString(),mineTerrainCoverage:35,preservedTerrainSamples:old.nx*old.ny,suspectDepthWithheld:true,legitimateDeepRecordsRetained:true,directionalFamiliesWithheld:true,coverageRecords:35},null,2)+'\n');
console.log('PASS Depth quality, deep wells, branch families, all 35 terrain samples and exact corridor preservation');
