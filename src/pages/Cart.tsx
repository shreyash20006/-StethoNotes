import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { supabase, isLiveSupabase, triggerBrevoEmailSimulation } from '../lib/supabase';
import confetti from 'canvas-confetti';

// Import Cart components
import EmptyCart from '../components/cart/EmptyCart';
import CartItem from '../components/cart/CartItem';
import OrderSummary from '../components/cart/OrderSummary';
import TrustBadges from '../components/cart/TrustBadges';
import PromoBanner from '../components/cart/PromoBanner';
import Recommendations from '../components/cart/Recommendations';
import RecentlyViewed from '../components/cart/RecentlyViewed';
import SuccessModal from '../components/cart/SuccessModal';
import FailureModal from '../components/cart/FailureModal';

import { ChevronRight, Lock } from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const {
    items,
    removeItem,
    clearCart,
    getGrandTotal,
    paymentState,
    setPaymentState,
    coupon
  } = useCartStore();

  // Form Fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Modal control states
  const [successOpen, setSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Shown after a few seconds of "redirecting" state, in case the embedded
  // widget silently fails to render (ad blockers, Brave Shields, etc.)
  const [showFallbackOption, setShowFallbackOption] = useState(false);

  // SEO Optimization
  useEffect(() => {
    document.title = 'Shopping Cart | StethoNotes';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Review your selected medical notes and complete your secure purchase. Instant email delivery after payment.'
      );
    }
  }, []);

  // Sync profile details if logged in
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
    }
  }, [user]);

  // Loader helper for Razorpay Script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }
      const sdkUrl = 'https://checkout.razorpay.com/v1/checkout.js';
      console.log("Loading Razorpay SDK URL:", sdkUrl);
      const script = document.createElement('script');
      script.src = sdkUrl;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Fallback checkout: instead of the embedded widget (which loads many
  // cross-origin sub-resources that ad blockers pick off individually),
  // this redirects the whole page to a Razorpay-hosted payment page.
  // Top-level navigation is almost never blocked by content blockers.
  const openPaymentLinkFallback = async () => {
    try {
      setShowFallbackOption(false);
      setPaymentState('redirecting');
      addToast('info', 'Opening secure payment page', 'Redirecting you to a Razorpay-hosted checkout page…');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      if (!supabaseUrl) {
        throw new Error('Supabase URL is not configured. Cannot call Edge Function.');
      }

      const res = await supabase.functions.invoke('razorpay', {
        headers: { 'x-action': 'create-payment-link' },
        body: {
          items: items.map(item => ({ id: item.note.id, price: item.note.price })),
          userId: user?.id || null,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          couponCode: coupon || null,
          callbackUrl: `${window.location.origin}/order-confirmation`
        }
      });

      if (res.error) throw res.error;
      const linkData = res.data;

      if (!linkData?.success || !linkData?.short_url) {
        throw new Error(linkData?.message || 'Could not generate a payment link.');
      }

      // Full-page redirect — not an embedded widget.
      window.location.href = linkData.short_url;
    } catch (err: any) {
      console.error('Payment link fallback failed:', err);
      setPaymentError(err.message || 'Could not open the secure payment page. Please try again or contact support.');
      setPaymentState('failed');
      setFailureOpen(true);
    }
  };

  const handleCheckoutPayment = async () => {
    setShowFallbackOption(false);
    // Validations
    if (items.length === 0) {
      addToast('error', 'Cart Empty', 'Please select at least one study guide note before checking out.');
      return;
    }

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const isPhoneValid = /^[6-9]\d{9}$/.test(phone.trim());

    if (!name.trim() || !isEmailValid || !isPhoneValid) {
      addToast('error', 'Form Invalid', 'Please complete all customer detail fields with valid information.');
      return;
    }

    setPaymentState('redirecting');
    setPaymentError(null);

    const orderTotal = getGrandTotal();

    try {
      if (isLiveSupabase) {
        // Live Razorpay Flow
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          console.warn('Razorpay checkout.js failed to load — falling back to hosted payment link.');
          await openPaymentLinkFallback();
          return;
        }

        // 1. Create Order via server-side Edge Function (creates Razorpay order and returns it)
        const createOrderFunctionName = 'razorpay';
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        if (!supabaseUrl) {
          throw new Error('Supabase URL is not configured. Cannot call Edge Function.');
        }
        const createOrderUrl = `${supabaseUrl}/functions/v1/${createOrderFunctionName}`;
        console.log("Calling Edge Function:", createOrderFunctionName);
        console.log("Request URL:", createOrderUrl);

        let orderData = null;
        let orderErr = null;
        try {
          const res = await supabase.functions.invoke(createOrderFunctionName, {
            headers: { 'x-action': 'create-order' },
            body: {
              items: items.map(item => ({ id: item.note.id, price: item.note.price })),
              userId: user?.id || null,
              name: name.trim(),
              email: email.trim().toLowerCase(),
              phone: phone.trim(),
              couponCode: coupon || null
            }
          });
          orderData = res.data;
          orderErr = res.error;
          if (orderErr) {
            throw orderErr;
          }
        } catch (err: any) {
          console.error(err);
          if (err.context && typeof err.context.text === 'function') {
            try {
              console.error(await err.context.text());
            } catch (e) {}
          }
          throw err;
        }

        // Validation of key
        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
        if (!razorpayKey) {
          throw new Error("Razorpay Key ID (VITE_RAZORPAY_KEY_ID) is missing.");
        }

        // Validate orderData
        if (!orderData) {
          throw new Error("No response received from order creation service.");
        }
        if (orderData.success !== true) {
          throw new Error(orderData.message || "Order creation failed on payment gateway.");
        }
        if (!orderData.order_id) {
          throw new Error("Failed to create order on payment gateway: Order ID is missing.");
        }
        if (!(orderData.amount > 0)) {
          throw new Error("Invalid order amount. Amount must be greater than zero.");
        }
        if (!orderData.currency) {
          throw new Error("Currency code is missing in order details.");
        }

        // Local flag (not React state) so the watchdog below always sees
        // the current value, even inside its setTimeout closure.
        let paymentHandledByWidget = false;

        // 2. Initiate Razorpay Window Payment Options
        const options = {
          key: razorpayKey,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'StethoNotes',
          description: 'Secure Digital Guides Checkout',
          image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=150',
          order_id: orderData.order_id, // Pass Razorpay order_id
          handler: async (response: any) => {
            paymentHandledByWidget = true;
            setShowFallbackOption(false);
            setPaymentState('verifying');
            try {
              // 3. Verify Payment Signature & Create DB Order on the Server
              const verifyFunctionName = 'razorpay';
              const verifySupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
              if (!verifySupabaseUrl) {
                throw new Error('Supabase URL is not configured. Cannot call Edge Function.');
              }
              const verifyUrl = `${verifySupabaseUrl}/functions/v1/${verifyFunctionName}`;
              const verifyBody = {
                action: "verify-payment",
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                note_ids: items.map(item => item.note.id),
                user_id: user?.id || null,
                customer_name: name.trim(),
                customer_email: email.trim().toLowerCase(),
                customer_phone: phone.trim()
              };

              console.log("Calling Edge Function:", verifyFunctionName);
              console.log("Request URL:", verifyUrl);
              console.log("Request Body:", verifyBody);

              let verifyData = null;
              let verifyErr = null;
              try {
                const res = await supabase.functions.invoke(verifyFunctionName, {
                  headers: { 'x-action': 'verify-payment' },
                  body: verifyBody
                });
                verifyData = res.data;
                verifyErr = res.error;

                if (verifyErr) {
                  const statusCode = (verifyErr as any).status || 500;
                  console.log("Returned status code:", statusCode);
                  console.log("Returned JSON (Error):", verifyErr);
                  throw verifyErr;
                }

                console.log("Returned status code: 200");
                console.log("Returned JSON (Success):", verifyData);
              } catch (err: any) {
                console.error(err);
                if (err.context && typeof err.context.text === 'function') {
                  try {
                    console.error(await err.context.text());
                  } catch (e) {}
                }
                throw err;
              }

              if (!verifyData?.success) {
                throw new Error(verifyData?.message || 'Payment signature verification failed.');
              }

              // Fire confetti
              confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
              });

              addToast('success', 'Checkout Complete', 'Payment processed and email delivered successfully.');
              
              setCreatedOrderId(verifyData.order_id); // DB Order ID
              setPaymentState('success');
              setSuccessOpen(true);
              clearCart();
            } catch (err: any) {
              console.error(err);
              setPaymentError(err.message || 'Payment verification failed.');
              setPaymentState('failed');
              setFailureOpen(true);
            }
          },
          prefill: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            contact: phone.trim()
          },
          theme: {
            color: '#0F2D6B'
          }
        };

        console.log("OrderData", orderData);
        console.log("Razorpay Key", import.meta.env.VITE_RAZORPAY_KEY_ID);
        console.log("Options", options);

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          setPaymentError(resp.error.description || 'Razorpay checkout cancelled.');
          setPaymentState('failed');
          setFailureOpen(true);
        });
        rzp.open();

        // Watchdog: Razorpay's widget mounts an iframe into the DOM almost
        // immediately once open() succeeds. If a blocker silently ate one of
        // the widget's own sub-resource requests (e.g. the 403 on
        // checkout-static-next.razorpay.com/build/...), the iframe never
        // appears and the user is left staring at nothing. Detect that and
        // fall back automatically to the hosted payment link.
        let widgetDetected = false;
        const detectWidget = () => {
          const frame = document.querySelector('iframe[src*="razorpay"], iframe[name*="razorpay"], .razorpay-checkout-frame');
          if (frame) widgetDetected = true;
        };
        const watchdogInterval = window.setInterval(detectWidget, 400);

        window.setTimeout(() => {
          window.clearInterval(watchdogInterval);
          detectWidget();
          if (!widgetDetected && !paymentHandledByWidget) {
            console.warn('Razorpay widget never mounted — falling back to hosted payment link.');
            try { rzp.close(); } catch (e) { /* no-op */ }
            openPaymentLinkFallback();
          }
        }, 6000);

        // Give the user a manual way out sooner, in case the widget is
        // half-broken (visible but non-functional) rather than fully absent.
        window.setTimeout(() => setShowFallbackOption(true), 4000);

      } else {
        // DEMO local fallback simulation
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Create mock order records in localStorage
        const mockOrderId = `ord-${Math.random().toString(36).substr(2, 9)}`;
        const mockPaymentId = `pay_${Math.random().toString(36).substr(2, 12)}`;
        
        const orders = JSON.parse(localStorage.getItem('stetho_orders') || '[]');
        const newOrder = {
          id: mockOrderId,
          user_id: user?.id || null,
          customer_name: name.trim(),
          customer_email: email.trim().toLowerCase(),
          customer_phone: phone.trim(),
          total_amount: orderTotal,
          razorpay_payment_id: mockPaymentId,
          payment_status: 'completed',
          email_status: 'pending',
          created_at: new Date().toISOString()
        };
        orders.push(newOrder);
        localStorage.setItem('stetho_orders', JSON.stringify(orders));

        // Create mock order items
        const orderItems = JSON.parse(localStorage.getItem('stetho_order_items') || '[]');
        items.forEach((item) => {
          orderItems.push({
            id: `item-${Math.random().toString(36).substr(2, 9)}`,
            order_id: mockOrderId,
            note_id: item.note.id,
            price: item.note.price
          });
        });
        localStorage.setItem('stetho_order_items', JSON.stringify(orderItems));

        // Trigger Brevo Email simulation in the background
        triggerBrevoEmailSimulation(mockOrderId).catch(console.error);

        // Fire confetti
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        addToast('success', 'Checkout Complete (Demo Mode)', 'Simulated Razorpay transaction successful.');
        
        setCreatedOrderId(mockOrderId);
        setPaymentState('success');
        setSuccessOpen(true);
        clearCart();
      }
    } catch (err: any) {
      console.error(err);
      setShowFallbackOption(false);
      setPaymentError(err.message || 'Payment processing failed.');
      setPaymentState('failed');
      setFailureOpen(true);
    }
  };

  const handleRetryPayment = () => {
    setFailureOpen(false);
    handleCheckoutPayment();
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[75vh] flex items-center justify-center">
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Breadcrumb navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 font-sans">
        <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/')}>Home</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/courses')}>Courses</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-primary font-semibold">Cart</span>
      </nav>

      {/* Heading Block */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-100 pb-6 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-primary tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-gray-400 text-sm mt-1.5 font-sans">
            You're just one step away from smarter studying.
          </p>
        </div>
        <span className="bg-accent/10 text-accent font-display font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-sm shrink-0 border border-accent/15">
          👜 {items.length} Note{items.length !== 1 ? 's' : ''} Selected
        </span>
      </div>

      {/* Manual fallback: shown if the embedded widget seems stuck (e.g. an
          ad blocker or Brave Shields is silently interfering) */}
      {showFallbackOption && paymentState === 'redirecting' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-amber-800 font-sans">
            Payment window not opening? An ad blocker or browser privacy shield may be interfering.
          </p>
          <button
            onClick={openPaymentLinkFallback}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-display font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Pay via secure link instead
          </button>
        </div>
      )}

      {/* Grid Layout Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative pb-24 lg:pb-0">
        {/* Left Column (65%) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Promo offer Banner */}
          <PromoBanner />

          {/* Cart Item Cards list */}
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {items.map((item) => (
                <CartItem
                  key={item.note.id}
                  item={item}
                  onRemove={removeItem}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* AI Recommendation products */}
          <Recommendations />

          {/* Recently Viewed items */}
          <RecentlyViewed />

          {/* Trust Badges */}
          <TrustBadges />
        </div>

        {/* Right Sticky Column (35%) */}
        <div className="lg:col-span-4">
          <OrderSummary
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            onProceedCheckout={handleCheckoutPayment}
          />
        </div>
      </div>

      {/* Mobile Sticky bottom Summary bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 p-4 shadow-xl z-40 flex items-center justify-between gap-4 animate-slide-up">
        <div>
          <span className="text-[10px] text-gray-400 font-sans block">Pay Grand Total</span>
          <span className="font-display font-extrabold text-base text-accent">
            ₹{getGrandTotal().toFixed(2)}
          </span>
        </div>
        
        <button
          onClick={handleCheckoutPayment}
          disabled={paymentState === 'redirecting' || paymentState === 'verifying'}
          className="btn-primary py-2.5 px-6 font-display font-bold text-xs shadow-md flex items-center gap-1.5"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Checkout Securely</span>
        </button>
      </div>

      {/* SUCCESS POPUP MODAL */}
      <SuccessModal
        isOpen={successOpen}
        orderId={createdOrderId}
        email={email}
        onClose={() => setSuccessOpen(false)}
      />

      {/* FAILURE POPUP MODAL */}
      <FailureModal
        isOpen={failureOpen}
        errorMessage={paymentError}
        onRetry={handleRetryPayment}
        onClose={() => setFailureOpen(false)}
      />
    </div>
  );
}