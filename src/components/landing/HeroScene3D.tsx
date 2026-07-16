import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, RoundedBox, Torus } from '@react-three/drei';
import * as THREE from 'three';

function FloatingBook() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.6}>
      <group ref={ref} position={[0, 0, 0]}>
        <RoundedBox args={[1.8, 2.4, 0.35]} radius={0.08} position={[0, 0, 0]}>
          <meshStandardMaterial color="#1FB6D4" metalness={0.2} roughness={0.5} />
        </RoundedBox>
        <RoundedBox args={[1.55, 2.15, 0.06]} radius={0.04} position={[0, 0, 0.2]}>
          <meshStandardMaterial color="#f8fafc" metalness={0.1} roughness={0.7} />
        </RoundedBox>
        <RoundedBox args={[1.5, 0.08, 0.3]} radius={0.02} position={[0, 0.8, 0.18]}>
          <meshStandardMaterial color="#0F2D6B" metalness={0.4} roughness={0.3} />
        </RoundedBox>
        <RoundedBox args={[1.5, 0.08, 0.3]} radius={0.02} position={[0, -0.8, 0.18]}>
          <meshStandardMaterial color="#0F2D6B" metalness={0.4} roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0.3, 0.24]}>
          <boxGeometry args={[0.5, 0.12, 0.02]} />
          <meshStandardMaterial color="#0F2D6B" metalness={0.5} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.3, 0.24]}>
          <boxGeometry args={[0.12, 0.5, 0.02]} />
          <meshStandardMaterial color="#0F2D6B" metalness={0.5} roughness={0.2} />
        </mesh>
      </group>
    </Float>
  );
}

function Stethoscope() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6) * 0.15;
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.9 + 1) * 0.12;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.8}>
      <group ref={ref} position={[2.3, 0.4, -0.6]} rotation={[0, -0.5, 0.3]}>
        <Torus args={[0.55, 0.07, 12, 32]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#0F2D6B" metalness={0.7} roughness={0.2} />
        </Torus>
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
          <meshStandardMaterial color="#1FB6D4" metalness={0.6} roughness={0.25} />
        </mesh>
        <Sphere args={[0.18]} position={[0.5, -0.55, 0]}>
          <meshStandardMaterial color="#1FB6D4" metalness={0.5} roughness={0.2} />
        </Sphere>
        <Sphere args={[0.18]} position={[-0.5, -0.55, 0]}>
          <meshStandardMaterial color="#1FB6D4" metalness={0.5} roughness={0.2} />
        </Sphere>
      </group>
    </Float>
  );
}

function MedicalCross() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2) * 0.2;
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.0 + 2) * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={ref} position={[-2.2, -0.2, 0.3]}>
        <mesh>
          <boxGeometry args={[0.5, 0.15, 0.08]} />
          <meshStandardMaterial color="#10B981" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.15, 0.5, 0.08]} />
          <meshStandardMaterial color="#10B981" metalness={0.3} roughness={0.4} />
        </mesh>
      </group>
    </Float>
  );
}

function Tablet() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4 + 3) * 0.2;
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.7 + 1.5) * 0.08;
    }
  });

  return (
    <Float speed={1.6} rotationIntensity={0.3} floatIntensity={0.5}>
      <RoundedBox ref={ref} args={[1.3, 1.7, 0.1]} radius={0.1} position={[-2, -0.4, 0.6]} rotation={[0.2, 0.4, -0.1]}>
        <meshStandardMaterial color="#1e293b" metalness={0.3} roughness={0.4} />
      </RoundedBox>
      <mesh position={[-2, -0.4, 0.66]} rotation={[0.2, 0.4, -0.1]}>
        <planeGeometry args={[1.1, 1.5]} />
        <meshStandardMaterial color="#0F2D6B" emissive="#1FB6D4" emissiveIntensity={0.15} metalness={0.1} roughness={0.9} />
      </mesh>
    </Float>
  );
}

