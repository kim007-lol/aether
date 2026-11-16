import {Group,Mesh,Material,WebGLRenderTarget,type Scene,type PerspectiveCamera,type Vector2,type WebGLRenderer,type Data3DTexture,type Texture} from 'three';
import type {Tier} from '../config/quality';import type {TaskQueue} from '../core/TaskQueue';
export interface FrameState{time:number;dt:number;progress:number;chapterT:number;velocity:number;pointer:Vector2;camera:PerspectiveCamera;tier:Tier;reduced:boolean;}
export interface Ctx{scene:Scene;camera:PerspectiveCamera;renderer:WebGLRenderer;tier:Tier;noise?:Data3DTexture;env?:Texture;}
export interface Chapter{readonly id:string;readonly range:[number,number];init(ctx:Ctx,queue:TaskQueue):Promise<void>;warm(renderer:WebGLRenderer):void;update(s:FrameState):void;setVisible(v:boolean):void;rebuild(tier:Tier):void;dispose():void;}
export abstract class SceneChapter implements Chapter{
 abstract readonly id:string;abstract readonly range:[number,number];readonly group=new Group();protected ctx!:Ctx;protected warmTarget=new WebGLRenderTarget(8,8);
 async init(ctx:Ctx,_queue:TaskQueue){void _queue;this.ctx=ctx;ctx.scene.add(this.group);}
 warm(renderer:WebGLRenderer){const previous=renderer.getRenderTarget();renderer.setRenderTarget(this.warmTarget);renderer.render(this.ctx.scene,this.ctx.camera);renderer.setRenderTarget(previous);}
 abstract update(s:FrameState):void;
 setVisible(v:boolean){this.group.visible=v;}
 abstract rebuild(tier:Tier):void;
 dispose(){this.group.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();if(Array.isArray(o.material))o.material.forEach((m:Material)=>m.dispose());else o.material.dispose();}});this.group.removeFromParent();this.warmTarget.dispose();}
}
