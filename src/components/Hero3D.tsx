import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

// 3D Capsule Pill
function CapsulePill(props: any) {
  const meshRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime()) * 0.3;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={meshRef} {...props}>
      {/* Top half - red/cyan */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.8, 32]} />
        <meshStandardMaterial color="#1FB6D4" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#1FB6D4" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Bottom half - white */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.8, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.5} />
      </mesh>
      <mesh position={[0, -0.8, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.5} />
      </mesh>
    </group>
  );
}

// 3D Medical Cross
function MedicalCross(props: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  return (
    <group {...props}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshStandardMaterial color="#ef4444" roughness={0.2} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshStandardMaterial color="#ef4444" roughness={0.2} />
      </mesh>
    </group>
  );
}

// 3D DNA Helix representation
function DNAHelix(props: any) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  const count = 15;
  const dots = Array.from({ length: count });

  return (
    <group ref={groupRef} {...props}>
      {dots.map((_, i) => {
        const y = (i - count / 2) * 0.25;
        const angle = i * 0.5;
        const radius = 0.6;
        const x1 = Math.cos(angle) * radius;
        const z1 = Math.sin(angle) * radius;
        const x2 = -Math.cos(angle) * radius;
        const z2 = -Math.sin(angle) * radius;

        return (
          <group key={i} position={[0, y, 0]}>
            {/* Sphere 1 */}
            <mesh position={[x1, 0, z1]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#1FB6D4" roughness={0.1} />
            </mesh>
            {/* Connection bar */}
            <mesh position={[(x1 + x2) / 2, 0, (z1 + z2) / 2]} rotation={[0, 0, angle]}>
              <boxGeometry args={[radius * 2, 0.02, 0.02]} />
              <meshStandardMaterial color="#cccccc" roughness={0.5} />
            </mesh>
            {/* Sphere 2 */}
            <mesh position={[x2, 0, z2]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Floating Molecules
function Molecule(props: any) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    }
  });

  return (
    <group ref={ref} {...props}>
      {/* Center atom */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#1FB6D4" roughness={0.1} metalness={0.5} />
      </mesh>
      {/* Connecting bonds & Outer atoms */}
      <group position={[0.4, 0.4, 0]}>
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      <group position={[-0.4, -0.4, 0]}>
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      <group position={[-0.4, 0.4, 0.4]}>
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#1FB6D4" />
        </mesh>
      </group>
    </group>
  );
}

export default function Hero3D() {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const support = !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
      setHasWebGL(support);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    // Elegant fallback SVG
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <div className="absolute inset-0 bg-accent/5 rounded-full filter blur-3xl animate-pulse" />
        <svg className="w-80 h-80 text-accent relative z-10" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" className="animate-spin" style={{ animationDuration: "25s" }} />
          <path d="M70,100 Q100,50 130,100 T190,100" stroke="#1FB6D4" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
          <circle cx="100" cy="100" r="30" fill="#0F2D6B" stroke="currentColor" strokeWidth="2" />
          <path d="M92,100 H108 M100,92 V108" stroke="#1FB6D4" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full h-[450px] lg:h-[550px] relative cursor-grab active:cursor-grabbing">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(31,182,212,0.12),transparent_60%)] pointer-events-none" />

      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#1FB6D4" />

        <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
          {/* Main central DNA double helix */}
          <DNAHelix position={[0, 0, 0]} scale={1.2} />
        </Float>

        <Float speed={1.5} rotationIntensity={1} floatIntensity={1.5}>
          {/* Left flying capsule pill */}
          <CapsulePill position={[-2.2, 1.2, 0.5]} scale={0.7} />
        </Float>

        <Float speed={2.5} rotationIntensity={2} floatIntensity={2}>
          {/* Right flying medical cross */}
          <MedicalCross position={[2.2, -0.8, 0.5]} scale={0.7} />
        </Float>

        <Float speed={1.8} rotationIntensity={1.2} floatIntensity={1.8}>
          {/* Top-right floating molecules */}
          <Molecule position={[1.8, 1.4, -0.5]} scale={0.9} />
        </Float>

        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
      </Canvas>
    </div>
  );
}