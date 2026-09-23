import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, Environment, Lightformer, Text3D, type FontData } from "@react-three/drei";
import helvetiker from "three/examples/fonts/helvetiker_bold.typeface.json";
import * as THREE from "three";

const DRIPS = [
  [-5.15, -0.92, 0.08, 0.62],
  [-3.36, -1.05, 0.06, 0.42],
  [-1.32, -1.02, 0.06, 0.58],
  [0.92, -0.98, 0.08, 0.46],
  [3.18, -1.04, 0.08, 0.64],
  [5.15, -0.94, 0.06, 0.44],
] as const;

function ChromeMaterial() {
  return (
    <meshPhysicalMaterial
      color="#d7dce0"
      metalness={1}
      roughness={0.08}
      clearcoat={1}
      clearcoatRoughness={0.04}
      envMapIntensity={2.8}
    />
  );
}

function Wordmark() {
  const group = useMemo(() => new THREE.Group(), []);
  const { pointer } = useThree();

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, pointer.x * 0.12, 4.5, dt);
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, -pointer.y * 0.07, 4.5, dt);
    group.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.035;
  });

  return (
    <primitive object={group}>
      <Center position={[0, 0.12, 0]}>
        <Text3D
          font={helvetiker as unknown as FontData}
          size={1.45}
          height={0.42}
          curveSegments={14}
          bevelEnabled
          bevelThickness={0.18}
          bevelSize={0.11}
          bevelOffset={0}
          bevelSegments={9}
          letterSpacing={-0.035}
          castShadow
        >
          DIEGCUTZ
          <ChromeMaterial />
        </Text3D>
      </Center>
      {DRIPS.map(([x, y, z, length], index) => (
        <group key={x} position={[x, y, z]}>
          <mesh scale={[0.13, length, 0.16]} castShadow>
            <capsuleGeometry args={[1, 1.25, 8, 12]} />
            <ChromeMaterial />
          </mesh>
          <mesh position={[0, -length - 0.15, 0]} scale={index % 2 === 0 ? 0.2 : 0.16} castShadow>
            <sphereGeometry args={[1, 20, 20]} />
            <ChromeMaterial />
          </mesh>
        </group>
      ))}
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
        camera={{ position: [0, 0.05, 10.6], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 5, 7]} intensity={2.8} castShadow />
        <pointLight position={[-5, -1, 4]} intensity={45} color="#26d9ff" distance={12} />
        <Suspense fallback={null}>
          <Wordmark />
          <Environment resolution={256}>
            <Lightformer intensity={5} position={[0, 5, 4]} scale={[9, 2, 1]} />
            <Lightformer intensity={3} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[5, 1, 1]} color="#26d9ff" />
            <Lightformer intensity={4} position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[6, 1, 1]} />
            <Lightformer intensity={2} position={[0, -4, 2]} scale={[8, 1, 1]} />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
}