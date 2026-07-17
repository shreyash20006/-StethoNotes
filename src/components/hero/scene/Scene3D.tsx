import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { MotionValue } from 'motion/react';
import MedicalBook from './MedicalBook';
import OrbitingObjects from './objects';

// ============================================
// COMPONENT: Scene3D
// Main R3F Canvas context, lighting, camera tilt rig,
// and Bloom post-processing effect manager.
// ============================================

interface Scene3DProps {
  deviceTier: 'desktop' | 'tablet';
  scrollProgress: MotionValue<number>;
  mouseRef: React.MutableRefObject<{ x: number; y: number; px: number; py: number }>;
}

// Camera Tilt and Scroll Zoom Rig
function InteractiveRig({
  scrollProgress,
  mouseRef,
}: {
  scrollProgress: MotionValue<number>;
  mouseRef: React.MutableRefObject<{ x: number; y: number; px: number; py: number }>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    // 1. Mouse Tilt Parallax (0.35 max offset)
    const targetX = mouseRef.current.x * 0.35;
    const targetY = mouseRef.current.y * 0.3;

    // 2. Scroll Zoom & Drift (0 -> 1)
    const scroll = scrollProgress.get();
    
    // Zoom out (increase Z) and drift upward (increase Y) as we scroll down
    const targetCamZ = 6.2 + scroll * 2.2;
    const targetCamY = targetY + scroll * 1.8;
    const targetCamX = targetX;

    // Smoothly lerp camera positions
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.05);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.05);

    // Keep camera locked onto center spine
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function Scene3D({ deviceTier, scrollProgress, mouseRef }: Scene3DProps) {
  // Cap the count of orbiting objects: 12 on desktop, 6 on tablet
  const activeCount = deviceTier === 'desktop' ? 12 : 6;

  return (
    <div className="w-full h-full min-h-[450px] md:min-h-[550px] relative">
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
        style={{ background: 'transparent' }}
      >
        {/* Adapt dynamic performance based on load */}
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={0.45} color="#8FA3C4" />
        
        {/* Soft blue key light */}
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.2}
          color="#3B82F6"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* High glowing cyan rim light */}
        <pointLight position={[-4, 2, -2]} intensity={2.5} color="#4DE8FF" />
        <pointLight position={[0, -5, 2]} intensity={0.8} color="#0F2D6B" />

        {/* Environment map for realistic reflections */}
        <Environment preset="city" />

        {/* Dynamic tilting / zooming interactive wrapper */}
        <InteractiveRig scrollProgress={scrollProgress} mouseRef={mouseRef} />

        {/* 3D Medical Book (Centerpiece) */}
        <MedicalBook scrollProgress={scrollProgress} />

        {/* Orbiting medical meshes */}
        <OrbitingObjects activeCount={activeCount} />

        {/* Postprocessing Bloom effect (Desktop only to protect performance) */}
        {deviceTier === 'desktop' && (
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={0.65}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.95}
              mipmapBlur
            />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
