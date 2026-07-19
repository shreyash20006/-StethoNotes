import { motion, AnimatePresence } from 'motion/react';
import { useSpecialty, SPECIALTIES, type SpecialtyId } from '../../context/SpecialtyContext';
import { ArrowRight, X, Sparkles, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

// ============================================================
// SPECIALTY PANEL
// Appears below the anatomy navigator when an organ is clicked.
// Morphs between specialties with Framer Motion.
// Each specialty has its own animated background scene.
// ============================================================

export default function SpecialtyPanel() {
  const { specialty, clearSpecialty, isActive } = useSpecialty();

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.section
          key={specialty.id}
          id="specialty-panel"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.97 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden mx-4 md:mx-0 my-8"
          style={{
            border: `1px solid ${specialty.primaryColor}30`,
            boxShadow: `0 0 80px ${specialty.glowColor}, inset 0 1px 0 ${specialty.primaryColor}20`,
          }}
          aria-live="polite"
        >
          {/* Animated background scene — specialty-specific */}
          <SpecialtyBackground specialtyId={specialty.id} />

          {/* Content layer */}
          <div className="relative z-10 p-8 sm:p-12">
            {/* Close button */}
            <button
              onClick={clearSpecialty}
              className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{
                background: `${specialty.primaryColor}20`,
                border: `1px solid ${specialty.primaryColor}40`,
                color: specialty.primaryColor,
              }}
              aria-label="Close specialty panel"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-5 mb-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{
                  background: `${specialty.primaryColor}15`,
                  border: `1px solid ${specialty.primaryColor}35`,
                }}
              >
                {specialty.emoji}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
                    style={{
                      background: `${specialty.primaryColor}20`,
                      color: specialty.primaryColor,
                      border: `1px solid ${specialty.primaryColor}40`,
                    }}
                  >
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    {specialty.organ} System
                  </span>
                </div>
                <h2
                  className="text-2xl sm:text-4xl font-display font-bold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {specialty.label}
                </h2>
                <p className="mt-2 text-sm font-sans max-w-xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {specialty.description}
                </p>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                to={`/courses?specialty=${encodeURIComponent(specialty.label)}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold font-display transition-all"
                style={{
                  background: specialty.primaryColor,
                  color: '#fff',
                  boxShadow: `0 4px 20px ${specialty.glowColor}`,
                }}
              >
                <BookOpen className="w-4 h-4" />
                Browse {specialty.label} Notes
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={clearSpecialty}
                className="px-5 py-2.5 rounded-xl text-sm font-bold font-display transition-all"
                style={{
                  background: `${specialty.primaryColor}12`,
                  color: 'var(--text-muted)',
                  border: `1px solid var(--glass-border)`,
                }}
              >
                Explore Another Organ
              </button>
            </div>

            {/* Stats row */}
            <SpecialtyStats specialtyId={specialty.id} />
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

// ─── Animated Background Scene per Specialty ─────────────────

function SpecialtyBackground({ specialtyId }: { specialtyId: SpecialtyId }) {
  const config = SPECIALTIES[specialtyId];

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at 20% 50%, ${config.primaryColor}12 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 20%, ${config.secondaryColor}08 0%, transparent 50%),
                     var(--surface)`,
      }}
    >
      {/* SVG medical scene per specialty */}
      {specialtyId === 'cardiology' && <CardiologyScene color={config.primaryColor} />}
      {specialtyId === 'neurology' && <NeurologyScene color={config.primaryColor} />}
      {specialtyId === 'respiratory' && <RespiratoryScene color={config.primaryColor} />}
      {specialtyId === 'orthopedics' && <OrthopedicsScene color={config.primaryColor} />}
      {specialtyId === 'pharmacology' && <PharmacologyScene color={config.primaryColor} />}
      {specialtyId === 'microbiology' && <MicrobiologyScene color={config.primaryColor} />}
      {/* Default: floating particles for remaining specialties */}
      {!['cardiology', 'neurology', 'respiratory', 'orthopedics', 'pharmacology', 'microbiology'].includes(specialtyId) && (
        <FloatingParticles color={config.primaryColor} />
      )}
    </div>
  );
}

