import { motion } from 'framer-motion';
import { Award, ShieldCheck, Activity, Zap, Clock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui';
import { useIntersection } from '@/hooks';

const WHY_US = [
  {
    icon: <Award className="w-8 h-8 text-accent" />,
    title: 'Topper-Curated Content',
    desc: 'Compiled by university rankers and toppers, ensuring maximum accuracy and success.',
  },
  {
    icon: <Clock className="w-8 h-8 text-accent" />,
    title: 'Instant Email Delivery',
    desc: 'Get your note files sent directly to your inbox immediately after payment.',
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-accent" />,
    title: 'Secure Payments',
    desc: 'Fully encrypted and secure checkout powered by Razorpay.',
  },
  {
    icon: <Activity className="w-8 h-8 text-accent" />,
    title: 'Affordable Pricing',
    desc: 'Access high-quality guides at a fraction of textbook costs.',
  },
  {
    icon: <Zap className="w-8 h-8 text-accent" />,
    title: 'High-Yield Notes',
    desc: 'Exam-focused summaries and diagrams to maximize your learning potential.',
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-accent" />,
    title: 'Verified Quality',
    desc: 'All sellers are verified, ensuring consistent and reliable content quality.',
  },
];

const WhyUs = () => {
  const { ref, isVisible } = useIntersection({ triggerOnce: true });

  return (
    <section ref={ref} id="why-us" className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-primary mb-4">
            Why Study with StethoNotes?
          </h2>
          <div className="w-16 h-1 bg-accent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 text-base">
            Designed specifically to meet the high academic demands of modern medicine and health sciences.
          </p>
        </motion.div>

        {/* Features Grid */}
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {WHY_US.map((item, idx) => (
            <motion.div
              key={idx}
              variants={{
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4 }}
            >
              <Card variant="default" hover>
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-lg font-display font-bold text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default WhyUs;
