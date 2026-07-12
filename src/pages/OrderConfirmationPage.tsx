import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase, isLiveSupabase, triggerBrevoEmailSimulation } from '../lib/supabase';
import type { Note } from '../types';
import { useToastStore } from '../store/useToastStore';
import { Check, Mail, ShoppingBag, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const orderIdParam = searchParams.get('order_id');
  // Present when arriving here via the hosted Payment Link fallback instead
  // of the embedded widget — the DB order doesn't exist yet at redirect
  // time, so we have to resolve it by payment id (and wait for the
  // webhook to create it).
  const razorpayPaymentId = searchParams.get('razorpay_payment_id');

  const [order, setOrder] = useState<any>(null);
  const [purchasedNotes, setPurchasedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [waitingForWebhook, setWaitingForWebhook] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadItemsForOrder = async (resolvedOrderId: string, orderData: any) => {
      setOrder(orderData);
      const { data: itemsData, error: itemsErr } = await supabase
        .from('order_items')
        .select('*, note:notes(*)')
        .eq('order_id', resolvedOrderId);

      if (itemsErr) throw itemsErr;
      if (itemsData) {
        const notesList = itemsData.map((item: any) => item.note).filter(Boolean);
        setPurchasedNotes(notesList);
      }
    };

    const fetchOrderDetails = async () => {
      if (!orderIdParam && !razorpayPaymentId) {
        navigate('/courses');
        return;
      }

      setLoading(true);
      try {
        if (orderIdParam) {
          // Normal embedded-widget flow — order already exists (created
          // synchronously by verify-payment before this page ever loads).
          const { data: orderData, error: orderErr } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderIdParam)
            .single();

          if (orderErr || !orderData) throw new Error('Order details not found');
          await loadItemsForOrder(orderData.id, orderData);
        } else if (razorpayPaymentId) {
          // Hosted Payment Link flow — the order row is created by the
          // /webhook handler, which can lag slightly behind the redirect.
          // Poll briefly instead of failing immediately.
          setWaitingForWebhook(true);
          const maxAttempts = 10;
          let found: any = null;

          for (let attempt = 0; attempt < maxAttempts && !cancelled; attempt++) {
            const { data: orderData } = await supabase
              .from('orders')
              .select('*')
              .eq('razorpay_payment_id', razorpayPaymentId)
              .maybeSingle();

            if (orderData) {
              found = orderData;
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }

          if (cancelled) return;
          setWaitingForWebhook(false);

          if (!found) {
            throw new Error(
              'Your payment is still being confirmed. This can take a minute — please check your email for the receipt, or use Order Lookup with your email shortly.'
            );
          }

          await loadItemsForOrder(found.id, found);
        }
      } catch (err: any) {
        console.error(err);
        addToast('error', 'Receipt Retrieval Error', err.message || 'Could not load transaction receipt.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrderDetails();
    return () => { cancelled = true; };
  }, [orderIdParam, razorpayPaymentId, navigate]);

  const handleResendEmail = async () => {
    const orderId = order?.id;
    if (!orderId) return;
    setResending(true);

    try {
      if (isLiveSupabase) {
        const functionName = 'send-order-email';
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        if (!supabaseUrl) {
          throw new Error('Supabase URL is not configured. Cannot call Edge Function.');
        }
        const url = `${supabaseUrl}/functions/v1/${functionName}`;
        console.log("Calling Edge Function:", functionName);
        console.log("Request URL:", url);

        let data = null;
        let error = null;
        try {
          const res = await supabase.functions.invoke(functionName, {
            body: { orderId }
          });
          data = res.data;
          error = res.error;
          if (error) {
            throw error;
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
        if (data?.success) {
          addToast('success', 'Email Resent', 'A fresh download link email has been dispatched via Brevo.');
        } else {
          throw new Error(data?.message || 'Brevo API call failed');
        }
      } else {
        // Mock simulation
        const success = await triggerBrevoEmailSimulation(orderId);
        if (success) {
          addToast('success', 'Email Resent (Demo Mode)', 'Simulated Brevo email sent successfully.');
          
          // Refresh local status
          const updatedOrders = JSON.parse(localStorage.getItem('stetho_orders') || '[]');
          const matched = updatedOrders.find((o: any) => o.id === orderId);
          if (matched) {
            setOrder(matched);
          }
        } else {
          throw new Error('Simulated delivery failure. Try again.');
        }
      }
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Redelivery Failed', err.message || 'Failed to dispatch email.');
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
        <p className="text-gray-400 text-sm font-display">
          {waitingForWebhook
            ? 'Confirming your payment… this can take up to a minute.'
            : 'Verifying payment receipts...'}
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 min-h-[60vh] flex flex-col items-center justify-center gap-5 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500" />
        <h1 className="text-2xl font-display font-extrabold text-primary">
          Still confirming your payment
        </h1>
        <p className="text-gray-500 text-sm font-sans max-w-md">
          {razorpayPaymentId
            ? `We can see a payment attempt (ID: ${razorpayPaymentId}) but haven't finished confirming it on our end yet. If you were charged, your notes email will arrive shortly — or you can look your order up below in a minute.`
            : "We couldn't find that order. If you were charged, check your email for the receipt, or look it up below."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Link to="/lookup" className="btn-secondary py-3 px-8 text-sm w-full sm:w-auto">
            Order Lookup Portal
          </Link>
          <Link to="/courses" className="btn-primary py-3 px-8 text-sm w-full sm:w-auto">
            <ShoppingBag className="w-4 h-4" />
            Browse More Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
      {/* Success banner */}
      <div className="bg-primary-dark text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden mb-10 text-center flex flex-col items-center gap-5 border border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(31,182,212,0.1),transparent_70%)]" />
        
        {/* Pulsing Checkmark */}
        <div className="w-16 h-16 bg-accent/20 border border-accent/40 rounded-full flex items-center justify-center text-accent animate-bounce">
          <Check className="w-8 h-8 stroke-[3]" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">
          Payment Successful!
        </h1>
        
        <div className="bg-accent/15 border border-accent/30 rounded-2xl p-5 max-w-lg mt-2">
          <p className="text-accent font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2">
            <Mail className="w-5 h-5" />
            <span>Check Your Email Inbox!</span>
          </p>
          <p className="text-gray-300 text-xs sm:text-sm font-sans mt-2 leading-relaxed">
            Your notes are being sent to <strong className="text-white font-semibold">{order?.customer_email}</strong>.<br />
            Please allow up to 5 minutes for delivery. Make sure to check your <strong>Spam / Promotions</strong> folder.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10 w-full max-w-sm justify-center items-center text-xs text-gray-400">
          <span>Order ID: <span className="text-white font-semibold">{order?.id}</span></span>
          <span className="hidden sm:inline">|</span>
          <span>Payment ID: <span className="text-white font-semibold">{order?.razorpay_payment_id || 'MOCK_PAY_ID'}</span></span>
        </div>
      </div>

      {/* PDF List Container */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-cyan-soft mb-8">
        <h2 className="text-lg font-display font-bold text-primary mb-6 flex items-center gap-2 border-b border-gray-50 pb-3">
          <BookOpen className="w-5 h-5 text-accent" />
          <span>Purchased Note Materials</span>
        </h2>

        <div className="flex flex-col gap-4">
          {purchasedNotes.map((note) => (
            <div
              key={note.id}
              className="border border-gray-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4 bg-gray-50/50"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent shrink-0 font-display text-xl">
                📚
              </div>
              <div>
                <span className="text-[9px] font-sans font-bold text-accent uppercase">
                  {note.subject}
                </span>
                <h3 className="font-display font-bold text-sm sm:text-base text-primary">
                  {note.title}
                </h3>
                <p className="text-gray-400 text-xs mt-0.5">
                  Secure PDF Study Guide • Emailed after purchase verification
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Resend Email Section */}
        <div className="mt-8 border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-display font-bold text-primary">Didn't receive your email?</h4>
              <p className="text-[10px] text-gray-500 font-sans mt-0.5">
                Current email delivery status: <strong className="uppercase text-primary font-semibold">{order?.email_status || 'pending'}</strong>. Click resend to trigger Brevo delivery again.
              </p>
            </div>
          </div>

          <button
            onClick={handleResendEmail}
            disabled={resending}
            className="btn-primary py-2.5 px-6 text-xs font-bold w-full sm:w-auto flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
            <span>{resending ? 'Sending...' : 'Resend Notes Email'}</span>
          </button>
        </div>
      </div>

      {/* Redirect buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link to="/lookup" className="btn-secondary py-3 px-8 text-sm w-full sm:w-auto">
          Order Lookup Portal
        </Link>
        <Link to="/courses" className="btn-primary py-3 px-8 text-sm w-full sm:w-auto">
          <ShoppingBag className="w-4 h-4" />
          Browse More Catalog
        </Link>
      </div>
    </div>
  );
}