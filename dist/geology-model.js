// Shared geometry queries. Heights are metres above sea level; x/z are kilometres.
import {geo} from './model.js';

export const TRANSECTS = [
  {id:'illawarra', name:'Illawarra · plateau to coast', a:[150.66,-34.30], b:[151.02,-34.30], labels:['Woronora Plateau','Coalcliff coast'], chapter:0},
  {id:'sydney', name:'Sydney · beneath the harbour', a:[150.78,-33.85], b:[151.34,-33.85], labels:['Western Sydney','Harbour / coast'], chapter:1},
  {id:'lake', name:'Lake Macquarie · three coal seams', a:[151.30,-33.08], b:[151.74,-33.08], labels:['Inland','Lake / coast'], chapter:2},
  {id:'hunter', name:'Hunter · regional coal measures', a:[150.80,-32.68], b:[151.40,-32.68], labels:['Western Hunter','Eastern Hunter'], chapter:4},
];

export function within(bounds, lon, lat) {
  return lon>=bounds[0]&&lon<=bounds[2]&&lat>=bounds[1]&&lat<=bounds[3];
}

export function terrainHeight(t, lon, lat) {
  if(!within(t.bounds,lon,lat)) return null;
  const [w,s,e,n]=t.bounds;
  const x=(lon-w)/(e-w)*(t.nx-1), y=(n-lat)/(n-s)*(t.ny-1);
  const i=Math.min(t.nx-2,Math.floor(x)), j=Math.min(t.ny-2,Math.floor(y));
  const u=x-i,v=y-j,h=t.elevations;
  return h[j*t.nx+i]*(1-u)*(1-v)+h[j*t.nx+i+1]*u*(1-v)+h[(j+1)*t.nx+i]*(1-u)*v+h[(j+1)*t.nx+i+1]*u*v;
}

// Use the actual indexed triangles, including gaps; never interpolate across a footprint edge.
export function meshHeight(mesh,x,z) {
  const p=mesh.positions, ix=mesh.indices;
  for(let k=0;k<ix.length;k+=3) {
    const a=ix[k]*3,b=ix[k+1]*3,c=ix[k+2]*3;
    if(x<Math.min(p[a],p[b],p[c])-1e-7||x>Math.max(p[a],p[b],p[c])+1e-7||z<Math.min(p[a+2],p[b+2],p[c+2])-1e-7||z>Math.max(p[a+2],p[b+2],p[c+2])+1e-7)continue;
    const d=(p[b+2]-p[c+2])*(p[a]-p[c])+(p[c]-p[b])*(p[a+2]-p[c+2]);
    if(Math.abs(d)<1e-12)continue;
    const u=((p[b+2]-p[c+2])*(x-p[c])+(p[c]-p[b])*(z-p[c+2]))/d;
    const v=((p[c+2]-p[a+2])*(x-p[c])+(p[a]-p[c])*(z-p[c+2]))/d;
    if(u>=-1e-6&&v>=-1e-6&&u+v<=1+1e-6)return (u*p[a+1]+v*p[b+1]+(1-u-v)*p[c+1])*1000;
  }
  return null;
}

export function sampleSection(data, terrain, localTerrain, a,b, count=181) {
  const pa=geo(...a),pb=geo(...b),length=Math.hypot(pb[0]-pa[0],pb[2]-pa[2]);
  return {a,b,length,samples:Array.from({length:count},(_,i)=>{
    const t=i/(count-1),lon=a[0]+t*(b[0]-a[0]),lat=a[1]+t*(b[1]-a[1]),p=geo(lon,lat);
    return {lon,lat,km:t*length,ground:Math.max(0,terrainHeight(localTerrain,lon,lat)??terrainHeight(terrain,lon,lat)??0),
      seams:Object.fromEntries(data.seams.map(s=>[s.id,meshHeight(s.mesh,p[0],p[2])]))};
  })};
}

export function mappedUnitAt(surface,index,lon,lat) {
  if(!within(surface.bounds,lon,lat))return null;
  const [w,s,e,n]=surface.bounds;
  const x=Math.min(surface.width-1,Math.floor((lon-w)/(e-w)*surface.width));
  const y=Math.min(surface.height-1,Math.floor((n-lat)/(n-s)*surface.height));
  return surface.units[index[y*surface.width+x]-1]??null;
}

