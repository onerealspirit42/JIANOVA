"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { applyShoeMaterial, partAtFace } from "./shoe-material.js";
import { COLORS, MODEL_URL, PART_IDS, partIndex, type Design, type PartId } from "./parts";

/** As frameStep in ShoeStage.tsx: the first frame of a fade must not skip it. */
const frameStep = (running: boolean, delta: number) => Math.min(delta, running ? 0.25 : 1 / 60);

type ShoeModelProps = {
  design: Design;
  /** Part to briefly light; changes of `highlightTick` trigger it. */
  highlightPart?: PartId;
  highlightTick?: number;
  /** Called when a part is clicked or tapped (not dragged). */
  onSelectPart?: (part: PartId) => void;
  reducedMotion?: boolean;
  /** Called once the shoe is on screen. */
  onReady?: () => void;
};

/** Seconds a colour change takes: it starts at once and settles softly. */
const FADE = 0.75;
/** The selection glow: a quick rise, then a long, soft fall. */
const GLOW_TIME = 1.4;
const GLOW_PEAK = 0.3;

type Lab = [number, number, number];

/** Linear sRGB to OKLab, so a fade passes through clean in-between colours. */
function toLab(c: THREE.Color): Lab {
  const l = Math.cbrt(0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b);
  const m = Math.cbrt(0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b);
  const s = Math.cbrt(0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromLab([L, a, b]: Lab, out: THREE.Color) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  out.setRGB(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  );
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
/** 0 → 1 → 0: rises over the first fifth, then falls away gently. */
const glowCurve = (p: number) => (p < 0.2 ? easeOutCubic(p / 0.2) : 1 - easeInOutCubic((p - 0.2) / 0.8));

type Fade = { from: Lab; to: Lab; t: number };

export function ShoeModel({
  design,
  highlightPart,
  highlightTick = 0,
  onSelectPart,
  reducedMotion = false,
  onReady,
}: ShoeModelProps) {
  const gltf = useGLTF(MODEL_URL);
  const invalidate = useThree((s) => s.invalidate);

  // Clone the cached scene and give it its own material, so each canvas
  // colours its own shoe.
  const shoe = useMemo(() => {
    const root = gltf.scene.clone(true);
    const meshes: THREE.Mesh[] = [];
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) meshes.push(o);
    });
    const mesh = meshes[0];
    mesh.castShadow = true;
    return { root, mesh, paint: applyShoeMaterial(mesh) };
  }, [gltf.scene]);

  // Animation state lives in a ref: it changes every frame.
  const anim = useRef<{ shoe: typeof shoe | null; fades: Fade[]; glow: { part: number; t: number } | null }>({
    shoe: null,
    fades: [],
    glow: null,
  });

  // New colours: fade each changed part from where it is now (a change in the
  // middle of a fade carries on from the colour on screen).
  useEffect(() => {
    const a = anim.current;
    const fresh = a.shoe !== shoe;
    a.shoe = shoe;
    PART_IDS.forEach((id, i) => {
      const to = toLab(new THREE.Color(COLORS[design[id]]));
      const current = shoe.paint.getColor(i);
      const old = a.fades[i];
      if (fresh || reducedMotion || !old) {
        fromLab(to, current);
        a.fades[i] = { from: to, to, t: 1 };
      } else if (old.to.some((v, k) => Math.abs(v - to[k]) > 1e-6)) {
        a.fades[i] = { from: toLab(current), to, t: 0 };
      }
    });
    invalidate();
  }, [design, shoe, reducedMotion, invalidate]);

  // Tell the stage the shoe is ready, after its first frame is drawn.
  const readyRef = useRef(onReady);
  useEffect(() => {
    readyRef.current = onReady;
  }, [onReady]);
  useEffect(() => {
    const id = requestAnimationFrame(() => readyRef.current?.());
    return () => cancelAnimationFrame(id);
  }, [shoe]);

  // Light the selected part for a moment.
  useEffect(() => {
    if (highlightTick === 0 || !highlightPart || reducedMotion) return;
    anim.current.glow = { part: partIndex(highlightPart), t: 0 };
    invalidate();
  }, [highlightTick, highlightPart, reducedMotion, invalidate]);

  const running = useRef(false);
  useFrame((_, rawDelta) => {
    const delta = frameStep(running.current, rawDelta);
    const a = anim.current;
    let moving = false;
    a.fades.forEach((f, i) => {
      if (f.t >= 1) return;
      f.t = Math.min(1, f.t + delta / FADE);
      const e = easeOutCubic(f.t);
      fromLab([0, 1, 2].map((k) => f.from[k] + (f.to[k] - f.from[k]) * e) as Lab, shoe.paint.getColor(i));
      moving = true;
    });
    const g = a.glow;
    if (g) {
      g.t += delta / GLOW_TIME;
      if (g.t >= 1) {
        shoe.paint.glow(-1, 0);
        a.glow = null;
      } else {
        shoe.paint.glow(g.part, GLOW_PEAK * glowCurve(g.t));
        moving = true;
      }
    }
    running.current = moving;
    if (moving) invalidate();
  });

  const partAt = (event: ThreeEvent<PointerEvent | MouseEvent>) => {
    const index = partAtFace(shoe.mesh, event.face);
    return index >= 0 ? PART_IDS[index] : null;
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!onSelectPart || event.delta > 4) return; // a drag, not a tap
    const part = partAt(event);
    if (!part) return;
    event.stopPropagation();
    onSelectPart(part);
  };

  return (
    <primitive
      object={shoe.root}
      onClick={onSelectPart ? handleClick : undefined}
      onPointerOver={
        onSelectPart
          ? (e: ThreeEvent<PointerEvent>) => {
              // The canvas shows a hand to grab (jianova.css); over a part, a pointer to pick it.
              if (partAt(e)) (e.nativeEvent.target as HTMLElement).style.cursor = "pointer";
            }
          : undefined
      }
      onPointerOut={
        onSelectPart
          ? (e: ThreeEvent<PointerEvent>) => {
              (e.nativeEvent.target as HTMLElement).style.cursor = "";
            }
          : undefined
      }
    />
  );
}

useGLTF.preload(MODEL_URL);
