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
    setPaymentState
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
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckoutPayment = async () => {
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
          throw new Error('Razorpay SDK failed to load. Please verify your connection.');
        }

        // 1. Create Order inside Supabase
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .insert({
            user_id: user?.id || null,
            customer_name: name.trim(),
            customer_email: email.trim().toLowerCase(),
            customer_phone: phone.trim(),
            total_amount: orderTotal,
            payment_status: 'pending',
            email_status: 'pending',
            razorpay_payment_id: null
          })
          .select()
          .single();

        if (orderErr || !orderData) throw orderErr;

        // 2. Insert Order Items mapping
        const orderItemsPayload = items.map(item => ({
          order_id: orderData.id,
          note_id: item.note.id,
          price: item.note.price
        }));

        const { error: itemsErr } = await supabase
          .from('order_items')
          .insert(orderItemsPayload);

        if (itemsErr) throw itemsErr;

        // 3. Initiate Razorpay Window Payment Options
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mockkey',
          amount: Math.round(orderTotal * 100), // paise
          currency: 'INR',
          name: 'StethoNotes',
          description: 'Secure Digital Guides Checkout',
          image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=150',
          handler: async (response: any) => {
            setPaymentState('verifying');
            try {
              // Update payment confirmation and receipt IDs in database
              const { error: updateErr } = await supabase
                .from('orders')
                .update({
                  payment_status: 'completed',
                  razorpay_payment_id: response.razorpay_payment_id
                })
                .eq('id', orderData.id);

              if (updateErr) throw updateErr;

              // Trigger Brevo email delivery via Edge Function
              try {
                const { data: fnData, error: fnErr } = await supabase.functions.invoke('send-order-email', {
                  body: { orderId: orderData.id }
                });
                if (fnErr || !fnData?.success) {
                  console.error('Email auto-dispatch error:', fnErr || fnData?.message);
                  addToast('info', 'Email Delayed', 'Payment succeeded, but notes email dispatch failed. You can resend it from the confirmation page.');
                } else {
                  addToast('success', 'Email Dispatched', 'Your purchased note guides have been sent to your email.');
                }
              } catch (emailErr) {
                console.error('Email auto-dispatch failed:', emailErr);
                addToast('info', 'Email Delayed', 'Notes email delivery failed. You can resend it from the success page.');
              }

              // Fire confetti
              confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
              });

              addToast('success', 'Checkout Complete', 'Payment processed successfully.');
              
              setCreatedOrderId(orderData.id);
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

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          setPaymentError(resp.error.description || 'Razorpay checkout cancelled.');
          setPaymentState('failed');
          setFailureOpen(true);
        });
        rzp.open();

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
