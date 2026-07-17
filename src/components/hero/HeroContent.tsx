import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import MagneticButton from './MagneticButton';
import AnimatedCounter from './AnimatedCounter';

// ============================================
// COMPONENT: HeroContent
// Handles left-column layout: badge, staggered heading words,
// moving cyan text gradient, paragraph, magnetic buttons, and stats.
// ============================================

export default function HeroContent() {
  const navigate = useNavigate();
  const headingText = 'Your Stethoscope to Academic Success';
  const words = headingText.split(' ');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  };

  return (
    <div className="flex flex-col justify-center text-left space-y-6 max-w-2xl">
      {/* 1. GLASS PILL BADGE */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
        className="inline-flex items-center gap-2 self-start bg-slate-950/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/15"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <span className="text-[10px] font-mono tracking-wider font-semibold uppercase text-cyan-400">
          India's Largest Medical Notes Marketplace
        </span>
      </motion.div>

      {/* 2. STAGGERED HEADING WORDS */}
      <motion.h1
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-paper leading-[1.08] tracking-tight font-display"
      >
        {words.map((word, idx) => {
          const isStethoscope = word.toLowerCase().replace(/[^a-z]/g, '') === 'stethoscope';
          return (
            <motion.span
              key={idx}
              variants={wordVariants}
              className="inline-block mr-[0.25em]"
            >
              {isStethoscope ? (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1FB6D4] via-[#4DE8FF] to-[#1FB6D4] bg-[length:200%_auto] animate-text-gradient">
                  {word}
                </span>
              ) : (
                word
              )}
            </motion.span>
          );
        })}
      </motion.h1>

      {/* 3. PARAGRAPH */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
        className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg font-sans font-light"
      >
        Curated, university-mapped study notes from top-ranked seniors — instant PDF
        delivery, watermarked and exam-ready. Less time hunting for material, more
        time studying it.
      </motion.p>

      {/* 4. MAGNETIC ACTIONS */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
        className="flex flex-wrap items-center gap-4 pt-2"
      >
        <MagneticButton
          variant="primary"
          onClick={() => navigate('/courses')}
        >
          Browse Study Notes
        </MagneticButton>
        <MagneticButton
          variant="ghost"
          onClick={() => navigate('/seller/login')}
        >
          Become a Seller
        </MagneticButton>
      </motion.div>

      {/* 5. STATS ROW */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-slate-800"
      >
        <div>
          <h3 className="text-xl sm:text-2xl font-bold font-mono text-paper tracking-tight">
            <AnimatedCounter target={10000} suffix="+" />
          </h3>
          <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mt-1">
            Active Students
          </p>
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold font-mono text-paper tracking-tight">
            <AnimatedCounter target={1500} suffix="+" />
          </h3>
          <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mt-1">
            Syllabus PDFs
          </p>
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold font-mono text-paper tracking-tight">
            <AnimatedCounter target={150} suffix="+" />
          </h3>
          <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mt-1">
            Contributors
          </p>
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 tracking-tight">
            <AnimatedCounter target={4.9} suffix="★" duration={1.2} />
          </h3>
          <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mt-1">
            Ratings Average
          </p>
        </div>
      </motion.div>

      {/* Style for animating the text gradient */}
      <style>{`
        @keyframes textGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-text-gradient {
          animation: textGradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
