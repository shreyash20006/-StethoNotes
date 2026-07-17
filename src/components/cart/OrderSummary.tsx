import { useCartStore } from '../../store/useCartStore';
import CheckoutForm from './CheckoutForm';
import CouponInput from './CouponInput';
import PaymentMethods from './PaymentMethods';
import { Lock, RefreshCw } from 'lucide-react';

interface OrderSummaryProps {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  onProceedCheckout: () => void;
}

export default function OrderSummary({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  onProceedCheckout
}: OrderSummaryProps) {
  const {
    items,
    coupon,
    getSubtotal,
    getDiscount,
    getGST,
    getPlatformFee,
    getGrandTotal,
    paymentState
  } = useCartStore();

  // Validations for checkout enablement
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPhoneValid = /^[6-9]\d{9}$/.test(phone.trim());
  const isFormValid = name.trim().length >= 3 && isEmailValid && isPhoneValid;
  const isCartEmpty = items.length === 0;

  const isProcessing = paymentState === 'redirecting' || paymentState === 'verifying';

  return (
    <div className="flex flex-col gap-6 sticky top-6 text-white">
      {/* 1. SECURE CHECKOUT DETAILS FORM */}
      <CheckoutForm
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        phone={phone}
        setPhone={setPhone}
      />

      {/* 2. COUPON BOX */}
      <CouponInput />

      {/* 3. STICKY ORDER SUMMARY BILLING CARD (Glassmorphism) */}
      <div className="glass-card-v2 bg-card/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 shadow-[0_0_50px_-12px_rgba(31,182,212,0.05)] text-left">
        <h3 className="font-display font-extrabold text-base text-white border-b border-white/5 pb-3">
          Order Summary
        </h3>

        <div className="flex flex-col gap-2.5 text-xs text-muted font-sans">
          {/* Subtotal */}
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-white">₹{getSubtotal().toFixed(2)}</span>
          </div>

          {/* Coupon Discount */}
          {coupon && (
            <div className="flex justify-between text-emerald-450 font-semibold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
              <span>Coupon Discount ({coupon})</span>
              <span>-₹{getDiscount().toFixed(2)}</span>
            </div>
          )}

          {/* GST */}
          <div className="flex justify-between">
            <span>GST (18% Standard)</span>
            <span className="font-semibold text-white">₹{getGST().toFixed(2)}</span>
          </div>

          {/* Platform fee */}
          <div className="flex justify-between">
            <span>Secured Platform Fee</span>
            <span className="font-semibold text-white">₹{getPlatformFee().toFixed(2)}</span>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between border-t border-white/5 pt-3 mt-1.5 text-sm font-display font-extrabold text-white">
            <span>Grand Total</span>
            <span className="text-primary text-base font-black tracking-tight">₹{getGrandTotal().toFixed(2)}</span>
          </div>
        </div>

        {/* 4. PAYMENT METHODS ACCREDITATIONS */}
        <PaymentMethods />

        {/* 5. SECURE CHECKOUT BUTTON */}
        <button
          onClick={onProceedCheckout}
          disabled={!isFormValid || isCartEmpty || isProcessing}
          className="w-full bg-primary hover:bg-primary-dark text-void font-display font-extrabold text-xs py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(31,182,212,0.25)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 hover:scale-[1.01]"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>
                {paymentState === 'redirecting'
                  ? 'Redirecting to Razorpay...'
                  : 'Verifying payment...'}
              </span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Proceed to Secure Payment</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
