import { useEffect, useRef } from 'react';
import { useSpecialty } from '../../context/SpecialtyContext';

// ============================================================
// MEDICAL CURSOR GLOW
// A soft glowing orb that follows the cursor, tinted by
// the currently active specialty color. Makes the interface
// feel alive and tactile.
// ============================================================

export default function MedicalCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -200, y: -200 });
  const raf = useRef<number | null>(null);
  const { specialty } = useSpecialty();

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    document.addEventListener('mousemove', onMove, { passive: true });

    const animate = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${pos.current.x - 150}px, ${pos.current.y - 150}px)`;
      }
      raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  // Hide on touch/mobile devices
  if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return null;

  return (
    <>
      {/* Precision dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[9998] will-change-transform"
        style={{
          background: specialty.primaryColor,
          boxShadow: `0 0 8px ${specialty.primaryColor}`,
          transition: 'background 0.5s ease, box-shadow 0.5s ease',
        }}
        aria-hidden="true"
      />
      {/* Soft glow orb */}
      <div
        ref={glowRef}
        className="fixed top-0 left-0 w-[300px] h-[300px] rounded-full pointer-events-none z-[9997] will-change-transform"
        style={{
          background: `radial-gradient(circle, ${specialty.primaryColor}10 0%, transparent 70%)`,
          transition: 'background 0.6s ease',
        }}
        aria-hidden="true"
      />
    </>
  );
}
