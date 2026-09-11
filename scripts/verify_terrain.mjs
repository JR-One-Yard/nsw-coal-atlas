import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire('/Users/jamesroberts/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-webgl','--ignore-gpu-blocklist']});
const checks=[],errors=[];
const check=async(name,fn)=>{await fn();checks.push({name,passed:true});console.log('PASS',name);};
try {
 const page=await browser.newPage({viewport:{width:1600,height:1000}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.coalAtlas?.getState().frameCount>5);
 await check('Served terrain removes the Yarra Bay spike and preserves the correction source',async()=>{
  const {terrain,ledger}=await page.evaluate(async()=>({terrain:await(await fetch('./data/terrain.json')).json(),ledger:await(await fetch('./data/terrain-corrections.json')).json()}));
  assert.equal(terrain.elevations[200*193+93],0);
  const correction=ledger.corrections.find(c=>c.id==='yarra-bay-water-surface');
  assert.equal(correction.originalMetres,826);assert.equal(correction.replacementMetres,0);
  assert(correction.url.startsWith('https://services.ga.gov.au/'));
 });
 await page.locator('#chapters button').nth(1).click();
 await page.waitForTimeout(1800);
 await check('Sydney chapter renders the corrected terrain at default and stronger vertical scales',async()=>{
  assert.equal(await page.evaluate(()=>window.coalAtlas.getState().chapter),1);
  await page.screenshot({path:'evidence/terrain-sydney-corrected.png'});
  await page.locator('#exaggeration').evaluate(e=>{e.value='20';e.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.evaluate(()=>window.coalAtlas.getState().state.exaggeration),20);
  await page.waitForTimeout(300);
  await page.screenshot({path:'evidence/terrain-sydney-20x.png'});
 });
 await check('Correction provenance is available from Sources and no browser exception occurred',async()=>{
  assert.equal(await page.locator('#sourceBody a[href="./data/terrain-corrections.json"]').count(),1);
  assert.deepEqual(errors,[]);
 });
 fs.writeFileSync('evidence/terrain-browser-tests.json',JSON.stringify({date:new Date().toISOString(),checks,errors},null,2));
} finally {await browser.close();}
