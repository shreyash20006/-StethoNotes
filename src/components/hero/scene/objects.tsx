import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// ============================================
// COMPONENT: OrbitingObjects (12 custom primitives)
// Procedurally modeled low-poly medical meshes.
// Ambient floating and circular orbital paths.
// ============================================

interface OrbitingItemProps {
  index: number;
  total: number;
}

// 1. Brain (TorusKnot - organic complexity)
function BrainMesh() {
  return (
    <mesh castShadow receiveShadow>
      <torusKnotGeometry args={[0.5, 0.18, 64, 8, 3, 4]} />
      <meshPhysicalMaterial
        color="#F472B6"
        emissive="#F472B6"
        emissiveIntensity={0.25}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
}

// 2. Capsule (Capsule geometry mock via Cylinder & Spheres)
function CapsuleMesh() {
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      {/* Top half - Red */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.6, 16]} />
        <meshPhysicalMaterial color="#EF4444" clearcoat={1.0} metalness={0.1} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshPhysicalMaterial color="#EF4444" clearcoat={1.0} metalness={0.1} roughness={0.1} />
      </mesh>
      {/* Bottom half - White */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.6, 16]} />
        <meshPhysicalMaterial color="#F4F8FC" clearcoat={1.0} metalness={0.1} roughness={0.1} />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshPhysicalMaterial color="#F4F8FC" clearcoat={1.0} metalness={0.1} roughness={0.1} />
      </mesh>
    </group>
  );
}

// 3. Medical Cross
function CrossMesh() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.9, 0.25, 0.25]} />
        <meshPhysicalMaterial color="#1FB6D4" emissive="#1FB6D4" emissiveIntensity={0.4} roughness={0.1} />
      </mesh>
      <mesh castShadow>
        <boxGeometry args={[0.25, 0.9, 0.25]} />
        <meshPhysicalMaterial color="#1FB6D4" emissive="#1FB6D4" emissiveIntensity={0.4} roughness={0.1} />
      </mesh>
    </group>
  );
}

// 4. Extruded Heart Shape
const heartShape = new THREE.Shape();
heartShape.moveTo(0, 0.3);
heartShape.bezierCurveTo(0, 0.7, -0.5, 0.7, -0.5, 0.3);
heartShape.bezierCurveTo(-0.5, -0.2, 0, -0.6, 0, -0.9);
heartShape.bezierCurveTo(0, -0.6, 0.5, -0.2, 0.5, 0.3);
heartShape.bezierCurveTo(0.5, 0.7, 0, 0.7, 0, 0.3);

const extrudeSettings = {
  depth: 0.22,
  bevelEnabled: true,
  bevelSegments: 4,
  steps: 1,
  bevelSize: 0.05,
  bevelThickness: 0.05,
};

function HeartMesh() {
  return (
    <mesh castShadow scale={[0.8, 0.8, 0.8]}>
      <extrudeGeometry args={[heartShape, extrudeSettings]} />
      <meshPhysicalMaterial
        color="#EC4899"
        emissive="#EC4899"
        emissiveIntensity={0.3}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
        roughness={0.2}
      />
    </mesh>
  );
}

