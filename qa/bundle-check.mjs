import { readdir,readFile,writeFile } from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const files=await readdir('dist/assets');let total=0;const chunks=[];for(const f of files.filter(f=>f.endsWith('.js'))){const data=await readFile('dist/assets/'+f);const gzip=gzipSync(data).length;total+=gzip;chunks.push({file:f,bytes:data.length,gzip});}await writeFile('qa/bundle.json',JSON.stringify({totalGzip:total,chunks},null,2));console.log('JS gzip:',total,'bytes; budget:',450*1024);if(total>450*1024)process.exitCode=1;
