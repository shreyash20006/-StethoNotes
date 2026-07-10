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
  const orderId = searchParams.get('order_id');

  const [order, setOrder] = useState<any>(null);
  const [purchasedNotes, setPurchasedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        navigate('/courses');
        return;
      }

      setLoading(true);
      try {
        // Fetch order details
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderErr || !orderData) {
          throw new Error('Order details not found');
        }

        setOrder(orderData);

        // Fetch purchased items
        const { data: itemsData, error: itemsErr } = await supabase
          .from('order_items')
          .select('*, note:notes(*)')
          .eq('order_id', orderId);

        if (itemsErr) throw itemsErr;

        if (itemsData) {
          const notesList = itemsData.map((item: any) => item.note).filter(Boolean);
          setPurchasedNotes(notesList);
        }
      } catch (err: any) {
        console.error(err);
        addToast('error', 'Receipt Retrieval Error', err.message || 'Could not load transaction receipt.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigate]);

  const handleResendEmail = async () => {
    if (!orderId) return;
    setResending(true);

    try {
      if (isLiveSupabase) {
        // Live Edge Function request
        const { data, error } = await supabase.functions.invoke('send-order-email', {
          body: { orderId }
        });
        if (error) throw error;
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
        <p className="text-gray-400 text-sm font-display">Verifying payment receipts...</p>
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
