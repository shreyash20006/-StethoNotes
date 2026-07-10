import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag } from 'lucide-react';

export default function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center py-20 bg-white border border-gray-100 rounded-2xl flex flex-col items-center justify-center p-8 shadow-cyan-soft max-w-xl mx-auto"
    >
      <div className="w-20 h-20 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center text-accent mb-6 animate-pulse">
        <ShoppingBag className="w-10 h-10" />
      </div>

      <h2 className="text-2xl font-display font-extrabold text-primary mb-3">
        Your cart is empty
      </h2>

      <p className="text-gray-400 font-sans text-sm max-w-sm mb-8 leading-relaxed">
        Looks like you haven't added any study notes yet. Explore our topper-curated guides to start studying smarter!
      </p>

      <Link
        to="/courses"
        className="btn-primary py-3.5 px-8 font-display font-bold text-sm shadow-md"
      >
        Browse Notes
      </Link>
    </motion.div>
  );
}
