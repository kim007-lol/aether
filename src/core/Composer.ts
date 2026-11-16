import {HalfFloatType,UnsignedByteType,Vector2,type WebGLRenderer,type Scene,type Camera} from 'three';
import {EffectComposer,RenderPass,EffectPass,BloomEffect,ChromaticAberrationEffect,VignetteEffect,NoiseEffect,ToneMappingEffect,ToneMappingMode,SMAAEffect,BlendFunction} from 'postprocessing';
import type {Tier} from '../config/quality';
export class Composer {
 readonly composer:EffectComposer;readonly bloom:BloomEffect;readonly chromatic:ChromaticAberrationEffect;private effects:EffectPass;private smaa:EffectPass|null=null;halfFloat:boolean;
 constructor(renderer:WebGLRenderer,scene:Scene,camera:Camera,tier:Tier){this.halfFloat=renderer.extensions.has('EXT_color_buffer_float')||renderer.extensions.has('EXT_color_buffer_half_float');this.composer=new EffectComposer(renderer,{frameBufferType:this.halfFloat?HalfFloatType:UnsignedByteType,multisampling:tier.msaa});this.composer.addPass(new RenderPass(scene,camera));this.bloom=new BloomEffect({mipmapBlur:true,luminanceThreshold:.9,luminanceSmoothing:.2,intensity:.9,radius:.85,levels:8});this.chromatic=new ChromaticAberrationEffect({offset:new Vector2(.0005,.0005),radialModulation:true,modulationOffset:.15});const noise=new NoiseEffect({premultiply:true,blendFunction:BlendFunction.SOFT_LIGHT});noise.blendMode.opacity.value=.035;this.effects=new EffectPass(camera,this.bloom,this.chromatic,new VignetteEffect({offset:.3,darkness:.65}),noise,new ToneMappingEffect({mode:ToneMappingMode.ACES_FILMIC}));this.composer.addPass(this.effects);this.smaa=new EffectPass(camera,new SMAAEffect());this.composer.addPass(this.smaa);this.rebuild(tier);}
 rebuild(tier:Tier){this.composer.multisampling=tier.msaa;if(this.smaa)this.smaa.enabled=tier.msaa===0;this.chromatic.blendMode.opacity.value=tier.chromatic?1:0;}
 update(velocity:number,pulse:number,reduced:boolean){const speed=reduced?0:Math.abs(velocity);this.bloom.intensity=.9+speed*.22+(reduced?0:pulse*.8);const offset=.0005+speed*.0017+(reduced?0:pulse*.001);this.chromatic.offset.set(offset,offset);}
 resize(){this.composer.setSize(innerWidth,innerHeight);}
 dispose(){this.composer.dispose();}
}
