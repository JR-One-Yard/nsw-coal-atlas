import fs from 'node:fs';
import {mergeMineInventory} from '../dist/mine-inventory.js';
const read=name=>JSON.parse(fs.readFileSync(`dist/data/${name}.json`));
const atlas=read('atlas');
const geo=(lon,lat,h)=>[(lon-151.15)*111.32*Math.cos(-33.55*Math.PI/180),h/1000,(-33.55-lat)*111.32];
mergeMineInventory(atlas,read('industry'),read('terrain-wide'),geo);
fs.writeFileSync('dist/data/atlas.json',JSON.stringify(atlas));
console.log(`Exported ${atlas.mines.length} mine and historical locations`);
