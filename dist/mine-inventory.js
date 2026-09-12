import {terrainHeight} from './geology-model.js';

// Shared by browser initialization and the downloadable atlas builder.
export function mergeMineInventory(data, inventory, terrain, geo) {
 for(const source of inventory.sources)if(!data.sources.some(s=>s.id===source.id))data.sources.push(source);
 for(const record of inventory.records){
  const existing=data.mines.find(m=>m.id===record.id),height=terrainHeight(terrain,record.lon,record.lat),coverage=height===null?'Outside the terrain and underground model coverage. Marker shows registry coordinates only; elevation is not modelled.':'Registry location on sampled terrain; no mine workings are modelled.';
  if(height===null)throw new Error(`Missing terrain for ${record.name}`);
  if(existing){existing.position=geo(record.lon,record.lat,Math.max(0,height));existing.coverage=coverage;continue;}
  data.mines.push({...record,kind:'mine',position:geo(record.lon,record.lat,Math.max(0,height??0)),confidence:'GSNSW point location',status:record.registryStatus,coverage,description:record.description||`${record.name} is a ${record.method?.toLowerCase()||'coal'} operation in the ${record.region} coalfield.`});
 }
 return data;
}
