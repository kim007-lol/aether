/// <reference lib="webworker" />
import { createRockGeometry } from './geometry.ts';

self.onmessage=(event:MessageEvent<{detail:number;seed:number}>)=>{
  const {detail,seed}=event.data;
  const geometry=createRockGeometry(detail,seed);
  const positions=geometry.getAttribute('position').array;
  const normals=geometry.getAttribute('normal').array;
  const cavity=geometry.getAttribute('aCavity').array;
  const indices=geometry.index!.array;
  self.postMessage({positions,normals,cavity,indices,seed,craters:geometry.userData.craters,radius:geometry.boundingSphere!.radius,center:geometry.boundingSphere!.center.toArray()},
    {transfer:[positions.buffer,normals.buffer,cavity.buffer,indices.buffer]});
  geometry.dispose();
};
