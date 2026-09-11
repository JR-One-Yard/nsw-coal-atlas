const $=id=>document.getElementById(id);
let returnFocus=null;
export function closePanels(restore=true){
  for(const id of ['controls','details'])$(id).hidden=true;
  $('toggleControls').setAttribute('aria-expanded','false');
  syncPanelAccess();
  if(restore&&returnFocus?.isConnected&&!returnFocus.closest('[hidden]'))returnFocus.focus();
}
export function openPanel(id){
  const trigger=document.activeElement;
  if(!trigger?.closest('#controls,#details'))returnFocus=trigger;
  closePanels(false);$(id).hidden=false;$(id).scrollTop=0;
  $('toggleControls').setAttribute('aria-expanded',String(id==='controls'));
  syncPanelAccess();
  // Keep keyboard position when refreshing content inside the same panel.
  if(!trigger?.closest('#'+id))$(id).querySelector('button')?.focus({preventScroll:true});
}
export function showPage(name){
  closePanels(false);
  $('mapPage').hidden=name!=='map';$('aboutPage').hidden=name!=='about';
  if($('industryPanel'))$('industryPanel').hidden=name!=='mines';
  document.body.classList.toggle('industry-open',name==='mines');
  for(const [id,page]of [['mapTab','map'],['industryToggle','mines'],['sources','about']]){
    if(page===name)$(id).setAttribute('aria-current','page');else $(id).removeAttribute('aria-current');
  }
  if(name==='about')$('aboutTitle').focus();
}
const compact=matchMedia('(max-width:760px)');
function syncPanelAccess(){
  $('stage').inert=compact.matches&&(!$('controls').hidden||!$('details').hidden);
}
compact.addEventListener('change',syncPanelAccess);
