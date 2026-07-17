import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { supabase } from '../lib/supabase';
import NoteUploadWizard from '../components/admin/NoteUploadWizard';
import SellerWallet from '../components/seller/SellerWallet';
import SellerKYC from '../components/seller/SellerKYC';
import type { Order, Note, Course } from '../types';
import {
  Store, BookOpen, DollarSign, Package,
  User, Mail, Phone, Save, LogOut, BarChart3,
  Plus, Search, Trash2, Edit2, Wallet, ShieldCheck
} from 'lucide-react';

type SellerTab = 'overview' | 'products' | 'orders' | 'wallet' | 'kyc' | 'profile';

export default function SellerDashboardPage() {
  const navigate = useNavigate();
  const { user, signOut, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<SellerTab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Note Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['overview', 'products', 'orders', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [window.location.search]);

  useEffect(() => {
    if (!user) {
      navigate('/seller/login');
      return;
    }
    if (user.role !== 'seller') {
      if (user.role === 'seller_pending') navigate('/seller/application-pending');
      else if (user.role === 'student') navigate('/dashboard');
      else if (user.role === 'admin' || user.role === 'super_admin') navigate('/admin/dashboard');
      return;
    }
    setName(user.name);
    setPhone(user.phone || '');
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch courses
      const { data: coursesData } = await supabase.from('courses').select('*').order('name');
      if (coursesData) setCourses(coursesData);

      // 2. Fetch seller's notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      if (notesData) setNotesList(notesData);

      // 3. Fetch orders (where seller notes were purchased)
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      if (ordersData) setOrders(ordersData);
    } catch (err: any) {
      console.error('Seller dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const ok = await updateProfile(name, phone);
    if (ok) addToast('success', 'Profile Saved', 'Your profile has been updated.');
    else addToast('error', 'Save Failed', 'Could not update profile.');
    setSavingProfile(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/seller/login');
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to remove this note? This action is permanent.')) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('seller_id', user?.id);
      if (error) throw error;

      addToast('info', 'Note Deleted', 'The notes document was successfully removed.');
      fetchData();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  const filteredNotes = notesList.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { id: SellerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'products', label: 'My Notes', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <Package className="w-4 h-4" /> },
    { id: 'wallet', label: 'Wallet', icon: <Wallet className="w-4 h-4" /> },
    { id: 'kyc', label: 'KYC', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-void text-white font-sans pb-16">
      {/* Top Header Bar */}
      <div className="bg-card/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-450 to-teal-500 flex items-center justify-center shadow-lg">
              <Store className="w-5 h-5 text-void" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">{user?.name}</p>
              <p className="text-xs text-emerald-400 font-medium">Verified Seller</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-muted hover:text-white transition-colors hidden sm:block">
              Browse Store
            </Link>
            <button onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-white/5 px-3 py-2 rounded-xl transition-all border border-transparent hover:border-white/5">
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-56 shrink-0">
            <nav className="bg-card/65 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl flex lg:flex-col gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold shadow-md'
                      : 'text-muted hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:block lg:block">{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-xl font-display font-bold text-white mb-6">Seller Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                  {[
                    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: <DollarSign className="w-6 h-6 text-emerald-400" />, color: 'emerald' },
                    { label: 'Total Orders', value: orders.length, icon: <Package className="w-6 h-6 text-blue-400" />, color: 'blue' },
                    { label: 'Notes Listed', value: notesList.length, icon: <BookOpen className="w-6 h-6 text-purple-400" />, color: 'purple' },
                  ].map((stat, i) => (
                    <div key={i} className="glass-card-v2 bg-card/60 border border-white/10 rounded-2xl p-5 shadow-2xl text-white">
                      <div className={`inline-flex w-12 h-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 mb-3`}>
                        {stat.icon}
                      </div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-muted">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Info Dashboard helper cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="glass-card-v2 bg-card/65 rounded-2xl p-6 border border-white/10 shadow-2xl text-left">
                    <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      <span>Start Selling Notes</span>
                    </h3>
                    <p className="text-xs text-muted leading-relaxed mb-4">
                      Upload your high-yield notes as PDFs, choose your price, and help peer students across college domains.
                    </p>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-lg"
                    >
                      Manage Notes Catalogue
                    </button>
                  </div>

                  <div className="glass-card-v2 bg-card/65 rounded-2xl p-6 border border-white/10 shadow-2xl text-left">
                    <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-450" />
                      <span>Earnings Settlements</span>
                    </h3>
                    <p className="text-xs text-muted leading-relaxed mb-4">
                      Earnings are transferred directly to your bank account or registered UPI ID within 24 hours of checkout settlement.
                    </p>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="py-2 px-4 border border-white/10 hover:bg-white/5 text-white font-bold text-xs rounded-xl transition-colors"
                    >
                      Update Profile Info
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PRODUCTS TAB (Seller Notes Catalogue Manager) */}
            {activeTab === 'products' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">My Notes Catalogue</h2>
                    <p className="text-xs text-muted">List and manage your study notes available for students.</p>
                  </div>
                  <button
                    onClick={() => { setEditingNote(null); setIsDrawerOpen(true); }}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload New Note</span>
                  </button>
                </div>

                {/* Filter and Search */}
                <div className="flex items-center gap-4 bg-card/65 p-3 border border-white/10 rounded-2xl shadow-2xl">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      placeholder="Search note title or subject..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-white/10 focus:outline-none focus:border-emerald-500/50 bg-void text-xs rounded-xl text-white"
                    />
                  </div>
                </div>

                {/* Grid of note cards */}
                {filteredNotes.length === 0 ? (
                  <div className="bg-card/65 rounded-2xl p-16 text-center border border-white/10 shadow-2xl">
                    <BookOpen className="w-10 h-10 text-muted mx-auto mb-3" />
                    <p className="text-white font-bold text-sm">No notes found</p>
                    <p className="text-xs text-muted mt-1">Click the upload button to list your first note document.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredNotes.map(note => {
                      const courseName = courses.find(c => c.id === note.course_id)?.name || 'Course';
                      return (
                        <div key={note.id} className="glass-card-v2 bg-card/65 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between hover:border-emerald-500/20 transition-all text-left">
                          <div>
                            <div className="relative aspect-[4/3] bg-void overflow-hidden border-b border-white/5">
                              <img src={note.thumbnail_url} alt="Cover" className="w-full h-full object-cover" />
                              <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                note.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' : 'bg-white/5 border-white/10 text-muted'
                              }`}>
                                {note.status === 'active' ? 'Published' : 'Draft'}
                              </span>
                            </div>
                            <div className="p-4 space-y-2">
                              <span className="text-[10px] text-primary font-sans tracking-wide uppercase font-bold">{courseName} — {note.subject}</span>
                              <h4 className="font-bold text-white text-sm line-clamp-1 leading-snug">{note.title}</h4>
                              <p className="text-muted text-xs line-clamp-2 leading-relaxed">{note.description || 'No description provided.'}</p>
                            </div>
                          </div>

                          <div className="p-4 pt-0 border-t border-white/5 flex items-center justify-between mt-2">
                            <span className="text-white font-bold font-sans text-sm">₹{note.price}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setEditingNote(note); setIsDrawerOpen(true); }}
                                className="p-2 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-350 rounded-lg transition-colors border border-emerald-500/20"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-2 hover:bg-red-500/10 text-red-400 hover:text-red-350 rounded-lg transition-colors border border-red-500/20"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-xl font-bold text-white mb-6">Recent Orders</h2>
                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-card/65 rounded-2xl p-16 text-center border border-white/10 shadow-2xl">
                    <Package className="w-10 h-10 text-muted mx-auto mb-3" />
                    <p className="text-muted text-sm">No orders yet.</p>
                  </div>
                ) : (
                  <div className="glass-card-v2 bg-card/65 border border-white/10 rounded-2xl overflow-hidden shadow-2xl text-left">
                    <table className="w-full text-sm">
                      <thead className="bg-void/50 border-b border-white/5">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted font-sans uppercase">Customer</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted font-sans uppercase">Amount</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted font-sans uppercase">Status</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted font-sans uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white">
                        {orders.map(order => (
                          <tr key={order.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-white">{order.customer_name}</p>
                              <p className="text-xs text-muted">{order.customer_email}</p>
                            </td>
                            <td className="px-4 py-3 font-semibold text-white">
                              ₹{order.total_amount.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                                order.payment_status === 'completed'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                              }`}>
                                {order.payment_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted font-sans">
                              {new Date(order.created_at).toLocaleDateString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* WALLET TAB */}
            {activeTab === 'wallet' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <SellerWallet />
              </motion.div>
            )}

            {/* KYC TAB */}
            {activeTab === 'kyc' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <SellerKYC />
              </motion.div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-xl font-bold text-white mb-6">Seller Profile</h2>
                <div className="glass-card-v2 bg-card/65 rounded-2xl border border-white/10 p-6 shadow-2xl max-w-lg text-left text-white">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-14 h-14 rounded-2xl object-cover border border-white/10" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <User className="w-7 h-7 text-emerald-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white">{user?.name}</p>
                      <p className="text-xs text-emerald-400 font-medium">Verified Seller</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 text-sm">
                    <div>
                      <label className="text-xs font-semibold text-muted mb-1.5 block">Full Name</label>
                      <div className="relative">
                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-white/10 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30 outline-none rounded-xl bg-void text-white" />
                        <User className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted mb-1.5 block">Email</label>
                      <div className="relative">
                        <input type="email" value={user?.email || ''} disabled
                          className="w-full pl-10 pr-4 py-3 border border-white/5 bg-void/40 rounded-xl text-muted cursor-not-allowed" />
                        <Mail className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted mb-1.5 block">Phone Number</label>
                      <div className="relative">
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                          placeholder="9876543210"
                          className="w-full pl-10 pr-4 py-3 border border-white/10 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30 outline-none rounded-xl bg-void text-white" />
                        <Phone className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                    <button onClick={handleSaveProfile} disabled={savingProfile}
                      className="flex items-center justify-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-750 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 shadow-lg mt-2">
                      <Save className="w-4 h-4" />
                      {savingProfile ? 'Saving…' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>

      {/* NOTE UPLOAD WIZARD DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-[#060D1A]/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-4xl h-full bg-card border-l border-white/10 shadow-2xl z-10 overflow-y-auto"
            >
              <NoteUploadWizard
                note={editingNote}
                isAdmin={false}
                onClose={() => setIsDrawerOpen(false)}
                onSaveSuccess={() => {
                  setIsDrawerOpen(false);
                  fetchData();
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
