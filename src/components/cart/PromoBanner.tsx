import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import { Tag, Sparkles } from 'lucide-react';

export default function PromoBanner() {
  const { applyCoupon, coupon } = useCartStore();
  const { addToast } = useToastStore();

  const handleAutoApply = () => {
    const success = applyCoupon('WELCOME10');
    if (success) {
      addToast('success', 'Coupon Applied', 'Coupon WELCOME10 has been automatically applied to your cart!');
    }
  };

  if (coupon === 'WELCOME10') return null; // Hide if already applied

  return (
    <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_60%)]" />
      
      <div className="flex items-center gap-3.5 relative z-10">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-accent shrink-0">
          <Sparkles className="w-5 h-5 text-accent animate-bounce" />
        </div>
        <div>
          <h4 className="text-sm font-display font-extrabold flex items-center gap-1.5">
            <span>Special Student discount unlocked!</span>
          </h4>
          <p className="text-[11px] text-white/80 font-sans mt-0.5">
            Use coupon <strong className="text-white font-semibold uppercase">WELCOME10</strong> at checkout to save <strong>10%</strong> on your order.
          </p>
        </div>
      </div>

      <button
        onClick={handleAutoApply}
        className="bg-white text-primary hover:bg-cyan-50 font-display font-extrabold text-xs py-2.5 px-5 rounded-xl shadow-sm shrink-0 relative z-10 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
      >
        <Tag className="w-3.5 h-3.5 text-accent" />
        <span>Apply Automatically</span>
      </button>
    </div>
  );
}
