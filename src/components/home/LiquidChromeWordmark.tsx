import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, Environment, Lightformer, Text3D, type FontData } from "@react-three/drei";
import helvetiker from "three/examples/fonts/helvetiker_bold.typeface.json";
import * as THREE from "three";

const LETTERS = ["D", "I", "E", "G", "C", "U", "T", "Z"];
const LETTER_WIDTHS: Record<string, number> = { D: 1.42, I: 0.72, E: 1.28, G: 1.48, C: 1.42, U: 1.45, T: 1.3, Z: 1.3 };

function ChromeMaterial() {
  return (
    <meshPhysicalMaterial
      color="#eef2f4"
      metalness={1}
      roughness={0.1}
      clearcoat={1}
      clearcoatRoughness={0.02}
      envMapIntensity={5.4}
    />
  );
}

function Wordmark() {
  const group = useMemo(() => new THREE.Group(), []);
  const { pointer, viewport } = useThree();
  const positions = useMemo(() => {
    const gap = 0.24;
    const total = LETTERS.reduce((sum, letter) => sum + LETTER_WIDTHS[letter], 0) + gap * (LETTERS.length - 1);
    let cursor = -total / 2;
    return LETTERS.map(letter => {
      const width = LETTER_WIDTHS[letter];
      const x = cursor;
      cursor += width + gap;
      return x;
    });
  }, []);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const time = state.clock.elapsedTime;
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, pointer.x * 0.34 + Math.sin(time * 0.42) * 0.055, 5.8, dt);
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, -pointer.y * 0.19 + Math.cos(time * 0.48) * 0.035, 5.8, dt);
    group.rotation.z = THREE.MathUtils.damp(group.rotation.z, pointer.x * -0.025, 4.5, dt);
    group.position.x = THREE.MathUtils.damp(group.position.x, pointer.x * Math.min(0.38, viewport.width * 0.018), 4.8, dt);
    group.position.y = THREE.MathUtils.damp(group.position.y, pointer.y * 0.16 + Math.sin(time * 0.9) * 0.09, 4.8, dt);
    group.position.z = THREE.MathUtils.damp(group.position.z, Math.sin(time * 0.7) * 0.24 + Math.abs(pointer.x) * 0.18, 4.8, dt);
    const targetScale = Math.min(1.02, Math.max(0.48, viewport.width / 11.8)) * (1 + Math.sin(time * 0.72) * 0.018);
    group.scale.setScalar(THREE.MathUtils.damp(group.scale.x, targetScale, 6, dt));
  });

  return (
    <primitive object={group}>
      <Center position={[0, 0.08, 0]}>
        <group>
          {LETTERS.map((letter, index) => (
            <Text3D
              key={`${letter}-${index}`}
              position={[positions[index], Math.sin(index * 1.7) * 0.035, index % 2 === 0 ? 0.04 : -0.02]}
              font={helvetiker as unknown as FontData}
              size={1.5}
              height={0.72}
              curveSegments={24}
              bevelEnabled
              bevelThickness={0.32}
              bevelSize={0.22}
              bevelOffset={-0.055}
              bevelSegments={18}
              scale={[1, 1.06 + (index % 3) * 0.015, 1.12]}
              castShadow
            >
              {letter}
              <ChromeMaterial />
            </Text3D>
          ))}
        </group>
      </Center>
    </primitive>
  );
}

export function LiquidChromeWordmark() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    try {
      const canvas = document.createElement("canvas");
      setWebgl(Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")));
    } catch {
      setWebgl(false);
    }
    return () => query.removeEventListener("change", update);
  }, []);

  if (!webgl || reducedMotion) {
    return <div className="liquid-wordmark-fallback" aria-label="DIEGCUTZ">DIEGCUTZ</div>;
  }

  return (
    <div className="liquid-wordmark" role="img" aria-label="DIEGCUTZ en cromo líquido tridimensional">
      <Canvas
        dpr={[1, 1.5]}
        shadows
        camera={{ position: [0, 0.05, 12.1], fov: 35 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.8} />
        <hemisphereLight intensity={1.6} color="#f7f7f4" groundColor="#33424a" />
        <directionalLight position={[3, 5, 7]} intensity={6.5} castShadow />
        <pointLight position={[-5, -1, 4]} intensity={45} color="#26d9ff" distance={12} />
        <Suspense fallback={null}>
          <Wordmark />
          <Environment resolution={256}>
            <Lightformer intensity={9} position={[0, 5, 4]} scale={[10, 3, 1]} />
            <Lightformer intensity={6} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} color="#26d9ff" />
            <Lightformer intensity={9} position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[7, 2, 1]} />
            <Lightformer intensity={7} position={[0, -4, 2]} scale={[9, 2, 1]} />
            <Lightformer intensity={6} position={[0, 0, 6]} scale={[4, 8, 1]} />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
}