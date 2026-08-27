"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { AvatarState, getAvatarVisualState, describeAvatarState } from "@/features/avatar";
import { StatBar } from "./AvatarPreview";

/**
 * ==================================================================
 * AVATAR 3D — corpo procedurale (nessun asset esterno)
 * ==================================================================
 * Non carichiamo un modello 3D pronto (.glb): costruiamo il corpo da
 * primitive geometriche (sfere, capsule, box), i cui GRUPPI vengono
 * scalati in tempo reale in base a muscleLevel/fatLevel — la stessa
 * identica logica di tier usata nella versione 2D (getAvatarVisualState),
 * solo applicata ad assi X/Z invece che a scaleX CSS.
 *
 * Perché procedurale e non un modello scaricato: zero dipendenze da
 * servizi esterni o asset da licenziare, funziona offline, e questa
 * struttura è pensata per essere sostituita in futuro da un vero
 * modello rigged con morph target (es. generato da un selfie) senza
 * cambiare l'interfaccia del componente — il resto dell'app continua
 * a passargli semplicemente un AvatarState.
 * ==================================================================
 */

interface Avatar3DProps {
  state: AvatarState;
  athleteName?: string;
}

function HumanoidBody({ state }: { state: AvatarState }) {
  const visual = getAvatarVisualState(state);

  const targetShoulder = 0.85 + (visual.muscleTier - 1) * 0.09;
  const targetChest = 0.88 + (visual.muscleTier - 1) * 0.07;
  const targetWaist = 0.85 + (visual.fatTier - 1) * 0.13;
  const targetArm = 0.9 + (visual.muscleTier - 1) * 0.09;

  const shoulderRef = useRef<THREE.Group>(null);
  const chestRef = useRef<THREE.Group>(null);
  const waistRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const bodyMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const waistMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  const baseColor = new THREE.Color("#2A2F3A");
  const growthColor = new THREE.Color("#4FD1A5");
  const cautionColor = new THREE.Color("#E2725B");

  useFrame((clock, delta) => {
    const lerpFactor = Math.min(1, delta * 4);

    for (const [ref, target] of [
      [shoulderRef, targetShoulder],
      [chestRef, targetChest],
      [waistRef, targetWaist],
      [armLRef, targetArm],
      [armRRef, targetArm],
    ] as const) {
      if (!ref.current) continue;
      ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, target, lerpFactor);
      ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, target, lerpFactor);
    }

    // Colore del busto: più definizione muscolare = più tinta "growth"
    if (bodyMaterialRef.current) {
      const muscleMix = visual.muscleTier / 5;
      bodyMaterialRef.current.color.lerpColors(baseColor, growthColor, muscleMix * 0.35);
    }
    // Colore della vita: massa grassa alta vira verso "caution"
    if (waistMaterialRef.current) {
      const fatMix = Math.max(0, (visual.fatTier - 3) / 2);
      waistMaterialRef.current.color.lerpColors(baseColor, cautionColor, fatMix * 0.4);
    }

    // Anello sulla pedana: pulsa più intensamente con più costanza (stamina)
    if (ringRef.current) {
      const pulse = 0.4 + Math.sin(clock.clock.elapsedTime * 1.5) * 0.15 * (visual.staminaTier / 5);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  return (
    <group position={[0, -1, 0]}>
      {/* Testa */}
      <mesh position={[0, 2.05, 0]} castShadow>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color="#2A2F3A" roughness={0.6} />
      </mesh>

      {/* Collo */}
      <mesh position={[0, 1.83, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.12, 12]} />
        <meshStandardMaterial color="#2A2F3A" roughness={0.6} />
      </mesh>

      {/* Spalle */}
      <group ref={shoulderRef} position={[0, 1.68, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.62, 0.14, 0.24]} />
          <meshStandardMaterial ref={bodyMaterialRef} color="#2A2F3A" roughness={0.55} metalness={0.1} />
        </mesh>
      </group>

      {/* Petto/torso */}
      <group ref={chestRef} position={[0, 1.45, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.48, 0.42, 0.26]} />
          <meshStandardMaterial color="#2A2F3A" roughness={0.55} metalness={0.1} />
        </mesh>
      </group>

      {/* Vita/addome — reagisce al fatLevel */}
      <group ref={waistRef} position={[0, 1.08, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.34, 0.24]} />
          <meshStandardMaterial ref={waistMaterialRef} color="#2A2F3A" roughness={0.55} metalness={0.1} />
        </mesh>
      </group>

      {/* Braccia */}
      <group ref={armLRef} position={[-0.42, 1.5, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.09, 0.55, 4, 12]} />
          <meshStandardMaterial color="#232833" roughness={0.6} />
        </mesh>
      </group>
      <group ref={armRRef} position={[0.42, 1.5, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.09, 0.55, 4, 12]} />
          <meshStandardMaterial color="#232833" roughness={0.6} />
        </mesh>
      </group>

      {/* Gambe */}
      <mesh position={[-0.14, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.75, 4, 12]} />
        <meshStandardMaterial color="#232833" roughness={0.6} />
      </mesh>
      <mesh position={[0.14, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.75, 4, 12]} />
        <meshStandardMaterial color="#232833" roughness={0.6} />
      </mesh>

      {/* Pedana */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.85, 48]} />
        <meshStandardMaterial color="#1B1F28" roughness={0.9} />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.78, 0.85, 48]} />
        <meshBasicMaterial color="#4FD1A5" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

export default function Avatar3D({ state, athleteName = "Il tuo atleta" }: Avatar3DProps) {
  const description = describeAvatarState(state);

  return (
    <div className="w-full max-w-sm rounded-lg border border-ink-line bg-ink-panel bg-grid bg-grid p-6">
      <div className="flex items-center justify-between border-b border-ink-line pb-3">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-paper-muted">
          Scheda atleta · 3D
        </span>
      </div>

      <div className="mt-3">
        <h3 className="font-display text-xl font-semibold text-paper">{athleteName}</h3>
        <p className="font-mono text-xs text-growth">{description}</p>
      </div>

      <div className="mt-4 h-72 w-full overflow-hidden rounded-md border border-ink-line/60 bg-ink">
        <Canvas camera={{ position: [0, 0.9, 2.6], fov: 40 }} shadows>
          <ambientLight intensity={0.55} />
          <directionalLight position={[2, 3, 2]} intensity={0.9} castShadow />
          <pointLight position={[-2, 1, -1]} intensity={0.5} color="#4FD1A5" />
          <pointLight position={[2, 0.5, -1.5]} intensity={0.35} color="#E3A857" />
          <HumanoidBody state={state} />
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={1.8}
            maxDistance={3.5}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
            autoRotate
            autoRotateSpeed={1.2}
            target={[0, 0.5, 0]}
          />
        </Canvas>
      </div>
      <p className="mt-2 text-center font-mono text-[10px] text-paper-muted">
        Trascina per ruotare · scroll per zoom
      </p>

      <div className="mt-4 space-y-2 border-t border-ink-line pt-4">
        <StatBar label="Muscolo" value={state.muscleLevel} color="bg-growth" />
        <StatBar label="Massa grassa" value={state.fatLevel} color="bg-caution" />
        <StatBar label="Costanza" value={state.staminaLevel} color="bg-effort" />
      </div>
    </div>
  );
}
