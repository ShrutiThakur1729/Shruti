import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useStore } from "../state/store";

export default function Performance({ active = true }: { active?: boolean }) {
  const { gl, setDpr } = useThree();
  const frames = useRef<number[]>([]);
  const last = useRef(0);
  const start = useRef(performance.now());

  const quality = useStore((s) => s.quality);

  useEffect(() => {
    gl.info.autoReset = false;
    // detect software GPUs (cloud previews, weak devices) and step quality down
    try {
      const glCtx = gl.getContext();
      const ext = glCtx.getExtension("WEBGL_debug_renderer_info");
      const renderer = glCtx.getParameter(ext?.UNMASKED_RENDERER_WEBGL || glCtx.RENDERER);
      if (/swiftshader|llvmpipe|software|angle \(software/i.test(String(renderer))) {
        const st = useStore.getState();
        if (st.quality === "high") useStore.setState({ quality: "medium" });
      }
    } catch {
      /* ignore */
    }
    const maxDpr = quality === "low" ? 0.85 : quality === "medium" ? 1.15 : 1.5;
    setDpr(Math.min(window.devicePixelRatio, maxDpr));
    return () => {
      gl.info.autoReset = true;
    };
  }, [gl, setDpr, quality]);

  useEffect(() => {
    frames.current = [];
    last.current = 0;
    start.current = performance.now();
  }, [active]);

  useFrame(() => {
    if (!active) return;
    const now = performance.now();
    if (last.current && document.visibilityState === "visible")
      frames.current.push(now - last.current);
    last.current = now;
    if (now - start.current > 5000 && frames.current.length) {
      const a = frames.current;
      const sorted = [...a].sort((x, y) => x - y);
      const sum = a.reduce((s, n) => s + n, 0);
      const fps = 1000 / (sum / a.length);
      const report = {
        fps: +fps.toFixed(1),
        p95ms: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        textures: gl.info.memory.textures,
        geometries: gl.info.memory.geometries,
        renderer: gl.getContext().getParameter(gl.getContext().RENDERER),
        samples: a.length,
      };
      const node = document.querySelector<HTMLOutputElement>("#performance-report");
      if (node) {
        node.textContent = JSON.stringify(report);
        node.dataset.fps = String(report.fps);
      }
      useStore.setState({ fps: +fps.toFixed(0) });
      if (fps < 26 && gl.getPixelRatio() > 0.65)
        setDpr(Math.max(0.65, gl.getPixelRatio() - 0.1));
      frames.current = [];
      start.current = now;
    }
    gl.info.reset();
  }, -100);
  return null;
}
