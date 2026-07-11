import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Review, CouponCode } from '../../types';
import { useToastStore } from '../../store/useToastStore';
import {
  Tag, Star, Trash2, CheckCircle2, AlertTriangle, Search, Plus,
  ToggleLeft, ToggleRight, Pin, EyeOff, Eye
} from 'lucide-react';

export default function ReviewsCoupons() {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'coupons'>('reviews');

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewSort, setReviewSort] = useState<'newest' | 'rating-desc' | 'rating-asc' | 'reported'>('newest');

  // Coupons State
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponValue, setCouponValue] = useState('');
  const [couponLimit, setCouponLimit] = useState('');
  const [couponExpiry, setCouponExpiry] = useState('');
  const [couponMinPurchase, setCouponMinPurchase] = useState('');
  const [couponMaxDiscount, setCouponMaxDiscount] = useState('');

  useEffect(() => {
    fetchReviewsAndCoupons();
  }, []);

  const fetchReviewsAndCoupons = async () => {
    setLoading(true);
    try {
      // 1. Fetch reviews joined with notes and profiles
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, note:notes(title), profile:profiles(full_name, email)');

      const mappedReviews: Review[] = (reviewsData || []).map((r: any) => ({
        ...r,
        user_name: r.profile?.full_name || 'Student',
        user_email: r.profile?.email || '',
        note_title: r.note?.title || 'Study Note'
      }));
      setReviews(mappedReviews);

      // 2. Fetch coupon codes
      const { data: couponsData } = await supabase
        .from('coupon_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (couponsData) setCoupons(couponsData);

    } catch (err) {
      console.error('Error fetching reviews and coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  // Review Operations
  const handlePinReview = async (review: Review) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_pinned: !review.is_pinned })
        .eq('id', review.id);
      if (error) throw error;

      addToast('success', review.is_pinned ? 'Review Unpinned' : 'Review Pinned', 'Review visibility prioritized.');
      fetchReviewsAndCoupons();
    } catch (err: any) {
      addToast('error', 'Pin Failed', err.message);
    }
  };

  const handleHideReview = async (review: Review) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_hidden: !review.is_hidden })
        .eq('id', review.id);
      if (error) throw error;

      addToast('info', review.is_hidden ? 'Review Visible' : 'Review Hidden', 'Visibility status updated.');
      fetchReviewsAndCoupons();
    } catch (err: any) {
      addToast('error', 'Hide Failed', err.message);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      if (error) throw error;

      addToast('info', 'Review Deleted', 'Review removed from catalogue.');
      fetchReviewsAndCoupons();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  // Coupon Operations
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !couponValue.trim()) return;

    try {
      const { error } = await supabase.from('coupon_codes').insert({
        code: couponCode.toUpperCase().trim(),
        discount_type: couponType,
        discount_value: Number(couponValue),
        expiry_date: couponExpiry || null,
        usage_limit: couponLimit ? Number(couponLimit) : null,
        min_purchase: couponMinPurchase ? Number(couponMinPurchase) : 0,
        max_discount: couponMaxDiscount ? Number(couponMaxDiscount) : null,
        is_active: true
      });

      if (error) throw error;

      addToast('success', 'Coupon Created', `Promo code ${couponCode.toUpperCase()} published successfully.`);
      setShowAddCoupon(false);
      clearCouponForm();
      fetchReviewsAndCoupons();
    } catch (err: any) {
      addToast('error', 'Coupon Creation Failed', err.message);
    }
  };

  const clearCouponForm = () => {
    setCouponCode('');
    setCouponType('percentage');
    setCouponValue('');
    setCouponLimit('');
    setCouponExpiry('');
    setCouponMinPurchase('');
    setCouponMaxDiscount('');
  };

  const handleToggleCoupon = async (coupon: CouponCode) => {
    try {
      const { error } = await supabase
        .from('coupon_codes')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);
      if (error) throw error;

      addToast('success', 'Coupon Updated', `Promo code ${coupon.code} status toggled.`);
      fetchReviewsAndCoupons();
    } catch (err: any) {
      addToast('error', 'Toggle Failed', err.message);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const { error } = await supabase.from('coupon_codes').delete().eq('id', couponId);
      if (error) throw error;

      addToast('info', 'Coupon Deleted', 'Promo code deleted.');
      fetchReviewsAndCoupons();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  // Sorting and Filtering Reviews
  const sortedReviews = [...reviews]
    .filter(r => 
      r.comment.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      (r.note_title || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
      (r.user_name || '').toLowerCase().includes(reviewSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (reviewSort === 'rating-desc') return b.rating - a.rating;
      if (reviewSort === 'rating-asc') return a.rating - b.rating;
      if (reviewSort === 'reported') return (b.is_reported ? 1 : 0) - (a.is_reported ? 1 : 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0c1230]">{activeTab === 'reviews' ? 'Reviews & Ratings' : 'Coupons & Promos'}</h1>
          <p className="text-sm text-slate-500 mt-1">Moderate buyer comments and publish coupon discount codes.</p>
        </div>

        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'reviews' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500'
            }`}
          >
            Buyer Reviews
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'coupons' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500'
            }`}
          >
            Manage Coupons
          </button>
        </div>
      </div>

      {activeTab === 'reviews' ? (
        // ==========================================
        // REVIEWS TAB SECTION
        // ==========================================
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="relative flex-grow max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search reviewer or comment..."
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 bg-slate-50/20"
              />
            </div>

            <select
              value={reviewSort}
              onChange={(e) => setReviewSort(e.target.value as any)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-cyan-500 bg-slate-50/20 font-semibold"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="rating-desc">Sort: Highest Rating</option>
              <option value="rating-asc">Sort: Lowest Rating</option>
              <option value="reported">Sort: Reported Abuse</option>
            </select>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm divide-y divide-slate-50 overflow-hidden">
            {sortedReviews.length === 0 ? (
              <p className="text-center py-12 text-slate-450 text-xs">No buyer reviews found matching search query.</p>
            ) : (
              sortedReviews.map(r => (
                <div key={r.id} className="p-6 flex flex-col md:flex-row justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-450">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold font-sans">{new Date(r.created_at).toLocaleDateString()}</span>
                      {r.is_verified_purchase && (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold">Verified Purchase</span>
                      )}
                      {r.is_pinned && (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center gap-0.5">
                          <Pin className="w-2.5 h-2.5 fill-current" /> Pinned
                        </span>
                      )}
                      {r.is_reported && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-bold flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> Reported
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-sans">{r.comment}</p>
                    
                    <div className="text-[10px] text-slate-400">
                      <span>by <b>{r.user_name}</b> ({r.user_email}) on note: <b>{r.note_title}</b></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-start md:self-center">
                    <button
                      onClick={() => handlePinReview(r)}
                      className={`p-2 border rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold ${
                        r.is_pinned 
                          ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                          : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                      <span>{r.is_pinned ? 'Unpin' : 'Pin'}</span>
                    </button>

                    <button
                      onClick={() => handleHideReview(r)}
                      className={`p-2 border rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold ${
                        r.is_hidden 
                          ? 'bg-amber-50 border-amber-250 text-amber-600 hover:bg-amber-100'
                          : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      {r.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{r.is_hidden ? 'Show' : 'Hide'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteReview(r.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        // ==========================================
        // COUPONS TAB SECTION
        // ==========================================
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COUPONS LIST TABLE */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Active Coupons</h3>
              {!showAddCoupon && (
                <button
                  onClick={() => setShowAddCoupon(true)}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Coupon</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                    <th className="px-6 py-4">Promo Code</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Usage Limit</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-800">
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-450">No coupons active.</td>
                    </tr>
                  ) : (
                    coupons.map(coupon => (
                      <tr key={coupon.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-4 font-bold text-slate-900 font-mono tracking-wider">{coupon.code}</td>
                        <td className="px-6 py-4 font-semibold font-sans">
                          {coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}% Off`
                            : `₹${coupon.discount_value} Flat`}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-sans">
                          {coupon.used_count} / {coupon.usage_limit || '∞'} uses
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            coupon.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-650'
                          }`}>
                            {coupon.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right shrink-0">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleCoupon(coupon)}
                              className="p-1 text-slate-500 hover:text-cyan-600 transition-colors"
                              title="Toggle status"
                            >
                              {coupon.is_active ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="p-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-650 hover:bg-red-50 hover:border-red-155 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ADD COUPON FORM DRAWER/SIDEBAR */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            {showAddCoupon ? (
              <form onSubmit={handleCreateCoupon} className="space-y-4 flex-grow flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b border-slate-50 pb-3">New Promo Code</h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Coupon Code</label>
                    <input
                      type="text"
                      placeholder="e.g. SUMMER25"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono tracking-wider focus:outline-none focus:border-cyan-500 bg-slate-50/20"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Discount Type</label>
                      <select
                        value={couponType}
                        onChange={(e) => setCouponType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 bg-slate-50/20"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Flat Price (₹)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Discount Value</label>
                      <input
                        type="number"
                        placeholder="e.g. 15"
                        value={couponValue}
                        onChange={(e) => setCouponValue(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-850 bg-slate-50/20 font-sans"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Min Purchase (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 499"
                        value={couponMinPurchase}
                        onChange={(e) => setCouponMinPurchase(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-850 bg-slate-50/20 font-sans"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Max Discount (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 200"
                        value={couponMaxDiscount}
                        onChange={(e) => setCouponMaxDiscount(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-850 bg-slate-50/20 font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Usage Limit</label>
                      <input
                        type="number"
                        placeholder="Unlimited if empty"
                        value={couponLimit}
                        onChange={(e) => setCouponLimit(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-850 bg-slate-50/20 font-sans"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Expiry Date</label>
                      <input
                        type="date"
                        value={couponExpiry}
                        onChange={(e) => setCouponExpiry(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50/20 font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-6 border-t border-slate-50 mt-6">
                  <button
                    type="submit"
                    className="flex-grow py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Create Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCoupon(false)}
                    className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-grow flex flex-col justify-between py-10">
                <div className="flex flex-col items-center justify-center text-center">
                  <Tag className="w-10 h-10 text-slate-300 mb-3" />
                  <h4 className="font-bold text-slate-700 text-sm">Coupon Settings</h4>
                  <p className="text-xs text-slate-400 mt-1">Select a coupon from the list or click create to publish a new promo discount value code.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
