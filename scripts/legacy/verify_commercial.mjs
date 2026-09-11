import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire('/Users/jamesroberts/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-webgl','--ignore-gpu-blocklist']});
const checks=[],errors=[],bad=[];
const check=async(name,fn)=>{await fn();checks.push({name,passed:true});console.log('PASS',name);};
try {
 const page=await browser.newPage({viewport:{width:1600,height:1000},acceptDownloads:true});
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url());});
 const state=()=>page.evaluate(()=>window.coalCommercial.getState());
 const open=async()=>{await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.coalCommercial);await page.locator('#industryToggle').click();};
 await open();
 await check('Overview shows distinct complex production and explicit snapshot coverage',async()=>{
  const s=await state();assert.equal(s.summary.count,35);assert.equal(s.summary.complexes.length,3);assert((await page.locator('#commercialStats').innerText()).includes('40.944'));assert((await page.locator('#commercialStats').innerText()).includes('5/35'));
 });
 await page.screenshot({path:'evidence/commercial-overview.png'});
 await check('Operator portfolio and destination buttons filter the inventory',async()=>{
  await page.locator('[data-operator="Yancoal"]').click();assert.equal(await page.locator('#mineOperator').inputValue(),'Yancoal');assert((await state()).summary.operators.every(o=>o.name==='Yancoal'));
  await page.locator('#resetIndustryFilters').click();await page.locator('[data-destination="eraring"]').click();assert.equal((await state()).summary.count,2);
  assert.deepEqual(await page.evaluate(()=>window.coalIndustry.getState().filtered.sort()),['mandalong','myuna']);await page.locator('#resetIndustryFilters').click();
  await page.locator('#mineRegion').selectOption('Hunter');await page.locator('#mineProduct').selectOption('met');await page.locator('#mineSearch').fill('ashton');
  await page.locator('[data-operator="Yancoal"]').focus();await page.keyboard.press('Enter');
  assert.deepEqual(await page.evaluate(()=>window.coalIndustry.getState().filtered),['ashton']);
  await page.locator('#resetIndustryFilters').click();await page.locator('[data-operator="Not verified"]').click();assert.equal((await state()).summary.count,2);await page.locator('#resetIndustryFilters').click();
 });
 await check('Shortlist persists across filters, caps selection and compares shared complexes honestly',async()=>{
  for(const id of ['moolarben-open-cut-mine','moolarben-underground-mine','appin','myuna'])await page.locator(`[data-compare="${id}"]`).check();
  await page.locator('[data-compare="ashton"]').click();assert.equal((await state()).selected.length,4);assert(!(await page.locator('[data-compare="ashton"]').isChecked()));
  assert((await page.locator('#commercialMessage').innerText()).includes('up to four'));
  await page.locator('#mineSearch').fill('ashton');assert.equal((await state()).selected.length,4);await page.locator('#commercialTab-compare').click();
  assert((await page.locator('#commercial-compare').innerText()).includes('must not be added'));assert.equal(await page.locator('.comparison-table thead th').count(),5);
  await page.locator('#resetIndustryFilters').click();
 });
 await page.screenshot({path:'evidence/commercial-comparison.png'});
 await check('Comparison CSV includes selected operations, source URLs and production basis',async()=>{
  const pending=page.waitForEvent('download');await page.locator('#exportComparison').click();const d=await pending;const csv=fs.readFileSync(await d.path(),'utf8');
  assert(csv.includes('Moolarben open cut mine'));assert(csv.includes('Yancoal-P4-Report-2025.pdf'));assert(csv.includes('Whole-complex saleable Mt'));assert(csv.includes('not actual')===false);
  await page.locator('[data-remove="appin"]').click();await page.locator('[data-compare="mtw"]').check();
  assert((await page.locator('#commercial-compare').innerText()).includes('Regional rail / export (illustrative)'));
  const next=page.waitForEvent('download');await page.locator('#exportComparison').click();const destinationCSV=fs.readFileSync(await (await next).path(),'utf8');
  assert(destinationCSV.includes('Regional rail / export (illustrative)'));assert(destinationCSV.includes('Newcastle · export'));assert(destinationCSV.includes('Not recorded'));
  await page.locator('[data-remove="mtw"]').click();await page.locator('[data-compare="appin"]').check();
 });
 await check('Comparison survives a page reload and malformed saved data is tolerated',async()=>{
  await open();assert.equal((await state()).selected.length,4);
  await page.evaluate(()=>localStorage.setItem('nsw-coal-atlas:commercial-shortlist:v1','{bad-json'));
  await open();assert.deepEqual((await state()).selected,[]);
  await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('Storage unavailable');};Storage.prototype.setItem=()=>{throw new Error('Storage unavailable');};});
  await open();await page.locator('[data-compare="appin"]').check();assert.deepEqual((await state()).selected,['appin']);assert((await page.locator('#commercialMessage').innerText()).includes('storage is unavailable'));
  await page.locator('#commercialTab-compare').click();await page.locator('[data-remove="appin"]').click();assert.deepEqual((await state()).selected,[]);
 });
 await check('Keyboard tab navigation opens Revenue lab and calculates the documented formula',async()=>{
  await page.locator('#commercialTab-overview').focus();await page.keyboard.press('End');assert.equal((await state()).tab,'scenario');
  assert((await page.locator('#scenarioResult').innerText()).includes('A$153.846m'));
  await page.locator('#scenarioVolume').fill('2');await page.locator('#scenarioFX').fill('0.5');assert((await page.locator('#scenarioResult').innerText()).includes('A$400m'));
 });
 await check('Invalid input clears stale results and valid zero volume returns zero',async()=>{
  await page.locator('#scenarioFX').fill('0');assert(await page.locator('#exportScenario').isDisabled());assert.equal(await page.locator('.scenario-answer').count(),0);
  await page.locator('#scenarioFX').fill('0.5');await page.locator('#scenarioVolume').fill('');assert(await page.locator('#exportScenario').isDisabled());
  await page.locator('#scenarioVolume').fill('0');assert((await page.locator('#scenarioResult').innerText()).includes('A$0m'));
 });
 await check('Reported volume presets retain source and edits become manual assumptions',async()=>{
  await page.locator('#scenarioPreset').selectOption('moolarben');assert.equal(await page.locator('#scenarioVolume').inputValue(),'19.1');assert((await page.locator('#scenarioSource').innerText()).includes('Calendar 2025'));
  await page.locator('#scenarioVolume').fill('5');assert.equal(await page.locator('#scenarioPreset').inputValue(),'manual');assert((await page.locator('#scenarioSource').innerText()).includes('Manual volume'));
 });
 await check('Scenario export includes assumptions, units, source and nine sensitivity cases',async()=>{
  await page.locator('#scenarioPreset').selectOption('moolarben');const pending=page.waitForEvent('download');await page.locator('#exportScenario').click();const d=await pending;const csv=fs.readFileSync(await d.path(),'utf8');
  assert(csv.includes('USD per AUD'));assert(csv.includes('Yancoal-P4-Report-2025.pdf'));assert(csv.includes('not profit'));assert(csv.includes('Costs, royalties'));const lines=csv.split('\r\n');assert.equal(lines.slice(lines.findIndex(line=>line.startsWith('"Price USD per tonne"'))+1).length,9);
 });
 await page.locator('#commercial-scenario').scrollIntoViewIfNeeded();await page.screenshot({path:'evidence/commercial-scenario.png'});
 await check('Empty filters show missing production without stale totals',async()=>{
  await page.locator('#mineSearch').fill('NO_SUCH_OPERATION');await page.locator('#commercialTab-overview').click();assert.equal((await state()).summary.count,0);assert(!(await page.locator('#commercialStats').innerText()).includes('40.944'));assert((await page.locator('#commercial-overview').innerText()).includes('No comparable production'));await page.locator('#resetIndustryFilters').click();
 });
 await check('Mobile commercial views stay within the viewport and scenario controls remain usable',async()=>{
  await page.setViewportSize({width:390,height:844});await page.locator('#commercialTab-scenario').click();await page.locator('#scenarioPrice').fill('120');
  await page.locator('[data-compare="mtw"]').check();await page.locator('[data-compare="appin"]').check();
  for(const name of ['overview','compare','scenario']){await page.locator(`#commercialTab-${name}`).click();assert(await page.locator('#industryPanel').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`${name} must not clip the mobile panel`);}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert(await page.locator('#industryPanel').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Commercial panel must not clip horizontal overflow');assert(await page.locator('#exportScenario').isEnabled());await page.screenshot({path:'evidence/commercial-mobile.png'});
 });
 await check('Returning to geology preserves the atlas and all assets load cleanly',async()=>{
  await page.locator('#backGeology').click();assert(await page.locator('#industryPanel').isHidden());assert(await page.evaluate(()=>window.coalAtlas.getState().triangles>100000));assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 });
 fs.writeFileSync('evidence/commercial-browser-tests.json',JSON.stringify({date:new Date().toISOString(),datasetSnapshot:JSON.parse(fs.readFileSync('dist/data/industry.json')).date,viewports:[{width:1600,height:1000},{width:390,height:844}],checks,errors,badResponses:bad},null,2));
} finally {await browser.close();}
