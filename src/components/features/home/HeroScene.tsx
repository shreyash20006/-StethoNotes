import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float } from '@react-three/drei';
import { motion } from 'framer-motion';

/**
 * 3D Medical Objects for Hero Scene
 * Using React Three Fiber + Drei
 */

const Stethoscope = () => (
  <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
    <mesh position={[0, 0, 0]}>
      <torusGeometry args={[2, 0.4, 16, 100]} />
      <meshStandardMaterial color="#1fb6d4" wireframe={false} />
    </mesh>
  </Float>
);

const MedicalCapsule = () => (
  <Float speed={1.5} rotationIntensity={1} floatIntensity={1.5}>
    <mesh position={[4, 2, 0]} rotation={[0.5, 0.5, 0]}>
      <capsuleGeometry args={[0.5, 2, 8, 16]} />
      <meshStandardMaterial color="#ef4444" />
    </mesh>
  </Float>
);

const DNAHelix = () => (
  <Float speed={2.5} rotationIntensity={2} floatIntensity={2.5}>
    <mesh position={[-4, 0, 0]}>
      <torusGeometry args={[1.5, 0.2, 16, 50]} />
      <meshStandardMaterial color="#10b981" />
    </mesh>
  </Float>
);

const MedicalCross = () => (
  <Float speed={1.8} rotationIntensity={1.2} floatIntensity={1.8}>
    <mesh position={[2, -3, 0]}>
      <boxGeometry args={[0.3, 3, 0.3]} />
      <meshStandardMaterial color="#f59e0b" />
    </mesh>
    <mesh position={[2, -3, 0]}>
      <boxGeometry args={[3, 0.3, 0.3]} />
      <meshStandardMaterial color="#f59e0b" />
    </mesh>
  </Float>
);

const HeroScene = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas className="w-full h-full" dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 12]} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={2}
        />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#1fb6d4" />

        <Stethoscope />
        <MedicalCapsule />
        <DNAHelix />
        <MedicalCross />
      </Canvas>
    </div>
  );
};

export default HeroScene;
