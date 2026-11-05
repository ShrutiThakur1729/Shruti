import { FilesetResolver, HandLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import { input } from "./input";
import { useStore, type WorldId } from "../state/store";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const ORDER: WorldId[] = ["hello", "castle", "garden"];
const HOLD_MS = 450;
const DEADZONE = 0.14;
const LOOK_SPEED = 2.2;
const CALIB_FRAMES = 36;

export type GestureFrame = {
  hand: boolean;
  pinch: boolean;
  walking: boolean;
  x: number;
  y: number;
  calibrating: number | null;
  center: { x: number; y: number } | null;
  event?: string;
};

const dist = (a: NormalizedLandmark, b: NormalizedLandmark) => Math.hypot(a.x - b.x, a.y - b.y);

function swipeWorld(direction: 1 | -1) {
  const st = useStore.getState();
  if (st.phase !== "world" || st.journey) return false;
  const i = ORDER.indexOf(st.world);
  st.travelTo(ORDER[(i + direction + ORDER.length) % ORDER.length]);
  return true;
}

function select() {
  const st = useStore.getState();
  if (st.panel) {
    st.closePanel();
    return "Closed";
  }
  if (st.nearby && !st.journey) {
    st.interactNow(st.nearby.id);
    return "Selected";
  }
  return "Nothing nearby";
}

export async function startGestures(
  video: HTMLVideoElement,
  onFrame: (f: GestureFrame) => void,
  onCameraReady: () => void
) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 320, height: 240, facingMode: "user" },
    audio: false,
  });
  let hands: HandLandmarker;
  try {
    video.srcObject = stream;
    await video.play();
    onCameraReady();
    const vision = await FilesetResolver.forVisionTasks(WASM);
    hands = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
      runningMode: "VIDEO",
      numHands: 1,
    });
  } catch (err) {
    stream.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
    throw err;
  }

  let raf = 0;
  let lastVideoTime = -1;
  let lastT = performance.now();
  let pinching = false;
  let pinchStart = 0;
  let walking = false;
  let cooldownUntil = 0;
  let history: { t: number; x: number }[] = [];
  let calib: { x: number; y: number } | null = null;
  let samples: { x: number; y: number }[] = [];
  let size = 0.2;

  const stopWalk = () => {
    if (walking) {
      input.joy.active = false;
      input.joy.x = 0;
      input.joy.y = 0;
    }
    walking = false;
  };

  const frame = (hand: boolean, x: number, y: number, event?: string) =>
    onFrame({
      hand,
      pinch: pinching,
      walking,
      x,
      y,
      calibrating: calib ? null : samples.length / CALIB_FRAMES,
      center: calib,
      event,
    });

  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (video.readyState < 2 || video.currentTime === lastVideoTime) return;
    lastVideoTime = video.currentTime;
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    const lm = hands.detectForVideo(video, now).landmarks[0];
    if (!lm) {
      stopWalk();
      pinching = false;
      history = [];
      if (!calib) samples = [];
      frame(false, 0.5, 0.5);
      return;
    }
    const palmX = 1 - lm[9].x;
    const palmY = lm[9].y;
    size += (Math.max(0.04, dist(lm[0], lm[9])) - size) * 0.3;

    if (!calib) {
      const mean = samples.reduce((m, s) => ({ x: m.x + s.x / samples.length, y: m.y + s.y / samples.length }), { x: 0, y: 0 });
      if (samples.length && Math.hypot(palmX - mean.x, palmY - mean.y) > size * 0.5) samples = [];
      samples.push({ x: palmX, y: palmY });
      if (samples.length >= CALIB_FRAMES) {
        calib = { x: mean.x, y: mean.y };
        frame(true, palmX, palmY, "Calibrated");
      } else frame(true, palmX, palmY);
      return;
    }

    const ratio = dist(lm[4], lm[8]) / size;
    const isPinch = pinching ? ratio < 0.5 : ratio < 0.32;
    let event: string | undefined;

    history.push({ t: now, x: palmX });
    history = history.filter((h) => now - h.t < 380);
    const swing = palmX - history[0].x;
    if (!isPinch && now > cooldownUntil && Math.abs(swing) > Math.max(0.22, size * 1.6)) {
      if (swipeWorld(swing > 0 ? 1 : -1)) event = swing > 0 ? "Next world" : "Previous world";
      cooldownUntil = now + 1800;
      history = [];
    }

    if (isPinch && !pinching) pinchStart = now;
    if (isPinch && now - pinchStart > HOLD_MS && !walking) {
      walking = true;
      input.joy.active = true;
      input.joy.x = 0;
      input.joy.y = -1;
    }
    if (!isPinch && pinching) {
      if (!walking) event = select();
      stopWalk();
    }
    pinching = isPinch;

    if (now > cooldownUntil - 1200) {
      const reach = size * 2.5;
      const ox = Math.max(-1, Math.min(1, (palmX - calib.x) / reach));
      const oy = Math.max(-1, Math.min(1, (palmY - calib.y) / reach));
      const ex = Math.abs(ox) > DEADZONE ? ox - Math.sign(ox) * DEADZONE : 0;
      const ey = Math.abs(oy) > DEADZONE ? oy - Math.sign(oy) * DEADZONE : 0;
      input.look.dx -= ex * Math.abs(ex) * LOOK_SPEED * dt * 1.6;
      input.look.dy -= ey * Math.abs(ey) * LOOK_SPEED * dt * 1.2;
    }
    frame(true, palmX, palmY, event);
  };
  loop();

  return {
    stop: () => {
      cancelAnimationFrame(raf);
      stopWalk();
      hands.close();
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    },
    recalibrate: () => {
      calib = null;
      samples = [];
      stopWalk();
    },
  };
}
