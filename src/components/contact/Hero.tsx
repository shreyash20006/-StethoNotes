import { motion } from 'motion/react';
import { Mail, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary text-white py-20 lg:py-28">
      {/* Premium background grid & gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full font-display text-xs font-semibold text-accent uppercase tracking-wider mb-6">
            Get In Touch
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white max-w-3xl mx-auto leading-tight"
        >
          Contact <span className="text-accent">StethoNotes</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-300 text-sm sm:text-base lg:text-lg font-sans max-w-xl mx-auto mt-6 leading-relaxed"
        >
          Need help with your order, notes, or payments? We're here to help.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
        >
          <a
            href="mailto:support@stethonotes.store"
            className="w-full sm:w-auto btn-primary py-3.5 px-8 font-display font-bold text-sm shadow-cyan-soft flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            <span>Email Support</span>
          </a>
          <Link
            to="/courses"
            className="w-full sm:w-auto px-8 py-3.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all font-display font-bold text-sm text-white flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-accent" />
            <span>Browse Notes</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
