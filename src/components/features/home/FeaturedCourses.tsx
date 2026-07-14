import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import { MOTION_VARIANTS } from '@/styles/design-tokens';
import { useIntersection } from '@/hooks';

const CATEGORIES = [
  { id: 1, name: 'MBBS', desc: 'Bachelor of Medicine', icon: '🩺', color: 'from-blue-500/10 to-cyan-500/10' },
  { id: 2, name: 'BHMS', desc: 'Homoeopathic Medicine', icon: '🌿', color: 'from-emerald-500/10 to-teal-500/10' },
  { id: 3, name: 'BAMS', desc: 'Ayurvedic Medicine', icon: '🍃', color: 'from-green-500/10 to-emerald-500/10' },
  { id: 4, name: 'B.Sc Nursing', desc: 'Bachelor of Nursing', icon: '👩‍⚕️', color: 'from-pink-500/10 to-rose-500/10' },
  { id: 5, name: 'B.Pharm', desc: 'Bachelor of Pharmacy', icon: '💊', color: 'from-purple-500/10 to-indigo-500/10' },
  { id: 6, name: 'BPT', desc: 'Physiotherapy', icon: '🏃', color: 'from-orange-500/10 to-yellow-500/10' },
];

const FeaturedCourses = () => {
  const { ref, isVisible } = useIntersection({ triggerOnce: true });

  return (
    <section ref={ref} className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-primary mb-4">
            Featured Courses
          </h2>
          <div className="w-16 h-1 bg-accent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 text-base max-w-2xl mx-auto">
            Comprehensive study materials tailored for every medical and paramedical degree program.
          </p>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          initial="initial"
          animate={isVisible ? 'animate' : 'initial'}
          variants={{
            animate: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {CATEGORIES.map((category) => (
            <motion.div
              key={category.id}
              variants={{
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4 }}
            >
              <Card
                variant="default"
                hover
                className={`bg-gradient-to-br ${category.color} border-0 cursor-pointer`}
              >
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-lg font-display font-bold text-primary mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{category.desc}</p>
                <button className="text-accent text-sm font-semibold hover:gap-2 flex items-center gap-1 transition-all">
                  Explore
                  <span>→</span>
                </button>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedCourses;