// 5. DNA Helix
function DNAMesh() {
  const rungs = 8;
  const nodes = [];
  for (let i = 0; i < rungs; i++) {
    const t = (i / rungs) * Math.PI * 1.8;
    const x = Math.sin(t) * 0.45;
    const z = Math.cos(t) * 0.45;
    const y = (i / rungs) * 1.2 - 0.6;
    nodes.push({ x, y, z, tx: -x, ty: y, tz: -z });
  }

  return (
    <group scale={[0.7, 0.7, 0.7]}>
      {nodes.map((node, i) => (
        <group key={i}>
          {/* Outer Sphere Strand A */}
          <mesh position={[node.x, node.y, node.z]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshPhysicalMaterial color="#3B82F6" emissive="#3B82F6" emissiveIntensity={0.2} />
          </mesh>
          {/* Outer Sphere Strand B */}
          <mesh position={[node.tx, node.ty, node.tz]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshPhysicalMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={0.2} />
          </mesh>
          {/* Connecting Rung */}
          <mesh position={[0, node.y, 0]} rotation={[0, 0, Math.atan2(node.z, node.x)]}>
            <cylinderGeometry args={[0.02, 0.02, node.x * 2, 8]} />
            <meshPhysicalMaterial color="#F4F8FC" opacity={0.6} transparent />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// 6. Skull (Low-Poly representation)
function SkullMesh() {
  return (
    <group scale={[0.8, 0.8, 0.8]}>
      {/* Cranium */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshPhysicalMaterial color="#F4F8FC" roughness={0.4} clearcoat={0.5} />
      </mesh>
      {/* Jaw */}
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[0.26, 0.28, 0.32]} />
        <meshPhysicalMaterial color="#F4F8FC" roughness={0.4} />
      </mesh>
      {/* Eye Socket L */}
      <mesh position={[-0.14, 0.06, 0.32]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshPhysicalMaterial color="#0A1F4D" roughness={0.9} />
      </mesh>
      {/* Eye Socket R */}
      <mesh position={[0.14, 0.06, 0.32]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshPhysicalMaterial color="#0A1F4D" roughness={0.9} />
      </mesh>
    </group>
  );
}

// 7. Stethoscope
function StethoscopeMesh() {
  return (
    <group scale={[0.8, 0.8, 0.8]} rotation={[0.5, 0, 0.2]}>
      {/* Loop tubing */}
      <mesh>
        <torusGeometry args={[0.36, 0.04, 8, 32]} />
        <meshPhysicalMaterial color="#0A1F4D" roughness={0.5} />
      </mesh>
      {/* Chestpiece */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.08, 16]} />
        <meshPhysicalMaterial color="#1FB6D4" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Earpieces */}
      <mesh position={[0, 0.36, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
        <meshPhysicalMaterial color="#1FB6D4" metalness={0.8} />
      </mesh>
    </group>
  );
}

// 8. Microscope
function MicroscopeMesh() {
  return (
    <group scale={[0.65, 0.65, 0.65]} rotation={[0, 0.5, 0]}>
      {/* Base */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.08, 16]} />
        <meshPhysicalMaterial color="#0A1F4D" metalness={0.6} />
      </mesh>
      {/* Arm */}
      <mesh position={[-0.2, 0, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 12]} />
        <meshPhysicalMaterial color="#1FB6D4" metalness={0.4} />
      </mesh>
      {/* Eyepiece / Body */}
      <mesh position={[0.02, 0.22, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.08, 0.08, 0.45, 12]} />
        <meshPhysicalMaterial color="#F4F8FC" metalness={0.8} />
      </mesh>
    </group>
  );
}

// 9. Prescription Pad
function PrescriptionMesh() {
  return (
    <group scale={[0.8, 0.8, 0.8]} rotation={[0.4, -0.3, 0.1]}>
      {/* Board */}
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.85, 0.04]} />
        <meshPhysicalMaterial color="#94A3B8" roughness={0.6} />
      </mesh>
      {/* Paper Sheet */}
      <mesh position={[0, 0.02, 0.03]}>
        <boxGeometry args={[0.5, 0.72, 0.015]} />
        <meshPhysicalMaterial color="#F8FAFC" roughness={0.9} />
      </mesh>
      {/* Clip */}
      <mesh position={[0, 0.38, 0.04]}>
        <boxGeometry args={[0.24, 0.08, 0.06]} />
        <meshPhysicalMaterial color="#1FB6D4" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

// 10. Graduation Cap
function GraduationCapMesh() {
  return (
    <group scale={[0.8, 0.8, 0.8]} rotation={[0.2, 0.5, -0.1]}>
      {/* Top Board */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.9, 0.04, 0.9]} />
        <meshPhysicalMaterial color="#0A1F4D" roughness={0.6} clearcoat={0.2} />
      </mesh>
      {/* Skull Base */}
      <mesh>
        <cylinderGeometry args={[0.3, 0.32, 0.22, 16]} />
        <meshPhysicalMaterial color="#0F2D6B" roughness={0.5} />
      </mesh>
    </group>
  );
}

// 11. Medical File Stack
function FileStackMesh() {
  return (
    <group scale={[0.8, 0.8, 0.8]}>
      {/* File 1 */}
      <mesh position={[0, -0.1, 0]} rotation={[0, 0.1, 0]}>
        <boxGeometry args={[0.65, 0.12, 0.85]} />
        <meshPhysicalMaterial color="#0F2D6B" clearcoat={0.3} />
      </mesh>
      {/* File 2 */}
      <mesh position={[0.04, 0.04, 0.02]} rotation={[0, -0.15, 0]}>
        <boxGeometry args={[0.62, 0.1, 0.82]} />
        <meshPhysicalMaterial color="#1FB6D4" clearcoat={0.3} />
      </mesh>
      {/* File 3 */}
      <mesh position={[-0.02, 0.15, -0.04]} rotation={[0, 0.25, 0]}>
        <boxGeometry args={[0.6, 0.08, 0.8]} />
        <meshPhysicalMaterial color="#F4F8FC" clearcoat={0.3} />
      </mesh>
    </group>
  );
}

// 12. Digital Tablet
function TabletMesh() {
  return (
    <group scale={[0.8, 0.8, 0.8]} rotation={[0.5, -0.4, 0]}>
      {/* Chassis Frame */}
      <mesh>
        <boxGeometry args={[0.68, 0.9, 0.04]} />
        <meshPhysicalMaterial color="#0A1F4D" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[0.6, 0.82, 0.01]} />
        <meshPhysicalMaterial
          color="#060D1A"
          emissive="#1FB6D4"
          emissiveIntensity={0.25}
          roughness={0.0}
        />
      </mesh>
    </group>
  );
}

// 3D mesh components mapped to index
const MESHES = [
  StethoscopeMesh,
  SkullMesh,
  BrainMesh,
  HeartMesh,
  DNAMesh,
  MicroscopeMesh,
  CapsuleMesh,
  CrossMesh,
  PrescriptionMesh,
  GraduationCapMesh,
  FileStackMesh,
  TabletMesh,
];

export function OrbitingItem({ index, total }: OrbitingItemProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Orbiting properties
  const radius = 2.4 + (index % 3) * 0.45; // Staggered orbits
  const speed = 0.25 + (index % 2) * 0.12; // Speed varies
  const angleOffset = (index / total) * Math.PI * 2;
  const bobSpeed = 0.5 + Math.random() * 0.8;
  const bobIntensity = 0.15 + Math.random() * 0.2;

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (!groupRef.current) return;

    // Orbit path equation
    const angle = elapsed * speed + angleOffset;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    
    // Slow height bobbing
    const y = Math.sin(elapsed * bobSpeed) * bobIntensity;

    groupRef.current.position.set(x, y, z);
    
    // Constant rotation of the mesh
    groupRef.current.rotation.x += 0.005;
    groupRef.current.rotation.y += 0.008;
  });

  const TargetMesh = MESHES[index % MESHES.length];

  return (
    <group ref={groupRef}>
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.4}>
        <TargetMesh />
      </Float>
    </group>
  );
}

interface OrbitingObjectsProps {
  activeCount: number; // Tier control (desktop=12, tablet=6, mobile=0)
}

export default function OrbitingObjects({ activeCount }: OrbitingObjectsProps) {
  return (
    <group>
      {Array.from({ length: activeCount }).map((_, i) => (
        <OrbitingItem key={i} index={i} total={activeCount} />
      ))}
    </group>
  );
}
