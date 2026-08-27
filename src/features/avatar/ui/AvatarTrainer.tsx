"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { AvatarState, getAvatarVisualState } from "@/features/avatar";
import type { MovementPattern } from "@/features/workouts/exerciseLibrary";

/**
 * ==================================================================
 * AVATAR TRAINER — versione animata del corpo procedurale
 * ==================================================================
 * Estende la stessa filosofia di Avatar3D.tsx (nessun asset esterno,
 * primitive geometriche) aggiungendo però VERI snodi articolari
 * (anca, ginocchio, spalla) organizzati in una gerarchia di gruppi
 * annidati, necessari per poter animare un movimento credibile e non
 * solo scalare le proporzioni.
 *
 * Le proporzioni (spalle/petto/vita) restano guidate da muscleLevel/
 * fatLevel esattamente come nella scheda atleta — qui aggiungiamo
 * solo il movimento sopra la stessa identità visiva.
 * ==================================================================
 */

interface AvatarTrainerProps {
  state: AvatarState;
  pattern: MovementPattern;
  /** Durata di una singola ripetizione, in secondi (tempo di esecuzione) */
  repDurationSeconds?: number;
}

function AnimatedHumanoid({ state, pattern, repDurationSeconds = 2.4 }: Required<AvatarTrainerProps>) {
  const visual = getAvatarVisualState(state);

  const shoulderWidth = 0.85 + (visual.muscleTier - 1) * 0.09;
  const chestScale = 0.88 + (visual.muscleTier - 1) * 0.07;
  const waistScale = 0.85 + (visual.fatTier - 1) * 0.13;
  const armScale = 0.9 + (visual.muscleTier - 1) * 0.09;

  // Snodi principali
  const rootRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null); // pivot all'anca — per l'hip-hinge
  const armUpperLRef = useRef<THREE.Group>(null); // pivot alla spalla
  const armUpperRRef = useRef<THREE.Group>(null);
  const thighLRef = useRef<THREE.Group>(null); // pivot all'anca
  const thighRRef = useRef<THREE.Group>(null);
  const shinLRef = useRef<THREE.Group>(null); // pivot al ginocchio
  const shinRRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const repsPerSecond = 1 / repDurationSeconds;
    const t = clock.getElapsedTime() * repsPerSecond * Math.PI * 2;
    // Fase 0→1→0 morbida (coseno), 0 = posizione di riposo
    const phase = (1 - Math.cos(t)) / 2;

    if (!rootRef.current || !torsoRef.current) return;

    switch (pattern) {
      case "SQUAT": {
        rootRef.current.position.y = -0.22 * phase;
        torsoRef.current.rotation.x = 0.28 * phase; // leggera inclinazione in avanti
        if (thighLRef.current) thighLRef.current.rotation.x = 0.85 * phase;
        if (thighRRef.current) thighRRef.current.rotation.x = 0.85 * phase;
        if (shinLRef.current) shinLRef.current.rotation.x = -1.05 * phase;
        if (shinRRef.current) shinRRef.current.rotation.x = -1.05 * phase;
        if (armUpperLRef.current) armUpperLRef.current.rotation.x = -0.6 * phase;
        if (armUpperRRef.current) armUpperRRef.current.rotation.x = -0.6 * phase;
        break;
      }
      case "PUSH": {
        torsoRef.current.rotation.x = 0.08 * phase;
        if (armUpperLRef.current) armUpperLRef.current.rotation.x = -1.3 + 1.3 * phase;
        if (armUpperRRef.current) armUpperRRef.current.rotation.x = -1.3 + 1.3 * phase;
        rootRef.current.position.y = -0.04 * phase;
        break;
      }
      case "PULL": {
        torsoRef.current.rotation.x = -0.06 * phase;
        if (armUpperLRef.current) armUpperLRef.current.rotation.x = -1.2 * phase;
        if (armUpperRRef.current) armUpperRRef.current.rotation.x = -1.2 * phase;
        break;
      }
      case "CORE": {
        // Movimento contenuto: isometria con leggero "respiro"
        torsoRef.current.rotation.x = 0.06 * phase;
        rootRef.current.position.y = -0.015 * phase;
        break;
      }
      case "CARDIO": {
        rootRef.current.position.y = Math.abs(Math.sin(t)) * 0.12;
        if (armUpperLRef.current) armUpperLRef.current.rotation.z = 0.9 * phase;
        if (armUpperRRef.current) armUpperRRef.current.rotation.z = -0.9 * phase;
        if (thighLRef.current) thighLRef.current.rotation.z = 0.35 * phase;
        if (thighRRef.current) thighRRef.current.rotation.z = -0.35 * phase;
        break;
      }
    }
  });

  return (
    <group ref={rootRef} position={[0, -1, 0]}>
      {/* Bacino/anca — origine della gerarchia gambe+torso */}
      <group position={[0, 1.0, 0]}>
        {/* Torso (ruota per l'hip-hinge) */}
        <group ref={torsoRef}>
          <mesh position={[0, 0.17, 0]} castShadow>
            <boxGeometry args={[0.4 * waistScale, 0.34, 0.24 * waistScale]} />
            <meshStandardMaterial color="#2A2F3A" roughness={0.55} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[0.48 * chestScale, 0.42, 0.26 * chestScale]} />
            <meshStandardMaterial color="#2A2F3A" roughness={0.55} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.78, 0]} castShadow>
            <boxGeometry args={[0.62 * shoulderWidth, 0.14, 0.24]} />
            <meshStandardMaterial color="#2A2F3A" roughness={0.55} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.93, 0]}>
            <cylinderGeometry args={[0.08, 0.09, 0.12, 12]} />
            <meshStandardMaterial color="#2A2F3A" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.15, 0]} castShadow>
            <sphereGeometry args={[0.22, 24, 24]} />
            <meshStandardMaterial color="#2A2F3A" roughness={0.6} />
          </mesh>

          {/* Braccia — pivot alla spalla */}
          <group ref={armUpperLRef} position={[-0.35 * shoulderWidth, 0.78, 0]}>
            <mesh position={[0, -0.28, 0]} castShadow>
              <capsuleGeometry args={[0.09 * armScale, 0.5, 4, 12]} />
              <meshStandardMaterial color="#232833" roughness={0.6} />
            </mesh>
          </group>
          <group ref={armUpperRRef} position={[0.35 * shoulderWidth, 0.78, 0]}>
            <mesh position={[0, -0.28, 0]} castShadow>
              <capsuleGeometry args={[0.09 * armScale, 0.5, 4, 12]} />
              <meshStandardMaterial color="#232833" roughness={0.6} />
            </mesh>
          </group>
        </group>

        {/* Gambe — pivot all'anca, con ginocchio annidato */}
        <group ref={thighLRef} position={[-0.14, 0, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <capsuleGeometry args={[0.115, 0.4, 4, 12]} />
            <meshStandardMaterial color="#232833" roughness={0.6} />
          </mesh>
          <group ref={shinLRef} position={[0, -0.5, 0]}>
            <mesh position={[0, -0.24, 0.02]} castShadow>
              <capsuleGeometry args={[0.1, 0.4, 4, 12]} />
              <meshStandardMaterial color="#232833" roughness={0.6} />
            </mesh>
          </group>
        </group>
        <group ref={thighRRef} position={[0.14, 0, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <capsuleGeometry args={[0.115, 0.4, 4, 12]} />
            <meshStandardMaterial color="#232833" roughness={0.6} />
          </mesh>
          <group ref={shinRRef} position={[0, -0.5, 0]}>
            <mesh position={[0, -0.24, 0.02]} castShadow>
              <capsuleGeometry args={[0.1, 0.4, 4, 12]} />
              <meshStandardMaterial color="#232833" roughness={0.6} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Pedana */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.9, 48]} />
        <meshStandardMaterial color="#1B1F28" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.82, 0.9, 48]} />
        <meshBasicMaterial color="#4FD1A5" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

export default function AvatarTrainer({ state, pattern, repDurationSeconds = 2.4 }: AvatarTrainerProps) {
  return (
    <div className="h-80 w-full overflow-hidden rounded-md border border-ink-line bg-ink sm:h-96">
      <Canvas camera={{ position: [0, 0.7, 2.8], fov: 42 }} shadows>
        <ambientLight intensity={0.55} />
        <directionalLight position={[2, 3, 2]} intensity={0.9} castShadow />
        <pointLight position={[-2, 1, -1]} intensity={0.5} color="#4FD1A5" />
        <pointLight position={[2, 0.5, -1.5]} intensity={0.35} color="#E3A857" />
        <AnimatedHumanoid state={state} pattern={pattern} repDurationSeconds={repDurationSeconds} />
        <OrbitControls
          enablePan={false}
          minDistance={1.8}
          maxDistance={3.8}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.8}
          target={[0, 0.6, 0]}
        />
      </Canvas>
    </div>
  );
}
