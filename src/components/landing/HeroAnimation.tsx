import { Suspense, lazy, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const HeroScene3D = lazy(() => import('./HeroScene3D'));

function HeroFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <motion.div
        animate={{ y: [0, -16, 0], rotateY: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <div className="w-52 h-60 sm:w-60 sm:h-72 rounded-3xl bg-gradient-to-br from-cyan-500/25 to-blue-600/35 border border-white/15 backdrop-blur-2xl shadow-2xl flex items-center justify-center">
          <svg viewBox="0 0 80 80" className="w-28 h-28 text-cyan-400/90">
            <path fill="currentColor" d="M20 15h40v50H20z" opacity="0.3" rx="4" />
            <path fill="currentColor" d="M25 20h30v4H25zm0 8h25v3H25zm0 7h20v3H25z" />
            <circle cx="55" cy="55" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="M55 49v12M49 55h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-6 -right-6 w-10 h-10 rounded-full bg-cyan-400/40 blur-xl"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-8 -left-8 w-14 h-14 rounded-full bg-blue-500/30 blur-2xl"
        />
      </motion.div>
    </div>
  );
}

export default function HeroAnimation() {
  const [useLightweight, setUseLightweight] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 100]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.5]);
  const scale = useTransform(scrollY, [0, 400], [1, 0.92]);

  useEffect(() => {
    setMounted(true);
    const isMobile = window.innerWidth < 768;
    const isLowPower = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setUseLightweight(isMobile || isLowPower || prefersReduced);
  }, []);

  return (
    <motion.div
      style={{ y, opacity, scale }}
      className="w-full h-[320px] sm:h-[420px] lg:h-[500px] relative"
    >
      {!mounted ? (
        <div className="w-full h-full" />
      ) : useLightweight ? (
        <HeroFallback />
      ) : (
        <Suspense fallback={<HeroFallback />}>
          <HeroScene3D />
        </Suspense>
      )}
    </motion.div>
  );
}
