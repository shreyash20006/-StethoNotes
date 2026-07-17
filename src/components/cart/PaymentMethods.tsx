import { Shield, Lock, Globe, CreditCard } from 'lucide-react';

export default function PaymentMethods() {
  return (
    <div className="bg-void border border-white/5 rounded-2xl p-5 flex flex-col gap-4 text-white">
      {/* Razorpay Branding */}
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <span className="text-[10px] text-muted font-display font-bold uppercase tracking-wider">
          Payment Processor
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-display font-extrabold text-primary">Razorpay</span>
          <span className="bg-primary/10 text-primary font-sans text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-primary/20">
            SECURE
          </span>
        </div>
      </div>

      {/* Accepted instruments listing */}
      <div className="flex flex-wrap gap-2 text-[10px] text-muted font-sans">
        <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md">💳 Credit / Debit Card</span>
        <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md">⚡ UPI / GPay / PhonePe</span>
        <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md">🏦 Net Banking</span>
        <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md">💼 Wallets</span>
        <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md">📈 Cardless EMI</span>
      </div>

      {/* Security badges */}
      <div className="grid grid-cols-2 gap-3 text-[10px] text-muted font-sans border-t border-white/5 pt-3">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span>256-bit SSL Encryption</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span>Razorpay Secure checkout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span>SSL Protected Connection</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-primary" />
          <span>No Cash on Delivery</span>
        </div>
      </div>
    </div>
  );
}