// ─── Cardiology: ECG + Heart ──────────────────────────────────

function CardiologyScene({ color }: { color: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* ECG trace across the panel */}
      <path
        d="M -100 50% L 15% 50% L 20% 35% L 23% 60% L 28% 20% L 33% 65% L 36% 50% L 120% 50%"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeOpacity="0.25"
        strokeLinecap="round"
      >
        <animateTransform attributeName="transform" type="translate" from="-50% 0" to="50% 0" dur="3s" repeatCount="indefinite" />
      </path>

      {/* Second offset ECG */}
      <path
        d="M -100 70% L 15% 70% L 20% 55% L 23% 80% L 28% 40% L 33% 85% L 36% 70% L 120% 70%"
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.12"
        strokeLinecap="round"
      >
        <animateTransform attributeName="transform" type="translate" from="-30% 0" to="70% 0" dur="4.5s" repeatCount="indefinite" />
      </path>

      {/* Background heart */}
      <text x="85%" y="50%" fontSize="120" textAnchor="middle" dominantBaseline="middle" opacity="0.04" fill={color}>
        ❤
      </text>

      {/* Blood cell dots */}
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={i} cx={`${10 + i * 8}%`} cy={`${30 + (i % 3) * 20}%`} r="3" fill={color} opacity="0.12">
          <animate attributeName="cy" values={`${30 + (i % 3) * 20}%;${25 + (i % 3) * 20}%;${30 + (i % 3) * 20}%`}
            dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.12;0.04;0.12" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

// ─── Neurology: Neural network ────────────────────────────────

function NeurologyScene({ color }: { color: string }) {
  const nodes = [
    { x: '15%', y: '25%' }, { x: '35%', y: '45%' }, { x: '55%', y: '20%' },
    { x: '75%', y: '40%' }, { x: '90%', y: '65%' }, { x: '20%', y: '70%' },
    { x: '50%', y: '70%' }, { x: '80%', y: '20%' }, { x: '60%', y: '55%' },
  ];
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 7], [3, 7], [1, 8], [8, 4], [6, 4]
  ];

  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke={color} strokeWidth="1" strokeOpacity="0.15"
        >
          <animate attributeName="stroke-opacity" values="0.08;0.25;0.08"
            dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
        </line>
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r="4" fill={color} opacity="0.2">
          <animate attributeName="r" values="3;6;3" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.15;0.35;0.15" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

// ─── Respiratory: Lung breathing ─────────────────────────────

function RespiratoryScene({ color }: { color: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Left lung outline */}
      <ellipse cx="30%" cy="50%" rx="12%" ry="28%" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.15">
        <animate attributeName="ry" values="28%;32%;28%" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.15;0.3;0.15" dur="3.5s" repeatCount="indefinite" />
      </ellipse>

      {/* Right lung outline */}
      <ellipse cx="70%" cy="50%" rx="12%" ry="28%" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.15">
        <animate attributeName="ry" values="28%;32%;28%" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.15;0.3;0.15" dur="3.5s" repeatCount="indefinite" />
      </ellipse>

      {/* Oxygen particles */}
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx={`${20 + i * 8}%`} cy="50%" r="3" fill={color} opacity="0.2">
          <animate attributeName="cy" values="60%;40%;60%" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.05;0.3;0.05" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Bronchi tree center */}
      <line x1="50%" y1="15%" x2="30%" y2="40%" stroke={color} strokeWidth="2" strokeOpacity="0.12" />
      <line x1="50%" y1="15%" x2="70%" y2="40%" stroke={color} strokeWidth="2" strokeOpacity="0.12" />
      <line x1="30%" y1="40%" x2="22%" y2="55%" stroke={color} strokeWidth="1.2" strokeOpacity="0.1" />
      <line x1="30%" y1="40%" x2="35%" y2="58%" stroke={color} strokeWidth="1.2" strokeOpacity="0.1" />
      <line x1="70%" y1="40%" x2="78%" y2="55%" stroke={color} strokeWidth="1.2" strokeOpacity="0.1" />
      <line x1="70%" y1="40%" x2="65%" y2="58%" stroke={color} strokeWidth="1.2" strokeOpacity="0.1" />
    </svg>
  );
}

