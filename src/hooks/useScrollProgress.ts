import { useScroll, useSpring } from 'motion/react';

// ============================================
// HOOK: useScrollProgress
// Uses motion/react's scroll hooks combined with a spring
// for smooth scroll values without triggering component re-renders.
// ============================================

export default function useScrollProgress() {
  const { scrollYProgress } = useScroll();
  
  // Create a spring-smoothed version of the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.0001
  });

  return smoothProgress;
}
