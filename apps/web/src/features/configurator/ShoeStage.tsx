"use client";

import {
  Component,
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import { ShoeModel } from "./ShoeModel";
import { StageMessage } from "./StageMessage";
import type { Design, PartId } from "./parts";

export type StageMessages = {
  loading: string;
  unavailable: string;
};

type ShoeStageProps = {
  design: Design;
  messages: StageMessages;
  /** Allow rotate and zoom with mouse, touch and keyboard. */
  interactive?: boolean;
  /** Slowly turn the shoe (disabled when the user prefers reduced motion). */
  autoRotate?: boolean;
  highlightPart?: PartId;
  highlightTick?: number;
  onSelectPart?: (part: PartId) => void;
  /** Accessible description of what the 3D view shows. */
  label: string;
  className?: string;
};

/** Shoe length plus breathing room, used to fit the camera to any screen. */
const FIT_WIDTH = 2.84 * 1.25;
const FIT_HEIGHT = 1.2 * 2.6;
/** Initial viewing direction: a three-quarter view from the outer side, toe forward. */
const VIEW_DIRECTION = new THREE.Vector3(0.62, 0.3, 0.72).normalize();
const TARGET = new THREE.Vector3(0, 0.05, 0);

/**
 * Places the camera so the whole shoe fits the canvas, whatever its shape:
 * wide desktop panels and narrow phone screens alike. Runs on resize.
 */
function FitCamera() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = size.width / Math.max(size.height, 1);
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const tanH = tanV * aspect;
    const distance = Math.max(FIT_WIDTH / 2 / tanH, FIT_HEIGHT / 2 / tanV);
    camera.position.copy(TARGET).addScaledVector(VIEW_DIRECTION, distance);
    camera.lookAt(TARGET);
    invalidate();
  }, [camera, size.width, size.height, invalidate]);

  return null;
}

/** Slowly turns its children around the vertical axis, like a turntable. */
function Turntable({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (active && group.current) group.current.rotation.y += delta * 0.28;
  });
  return <group ref={group}>{children}</group>;
}

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** Whether the element is on screen, so off-screen canvases stop rendering. */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, inView] as const;
}

/** Shows a message instead of crashing the page if the model fails to load. */
class StageErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("3D stage failed to load", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function ShoeStage({
  design,
  messages,
  interactive = false,
  autoRotate = false,
  highlightPart,
  highlightTick,
  onSelectPart,
  label,
  className,
}: ShoeStageProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  // Render continuously only while turning on screen; otherwise render on
  // demand (after a change or interaction), which saves battery.
  const turning = autoRotate && !reducedMotion;
  const frameloop = turning && inView ? "always" : "demand";
  const unavailable = <StageMessage>{messages.unavailable}</StageMessage>;

  return (
    <div ref={ref} role="img" aria-label={label} className={className}>
      <StageErrorBoundary fallback={unavailable}>
        <Canvas
          frameloop={frameloop}
          dpr={[1, 2]}
          shadows={false}
          camera={{ position: [3, 1.5, 3.5], fov: 28, near: 0.1, far: 60 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          fallback={unavailable}
        >
          <FitCamera />
          <Suspense fallback={null}>
            <group position={[0, -0.55, 0]}>
              <Turntable active={turning}>
                <ShoeModel
                  design={design}
                  highlightPart={highlightPart}
                  highlightTick={highlightTick}
                  onSelectPart={onSelectPart}
                  reducedMotion={reducedMotion}
                />
                <ContactShadows
                  position={[0, 0, 0]}
                  opacity={0.55}
                  scale={6}
                  blur={2.4}
                  far={1.5}
                  resolution={512}
                  color="#05020a"
                  frames={1}
                />
              </Turntable>
            </group>

            {/* Studio lighting built locally: no external HDR download. */}
            <ambientLight intensity={0.35} />
            <directionalLight position={[-3, 5, 4]} intensity={1.6} />
            <Environment resolution={256} frames={1}>
              <Lightformer
                form="rect"
                intensity={4}
                position={[0, 4, 1]}
                scale={[8, 3, 1]}
                rotation-x={Math.PI / 2}
              />
              <Lightformer
                form="rect"
                intensity={2.6}
                position={[-5, 1.5, 2]}
                scale={[3, 4, 1]}
                rotation-y={Math.PI / 2.5}
              />
              <Lightformer
                form="rect"
                intensity={1.6}
                position={[5, 1, -1]}
                scale={[3, 4, 1]}
                rotation-y={-Math.PI / 2.5}
              />
              <Lightformer
                form="ring"
                intensity={1.2}
                color="#b9a4d6"
                position={[0, 1, -6]}
                scale={4}
              />
            </Environment>
          </Suspense>

          <OrbitControls
            makeDefault
            target={TARGET}
            enabled={interactive}
            enablePan={false}
            enableZoom={interactive}
            enableDamping
            dampingFactor={0.08}
            minDistance={3}
            maxDistance={14}
            minPolarAngle={0.25}
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
        </Canvas>
      </StageErrorBoundary>
    </div>
  );
}
