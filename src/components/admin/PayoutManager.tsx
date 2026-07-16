import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import type { SellerPayout } from '../../types';
import { useToastStore } from '../../store/useToastStore';
import {
  CreditCard, CheckCircle2, Search, Download
} from 'lucide-react';

interface SellerEarningItem {
  seller_id: string;
  seller_name: string;
  seller_email: string;
  store_name: string;
  upi_id?: string;
  bank_details?: any;
  total_sales: number;
  commission: number;
  paid_amount: number;
  pending_amount: number;
}

export default function PayoutManager() {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [sellerEarnings, setSellerEarnings] = useState<SellerEarningItem[]>([]);
  const [payoutLogs, setPayoutLogs] = useState<SellerPayout[]>([]);
  
  const [selectedSeller, setSelectedSeller] = useState<SellerEarningItem | null>(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementUpi, setSettlementUpi] = useState('');
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayoutsData();
  }, []);

  const fetchPayoutsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch completed orders and items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*, note:notes(*, seller:profiles(*, seller_profiles(*)))');

      // 2. Fetch payout logs
      const { data: payouts } = await supabase
        .from('seller_payouts')
        .select('*, seller:profiles(full_name, email)');

      const logs: SellerPayout[] = (payouts || []).map((p: any) => ({
        ...p,
        seller_name: p.seller?.full_name || 'Seller',
        seller_email: p.seller?.email || ''
      }));
      setPayoutLogs(logs);

      // 3. Aggregate earnings per seller
      const earningsMap: Record<string, SellerEarningItem> = {};

      (orderItems || []).forEach((item: any) => {
        if (item.note?.seller) {
          const seller = item.note.seller;
          const sp = seller.seller_profiles?.[0] || {};
          const sellerId = seller.id;
          const itemPrice = Number(item.price);
          
          if (!earningsMap[sellerId]) {
            earningsMap[sellerId] = {
              seller_id: sellerId,
              seller_name: seller.full_name || seller.name || 'Seller',
              seller_email: seller.email || '',
              store_name: sp.store_name || 'Standard Store',
              upi_id: sp.upi_id,
              bank_details: sp.bank_details,
              total_sales: 0,
              commission: 0,
              paid_amount: 0,
              pending_amount: 0
            };
          }

          // Total Sales volume
          earningsMap[sellerId].total_sales += itemPrice;
          // Platform Commission is 10%; Seller gets 90%
          earningsMap[sellerId].commission += itemPrice * 0.10;
        }
      });

      // Subtract paid payouts from total seller share (90% of total sales)
      logs.forEach(p => {
        const sid = p.seller_id;
        if (earningsMap[sid]) {
          if (p.status === 'completed') {
            earningsMap[sid].paid_amount += Number(p.amount);
          }
        }
      });

      // Calculate net pending earnings (90% of Sales - Paid Amount)
      Object.keys(earningsMap).forEach(sid => {
        const sellerShare = earningsMap[sid].total_sales * 0.90;
        earningsMap[sid].pending_amount = Math.max(0, sellerShare - earningsMap[sid].paid_amount);
      });

      setSellerEarnings(Object.values(earningsMap));

    } catch (err) {
      console.error('Error fetching payouts metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeller) return;

    const amt = Number(settlementAmount);
    if (isNaN(amt) || amt <= 0) {
      addToast('error', 'Invalid Amount', 'Please enter a positive numeric settlement amount.');
      return;
    }

    if (amt > selectedSeller.pending_amount) {
      addToast('info', 'Limit Exceeded', 'Settlement amount exceeds pending earnings.');
      return;
    }

    setProcessing(true);
    try {
      // Insert completed settlement payout log directly
      const { error } = await supabase.from('seller_payouts').insert({
        seller_id: selectedSeller.seller_id,
        amount: amt,
        status: 'completed',
        upi_id: settlementUpi || selectedSeller.upi_id || '',
        bank_details: selectedSeller.bank_details,
        payout_date: new Date().toISOString()
      });

      if (error) throw error;

      addToast('success', 'Payout Succeeded', `Settlement payout of ₹${amt} logged successfully.`);
      setSettlementAmount('');
      setSelectedSeller(null);
      fetchPayoutsData();
    } catch (err: any) {
      addToast('error', 'Payout Logging Failed', err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleExportCSV = () => {
    // Generate CSV for payouts logs
    let csv = 'ID,Seller,Email,Amount,Status,UPI ID,Payout Date\n';
    payoutLogs.forEach(l => {
      csv += `"${l.id}","${l.seller_name}","${l.seller_email}",${l.amount},"${l.status}","${l.upi_id || ''}","${l.payout_date ? new Date(l.payout_date).toLocaleDateString() : ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `StethoNotes_Settlements_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEarnings = useMemo(() => sellerEarnings.filter(s =>
    s.seller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.store_name.toLowerCase().includes(searchQuery.toLowerCase())
  ), [sellerEarnings, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-display">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#0c1230]">Seller Payouts</h1>
          <p className="text-sm text-slate-500 mt-1">Generate bank/UPI settlement payout logs for approved sellers.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* EARNINGS SUMMARY TABLE */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between gap-4">
            <h3 className="text-base font-bold text-slate-900">Earning Statistics</h3>
            <div className="relative w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search store name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs placeholder-slate-450 text-slate-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  <th className="px-6 py-4">Store</th>
                  <th className="px-6 py-4">Total Revenue</th>
                  <th className="px-6 py-4">Paid Out</th>
                  <th className="px-6 py-4">Pending Payout</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {filteredEarnings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-450">No earning summaries matched.</td>
                  </tr>
                ) : (
                  filteredEarnings.map(s => (
                    <tr key={s.seller_id} className="hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{s.store_name}</p>
                        <span className="text-[10px] text-slate-400 font-sans">by {s.seller_name}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-750 font-sans">₹{s.total_sales.toLocaleString()}</td>
                      <td className="px-6 py-4 text-emerald-600 font-semibold font-sans">₹{s.paid_amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-amber-600 font-bold font-sans">₹{s.pending_amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedSeller(s);
                            setSettlementAmount(Math.round(s.pending_amount).toString());
                            setSettlementUpi(s.upi_id || '');
                          }}
                          disabled={s.pending_amount <= 1}
                          className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed border border-primary/15 text-primary text-[10px] font-bold rounded-lg transition-colors"
                        >
                          Settle Payout
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SETTLEMENT DRAWER/PANEL COLUMN */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          {selectedSeller ? (
            <form onSubmit={handleGenerateSettlement} className="space-y-6 flex-grow flex flex-col justify-between">
              <div className="space-y-5">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-50 pb-3">Generate Settlement</h3>

                <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Store Name:</span>
                    <span className="font-semibold text-slate-850">{selectedSeller.store_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Owner Email:</span>
                    <span className="font-semibold text-slate-850 font-sans">{selectedSeller.seller_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pending Balance:</span>
                    <span className="font-bold text-amber-600 font-sans">₹{selectedSeller.pending_amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Payout Settlement Amount (₹)</label>
                  <input
                    type="number"
                    max={selectedSeller.pending_amount}
                    value={settlementAmount}
                    onChange={(e) => setSettlementAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 bg-slate-50/20"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Destination UPI ID</label>
                  <input
                    type="text"
                    value={settlementUpi}
                    onChange={(e) => setSettlementUpi(e.target.value)}
                    placeholder="e.g. name@bank"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-cyan-500 bg-slate-50/20"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-6 border-t border-slate-50 mt-6">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-grow py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{processing ? 'Processing...' : 'Mark Completed'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSeller(null)}
                  className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex-grow flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-50 pb-3 mb-4">Payout Log History</h3>
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {payoutLogs.length === 0 ? (
                    <p className="text-xs text-slate-450 text-center py-10">No payouts logged yet.</p>
                  ) : (
                    payoutLogs.slice(0, 5).map(l => (
                      <div key={l.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] flex justify-between items-center gap-2">
                        <div>
                          <p className="font-semibold text-slate-800 truncate max-w-[130px]">{l.seller_name}</p>
                          <span className="text-[9px] text-slate-400 font-sans">{l.payout_date ? new Date(l.payout_date).toLocaleDateString() : ''}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600 font-sans">₹{l.amount}</span>
                          <p className="text-[9px] text-emerald-500 font-semibold uppercase">{l.status}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="text-center pt-6 border-t border-slate-50 mt-5">
                <span className="text-[10px] text-slate-400 flex items-center gap-1.5 justify-center">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Log history records payouts completed out-of-band.</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
