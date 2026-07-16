import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { CartItem as CartItemType } from '../../types';
import { Trash2, Heart, Star, Mail, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface CartItemProps {
  item: CartItemType;
  onRemove: (noteId: string) => void;
}

function CartItemInner({ item, onRemove }: CartItemProps) {
  const { note } = item;
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Math variables for prices
  const originalPrice = Math.round(note.price * 1.4); // Simulate a 40% higher original price
  const discountPercent = 30; // 30% off simulated badge

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -3, boxShadow: '0 10px 25px -5px rgba(31, 182, 212, 0.08)' }}
      className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 transition-shadow relative overflow-hidden"
    >
      {/* Thumbnail Container */}
      <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden shrink-0 border border-gray-50 relative group bg-gray-50">
        <img
          src={note.thumbnail_url}
          alt={note.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2 bg-accent text-white text-[9px] font-display font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
          {discountPercent}% Off
        </div>
      </div>

      {/* Item Metadata */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] bg-primary/5 text-primary font-display font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                {(note as any).course?.name || 'Medical Guide'}
              </span>
              <Link to={`/notes/${note.id}`} className="hover:text-accent transition-colors">
                <h3 className="font-display font-bold text-sm sm:text-base text-primary leading-tight line-clamp-1">
                  {note.title}
                </h3>
              </Link>
            </div>
            
            {/* Price Box */}
            <div className="text-right shrink-0">
              <div className="font-display font-extrabold text-base text-primary">
                ₹{note.price.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400 line-through font-sans mt-0.5">
                ₹{originalPrice.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-gray-400 font-sans">
            <span>Subject: <strong className="text-gray-500 font-medium">{note.subject}</strong></span>
            <div className="w-1 h-1 bg-gray-200 rounded-full" />
            <span>Semester: <strong className="text-gray-500 font-medium">{(note as any).semester || '1st Sem'}</strong></span>
            <div className="w-1 h-1 bg-gray-200 rounded-full" />
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
              <span className="font-semibold text-gray-600">4.8</span>
            </div>
          </div>
        </div>

        {/* Card Actions & Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-50 pt-3 mt-3">
          {/* Delivered instantly text */}
          <span className="text-[10px] sm:text-xs text-accent font-sans font-semibold flex items-center gap-1.5">
            <Mail className="w-4 h-4" />
            <span>✔ Delivered instantly via Email</span>
          </span>

          <div className="flex items-center gap-2">
            {/* Preview link */}
            <Link
              to={`/notes/${note.id}`}
              className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-xl transition-all flex items-center gap-1 text-[11px] font-medium"
              title="Preview note guide"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Preview</span>
            </Link>

            {/* Wishlist toggle */}
            <button
              onClick={() => {
                setIsWishlisted(!isWishlisted);
                onRemove(note.id); // Or trigger wishlist toast
              }}
              className={`p-2 rounded-xl transition-all ${
                isWishlisted ? 'text-rose-500 bg-rose-50' : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50/50'
              }`}
              title="Move to wishlist"
            >
              <Heart className="w-4 h-4 fill-current" />
            </button>

            {/* Quantity selector (disabled) */}
            <div className="flex items-center border border-gray-150 rounded-xl bg-gray-50/50 px-2 py-1 opacity-50 select-none text-[11px] gap-1.5 font-bold">
              <span>Qty:</span>
              <span>1</span>
            </div>

            {/* Remove Trash CTA */}
            <button
              onClick={() => onRemove(note.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Remove note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(CartItemInner);
