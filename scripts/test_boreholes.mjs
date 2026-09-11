import fs from 'node:fs';import assert from 'node:assert/strict';
import {projectBorehole,sectionPicks,acceptedInterval} from '../dist/borehole-model.js';
const data=JSON.parse(fs.readFileSync('dist/data/borehole-picks.json')),checks=[];
function check(name,fn){fn();checks.push({name,passed:true});console.log('PASS',name);}
check('Regional ABSUC subset preserves all source records and original identifiers',()=>{
 assert.equal(data.bores.length,569);assert.equal(new Set(data.bores.map(b=>b.id)).size,569);
 const picks=data.bores.flatMap(b=>b.picks);assert.equal(picks.filter(p=>p.preferredTop).length,4955);assert.equal(picks.filter(p=>p.preferredBase).length,4479);assert.equal(new Set(picks.map(p=>p.id)).size,5105);
 assert(picks.every(p=>p.id&&p.unit&&p.source&&p.preference));
});
check('Known source pick preserves MD, AHD and drilling reference rather than treating MD as depth below ground',()=>{
 const b=data.bores.find(b=>b.name==='Cordeaux River 1'),p=b.picks.find(p=>p.unit==='Bulli Coal');
 assert.equal(b.datumName,'Kelly Bushing (KB)');assert.equal(b.datumAHD,327);assert.equal(p.topMD,92.5);assert.equal(p.topAHD,234.5);assert.equal(b.groundAHD,325);assert.notEqual(b.groundAHD-p.topAHD,p.topMD);
});
check('Suspect, missing and independently selected bases never become accepted interval ends',()=>{
 const p={preferredTop:true,preferredBase:true,preference:'TB',topMD:100,baseMD:103};assert(acceptedInterval(p));
 for(const change of [{preference:'TSB'},{baseMD:99},{baseMD:null},{preferredBase:false}])assert(!acceptedInterval({...p,...change}));
});
check('Section projection uses perpendicular distance, respects ends and excludes known horizontal holes',()=>{
 const a=[150.6,-34.3],b=[150.8,-34.3],bore={id:'test',lon:150.7,lat:-34.3,comment:'',picks:[{preferredTop:true,topAHD:100,unit:'Bulli Coal'}]},p=projectBorehole(bore,a,b);
 assert(Math.abs(p.t-.5)<1e-10);assert(p.offsetKm<1e-8);assert.equal(sectionPicks({bores:[bore]},a,b).length,1);
 for(const change of [{lat:-34.4},{lon:150.9},{comment:'horizontal'}])assert.equal(sectionPicks({bores:[{...bore,...change}]},a,b).length,0);
 assert.equal(projectBorehole(bore,a,a),null);
});
check('Real Illawarra section exposes reported coal evidence without altering the illustrative model',()=>{
 const picks=sectionPicks(data,[150.66,-34.30],[151.02,-34.30]);assert(picks.some(p=>p.bore.name==='Cordeaux River 1'&&p.seamId==='bulli'));assert(picks.every(p=>p.offsetKm<=1&&Number.isFinite(p.pick.topAHD)));
});
fs.writeFileSync('evidence/borehole-model-tests.json',JSON.stringify({date:new Date().toISOString(),checks},null,2));