function Brain() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + 2) * 0.3;
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.6 + 3) * 0.12;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.7}>
      <Sphere ref={ref} args={[0.5, 20, 20]} position={[1.6, 1.9, -1.1]}>
        <MeshDistortMaterial color="#EC4899" metalness={0.15} roughness={0.6} distort={0.25} speed={1.5} />
      </Sphere>
    </Float>
  );
}

function DNAHelix() {
  const groupRef = useRef<THREE.Group>(null);
  const pairs = useMemo(() => {
    const items = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const y = i * 0.18 - 1;
      items.push({
        a: { x: Math.cos(angle) * 0.35, y, z: Math.sin(angle) * 0.35 },
        b: { x: Math.cos(angle + Math.PI) * 0.35, y, z: Math.sin(angle + Math.PI) * 0.35 },
        i
      });
    }
    return items;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.4;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[-1.9, 1.3, -0.9]}>
      {pairs.map((p) => (
        <group key={p.i}>
          <mesh position={[p.a.x, p.a.y, p.a.z]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={p.i % 2 === 0 ? '#1FB6D4' : '#0F2D6B'} emissive={p.i % 2 === 0 ? '#1FB6D4' : '#0F2D6B'} emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[p.b.x, p.b.y, p.b.z]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={p.i % 2 === 0 ? '#F472B6' : '#EC4899'} emissive={p.i % 2 === 0 ? '#F472B6' : '#EC4899'} emissiveIntensity={0.25} />
          </mesh>
          {p.i % 2 === 0 && (
            <mesh position={[(p.a.x + p.b.x) / 2, p.a.y, (p.a.z + p.b.z) / 2]} rotation={[0, 0, Math.atan2(p.a.z - p.b.z, p.a.x - p.b.x) + Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, Math.sqrt((p.a.x - p.b.x) ** 2 + (p.a.z - p.b.z) ** 2), 4]} />
              <meshStandardMaterial color="#ffffff" opacity={0.3} transparent />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function FloatingCrosses() {
  const ref = useRef<THREE.Group>(null);
  const data = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 6; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 6,
        y: (Math.random() - 0.5) * 5,
        z: (Math.random() - 0.5) * 3 - 0.5,
        s: 0.06 + Math.random() * 0.08,
        speed: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    data.forEach((d, i) => {
      const child = ref.current!.children[i];
      if (!child) return;
      child.position.y = d.y + Math.sin(state.clock.elapsedTime * d.speed + d.phase) * 0.4;
      child.rotation.z = Math.sin(state.clock.elapsedTime * d.speed + d.phase) * 0.3;
    });
  });

  return (
    <group ref={ref}>
      {data.map((d, i) => (
        <group key={i} position={[d.x, d.y, d.z]} scale={d.s}>
          <mesh>
            <boxGeometry args={[1, 0.3, 0.05]} />
            <meshStandardMaterial color="#1FB6D4" emissive="#1FB6D4" emissiveIntensity={0.4} transparent opacity={0.7} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.3, 1, 0.05]} />
            <meshStandardMaterial color="#1FB6D4" emissive="#1FB6D4" emissiveIntensity={0.4} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Particles() {
  const count = 60;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.03;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#1FB6D4" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function Scene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const x = THREE.MathUtils.lerp(groupRef.current.rotation.y, state.mouse.x * 0.35, 0.04);
      const y = THREE.MathUtils.lerp(groupRef.current.rotation.x, -state.mouse.y * 0.2, 0.04);
      groupRef.current.rotation.y = x;
      groupRef.current.rotation.x = y;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-3, 3, 3]} intensity={0.8} color="#1FB6D4" />
      <pointLight position={[3, -2, 2]} intensity={0.5} color="#EC4899" />
      <pointLight position={[0, -3, 3]} intensity={0.4} color="#10B981" />

      <group ref={groupRef}>
        <FloatingBook />
        <Stethoscope />
        <MedicalCross />
        <Tablet />
        <Brain />
        <DNAHelix />
        <FloatingCrosses />
        <Particles />
      </group>
    </>
  );
}

export default function HeroScene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.5], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Scene />
    </Canvas>
  );
}
