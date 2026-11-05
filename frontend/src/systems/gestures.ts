import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { GestureRecognizer } from './gestureRecognizer';
import { dispatchGesture } from './gestureDispatch';
import { input } from './input';
import { useStore } from '../state/store';
const WASM='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm';
const MODEL='https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
export type GestureFrame={ hand:boolean; pinch:boolean; walking:boolean; x:number; y:number; calibrating:number|null; center:{x:number;y:number}|null; event?:string };
export async function startGestures(video:HTMLVideoElement,onFrame:(f:GestureFrame)=>void,onCameraReady:()=>void) {
 const stream=await navigator.mediaDevices.getUserMedia({video:{width:320,height:240,facingMode:'user'},audio:false});
 let hands:HandLandmarker;
 try {
  video.srcObject=stream; await video.play(); onCameraReady();
  const files=await FilesetResolver.forVisionTasks(WASM);
  const options={baseOptions:{modelAssetPath:MODEL},runningMode:'VIDEO' as const,numHands:2,minHandDetectionConfidence:.65,minHandPresenceConfidence:.65,minTrackingConfidence:.65};
  try { hands=await HandLandmarker.createFromOptions(files,{...options,baseOptions:{...options.baseOptions,delegate:'GPU'}}); }
  catch { hands=await HandLandmarker.createFromOptions(files,options); }
 } catch(err) { stream.getTracks().forEach(t=>t.stop());video.srcObject=null;throw err; }
 const recognizer=new GestureRecognizer(); let raf=0,lastVideo=-1,lastFrame=0,lastUi=0,calibration=0,context='';
 const reset=()=>{recognizer.reset().forEach(dispatchGesture);input.gestureWalk=false;};
 const loop=()=>{
  raf=requestAnimationFrame(loop); const now=performance.now();
  if(document.hidden) {reset();return;}
  if(video.readyState<2||video.currentTime===lastVideo||now-lastFrame<45)return;
  lastVideo=video.currentTime;lastFrame=now;
  const s=useStore.getState(), nextContext=`${s.phase}/${s.world}/${s.zone}/${s.panel}/${!!s.journey}`;
  if(context!==nextContext){reset();context=nextContext;calibration=0;}
  let detected; try {detected=hands.detectForVideo(video,now);}catch{reset();return;}
  const lm=detected.landmarks[0];
  if(!lm){reset();calibration=0;onFrame({hand:false,pinch:false,walking:false,x:.5,y:.5,calibrating:0,center:null});return;}
  const x=1-lm[9].x,y=lm[9].y;
  const size=Math.max(.04,Math.hypot(lm[0].x-lm[9].x,lm[0].y-lm[9].y));
  const pinch=Math.hypot(lm[4].x-lm[8].x,lm[4].y-lm[8].y)/size;
  const confidence=detected.handedness[0]?.[0]?.score??0;
  // Require a short neutral open-hand interval after context changes or tracking loss.
  if(calibration<12){if(pinch>.55&&confidence>.65)calibration++;else calibration=0;}
  let event='';
  if(calibration>=12){
   const other=detected.landmarks[1];
   const actions=recognizer.update({x,y,pinch,confidence,span:other?Math.hypot(lm[9].x-other[9].x,lm[9].y-other[9].y):undefined},now);
   for(const a of actions){dispatchGesture(a);if(a.type!=='drag'&&a.type!=='zoom')event=a.type;}
  }
  if(now-lastUi>100||event){lastUi=now;onFrame({hand:true,pinch:pinch<.5,walking:input.gestureWalk,x,y,calibrating:calibration<12?calibration/12:null,center:null,event});}
 };
 loop();
 return {stop:()=>{cancelAnimationFrame(raf);reset();hands.close();stream.getTracks().forEach(t=>t.stop());video.srcObject=null;},recalibrate:()=>{reset();calibration=0;}};
}
