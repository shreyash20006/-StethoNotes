import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card } from '@/components/ui';
import { useIntersection } from '@/hooks';

const TESTIMONIALS = [
  {
    name: 'Anjali Sharma',
    role: 'MBBS 3rd Year, AIIMS Delhi',
    avatar: '👩‍🎓',
    quote: 'StethoNotes saved me during my 3rd year exams. The anatomy notes are incredibly detailed and visual.',
    rating: 5,
  },
  {
    name: 'Rohan Patel',
    role: 'BHMS 2nd Year, Delhi University',
    avatar: '👨‍⚕️',
    quote: 'Finally found high-quality study materials at affordable prices. Highly recommend!',
    rating: 5,
  },
  {
    name: 'Priya Singh',
    role: 'B.Pharm 1st Year, Pune University',
    avatar: '👩‍🔬',
    quote: 'The pharmacology guides are comprehensive and easy to understand. Great value for money.',
    rating: 5,
  },
];

const Testimonials = () => {
  const { ref, isVisible } = useIntersection({ triggerOnce: true });

  return (
    <section ref={ref} className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-primary mb-4">
            What Students Say
          </h2>
          <div className="w-16 h-1 bg-accent rounded-full mx-auto" />
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial="initial"
          animate={isVisible ? 'animate' : 'initial'}
          variants={{
            animate: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {TESTIMONIALS.map((testimonial, idx) => (
            <motion.div
              key={idx}
              variants={{
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4 }}
            >
              <Card variant="default" hover className="h-full flex flex-col justify-between">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array(testimonial.rating)
                    .fill(null)
                    .map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                </div>

                {/* Quote */}
                <p className="text-gray-600 text-sm mb-6 italic leading-relaxed">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{testimonial.avatar}</div>
                    <div>
                      <p className="font-display font-semibold text-primary text-sm">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
