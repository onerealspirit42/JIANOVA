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
import {
  PauseIcon,
  PlayIcon,
  TurnLeftIcon,
  TurnRightIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "./icons";
import type { Design, PartId } from "./parts";

export type ViewMessages = {
  group: string;
  turnLeft: string;
  turnRight: string;
  zoomIn: string;
  zoomOut: string;
  pause: string;
  play: string;
};

export type StageMessages = {
  loading: string;
  unavailable: string;
  view: ViewMessages;
};

export type ShoeStageProps = {
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

/** Commands the buttons send to the 3D view. */
type ViewCommands = {
  turn: (radians: number) => void;
  zoom: (factor: number) => void;
};

/** The parts of OrbitControls the view driver uses. */
type Controls = { target: THREE.Vector3; update: () => void };

const UP = new THREE.Vector3(0, 1, 0);
const MIN_DISTANCE = 3;
const MAX_DISTANCE = 14;

/**
 * Turns and zooms the camera for the on-screen buttons, so the view can be
 * changed without dragging (keyboard, switch access, one finger). Moves ease
 * out from the current position and can be interrupted by a drag or another
 * press; with reduced motion they apply at once.
 */
function ViewDriver({
  commandsRef,
  reducedMotion,
}: {
  commandsRef: { current: ViewCommands | null };
  reducedMotion: boolean;
}) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as Controls | null;
  const invalidate = useThree((s) => s.invalidate);
  const pending = useRef({ angle: 0, logZoom: 0 });

  useEffect(() => {
    commandsRef.current = {
      turn: (radians) => {
        pending.current.angle += radians;
        invalidate();
      },
      zoom: (factor) => {
        pending.current.logZoom += Math.log(factor);
        invalidate();
      },
    };
    return () => {
      commandsRef.current = null;
    };
  }, [commandsRef, invalidate]);

  useFrame((_, delta) => {
    const p = pending.current;
    if (Math.abs(p.angle) < 1e-4 && Math.abs(p.logZoom) < 1e-4) {
      p.angle = 0;
      p.logZoom = 0;
      return;
    }
    const k = reducedMotion ? 1 : 1 - Math.exp(-delta * 9);
    const angle = p.angle * k;
    const logZoom = p.logZoom * k;
    p.angle -= angle;
    p.logZoom -= logZoom;

    const target = controls?.target ?? TARGET;
    const offset = camera.position.clone().sub(target).applyAxisAngle(UP, angle);
    offset.setLength(
      THREE.MathUtils.clamp(
        offset.length() * Math.exp(logZoom),
        MIN_DISTANCE,
        MAX_DISTANCE,
      ),
    );
    camera.position.copy(target).add(offset);
    camera.lookAt(target);
    controls?.update();
    invalidate();
  });

  return null;
}

const stageButton =
  "grid size-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition-[background-color,scale] duration-150 ease-out hover:bg-white/20 active:scale-[0.96]";

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
  // The 3D view is "ready" once WebGL starts; buttons appear only then, so
  // they never sit on top of the "could not be shown" message.
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const commandsRef = useRef<ViewCommands | null>(null);
  // Render continuously only while turning on screen; otherwise render on
  // demand (after a change or interaction), which saves battery.
  const canTurn = autoRotate && !reducedMotion;
  const turning = canTurn && !paused;
  const frameloop = turning && inView ? "always" : "demand";
  const unavailable = <StageMessage>{messages.unavailable}</StageMessage>;
  const view = messages.view;

  return (
    <div ref={ref} className={className}>
      <StageErrorBoundary fallback={unavailable}>
        <div role="img" aria-label={label} className="absolute inset-0">
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
            onCreated={() => setReady(true)}
          >
            <Scene
              design={design}
              interactive={interactive}
              turning={turning}
              highlightPart={highlightPart}
              highlightTick={highlightTick}
              onSelectPart={onSelectPart}
              reducedMotion={reducedMotion}
              commandsRef={commandsRef}
            />
          </Canvas>
        </div>

        {ready && interactive && (
          <div
            role="group"
            aria-label={view.group}
            className="absolute end-4 top-4 flex gap-2"
          >
            <button type="button" aria-label={view.turnLeft} className={stageButton} onClick={() => commandsRef.current?.turn(-Math.PI / 6)}>
              <TurnLeftIcon />
            </button>
            <button type="button" aria-label={view.turnRight} className={stageButton} onClick={() => commandsRef.current?.turn(Math.PI / 6)}>
              <TurnRightIcon />
            </button>
            <button type="button" aria-label={view.zoomIn} className={stageButton} onClick={() => commandsRef.current?.zoom(0.8)}>
              <ZoomInIcon />
            </button>
            <button type="button" aria-label={view.zoomOut} className={stageButton} onClick={() => commandsRef.current?.zoom(1.25)}>
              <ZoomOutIcon />
            </button>
          </div>
        )}

        {ready && canTurn && (
          <button
            type="button"
            aria-label={paused ? view.play : view.pause}
            className={`${stageButton} absolute end-0 bottom-0 sm:end-4 sm:bottom-4`}
            onClick={() => setPaused((p) => !p)}
          >
            <span className="grid [&>svg]:col-start-1 [&>svg]:row-start-1 [&>svg]:transition-[opacity,scale,filter] [&>svg]:duration-300 [&>svg]:ease-[cubic-bezier(0.2,0,0,1)]">
              <PauseIcon className={paused ? "scale-25 opacity-0 blur-[4px]" : "opacity-100"} />
              <PlayIcon className={paused ? "opacity-100" : "scale-25 opacity-0 blur-[4px]"} />
            </span>
          </button>
        )}
      </StageErrorBoundary>
    </div>
  );
}

function Scene({
  design,
  interactive,
  turning,
  highlightPart,
  highlightTick,
  onSelectPart,
  reducedMotion,
  commandsRef,
}: {
  design: Design;
  interactive: boolean;
  turning: boolean;
  highlightPart?: PartId;
  highlightTick?: number;
  onSelectPart?: (part: PartId) => void;
  reducedMotion: boolean;
  commandsRef: { current: ViewCommands | null };
}) {
  return (
    <>
          <FitCamera />
          {interactive && (
            <ViewDriver commandsRef={commandsRef} reducedMotion={reducedMotion} />
          )}
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
            minDistance={MIN_DISTANCE}
            maxDistance={MAX_DISTANCE}
            minPolarAngle={0.25}
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
    </>
  );
}
