// Raw values remain downloadable. No maximum-depth cap is applied.
export const DIRECTIONAL=/horizontal|deviated|directional|inclined|\b(?:leg|branch|sidetrack|inseam|lateral)\b|\bST\s*\d+/i;
export function depthQuality(b){
 const depth=b.totalMD??b.depth;
 if(b.id==='COAL_004298'||depth===9999||b.quality?.status==='suspect')return {eligible:false,status:'suspect',reason:'Reported 9,999 m is unverified. Trace withheld pending original-report validation; no replacement depth assigned.'};
 if(b.directionalFamily||DIRECTIONAL.test(`${b.name||''} ${b.comment||''}`))return {eligible:false,status:'directional',reason:'Directional or branched drilling indicated. No surveyed trajectory is supplied; vertical trace withheld.'};
 if(!Number.isFinite(depth)||depth<=0)return {eligible:false,status:'missing',reason:'No finite positive reported total depth.'};
 return {eligible:true,status:'schematic-md',reason:'Schematic drilling distance from displayed terrain. Trajectory and drilling datum are not verified; this is not measured vertical penetration.'};
}
export function markDirectionalFamilies(bores){
 const roots=bores.filter(b=>DIRECTIONAL.test(b.name)).map(b=>b.name.split(/\s+(?:Bulli\s+)?(?:leg|branch|ST\d|sidetrack|inseam|lateral)/i)[0].trim().toLowerCase());
 for(const b of bores)b.directionalFamily=roots.includes((b.name||'').trim().toLowerCase());
 return bores;
}
