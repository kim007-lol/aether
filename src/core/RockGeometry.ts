import { BufferAttribute, BufferGeometry, Sphere, Vector3 } from 'three';
import { prepareRockGeometry } from './geometry.ts';
export { createRockGeometry } from './geometry.ts';

interface RockBuffers {
  positions: Float32Array;
  normals: Float32Array;
  cavity: Float32Array;
  indices: Uint16Array | Uint32Array;
  seed: number;
  craters: number;
  radius: number;
  center: [number, number, number];
}

async function generateSliced(detail: number, seed: number, yieldTask: () => Promise<void>): Promise<BufferGeometry> {
  await yieldTask();
  const job = prepareRockGeometry(detail, seed);
  let sliceStart = performance.now();
  for(let i=0;i<job.count;i++) {
    job.displace(i);
    if((i&31)===0 && performance.now()-sliceStart>6) {await yieldTask();sliceStart=performance.now();}
  }
  await yieldTask();
  return job.finish();
}

export async function createRockGeometryAsync(detail: number, seed: number, yieldTask: () => Promise<void>): Promise<BufferGeometry> {
  if(typeof Worker==='undefined') return generateSliced(detail,seed,yieldTask);
  await yieldTask();
  // Geometry construction, welding, craters and normal recomputation stay off the UI thread.
  return new Promise<BufferGeometry>((resolve,reject)=>{
    const worker=new Worker(new URL('./rock.worker.ts',import.meta.url),{type:'module'});
    worker.onmessage=(event:MessageEvent<RockBuffers>)=>{
      const data=event.data;
      const geometry=new BufferGeometry();
      geometry.setAttribute('position',new BufferAttribute(data.positions,3));
      geometry.setAttribute('normal',new BufferAttribute(data.normals,3));
      geometry.setAttribute('aCavity',new BufferAttribute(data.cavity,1));
      geometry.setIndex(new BufferAttribute(data.indices,1));
      geometry.userData.seed=data.seed;
      geometry.userData.craters=data.craters;
      geometry.userData.generatedInWorker=true;
      geometry.boundingSphere=new Sphere(new Vector3(...data.center),data.radius);
      worker.terminate();
      resolve(geometry);
    };
    worker.onerror=(event)=>{worker.terminate();reject(new Error(event.message));};
    worker.postMessage({detail,seed});
  });
}
