import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire('/Users/jamesroberts/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-webgl','--ignore-gpu-blocklist']});
const checks=[],errors=[],badResponses=[];let failure=null;
const page=await browser.newPage({viewport:{width:1440,height:960},acceptDownloads:true});
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)badResponses.push({url:r.url(),status:r.status()});});
const check=async(name,fn)=>{await fn();checks.push({name,passed:true});console.log('PASS',name);};
const visible=id=>page.locator('#'+id).isVisible();
const state=()=>page.evaluate(()=>coalAtlas.getState());
const geo=()=>page.evaluate(()=>coalGeology.getState());
const range=async(id,value)=>page.locator('#'+id).fill(String(value));
const shot=async(name)=>{await page.waitForTimeout(350);await page.screenshot({path:`evidence/simple-${name}.png`});};
const layers=async()=>{if(!await visible('controls'))await page.locator('#toggleControls').click();};
const noOverflow=()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
try{
 await page.goto(process.env.ATLAS_URL||'http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForSelector('body[data-ready=true]');await page.waitForTimeout(1700);
 await check('Map opens with no modal or sidebar and only seven interactive controls',async()=>{
  assert.equal(await page.locator('#regionSelect').inputValue(),'all');assert((await state()).boreVisible);assert.equal((await geo()).boreDepthTraces,431);assert.equal((await state()).projectedMines.length,35);assert(!await visible('controls'));assert(!await visible('details'));assert(!await visible('sectionPanel'));assert.equal(await page.locator('dialog').count(),0);
  assert.equal(await page.locator('button:visible,select:visible,input:visible').count(),7);assert((await state()).triangles>100000);assert.equal((await state()).renderedSeams.length,8);assert((await state()).renderedRoutes.length>0);assert(await noOverflow());
 });await shot('desktop');
 await check('Every region and the whole-basin view are reachable from one picker',async()=>{
  for(let i=0;i<5;i++){await page.locator('#regionSelect').selectOption(String(i));assert.equal((await state()).chapter,i);assert(!await visible('details'));}
  await page.locator('#regionSelect').selectOption('all');await page.locator('#regionInfo').click();assert((await page.locator('#detailBody').innerText()).includes('five coalfield'));await page.keyboard.press('Escape');
  await page.locator('#regionSelect').selectOption('1');await page.locator('#regionInfo').click();assert((await page.locator('#detailBody').innerText()).includes('880'));await page.keyboard.press('Escape');
  await page.locator('#regionSelect').selectOption('0');
 });
 await check('Layer controls change rendered geometry and reset restores defaults',async()=>{
  await layers();assert.equal(await page.locator('#toggleControls').getAttribute('aria-expanded'),'true');await range('opacity',0);assert.equal((await state()).groundOpacity,0);await range('exaggeration',20);assert.equal((await state()).state.exaggeration,20);
  await page.locator('#seamSelect').selectOption('wongawilli');assert.deepEqual((await state()).renderedSeams,['wongawilli']);await page.locator('#showMines').uncheck();assert.equal((await state()).renderedMines.length,0);assert.equal((await state()).renderedRoutes.length,0);
  await page.locator('#mappedFaults').check();assert((await geo()).faults);await page.locator('#reset').click();assert.equal((await state()).state.exaggeration,12);assert.equal((await state()).renderedSeams.length,8);assert(!await visible('controls'));assert((await state()).renderedRoutes.length>0);assert((await state()).boreVisible);assert.equal((await geo()).boreDepthTraces,431);assert.equal(await page.locator('#regionSelect').inputValue(),'all');
 });
 await check('Finding a feature replaces layers with details and connections are already visible',async()=>{
  await layers();await page.locator('#featureSelect').selectOption('myuna');assert(!await visible('controls'));assert(await visible('details'));assert((await page.locator('#detailBody').innerText()).includes('Eraring'));
  assert((await state()).renderedRoutes.includes('myuna-eraring'));assert.equal(await page.locator('#showConnection').count(),0);await page.keyboard.press('Escape');
 });
 await check('Rock sequence selects a seam and highlights sourced surface exposures',async()=>{
  await page.locator('#regionSelect').selectOption('0');await layers();await page.locator('#openStrata').click();assert(await visible('strataPanel'));assert(!await visible('controls'));
  await page.locator('[data-unit="hawkesbury"]').click();assert((await geo()).surfaceFocus.count>0);await page.locator('[data-unit="bulli"]').click();assert.equal((await geo()).surfaceFocus,null);await shot('rocks');
  await page.locator('#regionSelect').selectOption('2');assert(!await visible('details'));await page.locator('#regionSelect').selectOption('0');
 });
 await check('Surface inspection has a visible exit and returns published unit evidence',async()=>{
  await layers();await page.locator('#inspectSurface').click();assert(await visible('inspectHint'));assert(!await visible('controls'));await page.waitForTimeout(1800);
  const box=await page.locator('#viewport').boundingBox();
  for(const [x,y]of [[.5,.55],[.45,.6],[.6,.5],[.4,.5]]){
   await page.mouse.click(box.x+box.width*x,box.y+box.height*y);
   if((await page.locator('#detailBody').innerText()).includes('PUBLISHED GEOLOGICAL MAPPING'))break;
  }
  assert((await page.locator('#detailBody').innerText()).includes('GSNSW'));await page.locator('#closeDetails').click();await page.locator('#stopInspect').click();assert(!(await geo()).inspect);
 });
 await check('Cross-section opens independently, supports presets and selects the same 3D seam',async()=>{
  await page.locator('#openSection').click();assert(await visible('sectionPanel'));assert(!await visible('details'));assert.equal(await page.locator('#openSection').getAttribute('aria-expanded'),'true');
  for(let i=0;i<4;i++){await page.locator('#transect').selectOption(String(i));assert((await geo()).sectionLength>0);}
  await page.locator('#transect').selectOption('0');assert(await page.locator('#sectionSvg').evaluate(svg=>[...svg.querySelectorAll('text')].every(t=>{const b=t.getBBox();return b.x>=0&&b.x+b.width<=1000;})),'Axis labels, including negative signs, must fit the exported figure');await page.locator('#sectionSvg [data-seam="wongawilli"]').focus();await page.keyboard.press('Enter');assert.equal((await state()).selected,'wongawilli');assert(await visible('strataPanel'));await page.locator('#closeDetails').click();await shot('section');
 });
 await check('Cross-section validates coordinates, retains source picks and exports attributed SVG',async()=>{
  await page.locator('#sectionOptions summary').first().click();await page.locator('#sectionCoordinates summary').click();await page.locator('#aLon').fill('0');await page.locator('#applySection').click();assert((await page.locator('#sectionMessage').innerText()).includes('distinct points'));await page.locator('#transect').selectOption('0');
  await page.locator('#sectionPicks').check();assert(await page.locator('#sectionSvg [data-pick]').count()>0);assert((await page.locator('#pickWarning').innerText()).includes('not deviation-corrected'));
  await page.locator('#sectionScale').click();assert((await page.locator('#sectionSvg').textContent()).includes('True scale 1:1'));
  const promise=page.waitForEvent('download');await page.locator('#exportSection').click();const download=await promise;const text=fs.readFileSync(await download.path(),'utf8');assert(text.includes('geometry illustrative')&&text.includes('bioregionalassessments.gov.au'));
  await page.locator('#sectionSvg [data-pick]').first().focus();await page.keyboard.press('Enter');assert(await visible('boreProfile'));await page.locator('#closeDetails').click();await page.locator('#closeSection').click();assert.equal(await page.locator('#openSection').getAttribute('aria-expanded'),'false');
 });
 await check('Borehole search, source references, log picks and empty results function',async()=>{
  await layers();await page.locator('#openBoreholes').click();await page.locator('#boreSearch').fill('Cordeaux River 1');assert.equal(await page.locator('#boreSelect option').count(),1);assert((await page.locator('#boreProfile').innerText()).includes('Kelly Bushing'));
  await page.locator('.bore-table button').filter({hasText:/^Bulli Coal$/}).click();assert((await page.locator('#pickDetail').innerText()).includes('92.5–94.5'));assert((await page.locator('#pickDetail').innerText()).includes('GSNSW_2021'));await shot('borehole');
  await page.locator('#boreSearch').fill('not-a-borehole');assert(await page.locator('#boreSelect').isDisabled());await page.locator('#boreSearch').fill('Cordeaux River 1');await page.locator('#locateBore').click();assert(!await visible('details'));
  await page.waitForTimeout(500);const viewport=await page.locator('#viewport').boundingBox();await page.mouse.click(viewport.x+viewport.width/2,viewport.y+viewport.height/2);assert(await visible('boreProfile'));assert((await page.locator('#boreProfile').innerText()).includes('Cordeaux River 1'));await page.keyboard.press('Escape');
 });
 await check('All registry mines render and fit the statewide view, including Gunnedah and Western',async()=>{
  await page.locator('#regionSelect').selectOption('all');await page.waitForTimeout(1800);
  const inventory=await (await page.request.get(new URL('data/industry.json',page.url()).href)).json(),view=await state();
  for(const r of inventory.records){assert(view.renderedMines.includes(r.id),r.id);const p=view.projectedMines.find(p=>p.id===r.id).position;assert(p.every(v=>Math.abs(v)<1),r.id+' fits camera');}
  await shot('all-nsw-mines');
 });
 await check('Borehole location layer is visible by default and can be toggled',async()=>{
  assert.equal((await geo()).boreLocations,569);await layers();await page.locator('#showBoreLogs').uncheck();assert.equal((await geo()).boreLocations,0);await page.locator('#showBoreLogs').check();assert.equal((await geo()).boreLocations,569);await page.keyboard.press('Escape');
 });
 await check('New mine markers link to full profiles and colocated records remain reachable',async()=>{
  await layers();await page.locator('#featureSelect').selectOption('ulan-west-underground-mine');assert((await page.locator('#detailBody').innerText()).includes('Registry location on sampled terrain'));
  await page.locator('#detailBody [data-feature="ulan-underground-mine"]').click();assert.equal((await state()).selected,'ulan-underground-mine');
  await page.locator('#fullMineProfile').click();assert((await page.locator('#industryDetail').innerText()).includes('Ulan'));await page.locator('#viewMine3D').click();assert.equal((await state()).selected,'ulan-underground-mine');await page.keyboard.press('Escape');
 });
 await check('Mines opens directly on all 35 records without a dashboard or empty detail panel',async()=>{
  await page.locator('#industryToggle').click();assert.equal(await page.locator('#mineRows [data-mine]').count(),35);assert(!await visible('industryDetail'));await page.locator('#mineRows [data-mine]').first().click();const profile=await page.locator('#industryDetail').innerText();assert(profile.includes('No data'));assert(!profile.includes('not yet been verified'));assert(!profile.includes('does not mean'));await page.locator('#closeMine').click();assert.equal(await page.locator('#commercialHub').count(),0);assert(!await visible('mapPage'));assert(await noOverflow());await shot('mines');
 });
 await check('Mine search, profiles and Back to list preserve query and provenance',async()=>{
  await page.locator('#mineSearch').fill('Narrabri');assert.equal(await page.locator('#mineRows [data-mine]').count(),1);await page.locator('#mineRows [data-mine]').click();assert((await page.locator('#industryDetail').innerText()).includes('77.5%'));assert((await page.locator('#industryDetail').innerText()).includes('not actual output'));await shot('mine-profile');await page.locator('#closeMine').click();assert.equal(await page.locator('#mineSearch').inputValue(),'Narrabri');
 });
 await check('Mine filters intersect, empty state recovers and CSV matches visible results',async()=>{
  await page.locator('#mineSearch').fill('not-a-mine');assert((await page.locator('#mineRows').innerText()).includes('No mines match'));await page.locator('#resetIndustryFilters').click();assert.equal(await page.locator('#mineRows [data-mine]').count(),35);
  await page.locator('.more-filters summary').click();await page.locator('#mineProduct').selectOption('met');assert((await page.locator('#mineRows').innerText()).includes('Metallurgical'));await page.locator('#resetIndustryFilters').click();await page.locator('.more-filters summary').click();
  await page.locator('#mineSearch').fill('Ulan');const promise=page.waitForEvent('download');await page.locator('#exportMines').click();const text=fs.readFileSync(await (await promise).path(),'utf8');assert(text.includes('Ulan West'));assert.equal(text.trim().split(/\r?\n/).length,3);await page.locator('#resetIndustryFilters').click();
 });
 await check('Mine profile links into the map, and About is a normal page with downloads',async()=>{
  await page.locator('#mineSearch').fill('Dendrobium');await page.locator('#mineRows [data-mine]').click();await page.locator('#viewMine3D').click();assert(await visible('mapPage'));assert.equal((await state()).selected,'dendrobium');assert(await visible('details'));
  await page.locator('#sources').click();assert(await visible('aboutPage'));assert(!await visible('mapPage'));assert((await page.locator('#sourceBody').innerText()).includes('not a survey'));assert.equal(await page.locator('#sourceBody a[href="./data/terrain-corrections.json"]').count(),1);
  for(const file of ['NSW-Coal-Atlas.blend','NSW-Coal-Flythrough.mp4']){const res=await page.request.head(new URL('downloads/'+file,page.url()).href);assert.equal(res.status(),200);assert(Number(res.headers()['content-length'])>100000);}
  await page.locator('#mapTab').click();assert(await visible('mapPage'));assert(!await visible('details'));
 });
 await check('Phone layout keeps panels exclusive, provides close controls and has no page overflow',async()=>{
  await page.setViewportSize({width:390,height:844});await layers();await page.locator('#reset').click();await page.locator('#regionSelect').selectOption('0');await page.waitForTimeout(1700);assert(await noOverflow());await shot('mobile');
  await layers();assert(await visible('controls'));assert(await page.locator('#stage').evaluate(e=>e.inert));await shot('mobile-layers');await page.locator('#openBoreholes').click();assert(!await visible('controls'));assert(await visible('details'));await page.locator('#boreSearch').fill('Cordeaux River 1');assert(await noOverflow());await page.locator('#details').evaluate(e=>e.scrollTop=e.scrollHeight);const closeBox=await page.locator('#closeDetails').boundingBox();assert(closeBox.y>0&&closeBox.y<300);await page.locator('#details').evaluate(e=>e.scrollTop=0);await shot('mobile-borehole');await page.locator('#closeDetails').click();
  await page.locator('#openSection').click();assert(await visible('sectionPanel'));assert(await noOverflow());await shot('mobile-section');await page.locator('#closeSection').click();
  await page.locator('#industryToggle').click();await page.locator('#resetIndustryFilters').click();await shot('mobile-mines');await page.locator('#mineRows [data-mine]').first().click();assert(!await visible('mineList'));assert(await visible('industryDetail'));assert(await noOverflow());await shot('mobile-mine-profile');await page.locator('#closeMine').click();assert(await visible('mineList'));await page.locator('#mapTab').click();
 });
 await check('Keyboard, small phones and landscape layouts retain navigation',async()=>{
  await layers();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'toggleControls');
  for(const viewport of [{width:320,height:568},{width:844,height:390},{width:720,height:480}]){await page.setViewportSize(viewport);assert(await noOverflow());await layers();assert(await visible('closeControls'));await page.locator('#closeControls').click();await page.locator('#sources').click();assert(await noOverflow());await page.locator('#mapTab').click();}
 });
 await check('WebGL remains populated after responsive resizes; assets and scripts report no errors',async()=>{
  await page.setViewportSize({width:1440,height:960});await page.locator('#regionSelect').selectOption('0');await page.waitForTimeout(1800);assert((await state()).triangles>100000);assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);
 });
}catch(error){failure=error.stack;await shot('failure');throw error;}finally{
 fs.writeFileSync('evidence/simple-browser-tests.json',JSON.stringify({date:new Date().toISOString(),checks,errors,badResponses,failure,passed:!failure&&checks.length===19&&errors.length===0&&badResponses.length===0},null,2));await browser.close();
}
