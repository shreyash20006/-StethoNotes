import { motion } from 'motion/react';

// ============================================
// COMPONENT: VitalsCards
// 6 cards designed as ICU vitals-monitor readouts.
// Absolute positioning around 3D scene edges.
// Floating vertical loops staggered via framer-motion.
// ============================================

interface VitalItem {
  id: number;
  label: string;
  readout: string;
  pulseColor: string;
  positionClass: string; // Tailwind absolute positions
  delay: number; // Staggered delays for floating loops
}

const VITALS_DATA: VitalItem[] = [
  {
    id: 1,
    label: 'Instant PDF',
    readout: '2.1s avg delivery',
    pulseColor: 'bg-cyan-400',
    positionClass: 'top-[8%] left-[0%]',
    delay: 0,
  },
  {
    id: 2,
    label: 'Verified Notes',
    readout: 'QA double-checked',
    pulseColor: 'bg-emerald-400',
    positionClass: 'top-[30%] -left-[12%]',
    delay: 0.8,
  },
  {
    id: 3,
    label: 'University Based',
    readout: 'mapped to syllabus',
    pulseColor: 'bg-blue-400',
    positionClass: 'bottom-[12%] left-[2%]',
    delay: 1.5,
  },
  {
    id: 4,
    label: 'Top Rated',
    readout: '4.9 / 5 avg rating',
    pulseColor: 'bg-yellow-400',
    positionClass: 'top-[12%] right-[5%]',
    delay: 0.4,
  },
  {
    id: 5,
    label: 'Watermarked',
    readout: 'traceable · anti-leak',
    pulseColor: 'bg-red-400',
    positionClass: 'top-[42%] -right-[8%]',
    delay: 1.2,
  },
  {
    id: 6,
    label: 'Exam Ready',
    readout: 'formatted · concise',
    pulseColor: 'bg-purple-400',
    positionClass: 'bottom-[15%] right-[0%]',
    delay: 1.9,
  },
];

export default function VitalsCards() {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none hidden lg:block">
      {VITALS_DATA.map((item) => (
        <motion.div
          key={item.id}
          className={`absolute ${item.positionClass} w-48`}
          initial={{ y: 0 }}
          animate={{ y: [-6, 6, -6] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: item.delay,
          }}
        >
          <div className="glass-panel-dark rounded-xl px-3.5 py-2.5 border border-white/8 shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-md relative overflow-hidden">
            {/* Header: Pulsing dot + Label */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${item.pulseColor} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${item.pulseColor}`}></span>
              </span>
              <span className="text-[10px] font-sans font-semibold tracking-wider text-slate-400 uppercase">
                {item.label}
              </span>
            </div>

            {/* Readout stats styled like medical dashboard */}
            <div className="flex items-end justify-between gap-1 border-t border-white/5 pt-1.5">
              <span className="text-[11px] font-mono text-paper tracking-tight leading-none uppercase">
                {item.readout}
              </span>
              
              {/* ICU ECG-tick SVG */}
              <svg className="w-8 h-4 text-cyan-400/40 opacity-75 shrink-0" viewBox="0 0 40 20" fill="none">
                <path
                  d="M0 10H15L17 5L19 15L21 8L22 10H40"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
