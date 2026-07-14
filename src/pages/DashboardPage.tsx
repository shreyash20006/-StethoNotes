import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import { supabase, isLiveSupabase, triggerBrevoEmailSimulation } from "../lib/supabase";
import type { Note, Order } from "../types";
import { BookOpen, User, Phone, Mail, Send, History, Save, RefreshCw, Award, Zap, Coins, Copy, Share2, Calendar } from "lucide-react";
import confetti from "canvas-confetti";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<"purchases" | "gamification" | "achievements" | "referral" | "profile" | "orders">("purchases");
  const [purchasedNotes, setPurchasedNotes] = useState<Note[]>([]);
  const [ordersHistory, setOrdersHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile forms
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Email resend spinner states
  const [resendingNoteId, setResendingNoteId] = useState<string | null>(null);
  const [noteToOrderMap, setNoteToOrderMap] = useState<Record<string, string>>({});

  // Gamification States
  const [streakCount, setStreakCount] = useState(5);
  const [coins, setCoins] = useState(150);
  const [xp, setXp] = useState(650);
  const [level] = useState(3);
  const [dailyClaimed, setDailyClaimed] = useState(false);

  // Study Reminders
  const [reminders, setReminders] = useState<{ day: string; note: string }[]>([
    { day: "Every Monday", note: "Anatomy Revision" },
    { day: "Every Wednesday", note: "Pharmacology Practice" }
  ]);
  const [newReminderDay, setNewReminderDay] = useState("Every Friday");
  const [newReminderNote, setNewReminderNote] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const validTabs = ["purchases", "gamification", "achievements", "referral", "profile", "orders"];
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [window.location.search]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    setName(user.name);
    setPhone(user.phone || "");

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data: ordersData } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .eq("payment_status", "completed")
          .order("created_at", { ascending: false });

        if (ordersData) {
          setOrdersHistory(ordersData);
          if (ordersData.length > 0) {
            const orderIds = ordersData.map((o: any) => o.id);
            const { data: itemsData } = await supabase
              .from("order_items")
              .select("*, note:notes(*)")
              .in("order_id", orderIds);

            if (itemsData) {
              const uniqueNotes: Record<string, Note> = {};
              const noteMap: Record<string, string> = {};

              itemsData.forEach((item: any) => {
                if (item.note) {
                  uniqueNotes[item.note.id] = item.note;
                  noteMap[item.note.id] = item.order_id;
                }
              });

              setNoteToOrderMap(noteMap);
              setPurchasedNotes(Object.values(uniqueNotes));
            }
          }
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const success = await updateProfile(name, phone);
      if (success) {
        addToast("success", "Profile Updated", "Your profile details have been saved successfully.");
      } else {
        throw new Error("Could not save details.");
      }
    } catch (err: any) {
      addToast("error", "Profile Update Failed", err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleEmailNotes = async (noteId: string, noteTitle: string) => {
    const matchedOrderId = noteToOrderMap[noteId];
    if (!matchedOrderId) {
      addToast("error", "Order Match Failed", "Could not locate purchase record for this note.");
      return;
    }

    setResendingNoteId(noteId);
    try {
      if (isLiveSupabase) {
        const functionName = "send-order-email";
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
        if (!supabaseUrl) throw new Error("Supabase URL is not configured.");

        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { orderId: matchedOrderId }
        });
        if (error) throw error;
        if (data?.success) {
          addToast("success", "Email Sent", `Your PDF guide for "${noteTitle}" has been sent to your inbox.`);
        } else {
          throw new Error(data?.message || "Email delivery failed");
        }
      } else {
        const success = await triggerBrevoEmailSimulation(matchedOrderId);
        if (success) {
          addToast("success", "Email Sent (Demo)", `Simulated email sent successfully for "${noteTitle}".`);
        } else {
          throw new Error("Simulated delivery failure.");
        }
      }
    } catch (err: any) {
      console.error(err);
      addToast("error", "Delivery Failed", err.message || "Could not trigger email send.");
    } finally {
      setResendingNoteId(null);
    }
  };

  const claimDailyReward = () => {
    if (dailyClaimed) return;
    setDailyClaimed(true);
    setCoins(prev => prev + 50);
    setXp(prev => prev + 100);
    setStreakCount(prev => prev + 1);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
    addToast("success", "Daily Reward Claimed!", "+50 Coins and +100 XP added to your locker.");
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderNote.trim()) return;
    setReminders(prev => [...prev, { day: newReminderDay, note: newReminderNote }]);
    setNewReminderNote("");
    addToast("success", "Reminder Saved", "We will notify you to revise this note.");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
        <p className="text-gray-400 text-sm font-display">Loading your student dashboard...</p>
      </div>
    );
  }

  const nextLevelXp = level * 500;
  const xpPercentage = Math.min((xp / nextLevelXp) * 100, 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit flex flex-col gap-6 text-white">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="font-display font-extrabold text-lg text-white truncate">{user?.name}</h3>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-sans px-2.5 py-0.5 rounded-full capitalize font-semibold mt-1 inline-block">
              {user?.role} Student
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {[
              { id: "purchases", label: "My Purchases", icon: <BookOpen className="w-4 h-4" /> },
              { id: "gamification", label: "Streak & Rewards", icon: <Zap className="w-4 h-4" /> },
              { id: "achievements", label: "Achievements", icon: <Award className="w-4 h-4" /> },
              { id: "referral", label: "Referral Program", icon: <Share2 className="w-4 h-4" /> },
              { id: "profile", label: "Profile Settings", icon: <User className="w-4 h-4" /> },
              { id: "orders", label: "Order History", icon: <History className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-semibold text-left transition-all ${
                  activeTab === tab.id
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Tab Contents Panel */}
        <main className="flex-grow bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* 1. Purchases */}
          {activeTab === "purchases" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-slate-900">Purchased Study Material</h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">{purchasedNotes.length} guides</span>
              </div>

              {purchasedNotes.length === 0 ? (
                <div className="text-center py-20 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-800">No Notes Purchased Yet</h3>
                    <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">Browse our catalogue to buy ranker notes and start your learning streak.</p>
                  </div>
                  <Link to="/courses" className="btn-primary py-2.5 px-6 text-xs font-bold mt-2">Browse Catalogue</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {purchasedNotes.map((note) => {
                    const resending = resendingNoteId === note.id;
                    return (
                      <div key={note.id} className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between gap-4 bg-slate-50/20">
                        <div className="flex gap-4">
                          <div className="w-16 h-20 bg-slate-150 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                            <img src={note.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <span className="text-[9px] font-sans font-bold text-cyan-600 uppercase tracking-wider">{note.subject}</span>
                            <h4 className="font-bold text-sm text-slate-950 truncate">{note.title}</h4>
                            <p className="text-[10px] text-slate-400">Delivered directly to your inbox</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <a
                            href={note.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
                          >
                            Read Online
                          </a>
                          <button
                            onClick={() => handleEmailNotes(note.id, note.title)}
                            disabled={resending}
                            className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            {resending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            <span>Email PDF</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. Gamification & Study Streak */}
          {activeTab === "gamification" && (
            <div className="space-y-6">
              <h2 className="text-xl font-display font-bold text-slate-900">Study Streak & StethoCoins</h2>

              {/* Status Header Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Level / XP */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Level {level}</p>
                    <span className="text-xs text-cyan-400 font-semibold">{xp}/{nextLevelXp} XP</span>
                  </div>
                  <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${xpPercentage}%` }} />
                  </div>
                </div>

                {/* StethoCoins */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">StethoCoins Balance</p>
                    <p className="text-3xl font-extrabold text-yellow-400 flex items-center gap-1.5 font-sans"><Coins className="w-6 h-6 fill-yellow-400/20" /> {coins}</p>
                  </div>
                </div>

                {/* Study Streak */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Revision Streak</p>
                    <p className="text-3xl font-extrabold text-cyan-400 flex items-center gap-1.5 font-sans"><Zap className="w-6 h-6 fill-cyan-400/20" /> {streakCount} Days</p>
                  </div>
                </div>
              </div>

              {/* Claim Reward Banner */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base">Claim Your Daily Revision Reward</h3>
                  <p className="text-xs text-slate-500">Revise daily to grow your streak and receive +50 Coins and +100 XP.</p>
                </div>
                <button
                  onClick={claimDailyReward}
                  disabled={dailyClaimed}
                  className="btn-primary py-3 px-6 text-xs font-bold disabled:bg-slate-300 disabled:from-slate-350 disabled:to-slate-350 shrink-0"
                >
                  {dailyClaimed ? "Claimed Today!" : "Claim Daily Reward"}
                </button>
              </div>

              {/* Reminders Calendar List */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Study Reminders Calendar</h3>
                <form onSubmit={handleAddReminder} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={newReminderDay}
                    onChange={e => setNewReminderDay(e.target.value)}
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 bg-slate-50/50"
                  >
                    <option>Every Monday</option>
                    <option>Every Tuesday</option>
                    <option>Every Wednesday</option>
                    <option>Every Thursday</option>
                    <option>Every Friday</option>
                    <option>Every Saturday</option>
                    <option>Every Sunday</option>
                  </select>
                  <input
                    type="text"
                    value={newReminderNote}
                    onChange={e => setNewReminderNote(e.target.value)}
                    placeholder="e.g. Pathology revision notes"
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 bg-slate-50/50"
                    required
                  />
                  <button type="submit" className="btn-primary py-2.5 text-xs font-bold">Add Reminder</button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {reminders.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 border border-slate-100 rounded-xl px-4 py-3 bg-slate-50/30">
                      <Calendar className="w-4 h-4 text-cyan-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{r.note}</p>
                        <p className="text-[10px] text-slate-400">{r.day}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. Achievements */}
          {activeTab === "achievements" && (
            <div className="space-y-6">
              <h2 className="text-xl font-display font-bold text-slate-900">Digital Milestones & Badges</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { badge: "🩺 Anatomy Novice", unlocked: true, desc: "Purchased anatomy notes pack" },
                  { badge: "📚 Syllabus Surfer", unlocked: true, desc: "Downloaded 3 study guides" },
                  { badge: "🔥 Revision Rockstar", unlocked: false, desc: "Maintain a 10-day revision streak" },
                  { badge: "💸 Topper Ally", unlocked: false, desc: "Invited 5 classmates via referrals" }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-2xl p-4 text-center space-y-3 transition-colors ${
                      item.unlocked ? "bg-white border-slate-100 shadow-sm" : "bg-slate-50/60 border-dashed border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="text-3xl">{item.badge.split(" ")[0]}</div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{item.badge.split(" ").slice(1).join(" ")}</h4>
                      <p className="text-[10px] text-slate-450 mt-1 leading-normal">{item.desc}</p>
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        item.unlocked ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-500"
                      }`}>
                        {item.unlocked ? "Unlocked" : "Locked"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Referral */}
          {activeTab === "referral" && (
            <div className="space-y-6">
              <h2 className="text-xl font-display font-bold text-slate-900">Referral Earning Center</h2>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/20 border border-slate-100 rounded-2xl p-5 text-center space-y-1">
                  <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Total Referred Friends</p>
                  <p className="text-3xl font-extrabold text-slate-900 font-sans">0</p>
                </div>
                <div className="bg-slate-950/20 border border-slate-100 rounded-2xl p-5 text-center space-y-1">
                  <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Referral Coins Earned</p>
                  <p className="text-3xl font-extrabold text-yellow-500 flex items-center justify-center gap-1 font-sans"><Coins className="w-5 h-5" /> 0</p>
                </div>
              </div>

              {/* Referral copy box */}
              <div className="border border-slate-100 rounded-3xl p-6 bg-slate-50/30 space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Share StethoNotes & Earn Coins</h3>
                  <p className="text-xs text-slate-450 mt-1">Get +100 StethoCoins for every classmate that registers and buys their first note pack using your code.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`https://stethonotes.store/register?ref=${user?.id?.slice(0, 8)}`}
                    readOnly
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono bg-white text-slate-650"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://stethonotes.store/register?ref=${user?.id?.slice(0, 8)}`);
                      addToast("success", "Link Copied", "Referral link copied to clipboard.");
                    }}
                    className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. Profile Settings */}
          {activeTab === "profile" && (
            <div>
              <h2 className="text-xl font-display font-bold text-[#0c1230] mb-6">Profile Information</h2>
              <form onSubmit={handleUpdateProfile} className="max-w-lg flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 focus:border-cyan-500 outline-none rounded-xl text-xs bg-slate-50/30 text-slate-800 font-medium"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Email Address (Read-only)</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-slate-150 bg-slate-100/50 outline-none rounded-xl text-xs text-slate-400 font-medium"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 focus:border-cyan-500 outline-none rounded-xl text-xs bg-slate-50/30 text-slate-800 font-medium"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="btn-primary py-3 px-6 text-xs font-bold w-fit flex items-center gap-1.5 mt-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{updatingProfile ? "Saving..." : "Save Settings"}</span>
                </button>
              </form>
            </div>
          )}

          {/* 6. Order History */}
          {activeTab === "orders" && (
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900 mb-6">Transaction History</h2>
              {ordersHistory.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl flex flex-col items-center gap-4">
                  <History className="w-12 h-12 text-slate-300" />
                  <h3 className="font-display font-semibold text-slate-800">No Orders Found</h3>
                  <p className="text-slate-450 text-xs max-w-xs mx-auto font-sans">You have not placed any orders yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {ordersHistory.map((order) => (
                    <div key={order.id} className="border border-slate-150 rounded-2xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs">
                      <div>
                        <p className="font-sans text-slate-400">Order ID: <span className="text-slate-900 font-semibold">{order.id}</span></p>
                        <p className="font-sans text-slate-400 mt-1">Date: <span className="text-slate-900 font-semibold">{new Date(order.created_at).toLocaleDateString()}</span></p>
                        <p className="font-sans text-slate-400 mt-1">Payment ID: <span className="text-slate-900 font-semibold">{order.razorpay_payment_id || "Cash/Demo"}</span></p>
                      </div>
                      <div className="flex flex-col sm:items-end gap-1 shrink-0">
                        <span className="font-display font-extrabold text-sm text-slate-800">₹{order.total_amount}</span>
                        <span className="bg-emerald-50 text-emerald-600 font-display font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}