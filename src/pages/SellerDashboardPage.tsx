import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import { supabase } from "../lib/supabase";
import NoteUploadWizard from "../components/admin/NoteUploadWizard";
import type { Order, Note, Course } from "../types";
import {
  Store, BookOpen, Package,
  User, Save, LogOut, BarChart3,
  Plus, Search, Trash2, Edit2, Wallet, Award, Share2, CheckCircle
} from "lucide-react";

type SellerTab = "overview" | "wallet" | "products" | "orders" | "achievements" | "referral" | "profile";

export default function SellerDashboardPage() {
  const navigate = useNavigate();
  const { user, signOut, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<SellerTab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Profile Form States
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Note Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Wallet / Payout States
  const [walletBalance, setWalletBalance] = useState(12450);
  const [payoutRequested, setPayoutRequested] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const validTabs = ["overview", "wallet", "products", "orders", "achievements", "referral", "profile"];
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [window.location.search]);

  useEffect(() => {
    if (!user) {
      navigate("/seller/login");
      return;
    }
    if (user.role !== "seller") {
      if (user.role === "seller_pending") navigate("/seller/application-pending");
      else if (user.role === "student") navigate("/dashboard");
      else if (user.role === "admin" || user.role === "super_admin") navigate("/admin/dashboard");
      return;
    }
    setName(user.name);
    setPhone(user.phone || "");
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: coursesData }, { data: notesData }, { data: ordersData }] = await Promise.all([
        supabase.from("courses").select("*").order("name"),
        supabase.from("notes").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*").eq("payment_status", "completed").order("created_at", { ascending: false }).limit(15)
      ]);

      if (coursesData) setCourses(coursesData);
      if (notesData) setNotesList(notesData);
      if (ordersData) setOrders(ordersData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const ok = await updateProfile(name, phone);
    if (ok) addToast("success", "Profile Saved", "Your profile details have been saved.");
    else addToast("error", "Save Failed", "Could not save details.");
    setSavingProfile(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/seller/login");
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to remove this note? This cannot be undone.")) return;
    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId).eq("seller_id", user?.id);
      if (error) throw error;
      addToast("info", "Deleted", "Note guide removed successfully.");
      fetchData();
    } catch (err: any) {
      addToast("error", "Delete Failed", err.message);
    }
  };

  const requestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payoutAmount);
    if (amount <= 0 || amount > walletBalance) {
      addToast("error", "Invalid Amount", "Please enter a valid amount within your wallet balance.");
      return;
    }
    if (!upiId.trim()) {
      addToast("error", "UPI Required", "Please enter your UPI ID.");
      return;
    }

    setSubmittingPayout(true);
    setTimeout(() => {
      setWalletBalance(prev => prev - amount);
      setPayoutRequested(true);
      setPayoutAmount("");
      setSubmittingPayout(false);
      addToast("success", "Payout Requested!", `Withdrawal of ₹${amount} initiated to ${upiId}.`);
    }, 1200);
  };

  const filteredNotes = notesList.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { id: SellerTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "wallet", label: "Wallet & Payouts", icon: <Wallet className="w-4 h-4" /> },
    { id: "products", label: "My Notes", icon: <BookOpen className="w-4 h-4" /> },
    { id: "orders", label: "Orders History", icon: <Package className="w-4 h-4" /> },
    { id: "achievements", label: "Accolades", icon: <Award className="w-4 h-4" /> },
    { id: "referral", label: "Referral Link", icon: <Share2 className="w-4 h-4" /> },
    { id: "profile", label: "Profile Info", icon: <User className="w-4 h-4" /> }
  ];

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin w-10 h-10 rounded-full border-t-2 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">{user?.name}</p>
              <p className="text-xs text-cyan-400 font-semibold">Verified Ranker Contributor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors hidden sm:block">
              Browse Store
            </Link>
            <button onClick={handleSignOut} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-xl transition-all border border-red-500/20 bg-red-500/5">
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-60 shrink-0">
            <nav className="bg-slate-900 rounded-3xl border border-slate-800 p-4 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all w-full text-left ${
                    activeTab === tab.id
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-grow bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Seller Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {[
                    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: "text-cyan-400" },
                    { label: "Total Sales", value: orders.length, color: "text-blue-400" },
                    { label: "Notes Listed", value: notesList.length, color: "text-indigo-400" }
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-950/40 rounded-2xl p-5 border border-slate-800">
                      <p className={`text-3xl font-extrabold ${stat.color} font-sans`}>{stat.value}</p>
                      <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-slate-950/20 rounded-2xl p-6 border border-slate-800 text-left space-y-3">
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <span>Upload Revision Notes</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Upload your handwritten summaries, flowcharts, or university review cheat sheets to begin earning.
                    </p>
                    <button onClick={() => setActiveTab("products")} className="btn-primary py-2 px-4 text-xs font-bold w-fit">
                      Manage Notes
                    </button>
                  </div>

                  <div className="bg-slate-950/20 rounded-2xl p-6 border border-slate-800 text-left space-y-3">
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-cyan-400" />
                      <span>Request Payout</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Withdraw your settled balances immediately via UPI or bank account transfer.
                    </p>
                    <button onClick={() => setActiveTab("wallet")} className="btn-primary py-2 px-4 text-xs font-bold w-fit">
                      Wallet Console
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* WALLET TAB */}
            {activeTab === "wallet" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Wallet & Settlements</h2>
                <div className="bg-slate-950/40 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Settled Balance</p>
                    <p className="text-4xl font-extrabold text-cyan-400 font-sans">₹{walletBalance}</p>
                  </div>
                  {walletBalance > 0 ? (
                    <form onSubmit={requestPayout} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <input
                        type="number"
                        placeholder="Amount (₹)"
                        value={payoutAmount}
                        onChange={e => setPayoutAmount(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-550 w-full sm:w-28 focus:outline-none focus:border-cyan-500 font-sans"
                        required
                      />
                      <input
                        type="text"
                        placeholder="UPI ID (e.g. name@okaxis)"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-550 w-full sm:w-44 focus:outline-none focus:border-cyan-500"
                        required
                      />
                      <button type="submit" disabled={submittingPayout} className="btn-primary py-2.5 px-6 text-xs font-bold shrink-0">
                        {submittingPayout ? "Processing..." : "Withdraw"}
                      </button>
                    </form>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No balance currently available for settlement.</p>
                  )}
                </div>

                {payoutRequested && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Withdrawal request received. Settlements usually reflect in 1-2 hours.</span>
                  </div>
                )}
              </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === "products" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">My Notes Catalogue</h2>
                    <p className="text-xs text-slate-450 mt-0.5">List and manage your study notes available for students.</p>
                  </div>
                  <button
                    onClick={() => { setEditingNote(null); setIsDrawerOpen(true); }}
                    className="btn-primary py-2.5 px-5 text-xs font-bold"
                  >
                    <Plus className="w-4 h-4" /> Upload New Note
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950/40 border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs rounded-xl text-white placeholder-slate-500"
                  />
                </div>

                {filteredNotes.length === 0 ? (
                  <div className="bg-slate-950/10 border border-slate-800 rounded-3xl p-16 text-center">
                    <BookOpen className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-xs">No notes found. Upload your first document pack to begin selling.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredNotes.map(note => {
                      const courseName = courses.find(c => c.id === note.course_id)?.name || "Course";
                      return (
                        <div key={note.id} className="bg-slate-950/20 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-cyan-500/10 transition-colors">
                          <div>
                            <div className="h-32 bg-slate-900 relative overflow-hidden">
                              <img src={note.thumbnail_url} alt="" className="w-full h-full object-cover" />
                              <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                note.status === "active" ? "bg-cyan-500/10 text-cyan-400" : "bg-slate-800 text-slate-400"
                              }`}>
                                {note.status === "active" ? "Published" : "Draft"}
                              </span>
                            </div>
                            <div className="p-4 space-y-1.5 text-left">
                              <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">{courseName} • {note.subject}</span>
                              <h4 className="font-bold text-white text-sm line-clamp-1">{note.title}</h4>
                              <p className="text-slate-400 text-xs line-clamp-2">{note.description || "No description."}</p>
                            </div>
                          </div>
                          <div className="p-4 pt-2 border-t border-slate-850 flex items-center justify-between mt-2">
                            <span className="text-white font-bold font-sans text-sm">₹{note.price}</span>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingNote(note); setIsDrawerOpen(true); }} className="p-2 bg-slate-900 border border-slate-800 hover:border-cyan-500 text-cyan-400 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteNote(note.id)} className="p-2 bg-slate-900 border border-slate-800 hover:border-red-500 text-red-400 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Purchase Orders Logs</h2>
                {orders.length === 0 ? (
                  <div className="bg-slate-950/10 border border-slate-800 rounded-3xl p-16 text-center">
                    <Package className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-xs">No orders logged.</p>
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-950/60 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                        <tr>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                        {orders.map(order => (
                          <tr key={order.id} className="hover:bg-slate-900/30">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-white">{order.customer_name}</p>
                              <p className="text-[10px] text-slate-500">{order.customer_email}</p>
                            </td>
                            <td className="px-4 py-3 font-bold text-white font-sans">₹{order.total_amount}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[9px] font-bold rounded-full uppercase">Completed</span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-sans">{new Date(order.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === "achievements" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Contributor Badges</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { title: "🩺 Gold Contributor", desc: "Uploaded 5 note packs", unlocked: true },
                    { title: "⭐ Student Choice", desc: "Maintained > 4.8 average rating", unlocked: true },
                    { title: "💰 Centurion Seller", desc: "Reached ₹10,000 in sales", unlocked: false },
                    { title: "📢 Mega Share", desc: "Invited 5 other toppers", unlocked: false }
                  ].map((badge, idx) => (
                    <div key={idx} className={`border rounded-2xl p-4 text-center space-y-2 ${badge.unlocked ? "bg-slate-950/20 border-slate-800" : "border-dashed border-slate-800 opacity-55"}`}>
                      <div className="text-3xl">🏅</div>
                      <h4 className="font-bold text-xs text-white">{badge.title}</h4>
                      <p className="text-[9px] text-slate-450 leading-normal">{badge.desc}</p>
                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full uppercase ${badge.unlocked ? "bg-cyan-500/10 text-cyan-400" : "bg-slate-800 text-slate-500"}`}>{badge.unlocked ? "Unlocked" : "Locked"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REFERRAL TAB */}
            {activeTab === "referral" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Referral Code</h2>
                <div className="border border-slate-800 rounded-3xl p-6 bg-slate-950/30 space-y-4">
                  <div>
                    <h3 className="font-bold text-white text-sm">Invite Topper Friends</h3>
                    <p className="text-xs text-slate-400 mt-1">Get an extra 5% commission on their notes sales for the first 6 months.</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`https://stethonotes.store/register/seller?ref=${user?.id?.slice(0, 8)}`}
                      readOnly
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-slate-300 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://stethonotes.store/register/seller?ref=${user?.id?.slice(0, 8)}`);
                        addToast("success", "Link Copied", "Referral link copied to clipboard.");
                      }}
                      className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Seller Profile Settings</h2>
                <div className="bg-slate-950/40 rounded-3xl border border-slate-800 p-6 max-w-lg">
                  <form onSubmit={e => { e.preventDefault(); handleSaveProfile(); }} className="space-y-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Full Name</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</label>
                      <input type="email" value={user?.email || ""} disabled className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-500 cursor-not-allowed" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Phone Number</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500" />
                    </div>
                    <button type="submit" disabled={savingProfile} className="btn-primary py-3 px-6 text-xs font-bold w-fit flex items-center gap-1.5 shadow shadow-cyan-500/10">
                      <Save className="w-4 h-4" />
                      <span>{savingProfile ? "Saving..." : "Save Profile"}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* NOTE UPLOAD WIZARD DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 220 }} className="relative w-full max-w-4xl h-full bg-white shadow-2xl z-10 overflow-y-auto">
              <NoteUploadWizard
                note={editingNote}
                isAdmin={false}
                onClose={() => setIsDrawerOpen(false)}
                onSaveSuccess={() => { setIsDrawerOpen(false); fetchData(); }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}