import { FilesetResolver, HandLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import { input } from "./input";
import { useStore, type WorldId } from "../state/store";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const ORDER: WorldId[] = ["hello", "castle", "garden"];
const HOLD_MS = 450;
const DEADZONE = 0.09;
const LOOK_SPEED = 2.6;

export type GestureFrame = {
  hand: boolean;
  pinch: boolean;
  walking: boolean;
  x: number;
  y: number;
  event?: string;
};

const dist = (a: NormalizedLandmark, b: NormalizedLandmark) => Math.hypot(a.x - b.x, a.y - b.y);

function swipeWorld(direction: 1 | -1) {
  const st = useStore.getState();
  if (st.phase !== "world" || st.journey) return false;
  const i = ORDER.indexOf(st.world);
  const next = ORDER[(i + direction + ORDER.length) % ORDER.length];
  st.travelTo(next);
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

  const stopWalk = () => {
    if (walking) {
      input.joy.active = false;
      input.joy.x = 0;
      input.joy.y = 0;
    }
    walking = false;
  };

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
      onFrame({ hand: false, pinch: false, walking: false, x: 0.5, y: 0.5 });
      return;
    }
    const palmX = 1 - lm[9].x;
    const palmY = lm[9].y;
    const ratio = dist(lm[4], lm[8]) / Math.max(0.01, dist(lm[0], lm[9]));
    const isPinch = pinching ? ratio < 0.5 : ratio < 0.32;
    let event: string | undefined;

    history.push({ t: now, x: palmX });
    history = history.filter((h) => now - h.t < 380);
    const swing = palmX - history[0].x;
    if (!isPinch && now > cooldownUntil && Math.abs(swing) > 0.3) {
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
      const ox = palmX - 0.5;
      const oy = palmY - 0.5;
      const ex = Math.abs(ox) > DEADZONE ? ox - Math.sign(ox) * DEADZONE : 0;
      const ey = Math.abs(oy) > DEADZONE ? oy - Math.sign(oy) * DEADZONE : 0;
      input.look.dx -= ex * LOOK_SPEED * dt;
      input.look.dy -= ey * LOOK_SPEED * dt;
    }
    onFrame({ hand: true, pinch: isPinch, walking, x: palmX, y: palmY, event });
  };
  loop();

  return () => {
    cancelAnimationFrame(raf);
    stopWalk();
    hands.close();
    stream.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  };
}
