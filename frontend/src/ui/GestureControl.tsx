import { useEffect, useRef, useState } from "react";
import { useStore } from "../state/store";
import type { GestureFrame } from "../systems/gestures";

type Status = "loading" | "on" | "error";

export default function GestureControl() {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [frame, setFrame] = useState<GestureFrame | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(0);

  useEffect(() => {
    let stop: (() => void) | null = null;
    let cancelled = false;
    import("../systems/gestures")
      .then(({ startGestures }) =>
        startGestures(video.current!, (f) => {
          setFrame(f);
          if (f.event) {
            setToast(f.event);
            window.clearTimeout(toastTimer.current);
            toastTimer.current = window.setTimeout(() => setToast(""), 1400);
          }
        })
      )
      .then((s) => {
        if (cancelled) s();
        else {
          stop = s;
          setStatus("on");
        }
      })
      .catch(() => !cancelled && setStatus("error"));
    const timeout = window.setTimeout(() => !stop && !cancelled && setStatus((s) => (s === "loading" ? "error" : s)), 20000);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      stop?.();
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  const off = () => useStore.setState({ gestures: false });
  const label =
    status === "loading"
      ? "Waking the camera…"
      : status === "error"
        ? "Camera unavailable — allow camera access and try again."
        : !frame?.hand
          ? "Show your hand to the camera"
          : frame.walking
            ? "Walking forward"
            : frame.pinch
              ? "Pinch — release to select, hold to walk"
              : "Hand found";

  return (
    <aside className="gesture-widget" data-testid="gesture-widget" aria-live="polite">
      <div className="gesture-cam">
        <video ref={video} muted playsInline data-testid="gesture-video" />
        {frame?.hand && (
          <span
            className={`gesture-dot ${frame.pinch ? "pinch" : ""}`}
            style={{ left: `${frame.x * 100}%`, top: `${frame.y * 100}%` }}
          />
        )}
        <span className="gesture-deadzone" aria-hidden />
      </div>
      <p className={`gesture-status ${status}`} data-testid="gesture-status">{label}</p>
      <p className="gesture-help">Move hand to look · pinch to select · hold pinch to walk · swipe to switch world</p>
      {toast && <span className="gesture-toast" data-testid="gesture-toast">{toast}</span>}
      <button className="gesture-off" data-testid="gesture-off" onClick={off}>
        Turn off gestures
      </button>
    </aside>
  );
}