// ─── Orthopedics: Skeleton wireframe ─────────────────────────

function OrthopedicsScene({ color }: { color: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Wireframe bone grid */}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={`${10 + i * 15}%`} y="20%" width="8%" height="60%" rx="4%"
          fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.12"
          strokeDasharray="4 3" />
      ))}
      {/* Horizontal bands */}
      {Array.from({ length: 4 }, (_, i) => (
        <line key={i} x1="5%" y1={`${25 + i * 16}%`} x2="95%" y2={`${25 + i * 16}%`}
          stroke={color} strokeWidth="0.5" strokeOpacity="0.08" strokeDasharray="6 4" />
      ))}
      {/* X-ray cross marks */}
      {[['25%', '35%'], ['55%', '60%'], ['80%', '30%']].map(([x, y], i) => (
        <g key={i}>
          <line x1={`calc(${x} - 8px)`} y1={y} x2={`calc(${x} + 8px)`} y2={y}
            stroke={color} strokeWidth="1.5" strokeOpacity="0.2" />
          <line x1={x} y1={`calc(${y} - 8px)`} x2={x} y2={`calc(${y} + 8px)`}
            stroke={color} strokeWidth="1.5" strokeOpacity="0.2" />
        </g>
      ))}
    </svg>
  );
}

// ─── Pharmacology: Molecules ──────────────────────────────────

