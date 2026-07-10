import { useState } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { motion, AnimatePresence } from 'motion/react';
import { Tag, Check, X } from 'lucide-react';

export default function CouponInput() {
  const { coupon, applyCoupon, removeCoupon } = useCartStore();
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!code.trim()) return;

    const success = applyCoupon(code.trim());
    if (success) {
      const discountPct = code.trim().toUpperCase() === 'WELCOME10' ? 10 : code.trim().toUpperCase() === 'MEDFIRST' ? 15 : 20;
      setSuccessMsg(`Coupon "${code.toUpperCase()}" applied! Saved ${discountPct}% off.`);
      setCode('');
    } else {
      setErrorMsg('Invalid Coupon Code. Try WELCOME10, MEDFIRST, or PHARMA20.');
    }
  };

  const handleRemove = () => {
    removeCoupon();
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  return (
    <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-display font-bold text-primary">
        <Tag className="w-4 h-4 text-accent" />
        <span>Promo & Coupon Code</span>
      </div>

      {!coupon ? (
        <form onSubmit={handleApply} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. WELCOME10"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-grow border border-gray-250 focus:border-accent focus:ring-1 focus:ring-accent outline-none px-3.5 py-2.5 rounded-xl text-xs bg-white text-primary uppercase font-bold"
          />
          <button
            type="submit"
            className="btn-primary py-2.5 px-5 text-xs font-bold font-display shadow-sm shrink-0"
          >
            Apply
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 uppercase font-display font-bold">
                Coupon Applied
              </span>
              <p className="text-xs text-primary font-bold">{coupon}</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="p-1 hover:bg-emerald-150 rounded-lg text-gray-400 hover:text-primary transition-all"
            title="Remove coupon"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Animations for Success/Error alerts */}
      <AnimatePresence mode="wait">
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[10px] sm:text-xs text-emerald-600 font-sans font-medium mt-1 leading-relaxed"
          >
            {successMsg}
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[10px] sm:text-xs text-red-500 font-sans font-medium mt-1 leading-relaxed"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
