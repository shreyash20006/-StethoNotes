import { useEffect, useRef } from 'react';

// ============================================
// HOOK: useMousePosition
// Tracks cursor coordinates without triggering React re-renders.
// Essential for R3F frame loop interactions.
// ============================================

export default function useMousePosition() {
  const mouseRef = useRef({ x: 0, y: 0, px: 0, py: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth) * 2 - 1; // normalized -1 to 1
      const y = -(clientY / window.innerHeight) * 2 + 1; // normalized -1 to 1
      
      mouseRef.current = {
        x,
        y,
        px: clientX,
        py: clientY,
      };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return mouseRef;
}
