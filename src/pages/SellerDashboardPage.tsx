import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { supabase } from '../lib/supabase';
import type { Order, Note, Course } from '../types';
import {
  Store, BookOpen, DollarSign, Package,
  User, Mail, Phone, Save, LogOut, BarChart3,
  Plus, Search, Trash2, Edit2, X, Upload, CheckCircle2
} from 'lucide-react';

type SellerTab = 'overview' | 'products' | 'orders' | 'profile';

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
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubject, setNoteSubject] = useState('');
  const [noteSemester, setNoteSemester] = useState('');
  const [notePrice, setNotePrice] = useState('');
  const [noteCourseId, setNoteCourseId] = useState('');
  const [noteStatus, setNoteStatus] = useState<'active' | 'draft'>('active');
  const [noteDescription, setNoteDescription] = useState('');
  const [notePdfUrl, setNotePdfUrl] = useState('');
  const [noteThumbnailUrl, setNoteThumbnailUrl] = useState('');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

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
      if (coursesData) {
        setCourses(coursesData);
        if (coursesData.length > 0) setNoteCourseId(coursesData[0].id);
      }

      // 2. Fetch seller's notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      if (notesData) setNotesList(notesData);

      // 3. Fetch orders (where seller notes were purchased)
      // For now, load standard mock orders. Later joins note orders specifically.
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

  // Drawer Form Triggers
  const handleOpenCreateDrawer = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteSubject('');
    setNoteSemester('');
    setNotePrice('');
    if (courses.length > 0) setNoteCourseId(courses[0].id);
    setNoteStatus('active');
    setNoteDescription('');
    setNotePdfUrl('');
    setNoteThumbnailUrl('');
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteSubject(note.subject);
    setNoteSemester(note.semester || '');
    setNotePrice(note.price.toString());
    setNoteCourseId(note.course_id);
    setNoteStatus(note.status as any);
    setNoteDescription(note.description || '');
    setNotePdfUrl(note.pdf_url);
    setNoteThumbnailUrl(note.thumbnail_url);
    setIsDrawerOpen(true);
  };

  const handleSimulatePdfUpload = () => {
    setPdfUploading(true);
    setTimeout(() => {
      setNotePdfUrl(`pdfs/notes_anatomy_${Math.random().toString(36).substring(2, 6)}.pdf`);
      setPdfUploading(false);
      addToast('success', 'PDF Document Uploaded', 'Simulated note document attachment.');
    }, 1200);
  };

  const handleSimulateThumbnailUpload = () => {
    setThumbnailUploading(true);
    setTimeout(() => {
      setNoteThumbnailUrl('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400');
      setThumbnailUploading(false);
      addToast('success', 'Thumbnail Uploaded', 'Simulated preview thumbnail upload.');
    }, 1000);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteSubject.trim() || !notePrice.trim() || !noteCourseId) {
      addToast('error', 'Missing Fields', 'Please complete Title, Course, Subject, and Price.');
      return;
    }

    const payload = {
      title: noteTitle.trim(),
      subject: noteSubject.trim(),
      semester: noteSemester.trim() || null,
      price: Number(notePrice),
      course_id: noteCourseId,
      status: noteStatus,
      description: noteDescription.trim(),
      pdf_url: notePdfUrl || 'pdfs/anatomy_upper_limb.pdf',
      thumbnail_url: noteThumbnailUrl || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400',
      preview_images: [
        'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&q=80&w=400'
      ],
      seller_id: user?.id
    };

    try {
      if (editingNote) {
        // Update Note
        const { error } = await supabase
          .from('notes')
          .update(payload)
          .eq('id', editingNote.id)
          .eq('seller_id', user?.id);
        if (error) throw error;
        addToast('success', 'Note Updated', 'Your study notes details were successfully updated.');
      } else {
        // Insert Note
        const { error } = await supabase
          .from('notes')
          .insert(payload);
        if (error) throw error;
        addToast('success', 'Note Published', 'Your study notes are now listed on StethoNotes.');
      }

      setIsDrawerOpen(false);
      fetchData();
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message);
    }
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
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-emerald-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm leading-tight">{user?.name}</p>
              <p className="text-xs text-emerald-600 font-medium">Verified Seller</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-slate-500 hover:text-accent transition-colors hidden sm:block">
              Browse Store
            </Link>
            <button onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-all">
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-56 shrink-0">
            <nav className="bg-white rounded-2xl border border-emerald-100 p-3 shadow-sm flex lg:flex-col gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
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
                <h2 className="text-xl font-bold text-slate-800 mb-6">Seller Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                  {[
                    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: <DollarSign className="w-6 h-6 text-emerald-500" />, color: 'emerald' },
                    { label: 'Total Orders', value: orders.length, icon: <Package className="w-6 h-6 text-blue-500" />, color: 'blue' },
                    { label: 'Notes Listed', value: notesList.length, icon: <BookOpen className="w-6 h-6 text-purple-500" />, color: 'purple' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <div className={`inline-flex w-12 h-12 items-center justify-center rounded-xl bg-${stat.color}-50 mb-3`}>
                        {stat.icon}
                      </div>
                      <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Info Dashboard helper cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl p-6 border border-emerald-100/60 shadow-sm text-left">
                    <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-500" />
                      <span>Start Selling Notes</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Upload your high-yield notes as PDFs, choose your price, and help peer students across college domains.
                    </p>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-colors shadow-md shadow-emerald-100"
                    >
                      Manage Notes Catalogue
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-teal-100/60 shadow-sm text-left">
                    <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span>Earnings Settlements</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Earnings are transferred directly to your bank account or registered UPI ID within 24 hours of checkout settlement.
                    </p>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg transition-colors"
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
                    <h2 className="text-xl font-bold text-slate-800">My Notes Catalogue</h2>
                    <p className="text-xs text-slate-400">List and manage your study notes available for students.</p>
                  </div>
                  <button
                    onClick={handleOpenCreateDrawer}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload New Note</span>
                  </button>
                </div>

                {/* Filter and Search */}
                <div className="flex items-center gap-4 bg-white p-3 border border-slate-100 rounded-2xl shadow-sm">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search note title or subject..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:border-emerald-500 bg-slate-50/20 text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* Grid of note cards */}
                {filteredNotes.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-gray-150 shadow-sm">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-700 font-bold text-sm">No notes found</p>
                    <p className="text-xs text-slate-400 mt-1">Click the upload button to list your first note document.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredNotes.map(note => {
                      const courseName = courses.find(c => c.id === note.course_id)?.name || 'Course';
                      return (
                        <div key={note.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
                          <div>
                            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                              <img src={note.thumbnail_url} alt="Cover" className="w-full h-full object-cover" />
                              <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                note.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {note.status === 'active' ? 'Published' : 'Draft'}
                              </span>
                            </div>
                            <div className="p-4 space-y-2 text-left">
                              <span className="text-[10px] text-slate-400 font-sans tracking-wide uppercase font-bold">{courseName} — {note.subject}</span>
                              <h4 className="font-bold text-slate-800 text-sm line-clamp-1 leading-snug">{note.title}</h4>
                              <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{note.description || 'No description provided.'}</p>
                            </div>
                          </div>

                          <div className="p-4 pt-0 border-t border-slate-50 flex items-center justify-between mt-2">
                            <span className="text-slate-800 font-bold font-sans text-sm">₹{note.price}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenEditDrawer(note)}
                                className="p-2 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg transition-colors border border-emerald-100"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-2 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-lg transition-colors border border-red-100"
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
                <h2 className="text-xl font-bold text-slate-800 mb-6">Recent Orders</h2>
                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No orders yet.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm text-left">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Customer</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Amount</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {orders.map(order => (
                          <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-700">{order.customer_name}</p>
                              <p className="text-xs text-slate-400">{order.customer_email}</p>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              ₹{order.total_amount.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                order.payment_status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {order.payment_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400">
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

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-xl font-bold text-slate-800 mb-6">Seller Profile</h2>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-lg text-left">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-14 h-14 rounded-2xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                        <User className="w-7 h-7 text-emerald-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-800">{user?.name}</p>
                      <p className="text-xs text-emerald-600 font-medium">Verified Seller</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 text-sm">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Full Name</label>
                      <div className="relative">
                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none rounded-xl text-slate-800" />
                        <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Email</label>
                      <div className="relative">
                        <input type="email" value={user?.email || ''} disabled
                          className="w-full pl-10 pr-4 py-3 border border-gray-100 bg-gray-50 rounded-xl text-gray-400 cursor-not-allowed" />
                        <Mail className="w-4 h-4 text-gray-300 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Phone Number</label>
                      <div className="relative">
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                          placeholder="9876543210"
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none rounded-xl text-slate-800" />
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                    <button onClick={handleSaveProfile} disabled={savingProfile}
                      className="flex items-center justify-center gap-2 py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 shadow-md shadow-emerald-200">
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

      {/* NOTE UPLOAD DRAWER MODAL */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-[#0c1230]/40 backdrop-blur-xs"
            />
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col justify-between border-l border-slate-100 z-10"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{editingNote ? 'Edit Notes Details' : 'Upload Study Notes'}</h3>
                  <p className="text-xs text-slate-400">Provide document credentials and media attachments.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Form Scroll Content */}
              <form onSubmit={handleSaveNote} className="flex-grow overflow-y-auto p-6 space-y-6 text-left">
                {/* Note Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Note Title *</label>
                  <input
                    type="text"
                    required
                    value={noteTitle}
                    onChange={e => setNoteTitle(e.target.value)}
                    placeholder="e.g. Upper Limb Anatomy — Hand & Wrist Bones"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none text-xs transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Course select */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Academic Course *</label>
                    <select
                      value={noteCourseId}
                      onChange={e => setNoteCourseId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none text-xs transition-colors"
                    >
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Subject *</label>
                    <input
                      type="text"
                      required
                      value={noteSubject}
                      onChange={e => setNoteSubject(e.target.value)}
                      placeholder="e.g. Anatomy"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none text-xs transition-colors"
                    />
                  </div>

                  {/* Semester */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Semester / Year</label>
                    <input
                      type="text"
                      value={noteSemester}
                      onChange={e => setNoteSemester(e.target.value)}
                      placeholder="e.g. Semester 2"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none text-xs transition-colors"
                    />
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Note Price (INR) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={notePrice}
                      onChange={e => setNotePrice(e.target.value)}
                      placeholder="e.g. 199"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none text-xs transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Status select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Catalogue Status</label>
                  <select
                    value={noteStatus}
                    onChange={e => setNoteStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none text-xs transition-colors"
                  >
                    <option value="active">Active (Published)</option>
                    <option value="draft">Draft (Private)</option>
                  </select>
                </div>

                {/* Note Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Note Description</label>
                  <textarea
                    rows={4}
                    value={noteDescription}
                    onChange={e => setNoteDescription(e.target.value)}
                    placeholder="Enter subjects covered, key lecture chapters included, authors..."
                    className="w-full p-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none text-xs transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Media Attachment Simulators */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Note Media & Attachments</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* PDF Document */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">PDF Document File</label>
                      <button
                        type="button"
                        onClick={() => handleSimulatePdfUpload()}
                        disabled={pdfUploading}
                        className="w-full py-3 border border-dashed border-slate-200 hover:border-emerald-500 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {pdfUploading ? (
                          <div className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-500 rounded-full animate-spin" />
                        ) : notePdfUrl ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Upload className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{pdfUploading ? 'Uploading...' : notePdfUrl ? 'Document Attached' : 'Attach PDF'}</span>
                      </button>
                    </div>

                    {/* Cover Image */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Cover Thumbnail Image</label>
                      <button
                        type="button"
                        onClick={handleSimulateThumbnailUpload}
                        disabled={thumbnailUploading}
                        className="w-full py-3 border border-dashed border-slate-200 hover:border-emerald-500 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {thumbnailUploading ? (
                          <div className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-500 rounded-full animate-spin" />
                        ) : noteThumbnailUrl ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Upload className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{thumbnailUploading ? 'Uploading...' : noteThumbnailUrl ? 'Cover Attached' : 'Attach Cover'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="flex gap-3 pt-6 border-t border-slate-100 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="py-2.5 px-5 hover:bg-slate-50 border border-slate-200 text-slate-650 font-bold text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-emerald-100"
                  >
                    {editingNote ? 'Save Updates' : 'Publish Notes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
