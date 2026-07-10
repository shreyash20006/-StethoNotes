import { useState } from 'react';
import { supabase, isLiveSupabase, triggerBrevoEmailSimulation } from '../lib/supabase';
import type { Note } from '../types';
import { useToastStore } from '../store/useToastStore';
import { Search, Mail, Key, ShoppingBag, Send, AlertCircle } from 'lucide-react';

export default function OrderLookupPage() {
  const { addToast } = useToastStore();

  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [searching, setSearching] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<Note[]>([]);
  const [searched, setSearched] = useState(false);

  // Email resend state
  const [resending, setResending] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !orderId.trim()) return;

    setSearching(true);
    setOrder(null);
    setOrderItems([]);
    setSearched(false);

    try {
      // 1. Fetch order matching ID and Email
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('customer_email', email.trim().toLowerCase())
        .single();

      if (orderErr || !orderData) {
        throw new Error('No order matched this combination of email and order ID.');
      }

      setOrder(orderData);

      // 2. Fetch associated note items
      const { data: itemsData, error: itemsErr } = await supabase
        .from('order_items')
        .select('*, note:notes(*)')
        .eq('order_id', orderId);

      if (itemsErr) throw itemsErr;

      if (itemsData) {
        const notesList = itemsData.map((item: any) => item.note).filter(Boolean);
        setOrderItems(notesList);
      }
      setSearched(true);
      addToast('success', 'Order Found', 'Details retrieved successfully.');
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Lookup Failed', err.message || 'Could not search for order.');
    } finally {
      setSearching(false);
    }
  };

  const handleResendTrigger = async () => {
    if (!order) return;
    setResending(true);

    try {
      if (isLiveSupabase) {
        // Live Edge Function request
        const { data, error } = await supabase.functions.invoke('send-order-email', {
          body: { orderId: order.id }
        });
        if (error) throw error;
        if (data?.success) {
          addToast('success', 'Email Resent', 'Notes email successfully resent.');
        } else {
          throw new Error(data?.message || 'Email dispatch failed.');
        }
      } else {
        // Mock simulation
        const success = await triggerBrevoEmailSimulation(order.id);
        if (success) {
          addToast('success', 'Email Resent (Demo Mode)', 'Simulated Brevo email sent successfully.');
          
          // Refresh order status locally
          const updatedOrders = JSON.parse(localStorage.getItem('stetho_orders') || '[]');
          const matched = updatedOrders.find((o: any) => o.id === order.id);
          if (matched) {
            setOrder(matched);
          }
        } else {
          throw new Error('Simulated delivery failed. Try again.');
        }
      }
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Email Redelivery Failed', err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
      <div className="text-center max-w-2xl mx-auto mb-10 flex flex-col items-center gap-3">
        <h1 className="text-3xl font-display font-extrabold text-primary tracking-tight">
          Order Lookup Portal
        </h1>
        <div className="w-16 h-1 bg-accent rounded-full" />
        <p className="text-gray-500 font-sans text-sm mt-1">
          Enter your checkout email address and Order ID to track delivery status or trigger PDF redelivery.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Lookup form */}
        <div className="lg:col-span-5 bg-white border border-gray-100 rounded-3xl p-6 shadow-cyan-soft">
          <h2 className="text-sm font-display font-bold text-primary mb-5 border-b border-gray-50 pb-2.5">
            Lookup Request
          </h2>

          <form onSubmit={handleLookup} className="flex flex-col gap-4 text-xs">
            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="font-display font-semibold text-gray-400">Checkout Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl bg-white text-primary"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Order ID */}
            <div className="flex flex-col gap-1.5">
              <label className="font-display font-semibold text-gray-400">Order ID</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. ord-123456"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl bg-white text-primary"
                />
                <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="btn-primary py-3.5 mt-2 font-bold text-sm w-full flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>{searching ? 'Searching...' : 'Find My Order'}</span>
            </button>
          </form>
        </div>

        {/* Results display panel */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {!searched ? (
            <div className="border border-dashed border-gray-200 bg-gray-50 rounded-3xl p-10 text-center flex flex-col items-center gap-3">
              <ShoppingBag className="w-12 h-12 text-gray-300" />
              <h3 className="font-display font-bold text-base text-primary">No Search Pending</h3>
              <p className="text-gray-400 text-xs max-w-xs">
                Provide your checkout details in the search box to check payment confirmation and delivery states.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-cyan-soft flex flex-col gap-6">
              {/* Order Status Header */}
              <div className="flex justify-between items-start border-b border-gray-50 pb-4">
                <div>
                  <h3 className="font-display font-extrabold text-base text-primary">
                    Order Details
                  </h3>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    ID: {order.id}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="bg-emerald-50 text-emerald-600 font-display font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Paid ₹{order.total_amount}
                  </span>
                  
                  {/* Email delivery status indicator */}
                  <span
                    className={`font-display font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                      order.email_status === 'sent'
                        ? 'bg-cyan-50 text-accent'
                        : order.email_status === 'pending'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    Email: {order.email_status}
                  </span>
                </div>
              </div>

              {/* Items Purchased */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] text-gray-400 font-display font-bold uppercase tracking-wider block">
                  Purchased Notes
                </span>
                
                {orderItems.map((note) => (
                  <div key={note.id} className="border border-gray-50 p-3.5 rounded-xl bg-gray-50/50 flex items-center gap-3">
                    <span className="text-lg">📄</span>
                    <div>
                      <h4 className="font-display font-bold text-xs text-primary line-clamp-1">
                        {note.title}
                      </h4>
                      <p className="text-[10px] text-accent font-semibold">{note.subject}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resend actions block */}
              <div className="bg-gray-50 border border-gray-150 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                <div className="flex gap-2 items-start">
                  <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-display font-bold text-primary">Need PDF link redelivered?</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                      This will generate a fresh secure link valid for 48 hours and send it via Brevo to {order.customer_email}.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleResendTrigger}
                  disabled={resending}
                  className="btn-primary py-2.5 px-5 text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{resending ? 'Sending...' : 'Resend Email'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
