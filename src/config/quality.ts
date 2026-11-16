export type TierName='low'|'medium'|'high'|'ultra';
export interface Tier {name:TierName;dprCap:number;msaa:number;sphere:[number,number];cloudOctaves:number;atmosphereSteps:number;stars:number;ringParticles:number;ringHeroRocks:number;far:number;mid:number;nebulaSteps:number;nebulaRes:number;shards:number;shadowSize:number;chromatic:boolean;}
export const TIERS:Record<TierName,Tier>={
low:{name:'low',dprCap:1,msaa:0,sphere:[240,128],cloudOctaves:4,atmosphereSteps:8,stars:30000,ringParticles:60000,ringHeroRocks:1000,far:600,mid:120,nebulaSteps:40,nebulaRes:.5,shards:120,shadowSize:0,chromatic:false},
medium:{name:'medium',dprCap:1.5,msaa:0,sphere:[320,192],cloudOctaves:5,atmosphereSteps:12,stars:60000,ringParticles:150000,ringHeroRocks:2000,far:1200,mid:300,nebulaSteps:56,nebulaRes:.6,shards:200,shadowSize:0,chromatic:true},
high:{name:'high',dprCap:2,msaa:4,sphere:[384,256],cloudOctaves:6,atmosphereSteps:16,stars:120000,ringParticles:300000,ringHeroRocks:3000,far:2000,mid:500,nebulaSteps:80,nebulaRes:.75,shards:300,shadowSize:2048,chromatic:true},
ultra:{name:'ultra',dprCap:2,msaa:4,sphere:[512,320],cloudOctaves:7,atmosphereSteps:24,stars:200000,ringParticles:450000,ringHeroRocks:4000,far:3000,mid:800,nebulaSteps:112,nebulaRes:1,shards:400,shadowSize:4096,chromatic:true}};
export const TIER_NAMES:TierName[]=['low','medium','high','ultra'];
export function isTier(value:string|null):value is TierName{return value!==null&&value in TIERS;}
