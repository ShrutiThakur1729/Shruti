import { useEffect, useRef, useState } from 'react';
import { audio } from '../audio/AudioEngine';
import { soundtrack } from '../data/content';
import { useStore } from '../state/store';
type Controller={pause:()=>void;destroy:()=>void;addListener:(name:string,cb:(e:{data:{isPaused:boolean;duration:number;position:number}})=>void)=>void};
type SpotifyAPI={createController:(el:HTMLElement,opts:Record<string,unknown>,cb:(c:Controller)=>void)=>void};
let apiPromise:Promise<SpotifyAPI>|null=null;
function loadSpotify(){
 if(!apiPromise)apiPromise=new Promise<SpotifyAPI>((resolve,reject)=>{
  (window as unknown as {onSpotifyIframeApiReady:(api:SpotifyAPI)=>void}).onSpotifyIframeApiReady=resolve;
  const script=document.createElement('script');script.src='https://open.spotify.com/embed/iframe-api/v1';script.async=true;
  script.onerror=()=>{apiPromise=null;reject(new Error('The official player could not load.'));};document.head.appendChild(script);
 });return apiPromise;
}
export default function SoundtrackPlayer(){
 const [opened,setOpened]=useState(false),[error,setError]=useState('');
 const target=useRef<HTMLDivElement>(null),controller=useRef<Controller|null>(null);
 const muted=useStore(s=>s.audio.muted||s.audio.master===0);
 useEffect(()=>{if(muted)controller.current?.pause();},[muted]);
 useEffect(()=>{
  if(!opened)return;let cancelled=false;
  loadSpotify().then(api=>{
   if(cancelled||!target.current)return;
   api.createController(target.current,{uri:'spotify:track:5MTGPkmiUuud9NkA0sl2nI',width:'100%',height:152},c=>{
    if(cancelled){c.destroy();return;}controller.current=c;
    c.addListener('playback_update',e=>{
      if(cancelled)return;
      if(e.data.isPaused||(e.data.duration>0&&e.data.position>=e.data.duration))audio.resumeFromTrack();
      else {if(useStore.getState().audio.muted){c.pause();return;}audio.pauseForTrack();}
    });
   });
  }).catch(err=>{if(!cancelled)setError(err.message);});
  return()=>{cancelled=true;controller.current?.pause();controller.current?.destroy();controller.current=null;audio.resumeFromTrack();};
 },[opened]);
 return <article className="panel-body soundtrack" data-testid="soundtrack-panel"><span className="chapter-mark">PERSONAL SOUNDTRACK</span><h2>{soundtrack.title} <em>· {soundtrack.artist}</em></h2><p>{soundtrack.note}</p>{!opened?<button className="btn-primary" data-testid="soundtrack-play" onClick={()=>setOpened(true)}>Open the official player ♪</button>:<><div ref={target}/><p className="small-copy">Use the player to start the track. The garden returns when you pause or finish.</p><button className="btn-secondary" onClick={()=>{controller.current?.pause();setOpened(false);audio.resumeFromTrack();}}>Stop track and restore garden</button></>}{error&&<p role="alert">{error} <a href="https://open.spotify.com/track/5MTGPkmiUuud9NkA0sl2nI" target="_blank" rel="noopener noreferrer">Listen on Spotify ↗</a></p>}<div className="panel-actions"><button data-testid="soundtrack-close" onClick={()=>useStore.getState().closePanel()}>Close</button></div></article>;
}
