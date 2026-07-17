import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

// ============================================
// COMPONENT: HeroBackground
// Combines navy gradients, panning grid, hex pattern,
// blurred glow orbs, auto-drawing SVG ECG line, and noise overlay.
// ============================================

export default function HeroBackground() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-[#060D1A] select-none pointer-events-none">
      {/* 1. Dark Navy Radial Gradient Wash */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,45,107,0.15)_0%,rgba(6,13,26,1)_70%)]" />

      {/* 2. Panning Grid Lines */}
      <div 
        className={`absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#8FA3C4_1px,transparent_1px),linear-gradient(to_bottom,#8FA3C4_1px,transparent_1px)] bg-[size:4rem_4rem]`}
        style={{
          animation: prefersReducedMotion ? 'none' : 'panGrid 40s linear infinite',
        }}
      />

      {/* 3. Hex Pattern (SVG top-right) */}
      <svg 
        className="absolute top-0 right-0 w-[40rem] h-[40rem] opacity-[0.06] text-cyan-500 transform translate-x-1/4 -translate-y-1/4"
        fill="currentColor"
        viewBox="0 0 100 100"
      >
        <pattern id="hexagons" width="10" height="17.32" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
          <path d="M5 0 L10 2.89 L10 8.66 L5 11.55 L0 8.66 L0 2.89 Z" fill="none" stroke="currentColor" strokeWidth="0.15" />
          <path d="M10 8.66 L15 11.55 L15 17.32 L10 20.21 L5 17.32 L5 11.55 Z" fill="none" stroke="currentColor" strokeWidth="0.15" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#hexagons)" />
      </svg>

      {/* 4. Three Blurred Glow Orbs */}
      <div 
        className="absolute w-[35rem] h-[35rem] rounded-full bg-[#0F2D6B] opacity-[0.25] blur-[100px] top-[-10%] left-[-5%]"
        style={{
          animation: prefersReducedMotion ? 'none' : 'floatOrbOne 25s ease-in-out infinite alternate',
        }}
      />
      <div 
        className="absolute w-[40rem] h-[40rem] rounded-full bg-[#1FB6D4] opacity-[0.12] blur-[120px] bottom-[-20%] right-[-10%]"
        style={{
          animation: prefersReducedMotion ? 'none' : 'floatOrbTwo 30s ease-in-out infinite alternate',
        }}
      />
      <div className="absolute w-[25rem] h-[25rem] rounded-full bg-[#4DE8FF] opacity-[0.06] blur-[90px] top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2" />

      {/* 5. Auto-drawing ECG line (SVG Polyline) across lower third */}
      <svg 
        className="absolute bottom-[15%] left-0 w-full h-32 opacity-15" 
        viewBox="0 0 1440 120" 
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,60 L400,60 L420,60 L430,30 L440,90 L450,10 L460,110 L470,50 L480,65 L490,60 L900,60 L920,60 L930,40 L940,80 L950,20 L960,100 L970,55 L980,65 L990,60 L1440,60"
          fill="none"
          stroke="#1FB6D4"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3.5, ease: 'easeInOut' }}
        />
      </svg>

      {/* 6. SVG Turbulence Noise Overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] mix-blend-overlay">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      {/* CSS Keyframes injected inline */}
      <style>{`
        @keyframes panGrid {
          0% { background-position: 0px 0px; }
          100% { background-position: 160px 160px; }
        }
        @keyframes floatOrbOne {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, 60px) scale(1.1); }
          100% { transform: translate(-20px, 30px) scale(0.95); }
        }
        @keyframes floatOrbTwo {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-60px, -40px) scale(0.9); }
          100% { transform: translate(30px, 20px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
