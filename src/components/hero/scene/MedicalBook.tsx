import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MotionValue } from 'motion/react';

// ============================================
// COMPONENT: MedicalBook
// Stylyzed 3D Open Medical Book.
// Double cover groups hinged at the spine [0,0,0].
// Hinge rotation lerps dynamically on pointer hover
// and spreads wider as scrollProgress advances.
// ============================================

interface MedicalBookProps {
  scrollProgress: MotionValue<number>;
}

export default function MedicalBook({ scrollProgress }: MedicalBookProps) {
  const bookRef = useRef<THREE.Group>(null);
  
  // Hinge group refs
  const leftCoverRef = useRef<THREE.Group>(null);
  const rightCoverRef = useRef<THREE.Group>(null);
  const leftPagesRef = useRef<THREE.Group>(null);
  const rightPagesRef = useRef<THREE.Group>(null);

  const [hovered, setHovered] = useState(false);

  // Constants
  const coverWidth = 0.72;
  const coverHeight = 1.1;
  const coverThickness = 0.04;

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const scroll = scrollProgress.get();

    // 1. Base hinge angle:
    // Standard: ~65 degrees (1.13 rad)
    // Hover: opens wider (~85 degrees / 1.48 rad)
    // Scroll: spreads flat (~90 degrees / 1.57 rad)
    const hoverAngleOffset = hovered ? 0.35 : 0;
    const scrollAngleOffset = scroll * 0.45;
    
    const targetHingeAngle = 1.05 + hoverAngleOffset + scrollAngleOffset;

    // Lerp Left Cover and pages angle (negative Y rotation)
    if (leftCoverRef.current) {
      leftCoverRef.current.rotation.y = THREE.MathUtils.lerp(
        leftCoverRef.current.rotation.y,
        -targetHingeAngle,
        0.1
      );
    }
    if (leftPagesRef.current) {
      // Pages are slightly less rotated to sit inside cover
      leftPagesRef.current.rotation.y = THREE.MathUtils.lerp(
        leftPagesRef.current.rotation.y,
        -targetHingeAngle + 0.12,
        0.1
      );
    }

    // Lerp Right Cover and pages angle (positive Y rotation)
    if (rightCoverRef.current) {
      rightCoverRef.current.rotation.y = THREE.MathUtils.lerp(
        rightCoverRef.current.rotation.y,
        targetHingeAngle,
        0.1
      );
    }
    if (rightPagesRef.current) {
      rightPagesRef.current.rotation.y = THREE.MathUtils.lerp(
        rightPagesRef.current.rotation.y,
        targetHingeAngle - 0.12,
        0.1
      );
    }

    // 2. Base book group rotation:
    // Slow continuous orbit + scroll rotation spin
    if (bookRef.current) {
      // Ambient slow spin
      bookRef.current.rotation.y = elapsed * 0.15 + scroll * Math.PI;
      // Scroll tilts book downward slightly
      bookRef.current.rotation.x = 0.2 + Math.sin(elapsed * 0.5) * 0.05 - scroll * 0.5;
    }
  });

  return (
    <group
      ref={bookRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={[1.5, 1.5, 1.5]}
      position={[0, 0, 0]}
    >
      {/* 1. SPINE / HINGE CENTER */}
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.04, coverHeight, 16]} />
        <meshPhysicalMaterial
          color="#0A1F4D"
          metalness={0.9}
          roughness={0.2}
          emissive="#1FB6D4"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* 2. LEFT SIDE COVER (rotates around group origin 0,0,0) */}
      <group ref={leftCoverRef}>
        {/* Cover Board */}
        <mesh position={[-coverWidth / 2, 0, -coverThickness / 2]} castShadow>
          <boxGeometry args={[coverWidth, coverHeight, coverThickness]} />
          <meshPhysicalMaterial
            color="#0F2D6B"
            metalness={0.4}
            roughness={0.2}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
          />
        </mesh>
        
        {/* Cyan accent foil line on cover edge */}
        <mesh position={[-coverWidth + 0.06, 0, 0.01]} castShadow>
          <boxGeometry args={[0.015, coverHeight - 0.12, 0.01]} />
          <meshPhysicalMaterial color="#4DE8FF" emissive="#1FB6D4" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* 3. RIGHT SIDE COVER */}
      <group ref={rightCoverRef}>
        {/* Cover Board */}
        <mesh position={[coverWidth / 2, 0, -coverThickness / 2]} castShadow>
          <boxGeometry args={[coverWidth, coverHeight, coverThickness]} />
          <meshPhysicalMaterial
            color="#0F2D6B"
            metalness={0.4}
            roughness={0.2}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
          />
        </mesh>
        {/* Cyan accent foil line */}
        <mesh position={[coverWidth - 0.06, 0, 0.01]} castShadow>
          <boxGeometry args={[0.015, coverHeight - 0.12, 0.01]} />
          <meshPhysicalMaterial color="#4DE8FF" emissive="#1FB6D4" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* 4. LEFT PAGES BLOCK */}
      <group ref={leftPagesRef}>
        <mesh position={[-coverWidth / 2 + 0.01, 0, 0.03]} castShadow>
          <boxGeometry args={[coverWidth - 0.02, coverHeight - 0.06, 0.06]} />
          <meshPhysicalMaterial
            color="#F4F8FC"
            roughness={0.6}
            clearcoat={0.1}
          />
        </mesh>
      </group>

      {/* 5. RIGHT PAGES BLOCK */}
      <group ref={rightPagesRef}>
        <mesh position={[coverWidth / 2 - 0.01, 0, 0.03]} castShadow>
          <boxGeometry args={[coverWidth - 0.02, coverHeight - 0.06, 0.06]} />
          <meshPhysicalMaterial
            color="#F4F8FC"
            roughness={0.6}
            clearcoat={0.1}
          />
        </mesh>
      </group>
    </group>
  );
}
