import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag } from 'lucide-react';

export default function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card-v2 bg-card/60 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-12 shadow-2xl max-w-xl mx-auto border border-white/10 text-white"
    >
      <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary mb-6 animate-pulse">
        <ShoppingBag className="w-10 h-10" />
      </div>

      <h2 className="text-2xl font-display font-extrabold text-white mb-3">
        Your cart is empty
      </h2>

      <p className="text-muted font-sans text-sm max-w-sm mb-8 leading-relaxed">
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
