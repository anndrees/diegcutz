import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const windowed = (progress: number, start: number, end: number) => {
  const edge = Math.min(0.08, (end - start) * 0.3);
  return Math.min(clamp01((progress - start) / edge), clamp01((end - progress) / edge));
};

function ChromeMaterial({ dark = false }: { dark?: boolean }) {
  return <meshPhysicalMaterial color={dark ? "#22282d" : "#dfe5e8"} metalness={1} roughness={0.12} clearcoat={1} envMapIntensity={4.5} />;
}

function Scissors({ progress }: { progress: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const bladeA = useRef<THREE.Group>(null);
  const bladeB = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  useFrame((state, rawDelta) => {
    const object = group.current;
    if (!object) return;
    const dt = Math.min(rawDelta, 0.05);
    const p = progress.current;
    const visible = windowed(p, 0.08, 0.42);
    const local = clamp01((p - 0.08) / 0.34);
    object.visible = visible > 0.01;
    object.position.x = THREE.MathUtils.damp(object.position.x, THREE.MathUtils.lerp(-viewport.width * 0.66, viewport.width * 0.48, local), 5, dt);
    object.position.y = THREE.MathUtils.damp(object.position.y, 1.5 - local * 2.7 + Math.sin(state.clock.elapsedTime * 1.2) * 0.18, 5, dt);
    object.rotation.z = -0.55 + local * 1.7;
    object.rotation.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.42;
    object.scale.setScalar(visible * Math.min(1.25, viewport.width / 8));
    const open = 0.17 + Math.abs(Math.sin(local * Math.PI * 5)) * 0.34;
    if (bladeA.current) bladeA.current.rotation.z = open;
    if (bladeB.current) bladeB.current.rotation.z = -open;
  });

  return (
    <group ref={group} rotation-x={0.2}>
      <group ref={bladeA}>
        <mesh position={[1.05, 0, 0]}><boxGeometry args={[2.25, 0.13, 0.12]} /><ChromeMaterial /></mesh>
      </group>
      <group ref={bladeB}>
        <mesh position={[1.05, 0, 0]}><boxGeometry args={[2.25, 0.13, 0.12]} /><ChromeMaterial /></mesh>
      </group>
      <mesh rotation-y={Math.PI / 2}><cylinderGeometry args={[0.13, 0.13, 0.28, 24]} /><ChromeMaterial dark /></mesh>
      <mesh position={[-0.58, 0.42, 0]}><torusGeometry args={[0.42, 0.11, 16, 36]} /><ChromeMaterial /></mesh>
      <mesh position={[-0.58, -0.42, 0]}><torusGeometry args={[0.42, 0.11, 16, 36]} /><ChromeMaterial /></mesh>
      <mesh position={[-0.25, 0, 0]}><boxGeometry args={[0.72, 0.15, 0.13]} /><ChromeMaterial /></mesh>
    </group>
  );
}

function Clipper({ progress }: { progress: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  useFrame((state, rawDelta) => {
    const object = group.current;
    if (!object) return;
    const dt = Math.min(rawDelta, 0.05);
    const p = progress.current;
    const visible = windowed(p, 0.34, 0.7);
    const local = clamp01((p - 0.34) / 0.36);
    object.visible = visible > 0.01;
    object.position.x = THREE.MathUtils.damp(object.position.x, THREE.MathUtils.lerp(viewport.width * 0.62, -viewport.width * 0.5, local), 5, dt);
    object.position.y = THREE.MathUtils.damp(object.position.y, -1.5 + local * 3.2 + Math.cos(state.clock.elapsedTime) * 0.16, 5, dt);
    object.rotation.z = 0.35 - local * 1.15;
    object.rotation.y += dt * 0.45;
    object.scale.setScalar(visible * Math.min(1.2, viewport.width / 8));
  });
  return (
    <group ref={group}>
      <RoundedBox args={[1.05, 2.35, 0.56]} radius={0.28} smoothness={5}><ChromeMaterial /></RoundedBox>
      <RoundedBox args={[1.24, 0.34, 0.62]} radius={0.08} smoothness={3} position={[0, 1.2, 0]}><ChromeMaterial dark /></RoundedBox>
      {Array.from({ length: 9 }, (_, index) => <mesh key={index} position={[-0.48 + index * 0.12, 1.45, 0]}><boxGeometry args={[0.065, 0.38, 0.4]} /><ChromeMaterial /></mesh>)}
      <mesh position={[0, 0.25, 0.31]}><capsuleGeometry args={[0.12, 0.36, 8, 18]} /><meshStandardMaterial color="#26d9ff" emissive="#26d9ff" emissiveIntensity={1.4} /></mesh>
    </group>
  );
}

function Comb({ progress }: { progress: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  useFrame((state, rawDelta) => {
    const object = group.current;
    if (!object) return;
    const dt = Math.min(rawDelta, 0.05);
    const p = progress.current;
    const visible = windowed(p, 0.58, 0.9);
    const local = clamp01((p - 0.58) / 0.32);
    object.visible = visible > 0.01;
    object.position.x = THREE.MathUtils.damp(object.position.x, THREE.MathUtils.lerp(-viewport.width * 0.55, viewport.width * 0.48, local), 5, dt);
    object.position.y = Math.sin(local * Math.PI * 2) * 1.8 + Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
    object.rotation.z = -0.6 + local * 1.3;
    object.rotation.x = Math.sin(state.clock.elapsedTime * 0.55) * 0.35;
    object.scale.setScalar(visible * Math.min(1.1, viewport.width / 9));
  });
  return (
    <group ref={group}>
      <RoundedBox args={[3.2, 0.42, 0.2]} radius={0.16} smoothness={4}><ChromeMaterial dark /></RoundedBox>
      {Array.from({ length: 17 }, (_, index) => <mesh key={index} position={[-1.45 + index * 0.18, -0.52, 0]}><boxGeometry args={[0.075, 0.72 + (index % 2) * 0.14, 0.16]} /><ChromeMaterial /></mesh>)}
    </group>
  );
}

function Razor({ progress }: { progress: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  useFrame((state, rawDelta) => {
    const object = group.current;
    if (!object) return;
    const dt = Math.min(rawDelta, 0.05);
    const p = progress.current;
    const visible = windowed(p, 0.72, 1);
    const local = clamp01((p - 0.72) / 0.28);
    object.visible = visible > 0.01;
    object.position.x = THREE.MathUtils.damp(object.position.x, THREE.MathUtils.lerp(viewport.width * 0.55, -viewport.width * 0.2, local), 5, dt);
    object.position.y = THREE.MathUtils.damp(object.position.y, 1.2 - local * 2.8, 5, dt);
    object.rotation.z = 0.8 - local * 1.8;
    object.rotation.y = Math.cos(state.clock.elapsedTime * 0.7) * 0.45;
    object.scale.setScalar(visible * Math.min(1.15, viewport.width / 8));
  });
  return (
    <group ref={group}>
      <RoundedBox args={[2.45, 0.38, 0.28]} radius={0.16} smoothness={4} position={[-.72, 0, 0]}><ChromeMaterial dark /></RoundedBox>
      <mesh position={[1, 0.12, 0]}><boxGeometry args={[1.35, 0.5, 0.09]} /><ChromeMaterial /></mesh>
      <mesh position={[0.28, 0, 0]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.13, 0.13, 0.38, 24]} /><ChromeMaterial /></mesh>
    </group>
  );
}

function Scene({ reducedMotion }: { reducedMotion: boolean }) {
  const progress = useRef(0);
  useFrame(() => {
    const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.current = reducedMotion ? 0 : window.scrollY / range;
  });
  if (reducedMotion) return null;
  return <><Scissors progress={progress} /><Clipper progress={progress} /><Comb progress={progress} /><Razor progress={progress} /></>;
}

export function ScrollBarberObjects() {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return (
    <div className="scroll-tools-3d" aria-hidden="true">
      <Canvas dpr={[1, 1.35]} camera={{ position: [0, 0, 11], fov: 38 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 6, 8]} intensity={5} />
        <pointLight position={[-5, 1, 5]} intensity={28} color="#26d9ff" distance={14} />
        <Suspense fallback={null}><Scene reducedMotion={reducedMotion} /><Environment resolution={128}><Lightformer intensity={8} position={[0, 5, 4]} scale={[12, 3, 1]} /><Lightformer intensity={5} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[7, 2, 1]} color="#26d9ff" /><Lightformer intensity={7} position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} /></Environment></Suspense>
      </Canvas>
    </div>
  );
}