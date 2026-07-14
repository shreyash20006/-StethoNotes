import { useEffect, useRef, useState } from 'react';

interface UseIntersectionOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

export const useIntersection = (options: UseIntersectionOptions = {}) => {
  const { triggerOnce = false, ...observerOptions } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (triggerOnce) {
          observer.unobserve(ref.current!);
        }
      } else if (!triggerOnce) {
        setIsVisible(false);
      }
    }, {
      threshold: 0.1,
      ...observerOptions,
    });

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [triggerOnce, observerOptions]);

  return { ref, isVisible };
};
