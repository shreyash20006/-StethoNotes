import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FAQItemProps {
  question: string;
  answer: React.ReactNode;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/5 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-2 font-display font-bold text-sm sm:text-base text-white hover:text-primary transition-colors"
      >
        <span>{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted shrink-0 ml-4"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="text-muted text-xs sm:text-sm leading-relaxed pt-2 pb-4 pr-6">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const faqs = [
    {
      question: "How do I receive my notes?",
      answer: "Notes are delivered via email immediately after successful payment verification. There is no direct file download link on the checkout page for security; you will receive a secure email with download links."
    },
    {
      question: "How long is the download link valid?",
      answer: "Generated download links remain active for exactly 48 hours for copyright protection. Once they expire, you can request fresh links at any time using our order tracking tool."
    },
    {
      question: "Can I request another email?",
      answer: (
        <span>
          Yes! If you lost your email or need a redelivery, go to the{" "}
          <Link to="/track-order" className="text-primary font-semibold hover:underline">
            Track Order
          </Link>{" "}
          page, enter your order parameters, and hit the resend button to get fresh links instantly.
        </span>
      )
    },
    {
      question: "Can I get a refund?",
      answer: "Due to the immediate digital delivery nature of academic study guides and PDF files, all note purchases are non-refundable. Please refer to our Refund Policy for specific exclusions."
    }
  ];

  return (
    <section className="py-12 bg-void text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-muted text-xs sm:text-sm mt-2">
            Quick answers to the most common inquiries from our medical students.
          </p>
        </div>

        <div className="glass-card-v2 bg-card/65 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl">
          {faqs.map((faq, idx) => (
            <FAQItem key={idx} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
