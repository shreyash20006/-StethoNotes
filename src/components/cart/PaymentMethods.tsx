import { Shield, Lock, Globe, CreditCard } from 'lucide-react';

export default function PaymentMethods() {
  return (
    <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 flex flex-col gap-4">
      {/* Razorpay Branding */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <span className="text-[10px] text-gray-400 font-display font-bold uppercase tracking-wider">
          Payment Processor
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-display font-extrabold text-blue-800">Razorpay</span>
          <span className="bg-accent/10 text-accent font-sans text-[8px] font-bold px-1.5 py-0.5 rounded-full">
            SECURE
          </span>
        </div>
      </div>

      {/* Accepted instruments listing */}
      <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-sans">
        <span className="bg-white border border-gray-200 px-2 py-1 rounded-md">💳 Credit / Debit Card</span>
        <span className="bg-white border border-gray-200 px-2 py-1 rounded-md">⚡ UPI / GPay / PhonePe</span>
        <span className="bg-white border border-gray-200 px-2 py-1 rounded-md">🏦 Net Banking</span>
        <span className="bg-white border border-gray-200 px-2 py-1 rounded-md">💼 Wallets</span>
        <span className="bg-white border border-gray-200 px-2 py-1 rounded-md">📈 Cardless EMI</span>
      </div>

      {/* Security badges */}
      <div className="grid grid-cols-2 gap-3 text-[10px] text-gray-400 font-sans border-t border-gray-200 pt-3">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-accent" />
          <span>256-bit SSL Encryption</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-accent" />
          <span>Razorpay Secure checkout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-accent" />
          <span>SSL Protected Connection</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-accent" />
          <span>No Cash on Delivery</span>
        </div>
      </div>
    </div>
  );
}
