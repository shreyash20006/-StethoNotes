import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSpecialty, type SpecialtyId, SPECIALTIES } from '../../context/SpecialtyContext';

// ============================================================
// INTERACTIVE ANATOMY NAVIGATOR
// The heart of StethoNotes' adaptive UI.
// A detailed SVG human body where every organ is clickable,
// hoverable, and tied to a medical specialty experience.
// ============================================================

interface OrganZone {
  id: SpecialtyId;
  label: string;
  anatomicalTerm: string;
  emoji: string;
  /** SVG path or ellipse center for hit area */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

// All coordinates are based on a 280×580 viewBox
const ORGAN_ZONES: OrganZone[] = [
  { id: 'neurology',       label: 'Neurology',        anatomicalTerm: 'Cerebrum',        emoji: '🧠', cx: 140, cy: 52,  rx: 40,  ry: 35  },
  { id: 'ophthalmology',   label: 'Ophthalmology',    anatomicalTerm: 'Oculus',          emoji: '👁️', cx: 140, cy: 75,  rx: 18,  ry: 8   },
  { id: 'respiratory',     label: 'Respiratory',      anatomicalTerm: 'Pulmones',        emoji: '🫁', cx: 140, cy: 175, rx: 52,  ry: 42  },
  { id: 'cardiology',      label: 'Cardiology',       anatomicalTerm: 'Cor',             emoji: '❤️', cx: 128, cy: 168, rx: 22,  ry: 20  },
  { id: 'gastroenterology',label: 'Gastroenterology', anatomicalTerm: 'Gaster',          emoji: '🫄', cx: 140, cy: 248, rx: 30,  ry: 22  },
  { id: 'nephrology',      label: 'Nephrology',       anatomicalTerm: 'Renes',           emoji: '🫘', cx: 140, cy: 275, rx: 38,  ry: 15  },
  { id: 'orthopedics',     label: 'Orthopedics',      anatomicalTerm: 'Columna',         emoji: '🦴', cx: 140, cy: 220, rx: 10,  ry: 70  },
  { id: 'anatomy',         label: 'Anatomy',          anatomicalTerm: 'Systema Musculare',emoji: '🫀', cx: 140, cy: 370, rx: 40,  ry: 45  },
];

// ─── Tooltip ────────────────────────────────────────────────

interface TooltipState {
  organ: OrganZone | null;
  x: number;
  y: number;
}

// ─── Main Component ─────────────────────────────────────────

export default function AnatomyNavigator() {
  const { specialty, setSpecialty } = useSpecialty();
  const [hovered, setHovered] = useState<SpecialtyId | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ organ: null, x: 0, y: 0 });
  const [activeSystem, setActiveSystem] = useState<'all' | 'skeletal' | 'cardiovascular' | 'nervous' | 'digestive'>('all');
  const svgRef = useRef<SVGSVGElement>(null);

  const handleOrganHover = useCallback((organ: OrganZone, svgX: number, svgY: number) => {
    setHovered(organ.id);
    setTooltip({ organ, x: svgX, y: svgY });
  }, []);

  const handleOrganLeave = useCallback(() => {
    setHovered(null);
    setTooltip({ organ: null, x: 0, y: 0 });
  }, []);

  const handleOrganClick = useCallback((organ: OrganZone) => {
    setSpecialty(organ.id);
    // Smooth scroll to specialty panel
    setTimeout(() => {
      document.getElementById('specialty-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }, [setSpecialty]);

  const hoveredConfig = hovered ? SPECIALTIES[hovered] : null;
  const activeConfig = SPECIALTIES[specialty.id];

  return (
    <div className="relative flex flex-col items-center select-none" style={{ userSelect: 'none' }}>
      {/* System filter tabs */}
      <SystemFilterTabs activeSystem={activeSystem} setActiveSystem={setActiveSystem} />

      {/* Main SVG anatomy figure */}
      <div className="relative">
        {/* Outer glow ring — matches active specialty */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{
            boxShadow: hoveredConfig
              ? `0 0 80px ${hoveredConfig.glowColor}, 0 0 160px ${hoveredConfig.glowColor}`
              : activeConfig.id !== 'default'
                ? `0 0 40px ${activeConfig.glowColor}`
                : 'none',
          }}
          transition={{ duration: 0.4 }}
        />

        <svg
          ref={svgRef}
          viewBox="0 0 280 580"
          width="100%"
          style={{ maxWidth: 320, height: 'auto', overflow: 'visible', filter: 'drop-shadow(0 0 20px rgba(34,199,242,0.08))' }}
          aria-label="Interactive human anatomy diagram"
        >
          <defs>
            {/* Radial glow gradients per specialty */}
            {Object.values(SPECIALTIES).map(s => (
              <radialGradient key={s.id} id={`glow-${s.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={s.primaryColor} stopOpacity="0.6" />
                <stop offset="100%" stopColor={s.primaryColor} stopOpacity="0" />
              </radialGradient>
            ))}
            <radialGradient id="body-gradient" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="rgba(240,246,255,0.08)" />
              <stop offset="100%" stopColor="rgba(7,23,43,0.02)" />
            </radialGradient>
            <filter id="glow-filter">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="soft-glow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── BODY SILHOUETTE ── */}
          <BodySilhouette activeSystem={activeSystem} specialty={specialty.id} />

          {/* ── SKELETAL OVERLAY ── */}
          {(activeSystem === 'all' || activeSystem === 'skeletal') && (
            <SkeletalOverlay visible={activeSystem === 'skeletal'} />
          )}

          {/* ── CARDIOVASCULAR OVERLAY ── */}
          {(activeSystem === 'all' || activeSystem === 'cardiovascular') && (
            <CardiovascularOverlay visible={activeSystem === 'cardiovascular'} specialty={specialty.id} />
          )}

          {/* ── NERVOUS OVERLAY ── */}
          {(activeSystem === 'all' || activeSystem === 'nervous') && (
            <NervousOverlay visible={activeSystem === 'nervous'} specialty={specialty.id} />
          )}

          {/* ── ORGAN ZONES (interactive) ── */}
          {ORGAN_ZONES.map((organ) => {
            const isHovered = hovered === organ.id;
            const isActive = specialty.id === organ.id;
            const config = SPECIALTIES[organ.id];

            return (
              <g key={organ.id}>
                {/* Glow halo */}
                {(isHovered || isActive) && (
                  <motion.ellipse
                    cx={organ.cx}
                    cy={organ.cy}
                    rx={organ.rx + 16}
                    ry={organ.ry + 16}
                    fill={`url(#glow-${organ.id})`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}

                {/* Hover/active outline ring */}
                {(isHovered || isActive) && (
                  <motion.ellipse
                    cx={organ.cx}
                    cy={organ.cy}
                    rx={organ.rx + 6}
                    ry={organ.ry + 6}
                    fill="none"
                    stroke={config.primaryColor}
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8, rotate: 360 }}
                    transition={{ duration: 0.4, rotate: { duration: 8, repeat: Infinity, ease: 'linear' } }}
                    style={{ transformOrigin: `${organ.cx}px ${organ.cy}px` }}
                  />
                )}

                {/* Interactive hit zone */}
                <ellipse
                  cx={organ.cx}
                  cy={organ.cy}
                  rx={organ.rx}
                  ry={organ.ry}
                  fill={isHovered || isActive ? config.primaryColor : 'transparent'}
                  fillOpacity={isHovered ? 0.18 : isActive ? 0.12 : 0}
                  stroke={isHovered || isActive ? config.primaryColor : 'transparent'}
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  strokeOpacity={0.6}
                  style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onMouseEnter={(e) => {
                    const svgEl = svgRef.current;
                    if (!svgEl) return;
                    const rect = svgEl.getBoundingClientRect();
                    const scaleX = 280 / rect.width;
                    const scaleY = 580 / rect.height;
                    handleOrganHover(organ, (e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                  }}
                  onMouseLeave={handleOrganLeave}
                  onClick={() => handleOrganClick(organ)}
                  role="button"
                  aria-label={`Select ${organ.label} specialty`}
                />

                {/* Floating label on hover */}
                {(isHovered || isActive) && (
                  <motion.g
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ pointerEvents: 'none' }}
                  >
                    <rect
                      x={organ.cx - 36}
                      y={organ.cy - organ.ry - 22}
                      width={72}
                      height={16}
                      rx={4}
                      fill={config.primaryColor}
                      fillOpacity={0.95}
                    />
                    <text
                      x={organ.cx}
                      y={organ.cy - organ.ry - 11}
                      textAnchor="middle"
                      fontSize="7"
                      fontFamily="'Inter', sans-serif"
                      fontWeight="700"
                      fill="white"
                      letterSpacing="0.5"
                    >
                      {organ.anatomicalTerm.toUpperCase()}
                    </text>
                  </motion.g>
                )}
              </g>
            );
          })}

          {/* ECG baseline at bottom when cardiology is active */}
          {specialty.id === 'cardiology' && (
            <EcgLine x={20} y={540} width={240} />
          )}

          {/* Neural sparks when neurology is active */}
          {specialty.id === 'neurology' && (
            <NeuralSparks />
          )}

          {/* Breathing animation dots when respiratory is active */}
          {specialty.id === 'respiratory' && (
            <RespiratoryParticles />
          )}
        </svg>

        {/* Floating label callout (outside SVG, HTML tooltip) */}
        <AnimatePresence>
          {tooltip.organ && (
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="absolute pointer-events-none z-50"
              style={{
                left: `${(tooltip.x / 280) * 100}%`,
                top: `${(tooltip.y / 580) * 100}%`,
                transform: 'translate(-50%, -110%)',
              }}
            >
              <div
                className="px-3 py-2 rounded-xl text-xs font-bold font-display whitespace-nowrap shadow-2xl"
                style={{
                  background: SPECIALTIES[tooltip.organ.id].primaryColor,
                  color: '#fff',
                  boxShadow: `0 4px 24px ${SPECIALTIES[tooltip.organ.id].glowColor}`,
                }}
              >
                {tooltip.organ.emoji} {tooltip.organ.label}
                <br />
                <span className="font-normal opacity-80">{tooltip.organ.anatomicalTerm}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click instruction */}
      <motion.p
        className="mt-4 text-xs font-sans text-center opacity-50"
        style={{ color: 'var(--text-muted)' }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        Click any organ to explore its specialty →
      </motion.p>
    </div>
  );
}

// ─── Body Silhouette ─────────────────────────────────────────

function BodySilhouette({ activeSystem, specialty }: { activeSystem: string; specialty: SpecialtyId }) {
  const isXray = activeSystem === 'skeletal';
  const config = SPECIALTIES[specialty];

  return (
    <g opacity={isXray ? 0.4 : 1} style={{ transition: 'opacity 0.5s ease' }}>
      {/* Head */}
      <ellipse cx="140" cy="52" rx="42" ry="48" fill="none"
        stroke="var(--glass-border)" strokeWidth={isXray ? "0.5" : "1.5"}
        style={{ transition: 'all 0.5s' }} />

      {/* Neck */}
      <rect x="125" y="96" width="30" height="24" rx="4" fill="none"
        stroke="var(--glass-border)" strokeWidth="1" />

      {/* Shoulders + torso */}
      <path d="M 60 118 Q 30 128 28 160 L 28 320 Q 28 340 48 345 L 90 350 L 90 380 L 192 380 L 192 350 L 234 345 Q 252 340 252 320 L 252 160 Q 250 128 220 118 Z"
        fill="url(#body-gradient)"
        stroke="var(--glass-border)" strokeWidth="1.5"
        style={{ transition: 'all 0.5s' }} />

      {/* Left arm */}
      <path d="M 48 125 Q 18 145 12 200 L 10 290 Q 10 315 22 320 L 38 320 Q 52 315 52 290 L 54 200 Q 56 155 68 135 Z"
        fill="none" stroke="var(--glass-border)" strokeWidth="1.2" />

      {/* Right arm */}
      <path d="M 232 125 Q 262 145 268 200 L 270 290 Q 270 315 258 320 L 242 320 Q 228 315 228 290 L 226 200 Q 224 155 212 135 Z"
        fill="none" stroke="var(--glass-border)" strokeWidth="1.2" />

      {/* Hips */}
      <path d="M 90 350 Q 75 355 70 380 L 68 400 L 212 400 L 210 380 Q 205 355 192 350 Z"
        fill="none" stroke="var(--glass-border)" strokeWidth="1.2" />

      {/* Left thigh */}
      <path d="M 68 400 L 62 430 Q 58 460 60 490 L 62 530 Q 62 545 78 548 L 100 548 Q 114 545 114 530 L 116 490 Q 118 460 114 430 L 110 400 Z"
        fill="none" stroke="var(--glass-border)" strokeWidth="1.2" />

      {/* Right thigh */}
      <path d="M 212 400 L 218 430 Q 222 460 220 490 L 218 530 Q 218 545 202 548 L 180 548 Q 166 545 166 530 L 164 490 Q 162 460 166 430 L 170 400 Z"
        fill="none" stroke="var(--glass-border)" strokeWidth="1.2" />

      {/* Lower legs */}
      <path d="M 62 530 Q 60 555 64 565 L 100 565 Q 114 555 114 530"
        fill="none" stroke="var(--glass-border)" strokeWidth="1.2" />
      <path d="M 218 530 Q 220 555 216 565 L 180 565 Q 166 555 166 530"
        fill="none" stroke="var(--glass-border)" strokeWidth="1.2" />

      {/* Face features — eyes */}
      <ellipse cx="127" cy="58" rx="7" ry="5" fill="none" stroke="rgba(150,210,255,0.4)" strokeWidth="0.8" />
      <ellipse cx="153" cy="58" rx="7" ry="5" fill="none" stroke="rgba(150,210,255,0.4)" strokeWidth="0.8" />
      <circle cx="127" cy="58" r="3.5" fill="rgba(100,180,255,0.15)" />
      <circle cx="153" cy="58" r="3.5" fill="rgba(100,180,255,0.15)" />

      {/* Subtle body highlight */}
      <path d="M 100 120 Q 140 118 180 120 L 175 320 Q 140 325 105 320 Z"
        fill={`color-mix(in srgb, ${config.primaryColor} 3%, transparent)`}
        style={{ transition: 'fill 0.8s ease' }} />
    </g>
  );
}

// ─── Skeletal Overlay ────────────────────────────────────────

function SkeletalOverlay({ visible }: { visible: boolean }) {
  return (
    <g opacity={visible ? 1 : 0.15} style={{ transition: 'opacity 0.5s ease' }}>
      {/* Skull */}
      <ellipse cx="140" cy="48" rx="32" ry="36" fill="none" stroke="rgba(180,180,200,0.5)" strokeWidth="1" />
      <path d="M 118 72 L 118 80 L 162 80 L 162 72" fill="none" stroke="rgba(180,180,200,0.4)" strokeWidth="0.8" />

      {/* Spine */}
      {Array.from({ length: 18 }, (_, i) => (
        <rect key={i} x="134" y={100 + i * 14} width="12" height="10" rx="2"
          fill="none" stroke="rgba(180,180,200,0.4)" strokeWidth="0.8" />
      ))}

      {/* Ribcage */}
      {Array.from({ length: 7 }, (_, i) => (
        <g key={i}>
          <path d={`M 140 ${130 + i * 13} Q ${100 - i * 2} ${125 + i * 13} ${90 - i * 1} ${140 + i * 13}`}
            fill="none" stroke="rgba(180,180,200,0.35)" strokeWidth="0.8" />
          <path d={`M 140 ${130 + i * 13} Q ${180 + i * 2} ${125 + i * 13} ${190 + i * 1} ${140 + i * 13}`}
            fill="none" stroke="rgba(180,180,200,0.35)" strokeWidth="0.8" />
        </g>
      ))}

      {/* Pelvis */}
      <ellipse cx="140" cy="370" rx="52" ry="28" fill="none" stroke="rgba(180,180,200,0.4)" strokeWidth="1" />
      <path d="M 88 370 L 88 380 M 192 370 L 192 380" fill="none" stroke="rgba(180,180,200,0.35)" strokeWidth="0.8" />

      {/* Femur left/right */}
      <line x1="110" y1="400" x2="90" y2="520" stroke="rgba(180,180,200,0.4)" strokeWidth="4" strokeLinecap="round" />
      <line x1="170" y1="400" x2="190" y2="520" stroke="rgba(180,180,200,0.4)" strokeWidth="4" strokeLinecap="round" />

      {/* Humerus left/right */}
      <line x1="64" y1="135" x2="22" y2="260" stroke="rgba(180,180,200,0.4)" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="216" y1="135" x2="258" y2="260" stroke="rgba(180,180,200,0.4)" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  );
}

// ─── Cardiovascular Overlay ──────────────────────────────────

function CardiovascularOverlay({ visible, specialty }: { visible: boolean; specialty: SpecialtyId }) {
  const isCardio = specialty === 'cardiology';
  const color = isCardio ? '#E53E3E' : 'rgba(229,62,62,0.4)';

  return (
    <g opacity={visible ? 1 : isCardio ? 0.7 : 0.12} style={{ transition: 'opacity 0.6s ease' }}>
      {/* Heart */}
      <path d="M 128 160 C 128 152 120 148 114 154 C 108 160 110 170 128 183 C 146 170 148 160 142 154 C 136 148 128 152 128 160 Z"
        fill={color} fillOpacity="0.6" stroke={color} strokeWidth="0.8">
        {isCardio && (
          <animate attributeName="fill-opacity" values="0.6;0.9;0.6" dur="0.85s" repeatCount="indefinite" />
        )}
      </path>

      {/* Aorta */}
      <path d="M 130 153 Q 130 140 140 132 Q 155 125 160 115"
        fill="none" stroke={color} strokeWidth="3" strokeOpacity="0.7" />

      {/* Main arteries - descending */}
      <path d="M 138 183 Q 140 220 140 260 Q 140 310 135 360"
        fill="none" stroke={color} strokeWidth="2" strokeOpacity="0.6" strokeDasharray="4 2">
        {isCardio && <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.2s" repeatCount="indefinite" />}
      </path>

      {/* Left subclavian */}
      <path d="M 128 155 Q 90 148 60 155 Q 30 162 20 190"
        fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />

      {/* Right subclavian */}
      <path d="M 142 155 Q 180 148 210 155 Q 240 162 260 190"
        fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />

      {/* Pulmonary vessels */}
      <path d="M 120 165 Q 100 162 90 170 Q 82 178 84 188"
        fill="none" stroke={color} strokeWidth="1.2" strokeOpacity="0.5" />
      <path d="M 140 165 Q 160 162 170 170 Q 178 178 176 188"
        fill="none" stroke={color} strokeWidth="1.2" strokeOpacity="0.5" />

      {/* Femoral arteries */}
      <path d="M 128 380 Q 110 400 100 460 L 95 530"
        fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.4" />
      <path d="M 152 380 Q 170 400 180 460 L 185 530"
        fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.4" />
    </g>
  );
}

// ─── Nervous Overlay ─────────────────────────────────────────

function NervousOverlay({ visible, specialty }: { visible: boolean; specialty: SpecialtyId }) {
  const isNeuro = specialty === 'neurology';
  const color = isNeuro ? '#7C3AED' : 'rgba(124,58,237,0.4)';

  return (
    <g opacity={visible ? 1 : isNeuro ? 0.6 : 0.08} style={{ transition: 'opacity 0.6s ease' }}>
      {/* Brain outline */}
      <path d="M 112 40 Q 100 22 114 16 Q 128 10 140 14 Q 152 10 166 16 Q 180 22 168 40"
        fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.8" />

      {/* Spinal cord */}
      <line x1="140" y1="100" x2="140" y2="370"
        stroke={color} strokeWidth="2.5" strokeOpacity="0.6"
        strokeDasharray={isNeuro ? "3 2" : "none"}>
        {isNeuro && <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.5s" repeatCount="indefinite" />}
      </line>

      {/* Nerve branches — brachial plexus */}
      {[0, 1, 2, 3].map(i => (
        <g key={i}>
          <line x1="140" y1={115 + i * 20} x2={60 - i * 5} y2={125 + i * 25}
            stroke={color} strokeWidth="0.8" strokeOpacity="0.5" />
          <line x1="140" y1={115 + i * 20} x2={220 + i * 5} y2={125 + i * 25}
            stroke={color} strokeWidth="0.8" strokeOpacity="0.5" />
        </g>
      ))}

      {/* Lumbar nerves */}
      {[0, 1, 2, 3].map(i => (
        <g key={i}>
          <line x1="138" y1={290 + i * 15} x2={80 - i * 8} y2={310 + i * 18}
            stroke={color} strokeWidth="0.6" strokeOpacity="0.4" />
          <line x1="142" y1={290 + i * 15} x2={200 + i * 8} y2={310 + i * 18}
            stroke={color} strokeWidth="0.6" strokeOpacity="0.4" />
        </g>
      ))}

      {/* Sciatic nerve */}
      <path d="M 110 390 Q 96 430 90 530" stroke={color} strokeWidth="1.2" strokeOpacity="0.4" fill="none" />
      <path d="M 170 390 Q 184 430 190 530" stroke={color} strokeWidth="1.2" strokeOpacity="0.4" fill="none" />

      {/* Synapse nodes */}
      {isNeuro && [
        [140, 42], [140, 120], [60, 180], [220, 180], [140, 250], [90, 340], [190, 340]
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill={color} opacity="0.7">
          <animate attributeName="opacity" values="0.4;1;0.4" dur={`${1.2 + i * 0.3}s`} repeatCount="indefinite" />
          <animate attributeName="r" values="2;4;2" dur={`${1.2 + i * 0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  );
}

// ─── ECG Line ────────────────────────────────────────────────

function EcgLine({ x, y, width }: { x: number; y: number; width: number }) {
  const ecgPath = `M ${x} ${y} L ${x + 20} ${y} L ${x + 28} ${y - 8} L ${x + 32} ${y + 12} L ${x + 38} ${y - 28} L ${x + 44} ${y + 18} L ${x + 48} ${y} L ${x + width} ${y}`;
  return (
    <path d={ecgPath} fill="none" stroke="#E53E3E" strokeWidth="1.5" opacity="0.8" strokeLinecap="round">
      <animate attributeName="stroke-dashoffset" from={width + 80} to={-(width + 80)} dur="2s" repeatCount="indefinite" />
      <animateTransform attributeName="transform" type="translate" from={`${-width} 0`} to={`${width} 0`} dur="2s" repeatCount="indefinite" />
    </path>
  );
}

// ─── Neural Sparks ───────────────────────────────────────────

function NeuralSparks() {
  const sparks = [
    { cx: 120, cy: 48, delay: 0 },
    { cx: 160, cy: 44, delay: 0.4 },
    { cx: 140, cy: 62, delay: 0.8 },
    { cx: 108, cy: 56, delay: 1.2 },
    { cx: 172, cy: 56, delay: 1.6 },
  ];

  return (
    <>
      {sparks.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r="2" fill="#A78BFA">
          <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin={`${s.delay}s`} repeatCount="indefinite" />
          <animate attributeName="r" values="1;4;1" dur="1.5s" begin={`${s.delay}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </>
  );
}

// ─── Respiratory Particles ───────────────────────────────────

function RespiratoryParticles() {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <circle key={i} cx={100 + i * 14} cy={180} r="2.5" fill="#22D3EE" opacity="0.7">
          <animate attributeName="cy" values={`${180};${160};${180}`} dur={`${1.8 + i * 0.2}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur={`${1.8 + i * 0.2}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </>
  );
}

// ─── System Filter Tabs ──────────────────────────────────────

type SystemType = 'all' | 'skeletal' | 'cardiovascular' | 'nervous' | 'digestive';

const SYSTEM_TABS: { id: SystemType; label: string; color: string }[] = [
  { id: 'all',           label: 'Full Body',     color: 'var(--accent-primary)' },
  { id: 'cardiovascular',label: 'Cardio',        color: '#E53E3E'               },
  { id: 'skeletal',      label: 'Skeletal',      color: '#D97706'               },
  { id: 'nervous',       label: 'Nervous',       color: '#7C3AED'               },
];

function SystemFilterTabs({ activeSystem, setActiveSystem }: {
  activeSystem: SystemType;
  setActiveSystem: (s: SystemType) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-4 flex-wrap justify-center">
      {SYSTEM_TABS.map(tab => (
        <motion.button
          key={tab.id}
          onClick={() => setActiveSystem(tab.id)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="px-3 py-1.5 rounded-lg text-[10px] font-bold font-display uppercase tracking-wider transition-all duration-300"
          style={{
            background: activeSystem === tab.id
              ? tab.color
              : 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
            color: activeSystem === tab.id ? '#fff' : 'var(--text-muted)',
            border: `1px solid ${activeSystem === tab.id ? tab.color : 'var(--glass-border)'}`,
            boxShadow: activeSystem === tab.id ? `0 0 16px ${tab.color}60` : 'none',
          }}
        >
          {tab.label}
        </motion.button>
      ))}
    </div>
  );
}
