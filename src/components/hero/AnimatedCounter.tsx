import { useEffect, useRef, useState } from 'react';

// ============================================
// COMPONENT: AnimatedCounter
// Triggers a count-up animation when element enters the viewport.
// Respects prefers-reduced-motion.
// ============================================

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  duration?: number; // duration in seconds
}

export default function AnimatedCounter({
  target,
  suffix = '',
  duration = 1.5,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);

          const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
          ).matches;

          if (prefersReducedMotion) {
            setCount(target);
            return;
          }

          let startTime: number | null = null;

          const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / (duration * 1000);

            if (progress < 1) {
              // Cubic ease-out
              const easedProgress = 1 - Math.pow(1 - progress, 3);
              setCount(Math.floor(easedProgress * target));
              requestAnimationFrame(step);
            } else {
              setCount(target);
            }
          };

          requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    const element = elementRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [target, duration, hasAnimated]);

  return (
    <span ref={elementRef} className="font-mono font-bold">
      {count.toLocaleString()}{suffix}
    </span>
  );
}