export const STRATIGRAPHY = [
  {id:'wianamatta', name:'Wianamatta Group', age:'Triassic', lithology:'Predominantly shale, with sandstone', color:'#b8a8d1', note:'Younger cover preserved in parts of the basin. Its local subsurface thickness is not modelled.'},
  {id:'mittagong', name:'Mittagong Formation', age:'Triassic', lithology:'Sandstone and shale transition', color:'#b9c8ae', note:'Stratigraphic transition above the Hawkesbury Sandstone; not reconstructed as a separate 3D surface.'},
  {id:'hawkesbury', name:'Hawkesbury Sandstone', age:'Triassic', lithology:'Quartz-rich sandstone', color:'#e5c98e', note:'A major plateau-forming sandstone. Explore the mapped surface to see where it is exposed.'},
  {id:'narrabeen', name:'Narrabeen Group', age:'Triassic', lithology:'Sandstone, claystone and shale', color:'#cf9978', note:'Layered rocks between the Hawkesbury Sandstone and the coal measures; includes resistant sandstone and weaker claystone intervals.'},
  {id:'bulli', name:'Bulli Coal', age:'Late Permian', lithology:'Coal within the Illawarra Coal Measures', color:'#f7b967', note:'One of the major worked seams. The published regional thickness is commonly 2–3 m; this is not a measurement at your cursor.'},
  {id:'balgownie', name:'Balgownie Coal Member', age:'Late Permian', lithology:'Coal and intervening sedimentary rocks', color:'#e68e55', note:'Below Bulli in the southern sequence. Display spacing is illustrative.'},
  {id:'wongawilli', name:'Wongawilli Coal', age:'Late Permian', lithology:'Coal with mineral-rich interbands', color:'#ffe09e', note:'A coal-bearing interval rather than a uniform block of clean coal. The workable section is only part of the interval.'},
  {id:'lower', name:'Lower Illawarra Coal Measures', age:'Permian', lithology:'Additional coal units, sandstone and siltstone', color:'#92beb0', note:'Includes further coal units omitted from the three-seam display. The column is intentionally simplified.'},
  {id:'shoalhaven', name:'Shoalhaven Group', age:'Permian', lithology:'Older sedimentary succession', color:'#839daa', note:'Underlying regional rock succession; no subsurface surface is reconstructed here.'},
];

export const GEOLOGY_SOURCES = [
  {title:'GSNSW Seamless Geology · mapped rock units and fault traces',url:'https://www.resources.nsw.gov.au/geological-survey/projects/nsw-seamless-geology-project'},
  {title:'Australian Government · Southern Coalfield stratigraphy and coal',url:'https://www.bioregionalassessments.gov.au/assessments/12-resource-assessment-sydney-basin-bioregion/1211-coal'},
  {title:'Australian Government · stratigraphy and rock types',url:'https://www.bioregionalassessments.gov.au/assessments/11-context-statement-sydney-basin-bioregion/1132-stratigraphy-and-rock-type'},
  {title:'Australian Government · regional geological structure',url:'https://www.bioregionalassessments.gov.au/assessments/11-context-statement-sydney-basin-bioregion/1131-geological-structural-framework'},
];

// Use the published hierarchy, not an inferred correlation between similarly named rocks.
const STRATA_NAMES={wianamatta:'Wianamatta Group',mittagong:'Mittagong Formation',hawkesbury:'Hawkesbury Sandstone',narrabeen:'Narrabeen Group',bulli:'Bulli Coal',balgownie:'Balgownie Coal Member',wongawilli:'Wongawilli Coal',shoalhaven:'Shoalhaven Group'};
export function matchesStratigraphy(unit,id){
 const name=STRATA_NAMES[id];if(!name)return false;
 return [unit.unit_name,...(unit.all_stratigraphy||'').split('/')].some(value=>value?.trim()===name||value?.trim().startsWith(name+' - '));
}

// Intersections are with published surface traces only. They carry no fault-plane dip.
export function faultCrossings(surface,a,b){
 const A=geo(...a),B=geo(...b),dx=B[0]-A[0],dz=B[2]-A[2],length=Math.hypot(dx,dz),hits=[];
 if(length<1e-9)return hits;
 for(const f of surface.faults){
  const lines=f.geometry.type==='LineString'?[f.geometry.coordinates]:f.geometry.coordinates;
  for(const line of lines)for(let i=1;i<line.length;i++){
   const C=geo(...line[i-1]),D=geo(...line[i]),ex=D[0]-C[0],ez=D[2]-C[2],den=dx*ez-dz*ex;
   if(Math.abs(den)<1e-10)continue; // Parallel/collinear traces have no unique crossing.
   const cx=C[0]-A[0],cz=C[2]-A[2],t=(cx*ez-cz*ex)/den,u=(cx*dz-cz*dx)/den;
   if(t<0||t>1||u<0||u>1)continue;
   const lon=a[0]+t*(b[0]-a[0]),lat=a[1]+t*(b[1]-a[1]);if(!within(surface.bounds,lon,lat))continue;
   const km=t*length;
   if(hits.some(h=>h.id===f.id&&Math.abs(h.km-km)<1e-6))continue;
   hits.push({id:f.id,km,lon,lat,...f.properties});
  }
 }
 return hits.sort((a,b)=>a.km-b.km);
}
