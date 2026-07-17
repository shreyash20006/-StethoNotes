import { lazy, Suspense, useEffect, useState } from 'react';
import { isWebGLAvailable } from '../../lib/webgl';
import useMousePosition from '../../hooks/useMousePosition';
import useScrollProgress from '../../hooks/useScrollProgress';
import useMediaQuery from '../../hooks/useMediaQuery';
import HeroBackground from './background/HeroBackground';
import ParticleField from './background/ParticleField';
import HeroContent from './HeroContent';
import VitalsCards from './VitalsCards';
import StaticFallback from './scene/StaticFallback';

// Lazy-load the R3F Canvas and scene elements to keep initial JS bundle small
const Scene3D = lazy(() => import('./scene/Scene3D'));

// ============================================
// COMPONENT: HeroSection (Main Orchestrator)
// Splits layout (2 cols on desktop, stacked on mobile).
// Runs capability checks (WebGL availability) and responsive queries
// to toggle adaptive performance modes (mobile vs tablet vs desktop).
// ============================================

export default function HeroSection() {
  const [webglAvailable, setWebglAvailable] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Responsive device query checks
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Track pointers and scrolling dynamically using hooks
  const mouseRef = useMousePosition();
  const scrollProgress = useScrollProgress();

  useEffect(() => {
    setIsMounted(true);
    setWebglAvailable(isWebGLAvailable());
  }, []);

  // Determine device tier:
  // - 'desktop': full R3F, 12 orbiting items, Bloom postprocessing
  // - 'tablet': full R3F, 6 orbiting items, disable Bloom
  // - 'mobile' / non-WebGL: CSS static fallback, no R3F Canvas
  const deviceTier: 'desktop' | 'tablet' | 'mobile' = isDesktop
    ? 'desktop'
    : isTablet
    ? 'tablet'
    : 'mobile';

  const shouldRenderCanvas = isMounted && webglAvailable && deviceTier !== 'mobile';

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center py-20 px-6 sm:px-12 lg:px-16 overflow-hidden bg-[#060D1A] select-none">
      {/* 1. CORE BACKDROP & PARTICLES */}
      <HeroBackground />
      {isMounted && <ParticleField scrollProgress={scrollProgress} />}

      {/* 2. MAIN TWO-COLUMN LAYOUT */}
      <div className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-160px)]">
        {/* Left Column: Heading, Badges, CTAs, Stats */}
        <HeroContent />

        {/* Right Column: 3D Scene / Fallback */}
        <div className="relative w-full h-[400px] sm:h-[500px] lg:h-full min-h-[400px] flex items-center justify-center">
          {shouldRenderCanvas ? (
            <Suspense fallback={<StaticFallback />}>
              <Scene3D
                deviceTier={deviceTier as 'desktop' | 'tablet'}
                scrollProgress={scrollProgress}
                mouseRef={mouseRef}
              />
            </Suspense>
          ) : (
            <StaticFallback />
          )}

          {/* 3. ICU VITALS STATUS CARDS (Desktop only) */}
          {deviceTier === 'desktop' && <VitalsCards />}
        </div>
      </div>
    </section>
  );
}
