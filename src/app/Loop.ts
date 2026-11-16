import {gsap} from 'gsap';
export class Loop {private last=0;private tick=(time:number)=>{if(document.hidden){this.last=0;return;}const raw=this.last?time-this.last:1/60;this.last=time;this.frame(time,Math.min(.05,raw),raw*1000);};constructor(private readonly frame:(time:number,dt:number,rawMs:number)=>void){gsap.ticker.add(this.tick);}dispose(){gsap.ticker.remove(this.tick);}}
