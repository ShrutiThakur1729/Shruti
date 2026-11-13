import { useEffect, useRef, useState } from "react";
import { useStore } from "../state/store";
import type { GestureFrame } from "../systems/gestures";

type Status = "loading" | "model" | "on" | "error";

function statusLabel(status: Status, frame: GestureFrame | null) {
  if (status === "loading") return "Waking the camera…";
  if (status === "model") return "Loading hand tracking…";
  if (status === "error") return "Camera unavailable — allow camera access and try again.";
  if (frame?.calibrating != null)
    return frame.hand
      ? `Calibrating — hold your open hand still… ${Math.round(frame.calibrating * 100)}%`
      : "Calibration: raise an open hand where it feels comfortable";
  if (!frame?.hand) return "Show your hand to the camera";
  if (frame.walking) return "Walking forward";
  if (frame.pinch) return "Pinch — release to select, hold to walk";
  return "Hand found";
}

export default function GestureControl() {
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<{ stop: () => void; recalibrate: () => void } | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [frame, setFrame] = useState<GestureFrame | null>(null);
  const [toast, setToast] = useState("");
  const [dropdown,setDropdown] = useState<HTMLSelectElement|null>(null);
  const [details,showDetails] = useState(false);
  const toastTimer = useRef(0);
  useEffect(()=>{
    const open=(e:Event)=>setDropdown((e as CustomEvent<HTMLSelectElement>).detail);
    window.addEventListener('twi-hand-select',open);
    const changed=useStore.subscribe((s,old)=>{if(s.panel!==old.panel || s.phase!==old.phase || s.world!==old.world)setDropdown(null);});
    return ()=>{window.removeEventListener('twi-hand-select',open);changed();};
  },[]);

  useEffect(() => {
    let cancelled = false;
    const onFrame = (f: GestureFrame) => {
      setFrame(f);
      if (!f.event) return;
      setToast(f.event);
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(""), 1400);
    };
    import("../systems/gestures")
      .then(({ startGestures }) => startGestures(video.current!, onFrame, () => !cancelled && setStatus("model")))
      .then((c) => {
        if (cancelled) return c.stop();
        controls.current = c;
        setStatus("on");
      })
      .catch(() => !cancelled && setStatus("error"));
    const timeout = window.setTimeout(() => !cancelled && setStatus((s) => (s === "loading" ? "error" : s)), 20000);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controls.current?.stop();
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  const calibrating = status === "on" && frame?.calibrating != null;
  return (
    <>
    {status==='on' && frame?.hand && !calibrating && <i className="hand-pointer" aria-hidden style={{left:frame.x*100+'%',top:frame.y*100+'%'}}/>}
    {dropdown?.isConnected && <div className="hand-options" role="group" aria-label={dropdown.labels?.[0]?.innerText || 'Choose an option'}>
      {Array.from(dropdown.options).filter(o=>!o.disabled).map(o=><button key={o.value} onClick={()=>{
        dropdown.value=o.value;dropdown.dispatchEvent(new Event('change',{bubbles:true}));setDropdown(null);
      }}>{o.text}</button>)}
      <button onClick={()=>setDropdown(null)}>Cancel</button>
    </div>}
    <aside className={`gesture-widget ${details || status!=='on' || calibrating ? 'expanded' : 'compact'}`} data-testid="gesture-widget">
      <button className="hand-settings" aria-expanded={details} onClick={()=>showDetails(v=>!v)}>Hand controls</button>
      <div className="gesture-cam">
        <video ref={video} muted playsInline data-testid="gesture-video" />
        {frame?.hand && (
          <span
            className={`gesture-dot ${frame.pinch ? "pinch" : ""}`}
            style={{ left: `${frame.x * 100}%`, top: `${frame.y * 100}%` }}
          />
        )}
        {frame?.center && (
          <span className="gesture-deadzone" style={{ left: `${frame.center.x * 100}%`, top: `${frame.center.y * 100}%` }} aria-hidden />
        )}
        {calibrating && (
          <span className="gesture-progress" style={{ width: `${(frame?.calibrating ?? 0) * 100}%` }} data-testid="gesture-calibration-progress" />
        )}
      </div>
      <p className={`gesture-status ${status}`} data-testid="gesture-status">{statusLabel(status, frame)}</p>
      <p className="gesture-help">Aim the white ring and pinch to select. Hold to walk or scroll a panel. Swipe to change worlds or turn a book page.</p>
      {toast && <span className="gesture-toast" data-testid="gesture-toast">{toast}</span>}
      {status === 'error' && <button className="gesture-off" onClick={()=>{useStore.setState({gestures:false});window.setTimeout(()=>useStore.setState({gestures:true}),0);}}>Try camera again</button>}
      {status === "on" && (
        <button className="gesture-off" data-testid="gesture-recalibrate" onClick={() => controls.current?.recalibrate()}>
          Recalibrate
        </button>
      )}
      <button className="gesture-off" data-testid="gesture-off" onClick={() => useStore.setState({ gestures: false })}>
        Turn off gestures
      </button>
    </aside></>
  );
}
