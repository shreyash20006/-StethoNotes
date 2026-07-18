import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { useThemeStore } from '../../../store/useThemeStore';

// ============================================
// COMPONENT: HeroBackground
// Theme-aware background system:
// Dark  → Deep navy with glowing anatomy, ECG line, neural glow
// Light → Warm white with blueprint anatomy sketches, soft blue light
// Transitions smoothly via CSS variables and Framer Motion crossfades.
// ============================================

export default function HeroBackground() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const { theme } = useThemeStore();

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const isLight = theme === 'light';

  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden select-none pointer-events-none"
      style={{ background: 'var(--bg-base)', transition: 'background 0.6s ease' }}
    >
      {/* ── DARK MODE LAYERS ── */}
      <AnimatePresence>
        {!isLight && (
          <motion.div
            key="dark-bg"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            {/* 1. Deep radial gradient wash */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(12,32,56,0.5)_0%,rgba(7,23,43,1)_70%)]" />

            {/* 2. Panning blueprint grid */}
            <div
              className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#8FA3C4_1px,transparent_1px),linear-gradient(to_bottom,#8FA3C4_1px,transparent_1px)] bg-[size:4rem_4rem]"
              style={{ animation: prefersReducedMotion ? 'none' : 'panGrid 40s linear infinite' }}
            />

            {/* 3. Glow orbs */}
            <div
              className="absolute w-[35rem] h-[35rem] rounded-full blur-[100px] top-[-10%] left-[-5%]"
              style={{
                background: '#0C2038',
                opacity: 0.25,
                animation: prefersReducedMotion ? 'none' : 'floatOrbOne 25s ease-in-out infinite alternate',
              }}
            />
            <div
              className="absolute w-[40rem] h-[40rem] rounded-full blur-[120px] bottom-[-20%] right-[-10%]"
              style={{
                background: 'var(--accent-primary)',
                opacity: 0.07,
                animation: prefersReducedMotion ? 'none' : 'floatOrbTwo 30s ease-in-out infinite alternate',
              }}
            />
            <div className="absolute w-[25rem] h-[25rem] rounded-full blur-[90px] top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2"
              style={{ background: 'var(--accent-secondary)', opacity: 0.04 }}
            />

            {/* 4. Medical anatomy line-art overlay */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" fill="none">
              {/* Full-body anatomical figure (right side) */}
              <g opacity="0.05" stroke="#22C7F2" strokeWidth="0.8">
                {/* Head/skull outline */}
                <ellipse cx="1100" cy="130" rx="55" ry="65" />
                <path d="M1055 150 Q1040 190 1045 220 L1155 220 Q1160 190 1145 150" />
                {/* Spine */}
                <path d="M1100 220 L1100 520" strokeDasharray="4 3" />
                {/* Ribcage */}
                <ellipse cx="1100" cy="340" rx="70" ry="90" />
                <line x1="1100" y1="250" x2="1100" y2="430" />
                <path d="M1100 270 Q1040 285 1035 320 Q1040 355 1100 370" />
                <path d="M1100 270 Q1160 285 1165 320 Q1160 355 1100 370" />
                <path d="M1100 300 Q1035 315 1030 345 Q1035 375 1100 385" />
                <path d="M1100 300 Q1165 315 1170 345 Q1165 375 1100 385" />
                <path d="M1100 330 Q1035 345 1032 370" />
                <path d="M1100 330 Q1165 345 1168 370" />
                {/* Pelvis */}
                <path d="M1060 440 Q1025 470 1030 500 Q1055 520 1100 510 Q1145 520 1170 500 Q1175 470 1140 440 Z" />
                {/* Legs */}
                <line x1="1075" y1="510" x2="1065" y2="700" />
                <line x1="1125" y1="510" x2="1135" y2="700" />
                {/* Arms */}
                <path d="M1035 280 Q990 310 975 360 Q970 400 980 440" />
                <path d="M1165 280 Q1210 310 1225 360 Q1230 400 1220 440" />
                {/* Collar bones */}
                <path d="M1100 235 Q1065 242 1045 265" />
                <path d="M1100 235 Q1135 242 1155 265" />
              </g>

              {/* Heart detail (center-right) */}
              <g opacity="0.06" stroke="#22C7F2" strokeWidth="0.9">
                <path d="M1088 318 Q1074 305 1062 308 Q1048 312 1048 328 Q1048 344 1072 362 L1088 378 L1104 362 Q1128 344 1128 328 Q1128 312 1114 308 Q1102 305 1088 318 Z" />
                <path d="M1088 340 L1085 360 Q1082 372 1088 378" />
                <path d="M1088 340 L1091 360 Q1094 372 1088 378" />
                {/* Aorta */}
                <path d="M1088 308 Q1088 290 1095 280 Q1102 270 1100 260" />
              </g>

              {/* Brain cross-section (upper left) */}
              <g opacity="0.04" stroke="#1E90FF" strokeWidth="0.7">
                <ellipse cx="340" cy="160" rx="80" ry="65" />
                <path d="M280 145 Q310 120 340 160 Q370 120 400 145" />
                <path d="M270 165 Q295 140 340 165 Q385 140 410 165" />
                <path d="M275 185 Q310 200 340 180 Q370 200 405 185" />
                <path d="M340 95 Q355 115 350 140" />
                <path d="M340 95 Q325 115 330 140" />
                {/* Brain stem */}
                <path d="M340 225 L340 260 Q338 270 340 280" strokeWidth="1.2" />
                {/* Sulci */}
                <path d="M290 150 Q305 165 295 180" strokeDasharray="2 2" />
                <path d="M380 150 Q365 165 375 180" strokeDasharray="2 2" />
                <path d="M330 130 Q335 145 328 158" strokeDasharray="2 2" />
                <path d="M350 130 Q345 145 352 158" strokeDasharray="2 2" />
              </g>

              {/* Neural network connections */}
              <g opacity="0.03" stroke="#22C7F2" strokeWidth="0.6">
                {[
                  [200, 400], [280, 350], [180, 480], [320, 420], [250, 520],
                  [150, 380], [350, 380], [200, 560], [300, 480],
                ].map(([x, y], i) => (
                  <g key={i}>
                    <circle cx={x} cy={y} r="3" fill="#22C7F2" fillOpacity="0.4" />
                    {i > 0 && <line x1={x} y1={y} x2={200} y2={400} strokeDasharray="3 4" />}
                  </g>
                ))}
              </g>
            </svg>

            {/* 5. ECG waveform */}
            <svg
              className="absolute bottom-[12%] left-0 w-full h-32 opacity-[0.08]"
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
            >
              <motion.path
                d="M0,60 L400,60 L420,60 L430,30 L440,90 L450,10 L460,110 L470,50 L480,65 L490,60 L900,60 L920,60 L930,40 L940,80 L950,20 L960,100 L970,55 L980,65 L990,60 L1440,60"
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3.5, ease: 'easeInOut' }}
              />
            </svg>

            {/* 6. Hex pattern (top-right) */}
            <svg
              className="absolute top-0 right-0 w-[40rem] h-[40rem] opacity-[0.04] transform translate-x-1/4 -translate-y-1/4"
              fill="none"
              viewBox="0 0 100 100"
            >
              <defs>
                <pattern id="hexDark" width="10" height="17.32" patternUnits="userSpaceOnUse">
                  <path d="M5 0 L10 2.89 L10 8.66 L5 11.55 L0 8.66 L0 2.89 Z" fill="none" stroke="var(--accent-primary)" strokeWidth="0.15" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hexDark)" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LIGHT MODE LAYERS ── */}
      <AnimatePresence>
        {isLight && (
          <motion.div
            key="light-bg"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            {/* 1. Warm white radial gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(219,234,255,0.7)_0%,rgba(244,248,255,1)_70%)]" />

            {/* 2. Soft blue grid */}
            <div
              className="absolute inset-0 bg-[linear-gradient(to_right,#2D6BFF_1px,transparent_1px),linear-gradient(to_bottom,#2D6BFF_1px,transparent_1px)] bg-[size:4rem_4rem]"
              style={{
                opacity: 0.035,
                animation: prefersReducedMotion ? 'none' : 'panGrid 40s linear infinite',
              }}
            />

            {/* 3. Soft blue glow orbs */}
            <div
              className="absolute w-[50rem] h-[50rem] rounded-full blur-[140px] top-[-20%] right-[-10%]"
              style={{
                background: '#2D6BFF',
                opacity: 0.07,
                animation: prefersReducedMotion ? 'none' : 'floatOrbTwo 30s ease-in-out infinite alternate',
              }}
            />
            <div
              className="absolute w-[40rem] h-[40rem] rounded-full blur-[100px] bottom-[-10%] left-[-5%]"
              style={{
                background: '#00BCD4',
                opacity: 0.06,
                animation: prefersReducedMotion ? 'none' : 'floatOrbOne 25s ease-in-out infinite alternate',
              }}
            />

            {/* 4. Blueprint anatomy illustrations */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" fill="none">
              {/* Anatomical figure in blueprint style */}
              <g opacity="0.06" stroke="#2D6BFF" strokeWidth="0.8">
                <ellipse cx="1100" cy="130" rx="55" ry="65" />
                <path d="M1055 150 Q1040 190 1045 220 L1155 220 Q1160 190 1145 150" />
                <path d="M1100 220 L1100 520" strokeDasharray="4 3" />
                <ellipse cx="1100" cy="340" rx="70" ry="90" />
                <line x1="1100" y1="250" x2="1100" y2="430" />
                <path d="M1100 270 Q1040 285 1035 320 Q1040 355 1100 370" />
                <path d="M1100 270 Q1160 285 1165 320 Q1160 355 1100 370" />
                <path d="M1100 300 Q1035 315 1030 345 Q1035 375 1100 385" />
                <path d="M1100 300 Q1165 315 1170 345 Q1165 375 1100 385" />
                <path d="M1060 440 Q1025 470 1030 500 Q1055 520 1100 510 Q1145 520 1170 500 Q1175 470 1140 440 Z" />
                <line x1="1075" y1="510" x2="1065" y2="700" />
                <line x1="1125" y1="510" x2="1135" y2="700" />
                <path d="M1035 280 Q990 310 975 360 Q970 400 980 440" />
                <path d="M1165 280 Q1210 310 1225 360 Q1230 400 1220 440" />
                {/* Blueprint dimension lines */}
                <line x1="1200" y1="95" x2="1200" y2="700" strokeDasharray="2 4" strokeWidth="0.5" opacity="0.5" />
                <line x1="1195" y1="95" x2="1205" y2="95" strokeWidth="0.5" />
                <line x1="1195" y1="700" x2="1205" y2="700" strokeWidth="0.5" />
              </g>

              {/* Blueprint labels */}
              <g opacity="0.07" fill="#2D6BFF">
                <text x="1215" y="135" fontSize="7" fontFamily="Space Grotesk">CRANIUM</text>
                <text x="1215" y="340" fontSize="7" fontFamily="Space Grotesk">THORAX</text>
                <text x="1215" y="470" fontSize="7" fontFamily="Space Grotesk">PELVIS</text>
              </g>

              {/* Blueprint heart detail */}
              <g opacity="0.07" stroke="#00BCD4" strokeWidth="0.9">
                <path d="M1088 318 Q1074 305 1062 308 Q1048 312 1048 328 Q1048 344 1072 362 L1088 378 L1104 362 Q1128 344 1128 328 Q1128 312 1114 308 Q1102 305 1088 318 Z" />
                <path d="M1088 308 Q1088 290 1095 280" />
              </g>

              {/* Brain (upper left) in blueprint style */}
              <g opacity="0.05" stroke="#2D6BFF" strokeWidth="0.7">
                <ellipse cx="340" cy="160" rx="80" ry="65" />
                <path d="M280 145 Q310 120 340 160 Q370 120 400 145" />
                <path d="M270 165 Q295 140 340 165 Q385 140 410 165" />
                <path d="M275 185 Q310 200 340 180 Q370 200 405 185" />
                <path d="M340 225 L340 260" strokeWidth="1.2" />
                {/* Blueprint title box */}
                <rect x="258" y="236" width="165" height="18" rx="2" fill="none" stroke="#2D6BFF" strokeWidth="0.5" />
              </g>
              <g opacity="0.06" fill="#2D6BFF">
                <text x="266" y="248" fontSize="6.5" fontFamily="Space Grotesk">CEREBRAL HEMISPHERE — SAGITTAL VIEW</text>
              </g>

              {/* Soft vascular pattern (lower-left) */}
              <g opacity="0.04" stroke="#00BCD4" strokeWidth="0.7">
                <path d="M150 500 Q180 480 200 500 Q220 520 250 500 Q280 480 300 500" />
                <path d="M140 520 Q170 500 200 520 Q230 500 260 520 Q290 500 310 520" />
                <path d="M200 500 L200 600" />
                <path d="M200 540 Q170 560 150 580" />
                <path d="M200 540 Q230 560 250 580" />
              </g>
            </svg>

            {/* 5. Light ECG line */}
            <svg
              className="absolute bottom-[12%] left-0 w-full h-32"
              style={{ opacity: 0.1 }}
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
            >
              <motion.path
                d="M0,60 L400,60 L420,60 L430,30 L440,90 L450,10 L460,110 L470,50 L480,65 L490,60 L900,60 L920,60 L930,40 L940,80 L950,20 L960,100 L970,55 L980,65 L990,60 L1440,60"
                fill="none"
                stroke="#2D6BFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3.5, ease: 'easeInOut' }}
              />
            </svg>

            {/* 6. Blueprint grid corner */}
            <svg className="absolute top-0 right-0 w-[40rem] h-[40rem] opacity-[0.05] transform translate-x-1/4 -translate-y-1/4" fill="none" viewBox="0 0 100 100">
              <defs>
                <pattern id="hexLight" width="10" height="17.32" patternUnits="userSpaceOnUse">
                  <path d="M5 0 L10 2.89 L10 8.66 L5 11.55 L0 8.66 L0 2.89 Z" fill="none" stroke="#2D6BFF" strokeWidth="0.15" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hexLight)" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SHARED: Noise texture overlay ── */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.025] mix-blend-overlay">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  );
}
