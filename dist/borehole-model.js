import {depthQuality,markDirectionalFamilies} from './bore-quality.js';
import {geo} from './model.js';
export const PICK_SEAMS={'Bulli Coal':'bulli','Balgownie Coal':'balgownie','Balgownie Coal Member':'balgownie','Wongawilli Coal':'wongawilli','Wallarah Coal':'wallarah','Great Northern Coal':'greatnorthern','Fassifern Coal':'fassifern'};
export function projectBorehole(bore,a,b){
 const A=geo(...a),B=geo(...b),P=geo(bore.lon,bore.lat),dx=B[0]-A[0],dz=B[2]-A[2],length=Math.hypot(dx,dz);
 if(!length)return null;
 const t=((P[0]-A[0])*dx+(P[2]-A[2])*dz)/(length*length);
 return {km:t*length,offsetKm:Math.abs(dx*(A[2]-P[2])-(A[0]-P[0])*dz)/length,t};
}
export function sectionPicks(dataset,a,b,widthKm=1){
 return markDirectionalFamilies(dataset.bores).flatMap(bore=>{
  const p=projectBorehole(bore,a,b);
  if(!p||p.t<0||p.t>1||p.offsetKm>widthKm||depthQuality(bore).status==='directional')return [];
  return bore.picks.filter(p=>p.preferredTop&&Number.isFinite(p.topAHD)&&PICK_SEAMS[p.unit]).map(pick=>({...p,bore,pick,seamId:PICK_SEAMS[pick.unit]}));
 });
}
export function acceptedInterval(pick){
 return pick.preferredTop&&pick.preferredBase&&pick.preference==='TB'&&Number.isFinite(pick.topMD)&&Number.isFinite(pick.baseMD)&&pick.baseMD>pick.topMD;
}
