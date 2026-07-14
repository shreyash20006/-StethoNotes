import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useIntersection } from '@/hooks';

const FAQ_ITEMS = [
  {
    question: 'How do I purchase study notes?',
    answer: 'Simply browse our courses, select the notes you need, add them to your cart, and proceed to checkout. You\'ll receive the PDF via email within minutes.',
  },
  {
    question: 'Are the notes verified for accuracy?',
    answer: 'Yes, all sellers on StethoNotes are verified toppers and experienced educators. Every note goes through a quality check before being made available.',
  },
  {
    question: 'Can I access notes offline?',
    answer: 'Once downloaded, you can access your PDFs offline. Our PWA also allows you to browse previously viewed notes without internet.',
  },
  {
    question: 'What\'s your refund policy?',
    answer: 'We offer a 7-day money-back guarantee if you\'re not satisfied with your purchase. No questions asked.',
  },
  {
    question: 'How can I become a seller?',
    answer: 'Visit our seller registration page, complete the verification process, and start uploading your study materials. You\'ll earn up to 80% commission.',
  },
];

const FAQ = () => {
  const { ref, isVisible } = useIntersection({ triggerOnce: true });
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <section ref={ref} className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 border-b border-gray-100">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-primary mb-4">
            Frequently Asked Questions
          </h2>
          <div className="w-16 h-1 bg-accent rounded-full mx-auto" />
        </motion.div>

        {/* FAQ Items */}
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
          className="space-y-3"
        >
          {FAQ_ITEMS.map((item, idx) => (
            <motion.div
              key={idx}
              variants={{
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
                className="w-full text-left bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <p className="font-display font-semibold text-primary text-base">
                    {item.question}
                  </p>
                  <ChevronDown
                    className={`w-5 h-5 text-accent transition-transform duration-300 ${activeIdx === idx ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Answer */}
                {activeIdx === idx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-100"
                  >
                    <p className="text-gray-600 text-sm leading-relaxed">{item.answer}</p>
                  </motion.div>
                )}
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
