import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { supabase } from '../lib/supabase';
import { sendSellerApplicationReceivedEmail } from '../lib/brevo';
import {
  Clock, Mail, CheckCircle2, Store, LogOut, Bell,
  User, Phone, BookOpen, GraduationCap, CreditCard,
  FileText, Camera, Upload, AlertCircle, RefreshCw
} from 'lucide-react';
import type { SellerApplication } from '../types';

export default function SellerPendingPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { addToast } = useToastStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<SellerApplication | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('MBBS');
  const [year, setYear] = useState('1st Year');
  const [upiId, setUpiId] = useState('');
  const [bio, setBio] = useState('');
  const [governmentIdUrl, setGovernmentIdUrl] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

  // Simulation states
  const [photoUploading, setPhotoUploading] = useState(false);
  const [idUploading, setIdUploading] = useState(false);

  // Guard: only seller_pending may view this page
  useEffect(() => {
    if (!user) {
      navigate('/seller/login');
      return;
    }
    if (user.role === 'seller') {
      navigate('/seller/dashboard');
      return;
    }
    if (user.role === 'student') {
      navigate('/dashboard');
      return;
    }
    if (user.role === 'admin' || user.role === 'super_admin') {
      navigate('/admin/dashboard');
      return;
    }
  }, [user, navigate]);

  const fetchApplication = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setApplication(data);
        // Pre-fill form fields in case they want to re-apply
        setFullName(data.full_name);
        setPhone(data.phone);
        setCollege(data.college);
        setCourse(data.course);
        setYear(data.year);
        setUpiId(data.upi_id);
        setBio(data.bio || '');
        setGovernmentIdUrl(data.government_id_url || '');
        setProfilePhotoUrl(data.profile_photo_url || '');
      } else {
        setApplication(null);
        // Default fullName to user name
        setFullName(user.name || '');
      }
    } catch (err: any) {
      console.error('Error fetching seller application:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/seller/login');
  };

  const handleSimulatePhotoUpload = () => {
    setPhotoUploading(true);
    setTimeout(() => {
      setProfilePhotoUrl(`https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60`);
      setPhotoUploading(false);
      addToast('success', 'Profile Photo Uploaded', 'Simulated image upload completed.');
    }, 1200);
  };

  const handleSimulateIdUpload = () => {
    setIdUploading(true);
    setTimeout(() => {
      setGovernmentIdUrl(`https://stethonotes.store/uploads/mock-gov-id-${user?.id?.slice(0, 5)}.pdf`);
      setIdUploading(false);
      addToast('success', 'Gov ID Document Uploaded', 'Simulated PDF verification upload completed.');
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !college.trim() || !upiId.trim()) {
      addToast('error', 'Required Fields Missing', 'Please fill out all mandatory credentials.');
      return;
    }

    // UPI verification simple regex
    if (!upiId.includes('@')) {
      addToast('error', 'Invalid UPI ID', 'UPI address format must contain @ (e.g. handle@bank)');
      return;
    }

    setSubmitting(true);
    try {
      // Upsert into seller_applications (or insert new if not exists)
      const appPayload = {
        user_id: user?.id,
        full_name: fullName.trim(),
        email: user?.email,
        phone: phone.trim(),
        college: college.trim(),
        course,
        year,
        upi_id: upiId.trim(),
        bio: bio.trim() || null,
        government_id_url: governmentIdUrl || null,
        profile_photo_url: profilePhotoUrl || null,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        reviewed_by: null,
        rejection_reason: null
      };

      const { error } = await supabase
        .from('seller_applications')
        .upsert(appPayload, { onConflict: 'user_id' });

      if (error) throw error;

      // Update profiles status to pending & role to seller_pending (in case user was a student)
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ role: 'seller_pending', status: 'pending' })
        .eq('id', user?.id);

      if (profileErr) throw profileErr;

      // Trigger Brevo Confirmation Email
      sendSellerApplicationReceivedEmail(user?.email || '', fullName.trim()).catch(console.error);

      addToast('success', 'Application Submitted', 'Your seller application is now under review.');
      fetchApplication();
    } catch (err: any) {
      addToast('error', 'Submission Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReapply = async () => {
    // Keep application in state but reset its status locally to let user edit fields and submit again
    setApplication(null);
    addToast('info', 'Form Unlocked', 'You can now update your details and re-submit.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-sm font-semibold text-emerald-600">Retrieving application status...</span>
        </div>
      </div>
    );
  }

  // 1. Application Pending Approval State
  if (application && application.status === 'pending') {
    const steps = [
      { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, label: 'Application Submitted', done: true },
      { icon: <Clock className="w-5 h-5 text-amber-500 animate-pulse" />, label: 'Under Review (24–48 hrs)', done: false },
      { icon: <Mail className="w-5 h-5 text-gray-400" />, label: 'Approval Email Sent', done: false },
      { icon: <Store className="w-5 h-5 text-gray-400" />, label: 'Seller Dashboard Unlocked', done: false },
    ];

    return (
      <div className="min-h-[90vh] flex items-center justify-center px-4 py-16 relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-emerald-100/60 blur-[80px] -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl p-8 shadow-2xl shadow-emerald-100/40 text-center">
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg shadow-amber-200 mb-6 mx-auto"
            >
              <Clock className="w-10 h-10 text-white" />
            </motion.div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 mb-5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-amber-700 text-xs font-semibold">Under Review</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-800 mb-3">Application Pending Approval</h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Hello <strong>{application.full_name}</strong>, your seller request has been registered and is currently under review by StethoNotes administrators.
            </p>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              UPI payout ID <code className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-700 font-bold">{application.upi_id}</code> will be used for earnings disbursement upon activation.
            </p>

            {/* Progress steps */}
            <div className="text-left bg-gradient-to-b from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100 mb-6">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-4">Application Progress</p>
              <div className="flex flex-col gap-3.5">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      {step.icon}
                    </div>
                    <span className={`text-sm ${step.done ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                    {step.done && (
                      <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Done</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-6 text-left">
              <Bell className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Verification checks take up to 48 hours. We will email you at <strong>{user?.email}</strong> as soon as your panel is activated.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link to="/" className="btn-secondary py-3 text-sm font-semibold text-center rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">
                Browse Notes as Student
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. Application Rejected State
  if (application && application.status === 'rejected') {
    return (
      <div className="min-h-[90vh] flex items-center justify-center px-4 py-16 relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-teal-50">
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-red-100/40 blur-[80px] -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="bg-white border border-red-100 rounded-3xl p-8 shadow-2xl shadow-red-100/20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 text-red-500 mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 mb-5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-red-700 text-xs font-semibold">Application Rejected</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-800 mb-2">Application Denied</h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              We reviewed your seller registration request, but unfortunately, we are unable to approve your application at this time.
            </p>

            {application.rejection_reason && (
              <div className="text-left bg-red-50 border border-red-100 rounded-2xl p-5 mb-6">
                <p className="text-xs font-semibold text-red-800 uppercase tracking-wider mb-2">Administrator Reason:</p>
                <p className="text-sm text-red-700 leading-relaxed font-sans font-medium italic">
                  "{application.rejection_reason}"
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleReapply}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Update Details & Re-Apply</span>
              </button>
              <Link to="/" className="btn-secondary py-3 text-sm font-semibold text-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
                Back to Notes Feed
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. Application Submission Form State (No application submitted yet)
  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-100/30 blur-[100px] -z-10" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-teal-100/30 blur-[100px] -z-10" />

      <div className="w-full max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-emerald-100/20"
        >
          {/* Header */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100 mb-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Become a StethoNotes Seller</h1>
              <p className="text-sm text-slate-500">Complete your profile application details to begin selling notes.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step info banner */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex gap-3 text-left">
              <Bell className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 leading-relaxed">
                Provide accurate collegiate and banking/UPI credentials. Our support team verifies details manually before granting publisher privileges.
              </p>
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none text-sm transition-all"
                  />
                </div>
              </div>

              {/* Email Address (Read Only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address (Read-only)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    readOnly
                    value={user?.email || ''}
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl cursor-not-allowed text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none text-sm transition-all"
                  />
                </div>
              </div>

              {/* UPI ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">UPI Payout ID *</label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="username@bank"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none text-sm transition-all"
                  />
                </div>
              </div>

              {/* College */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Medical College / Institution *</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={college}
                    onChange={e => setCollege(e.target.value)}
                    placeholder="e.g. Grant Government Medical College, Mumbai"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none text-sm transition-all"
                  />
                </div>
              </div>

              {/* Course */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Academic Course *</label>
                <div className="relative">
                  <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={course}
                    onChange={e => setCourse(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none text-sm transition-all appearance-none"
                  >
                    <option value="MBBS">MBBS (Medicine & Surgery)</option>
                    <option value="BDS">BDS (Dental)</option>
                    <option value="BAMS">BAMS (Ayurveda)</option>
                    <option value="BHMS">BHMS (Homeopathy)</option>
                    <option value="BSc Nursing">BSc Nursing</option>
                    <option value="Paramedical">Paramedical</option>
                    <option value="Other">Other / Allied Sciences</option>
                  </select>
                </div>
              </div>

              {/* Year */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Current Year *</label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none text-sm transition-all appearance-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Intern">Internship</option>
                    <option value="Graduate">Postgraduate / Graduate</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">About Yourself / Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                placeholder="Describe your credentials, notes subjects covered, or achievements..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none text-sm transition-all resize-none"
              />
            </div>

            {/* Document Attachments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              {/* Profile Photo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Profile Store Photo</label>
                <div className="flex gap-3 items-center">
                  {profilePhotoUrl ? (
                    <img src={profilePhotoUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleSimulatePhotoUpload}
                    disabled={photoUploading}
                    className="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {photoUploading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{photoUploading ? 'Uploading...' : profilePhotoUrl ? 'Change Photo' : 'Upload photo'}</span>
                  </button>
                </div>
              </div>

              {/* College ID / Government Verification ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">College ID / Gov ID PDF</label>
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-slate-100 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateIdUpload}
                    disabled={idUploading}
                    className="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {idUploading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{idUploading ? 'Uploading...' : governmentIdUrl ? 'Document Loaded' : 'Upload ID PDF'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t border-slate-100 justify-end">
              <button
                type="button"
                onClick={handleSignOut}
                className="py-3 px-6 hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl transition-all"
              >
                Sign Out
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="py-3 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-200 disabled:opacity-50"
              >
                {submitting ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
