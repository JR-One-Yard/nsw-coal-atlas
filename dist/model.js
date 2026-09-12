export const DEFAULTS = Object.freeze({met:true,thermal:true,unknown:true,opacity:35,exaggeration:12,slice:100,seam:'all',showMines:true,showRoutes:true,showBores:true,showLabels:true});
export const DURATION=150;
export function matchesTags(tags,state){return tags.some(tag=>state[tag]===true);}
export function visibleSeams(data,state){return data.seams.filter(s=>matchesTags(s.tags,state)&&(state.seam==='all'||s.id===state.seam));}
export function visibleMines(data,state){return data.mines.filter(m=>matchesTags(m.tags,state)&&(state.seam==='all'||m.seams.includes(state.seam)));}
export function visibleRoutes(data,state){const ids=new Set(visibleMines(data,state).map(m=>m.id));return data.routes.filter(r=>ids.has(r.fromId)&&matchesTags(r.tags,state));}
export function chapterAt(progress,count=5){return Math.min(count-1,Math.floor(Math.max(0,Math.min(1,progress))*count));}
export function formatTime(seconds){const v=Math.max(0,Math.floor(seconds));return `${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`;}
export function colourFor(tags){return tags.includes('met')&&tags.includes('thermal')?'#dfa4ef':tags.includes('met')?'#f7b967':tags.includes('thermal')?'#58d8de':'#9da8c7';}
export function geo(lon,lat,h=0){return [(lon-151.15)*111.32*Math.cos(-33.55*Math.PI/180),h/1000,(-33.55-lat)*111.32];}
export function stateFromControls(root){return {...DEFAULTS,showBores:root.getElementById('showBoreLogs')?.checked??true,...Object.fromEntries(['showMines','showLabels'].map(id=>[id,root.getElementById(id).checked])),...Object.fromEntries(['opacity','exaggeration'].map(id=>[id,+root.getElementById(id).value])),seam:root.getElementById('seamSelect').value};}
