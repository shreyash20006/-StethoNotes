import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useIntersection } from '@/hooks';
import { animateCounter } from '@/lib/animations';

const STATS = [
  { value: 2000000, label: 'Active Students', suffix: '+' },
  { value: 500000, label: 'Study Notes', suffix: '+' },
  { value: 100, label: 'Universities', suffix: '+' },
  { value: 500000000, label: 'Seller Earnings', prefix: '₹', suffix: 'Cr+' },
];

const Statistics = () => {
  const { ref, isVisible } = useIntersection({ triggerOnce: true });
  const counterRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (isVisible) {
      counterRefs.current.forEach((ref, idx) => {
        if (ref) {
          const stat = STATS[idx];
          const displayValue = stat.value / (stat.value > 1000000 ? 1000000 : stat.value > 100 ? 1 : 1);
          animateCounter(ref, 0, displayValue, 2000);
        }
      });
    }
  }, [isVisible]);

  return (
    <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-primary-dark">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="text-center"
            >
              <div
                ref={(el) => {
                  if (el) counterRefs.current[idx] = el;
                }}
                className="text-4xl sm:text-5xl font-display font-extrabold text-white mb-2"
              >
                0
              </div>
              <p className="text-white/80 text-sm font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Statistics;
