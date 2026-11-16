export const clamp=(x:number,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const damp=(rate:number,dt:number)=>1-Math.exp(-rate*dt);
export const smoothstep=(a:number,b:number,x:number)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export function random(seed=12345){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
