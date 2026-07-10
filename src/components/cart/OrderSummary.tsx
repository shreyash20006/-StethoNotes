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
    <div className="flex flex-col gap-6 sticky top-6">
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
      <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-cyan-soft flex flex-col gap-4">
        <h3 className="font-display font-extrabold text-base text-primary border-b border-gray-50 pb-3">
          Order Summary
        </h3>

        <div className="flex flex-col gap-2.5 text-xs text-gray-500 font-sans">
          {/* Subtotal */}
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-primary">₹{getSubtotal().toFixed(2)}</span>
          </div>

          {/* Coupon Discount */}
          {coupon && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Coupon Discount ({coupon})</span>
              <span>-₹{getDiscount().toFixed(2)}</span>
            </div>
          )}

          {/* GST */}
          <div className="flex justify-between">
            <span>GST (18% Standard)</span>
            <span className="font-semibold text-primary">₹{getGST().toFixed(2)}</span>
          </div>

          {/* Platform fee */}
          <div className="flex justify-between">
            <span>Secured Platform Fee</span>
            <span className="font-semibold text-primary">₹{getPlatformFee().toFixed(2)}</span>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between border-t border-gray-100 pt-3 mt-1.5 text-sm font-display font-extrabold text-primary">
            <span>Grand Total</span>
            <span className="text-accent text-base">₹{getGrandTotal().toFixed(2)}</span>
          </div>
        </div>

        {/* 4. PAYMENT METHODS ACCREDITATIONS */}
        <PaymentMethods />

        {/* 5. SECURE CHECKOUT BUTTON */}
        <button
          onClick={onProceedCheckout}
          disabled={!isFormValid || isCartEmpty || isProcessing}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent text-white font-display font-extrabold text-sm py-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-cyan-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
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
