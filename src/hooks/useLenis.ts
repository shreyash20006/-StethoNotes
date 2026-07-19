import { useEffect } from 'react';

// ============================================================
// LENIS SMOOTH SCROLL HOOK
// Physics-based smooth scrolling that makes the page feel
// premium and intentional — like a native macOS application.
// ============================================================

export function useLenis() {
  useEffect(() => {
    // Skip on mobile / reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (prefersReduced || isMobile) return;

    let lenis: any;

    const init = async () => {
      try {
        // Use dynamic import for the 'lenis' package (was @studio-freight/lenis)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const LenisModule = await import(/* @vite-ignore */ 'lenis') as any;
        const LenisClass = LenisModule.default || LenisModule.Lenis;
        if (!LenisClass) return;

        lenis = new LenisClass({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 1,
        });

        function raf(time: number) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);
      } catch (err) {
        // Lenis not available, graceful fallback
        console.warn('Lenis not available, using native scroll');
      }
    };

    init();

    return () => {
      if (lenis) lenis.destroy();
    };
  }, []);
}
