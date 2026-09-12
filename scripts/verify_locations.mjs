import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire('/Users/jamesroberts/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-webgl','--ignore-gpu-blocklist']});const page=await browser.newPage({viewport:{width:1440,height:960}});
await page.goto('http://127.0.0.1:8766/');await page.waitForSelector('body[data-ready=true]');await page.waitForTimeout(1800);await page.locator('#toggleControls').click();await page.locator('#openBoreholes').click();await page.locator('#boreSearch').fill('Cordeaux River 1');await page.locator('#locateBore').click();await page.waitForTimeout(600);
const box=await page.locator('#viewport').boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);assert(await page.locator('#boreProfile').isVisible());
await page.locator('#closeDetails').click();await page.locator('#industryToggle').click();await page.locator('#mineSearch').fill('Dendrobium');await page.locator('[data-mine="dendrobium"]').click();assert((await page.locator('#industryDetail').innerText()).includes('No compiled logs within 10 km'));await page.locator('#closeMine').click();await page.locator('#mineSearch').fill('Appin');await page.locator('[data-mine="appin"]').click();assert(await page.locator('[data-nearby-bore]').count()>0);await page.locator('[data-nearby-bore]').first().click();assert(await page.locator('#boreProfile').isVisible());await page.locator('#closeDetails').click();
for(const [name,viewport] of [['desktop',{width:1440,height:960}],['mobile',{width:390,height:844}]]){
 await page.setViewportSize(viewport);await page.locator('#regionSelect').selectOption('all');await page.waitForTimeout(1900);
 const view=await page.evaluate(()=>coalAtlas.getState());assert.equal(view.projectedMines.length,35);for(const mine of view.projectedMines)assert(mine.position.every(v=>Math.abs(v)<1),mine.id+' fits '+name);
 await page.screenshot({path:`evidence/all-mines-${name}.png`});
}
fs.writeFileSync('evidence/map-location-tests.json',JSON.stringify({passed:true,date:new Date().toISOString(),checks:['Borehole marker opens measured-depth profile','Mine nearby-log link opens borehole profile','All 35 registry locations fit desktop and mobile statewide cameras']},null,2));console.log('PASS borehole clicks, mine-to-log links, all 35 mine locations on desktop and mobile');await browser.close();