function PharmacologyScene({ color }: { color: string }) {
  const atoms = [
    { cx: '20%', cy: '40%' }, { cx: '35%', cy: '25%' }, { cx: '50%', cy: '55%' },
    { cx: '65%', cy: '30%' }, { cx: '80%', cy: '60%' }, { cx: '45%', cy: '70%' },
  ];
  const bonds = [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [4, 5]];

  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {bonds.map(([a, b], i) => (
        <line key={i}
          x1={atoms[a].cx} y1={atoms[a].cy}
          x2={atoms[b].cx} y2={atoms[b].cy}
          stroke={color} strokeWidth="2" strokeOpacity="0.2"
        />
      ))}
      {atoms.map((a, i) => (
        <circle key={i} cx={a.cx} cy={a.cy} r="8" fill={color} fillOpacity="0.12"
          stroke={color} strokeWidth="1" strokeOpacity="0.3">
          <animate attributeName="r" values="7;10;7" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

// ─── Microbiology: Floating cells ────────────────────────────

function MicrobiologyScene({ color }: { color: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => {
        const cx = `${5 + i * 9}%`;
        const cy = `${20 + (i % 4) * 18}%`;
        const r = 8 + (i % 3) * 4;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.18">
              <animate attributeName="cy" values={`${20 + (i % 4) * 18}%;${15 + (i % 4) * 18}%;${20 + (i % 4) * 18}%`}
                dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={cx} cy={cy} r={r * 0.4} fill={color} opacity="0.1">
              <animate attributeName="cy" values={`${20 + (i % 4) * 18}%;${15 + (i % 4) * 18}%;${20 + (i % 4) * 18}%`}
                dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Default: Floating particles ─────────────────────────────

function FloatingParticles({ color }: { color: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <circle key={i}
          cx={`${5 + i * 6}%`} cy={`${15 + (i % 5) * 17}%`}
          r={2 + (i % 3)}
          fill={color} opacity="0.1"
        >
          <animate attributeName="cy" values={`${15 + (i % 5) * 17}%;${10 + (i % 5) * 17}%;${15 + (i % 5) * 17}%`}
            dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.08;0.2;0.08" dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

// ─── Specialty Stats ─────────────────────────────────────────

const SPECIALTY_STATS: Record<SpecialtyId, { label: string; value: string }[]> = {
  default: [],
  cardiology: [
    { label: 'Study Modules', value: '24+' },
    { label: 'ECG Topics', value: '48' },
    { label: 'Clinical Cases', value: '120+' },
    { label: 'Exam Questions', value: '800+' },
  ],
  neurology: [
    { label: 'Brain Regions', value: '32' },
    { label: 'Neurological Disorders', value: '60+' },
    { label: 'Reflex Charts', value: '18' },
    { label: 'Exam Questions', value: '650+' },
  ],
  respiratory: [
    { label: 'Lung Anatomy Topics', value: '20' },
    { label: 'ABG Protocols', value: '12' },
    { label: 'PFT Guides', value: '8' },
    { label: 'Clinical Scenarios', value: '90+' },
  ],
  orthopedics: [
    { label: 'Bone Anatomy', value: '206' },
    { label: 'Joint Types', value: '28' },
    { label: 'Fracture Types', value: '45+' },
    { label: 'Surgical Approaches', value: '30+' },
  ],
  anatomy: [
    { label: 'Body Systems', value: '11' },
    { label: 'Organ Topics', value: '120+' },
    { label: 'Diagrams', value: '400+' },
    { label: 'Exam Questions', value: '2000+' },
  ],
  pharmacology: [
    { label: 'Drug Classes', value: '80+' },
    { label: 'Mechanism Charts', value: '150+' },
    { label: 'Side Effects Tables', value: '200+' },
    { label: 'High Yield Mnemonics', value: '300+' },
  ],
  microbiology: [
    { label: 'Bacteria', value: '120+' },
    { label: 'Viruses', value: '80+' },
    { label: 'Lab Protocols', value: '45' },
    { label: 'Exam Questions', value: '1200+' },
  ],
  gastroenterology: [
    { label: 'GI Organs', value: '12' },
    { label: 'Liver Pathology', value: '30+' },
    { label: 'Endoscopy Notes', value: '20+' },
    { label: 'Clinical Cases', value: '80+' },
  ],
  nephrology: [
    { label: 'Kidney Functions', value: '18' },
    { label: 'Electrolyte Disorders', value: '24' },
    { label: 'Dialysis Guides', value: '10' },
    { label: 'Exam Questions', value: '500+' },
  ],
  ophthalmology: [
    { label: 'Eye Anatomy', value: '16' },
    { label: 'Retinal Disorders', value: '30+' },
    { label: 'Surgical Procedures', value: '18' },
    { label: 'Visual Pathway Notes', value: '12' },
  ],
};

function SpecialtyStats({ specialtyId }: { specialtyId: SpecialtyId }) {
  const stats = SPECIALTY_STATS[specialtyId];
  const config = SPECIALTIES[specialtyId];

  if (!stats || stats.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
          className="rounded-2xl p-4 text-center"
          style={{
            background: `${config.primaryColor}08`,
            border: `1px solid ${config.primaryColor}25`,
          }}
        >
          <p className="text-xl font-display font-bold" style={{ color: config.primaryColor }}>
            {stat.value}
          </p>
          <p className="text-[11px] font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {stat.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Mini-selector (all other specialties to quick-switch) ────

export function SpecialtyQuickSwitch() {
  const { specialty, setSpecialty } = useSpecialty();

  const others: SpecialtyId[] = [
    'cardiology', 'neurology', 'respiratory', 'orthopedics',
    'anatomy', 'pharmacology', 'microbiology',
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-6">
      {others.map(id => {
        const c = SPECIALTIES[id];
        const isActive = specialty.id === id;
        return (
          <motion.button
            key={id}
            onClick={() => setSpecialty(id)}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-display transition-all"
            style={{
              background: isActive ? c.primaryColor : `${c.primaryColor}12`,
              color: isActive ? '#fff' : c.primaryColor,
              border: `1px solid ${isActive ? c.primaryColor : `${c.primaryColor}30`}`,
              boxShadow: isActive ? `0 0 16px ${c.glowColor}` : 'none',
            }}
          >
            <span>{c.emoji}</span>
            <span>{c.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
