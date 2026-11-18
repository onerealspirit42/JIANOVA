"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  COLORS,
  MODEL_URL,
  PART_IDS,
  partForMesh,
  type Design,
  type PartId,
} from "./parts";

type ShoeModelProps = {
  design: Design;
  /** Part to briefly highlight; changes of `highlightTick` trigger it. */
  highlightPart?: PartId;
  highlightTick?: number;
  /** Called when a customizable part is clicked (not dragged). */
  onSelectPart?: (part: PartId) => void;
  reducedMotion?: boolean;
};

const FLASH = new THREE.Color("#8f6fb8");

export function ShoeModel({
  design,
  highlightPart,
  highlightTick = 0,
  onSelectPart,
  reducedMotion = false,
}: ShoeModelProps) {
  const gltf = useGLTF(MODEL_URL);
  const invalidate = useThree((s) => s.invalidate);
  const flash = useRef({ part: highlightPart, amount: 0 });

  // Clone the cached scene and give every mesh its own material, so changes
  // here never leak into other canvases that use the same model.
  const { scene, materials } = useMemo(() => {
    const root = gltf.scene.clone(true);
    const byPart = Object.fromEntries(
      PART_IDS.map((id) => [id, [] as THREE.MeshStandardMaterial[]]),
    ) as Record<PartId, THREE.MeshStandardMaterial[]>;

    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const material = (obj.material as THREE.MeshStandardMaterial).clone();
      obj.material = material;
      obj.castShadow = true;
      const part = partForMesh(obj.name);
      if (part) byPart[part].push(material);
    });
    return { scene: root, materials: byPart };
  }, [gltf.scene]);

  // three.js materials are mutated every frame, so keep them in a ref.
  const materialsRef = useRef(materials);
  useEffect(() => {
    materialsRef.current = materials;
  }, [materials]);

  const targets = useMemo(
    () =>
      Object.fromEntries(
        PART_IDS.map((id) => [id, new THREE.Color(COLORS[design[id]])]),
      ) as Record<PartId, THREE.Color>,
    [design],
  );

  // Start a short highlight whenever the selection changes.
  useEffect(() => {
    if (highlightTick === 0 || !highlightPart || reducedMotion) return;
    flash.current = { part: highlightPart, amount: 0.35 };
    invalidate();
  }, [highlightTick, highlightPart, reducedMotion, invalidate]);

  useEffect(() => invalidate(), [targets, invalidate]);

  useFrame((_, delta) => {
    const mats = materialsRef.current;
    let moving = false;
    const step = reducedMotion ? 1 : 1 - Math.exp(-delta * 9);

    for (const id of PART_IDS) {
      for (const material of mats[id]) {
        const target = targets[id];
        material.color.lerp(target, step);
        const d =
          Math.abs(material.color.r - target.r) +
          Math.abs(material.color.g - target.g) +
          Math.abs(material.color.b - target.b);
        if (d > 0.002) moving = true;
        else material.color.copy(target);
      }
    }

    const f = flash.current;
    if (f.part) {
      f.amount = Math.max(0, f.amount - delta * 0.9);
      for (const id of PART_IDS) {
        for (const material of mats[id]) {
          material.emissive.copy(FLASH);
          material.setValues({ emissiveIntensity: id === f.part ? f.amount : 0 });
        }
      }
      if (f.amount > 0) moving = true;
      else f.part = undefined;
    }

    if (moving) invalidate();
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!onSelectPart || event.delta > 4) return; // ignore drags
    const part = partForMesh(event.object.name);
    if (!part) return;
    event.stopPropagation();
    onSelectPart(part);
  };

  return (
    <primitive
      object={scene}
      onClick={onSelectPart ? handleClick : undefined}
      onPointerOver={
        onSelectPart
          ? (e: ThreeEvent<PointerEvent>) => {
              if (partForMesh(e.object.name))
                document.body.style.cursor = "pointer";
            }
          : undefined
      }
      onPointerOut={
        onSelectPart
          ? () => {
              document.body.style.cursor = "";
            }
          : undefined
      }
    />
  );
}

useGLTF.preload(MODEL_URL);
