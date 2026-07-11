import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { supabase, isLiveSupabase, triggerBrevoEmailSimulation } from '../lib/supabase';
import { sendSellerApprovalEmail, sendSellerRejectionEmail } from '../lib/brevo';
import type { Note, Course, Order, SellerRequest } from '../types';
import { ShieldCheck, Plus, Trash2, Edit2, TrendingUp, DollarSign, BookOpen, ShoppingBag, FolderOpen, Save, X, RefreshCw, Mail, Upload, FileUp, AlertTriangle, CheckCircle2, Users, Clock, XCircle } from 'lucide-react';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'analytics' | 'notes' | 'courses' | 'orders' | 'seller_requests'>('analytics');
  const [sellerRequests, setSellerRequests] = useState<SellerRequest[]>([]);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItemsList, setOrderItemsList] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form Fields for Add/Edit Note
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDesc, setNoteDesc] = useState('');
  const [noteCourseId, setNoteCourseId] = useState('');
  const [noteSubject, setNoteSubject] = useState('');
  const [notePrice, setNotePrice] = useState('');
  const [noteStatus, setNoteStatus] = useState<'active' | 'draft'>('active');

  // File Upload Form states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewFiles, setPreviewFiles] = useState<FileList | null>(null);

  // Upload Progress Tracking states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    pdf: 0,
    thumbnail: 0,
    previews: 0
  });
  const [uploadStatus, setUploadStatus] = useState({
    pdf: 'waiting',
    thumbnail: 'waiting',
    previews: 'waiting'
  });

  // Track existing preview URLs (for edit mode)
  const [existingPreviews, setExistingPreviews] = useState<string[]>([]);
  const [newPreviewUrl, setNewPreviewUrl] = useState('');

  // Course management form
  const [newCourseName, setNewCourseName] = useState('');

  // Email resending spinner tracking
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);

  // New features: semester and drag-and-drop file upload states
  const [noteSemester, setNoteSemester] = useState('1st Semester');
  const [dragActivePdf, setDragActivePdf] = useState(false);
  const [dragActiveThumb, setDragActiveThumb] = useState(false);
  const [dragActivePreviews, setDragActivePreviews] = useState(false);

  useEffect(() => {
    // Role-based protection: Only admin and super_admin allowed
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      addToast('error', 'Access Denied', 'You do not have permissions to view this administrator panel.');
      navigate('/');
      return;
    }

    fetchAdminData();
  }, [user, navigate]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch courses
      const { data: coursesData } = await supabase.from('courses').select('*');
      if (coursesData) {
        setCourses(coursesData);
        if (coursesData.length > 0) setNoteCourseId(coursesData[0].id);
      }

      // 2. Fetch notes
      const { data: notesData } = await supabase.from('notes').select('*');
      if (notesData) setNotes(notesData);

      // 3. Fetch all orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (ordersData) setOrders(ordersData);

      // 4. Fetch order items
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*');
      if (itemsData) setOrderItemsList(itemsData);

      // 5. Fetch seller requests
      const { data: sellerReqData } = await supabase
        .from('seller_requests')
        .select('*')
        .order('applied_at', { ascending: false });
      if (sellerReqData) setSellerRequests(sellerReqData as SellerRequest[]);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // SELLER APPROVAL
  // ----------------------------------------------------------
  const handleApproveseller = async (req: SellerRequest) => {
    setProcessingRequestId(req.id);
    try {
      // Update profile role to seller + status approved
      await supabase
        .from('profiles')
        .update({ role: 'seller', status: 'approved' })
        .eq('id', req.user_id);

      // Update seller_request record
      await supabase
        .from('seller_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
        .eq('id', req.id);

      // Send approval email
      await sendSellerApprovalEmail(req.email, req.full_name || req.email);

      addToast('success', 'Seller Approved', `${req.full_name || req.email} has been approved as a seller.`);
      fetchAdminData();
    } catch (err: any) {
      addToast('error', 'Approval Failed', err.message);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectSeller = async (req: SellerRequest) => {
    if (!confirm(`Reject seller application from ${req.full_name || req.email}?`)) return;
    setProcessingRequestId(req.id);
    try {
      await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', req.user_id);

      await supabase
        .from('seller_requests')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
        .eq('id', req.id);

      await sendSellerRejectionEmail(req.email, req.full_name || req.email);

      addToast('info', 'Seller Rejected', `Application from ${req.full_name || req.email} has been rejected.`);
      fetchAdminData();
    } catch (err: any) {
      addToast('error', 'Rejection Failed', err.message);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;

    try {
      const { error } = await supabase
        .from('courses')
        .insert({ name: newCourseName });

      if (error) throw error;

      addToast('success', 'Course Added', `Successfully registered academic course "${newCourseName}".`);
      setNewCourseName('');
      fetchAdminData();
    } catch (err: any) {
      addToast('error', 'Failed to Add Course', err.message);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course? This may break existing notes linked to it.')) return;
    try {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
      addToast('success', 'Course Deleted', 'Course successfully removed from database.');
      fetchAdminData();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  const handleDrag = (e: React.DragEvent, setDragActive: (active: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDropPdf = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActivePdf(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPdfFile(e.dataTransfer.files[0]);
    }
  };

  const handleDropThumb = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveThumb(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setThumbnailFile(e.dataTransfer.files[0]);
    }
  };

  const handleDropPreviews = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActivePreviews(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setPreviewFiles(e.dataTransfer.files);
    }
  };

  const openAddNoteModal = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteDesc('');
    setNoteSubject('');
    setNoteSemester('1st Semester');
    setNotePrice('');
    setNoteStatus('active');
    setPdfFile(null);
    setThumbnailFile(null);
    setPreviewFiles(null);
    setExistingPreviews([]);
    if (courses.length > 0) setNoteCourseId(courses[0].id);
    
    // Reset progress tracking
    setIsUploading(false);
    setUploadProgress({ pdf: 0, thumbnail: 0, previews: 0 });
    setUploadStatus({ pdf: 'waiting', thumbnail: 'waiting', previews: 'waiting' });
    
    setShowAddModal(true);
  };

  const openEditNoteModal = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteDesc(note.description);
    setNoteCourseId(note.course_id);
    setNoteSubject(note.subject);
    setNoteSemester(note.semester || '1st Semester');
    setNotePrice(note.price.toString());
    setNoteStatus(note.status || 'active');
    setPdfFile(null);
    setThumbnailFile(null);
    setPreviewFiles(null);
    setExistingPreviews(note.preview_images || []);
    
    // Reset progress tracking
    setIsUploading(false);
    setUploadProgress({ pdf: 0, thumbnail: 0, previews: 0 });
    setUploadStatus({ pdf: 'waiting', thumbnail: 'waiting', previews: 'waiting' });
    
    setShowAddModal(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!noteTitle.trim() || !noteSubject.trim() || !notePrice.trim()) {
      addToast('error', 'Validation Error', 'Please fill in Title, Subject, and Price.');
      return;
    }

    if (!editingNote) {
      if (!pdfFile) {
        addToast('error', 'Validation Error', 'PDF study notes file is required.');
        return;
      }
      if (!thumbnailFile) {
        addToast('error', 'Validation Error', 'Thumbnail cover image is required.');
        return;
      }
    }

    if (pdfFile) {
      if (pdfFile.size > 50 * 1024 * 1024) {
        addToast('error', 'Validation Error', 'PDF file size exceeds the 50MB limit.');
        return;
      }
      if (!pdfFile.name.toLowerCase().endsWith('.pdf')) {
        addToast('error', 'Validation Error', 'Invalid file format. Only PDF (.pdf) files are allowed.');
        return;
      }
    }

    if (previewFiles && previewFiles.length > 0) {
      if (previewFiles.length < 2 || previewFiles.length > 5) {
        addToast('error', 'Validation Error', 'Preview images count must be between 2 and 5 sample files.');
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress({ pdf: 0, thumbnail: 0, previews: 0 });
    setUploadStatus({ pdf: 'waiting', thumbnail: 'waiting', previews: 'waiting' });

    let finalPdfUrl = editingNote ? editingNote.pdf_url : '';
    let finalThumbUrl = editingNote ? editingNote.thumbnail_url : '';
    let finalPreviews: string[] = [...existingPreviews];

    try {
      // 1. Upload Private PDF File
      if (pdfFile) {
        setUploadStatus(prev => ({ ...prev, pdf: 'uploading' }));
        const ext = 'pdf';
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
        const filePath = `pdfs/${fileName}`;

        const { error } = await supabase.storage
          .from('notes-pdfs')
          .upload(filePath, pdfFile, {
            upsert: true,
            onUploadProgress: (progress: any) => {
              const pct = Math.round((progress.loaded / progress.total) * 100);
              setUploadProgress(prev => ({ ...prev, pdf: pct }));
            }
          });

        if (error) throw new Error(`PDF upload failed: ${error.message}`);
        finalPdfUrl = filePath;
        setUploadProgress(prev => ({ ...prev, pdf: 100 }));
        setUploadStatus(prev => ({ ...prev, pdf: 'completed' }));
      } else {
        setUploadProgress(prev => ({ ...prev, pdf: 100 }));
        setUploadStatus(prev => ({ ...prev, pdf: 'skipped' }));
      }

      // 2. Upload Thumbnail cover Image
      if (thumbnailFile) {
        setUploadStatus(prev => ({ ...prev, thumbnail: 'uploading' }));
        const ext = thumbnailFile.name.split('.').pop() || 'png';
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
        const filePath = `thumbnails/${fileName}`;

        const { error } = await supabase.storage
          .from('thumbnails')
          .upload(filePath, thumbnailFile, {
            upsert: true,
            onUploadProgress: (progress: any) => {
              const pct = Math.round((progress.loaded / progress.total) * 100);
              setUploadProgress(prev => ({ ...prev, thumbnail: pct }));
            }
          });

        if (error) throw new Error(`Thumbnail upload failed: ${error.message}`);
        
        if (isLiveSupabase) {
          const { data: pubData } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(filePath);
          finalThumbUrl = pubData?.publicUrl || '';
        } else {
          finalThumbUrl = `https://stethonotes-storage.mock/thumbnails/${filePath}`;
        }
        setUploadProgress(prev => ({ ...prev, thumbnail: 100 }));
        setUploadStatus(prev => ({ ...prev, thumbnail: 'completed' }));
      } else {
        setUploadProgress(prev => ({ ...prev, thumbnail: 100 }));
        setUploadStatus(prev => ({ ...prev, thumbnail: 'skipped' }));
      }

      // 3. Upload Multi-Image Previews
      if (previewFiles && previewFiles.length > 0) {
        setUploadStatus(prev => ({ ...prev, previews: 'uploading' }));
        const totalFiles = previewFiles.length;
        const uploadedUrls: string[] = [];

        for (let i = 0; i < totalFiles; i++) {
          const file = previewFiles[i];
          const ext = file.name.split('.').pop() || 'png';
          const fileName = `${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
          const filePath = `previews/${fileName}`;

          const { error } = await supabase.storage
            .from('previews')
            .upload(filePath, file, {
              upsert: true,
              onUploadProgress: (progress: any) => {
                const filePct = (progress.loaded / progress.total) * 100;
                const overallPct = Math.round(((i / totalFiles) * 100) + (filePct / totalFiles));
                setUploadProgress(prev => ({ ...prev, previews: overallPct }));
              }
            });

          if (error) throw new Error(`Preview image ${i+1} upload failed: ${error.message}`);

          let previewUrl = '';
          if (isLiveSupabase) {
            const { data: pubData } = supabase.storage
              .from('previews')
              .getPublicUrl(filePath);
            previewUrl = pubData?.publicUrl || '';
          } else {
            previewUrl = `https://stethonotes-storage.mock/previews/${filePath}`;
          }
          uploadedUrls.push(previewUrl);
        }

        // If editing, overwrite previews or append. Here we overwrite if a new selection was made.
        finalPreviews = uploadedUrls;
        setUploadProgress(prev => ({ ...prev, previews: 100 }));
        setUploadStatus(prev => ({ ...prev, previews: 'completed' }));
      } else {
        setUploadProgress(prev => ({ ...prev, previews: 100 }));
        setUploadStatus(prev => ({ ...prev, previews: 'skipped' }));
      }

      // Payload database submission
      const payload = {
        title: noteTitle,
        description: noteDesc,
        course_id: noteCourseId,
        subject: noteSubject,
        semester: noteSemester,
        price: parseFloat(notePrice),
        pdf_url: finalPdfUrl,
        thumbnail_url: finalThumbUrl,
        preview_images: finalPreviews,
        status: noteStatus
      };

      if (editingNote) {
        const { error } = await supabase
          .from('notes')
          .update(payload)
          .eq('id', editingNote.id);

        if (error) throw error;
        addToast('success', 'Note Updated', `Successfully updated "${noteTitle}".`);
      } else {
        const { error } = await supabase
          .from('notes')
          .insert(payload);

        if (error) throw error;
        addToast('success', 'Note Created', `Successfully added "${noteTitle}" to inventory.`);
      }

      setShowAddModal(false);
      setActiveTab('notes'); // Switch to inventory list
      fetchAdminData();
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Upload/Save Failed', err.message || 'Could not complete save action.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this study note guide?')) return;

    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      addToast('success', 'Note Deleted', 'Note guide permanently removed.');
      fetchAdminData();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  const handleToggleStatus = async (note: Note) => {
    const newStatus = note.status === 'active' ? 'draft' : 'active';
    try {
      const { error } = await supabase
        .from('notes')
        .update({ status: newStatus })
        .eq('id', note.id);

      if (error) throw error;
      
      addToast('success', 'Status Updated', `"${note.title}" set to ${newStatus}.`);
      fetchAdminData();
    } catch (err: any) {
      addToast('error', 'Toggle Failed', err.message);
    }
  };

  const handleResendEmail = async (orderId: string) => {
    setResendingEmailId(orderId);
    try {
      if (isLiveSupabase) {
        const { data, error } = await supabase.functions.invoke('send-order-email', {
          body: { orderId }
        });
        if (error) throw error;
        if (data?.success) {
          addToast('success', 'Email Dispatched', 'Transactional email resent successfully via Brevo.');
          fetchAdminData(); // Refresh UI
        } else {
          throw new Error(data?.message || 'Email delivery failed');
        }
      } else {
        const success = await triggerBrevoEmailSimulation(orderId);
        if (success) {
          addToast('success', 'Email Sent (Demo Mode)', 'Simulated Brevo email sent successfully.');
          fetchAdminData(); // Refresh email_status
        } else {
          throw new Error('Simulated delivery failure. Try again.');
        }
      }
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Redelivery Failed', err.message || 'Could not send email.');
    } finally {
      setResendingEmailId(null);
    }
  };

  const handleAddPreviewUrl = () => {
    if (!newPreviewUrl.trim()) return;
    setExistingPreviews([...existingPreviews, newPreviewUrl]);
    setNewPreviewUrl('');
  };

  const handleRemovePreviewUrl = (idx: number) => {
    setExistingPreviews(existingPreviews.filter((_, i) => i !== idx));
  };

  // Analytics Calculations
  const completedOrders = orders.filter(o => o.payment_status === 'completed');
  const totalSales = completedOrders.reduce((acc, o) => acc + Number(o.total_amount), 0);
  const averageOrderValue = completedOrders.length > 0 ? (totalSales / completedOrders.length).toFixed(2) : '0';
  
  // Brevo Delivery Success Rate
  const sentEmails = completedOrders.filter(o => o.email_status === 'sent');
  const emailSuccessRate = completedOrders.length > 0
    ? ((sentEmails.length / completedOrders.length) * 100).toFixed(0)
    : '100';

  // Sort notes chronologically (newest first)
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
        <p className="text-gray-400 text-sm font-display">Loading administrator platform...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Page Title */}
      <div className="mb-10 flex items-center justify-between border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-primary tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-accent" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Secure store inventory, study category classifications, order transactions, and marketplace analytics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Dark Navy Sidebar */}
        <aside className="w-full lg:col-span-3 bg-primary-dark text-white rounded-3xl p-6 shadow-xl flex flex-col gap-6">
          <div>
            <h3 className="font-display font-bold text-sm tracking-wide border-b border-white/10 pb-3">
              Management Menu
            </h3>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-display font-semibold text-left transition-all ${
                activeTab === 'analytics'
                  ? 'bg-accent text-white shadow-cyan-soft'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Sales & Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-display font-semibold text-left transition-all ${
                activeTab === 'notes'
                  ? 'bg-accent text-white shadow-cyan-soft'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Notes Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-display font-semibold text-left transition-all ${
                activeTab === 'courses'
                  ? 'bg-accent text-white shadow-cyan-soft'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Manage Courses</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-display font-semibold text-left transition-all ${
                activeTab === 'orders'
                  ? 'bg-accent text-white shadow-cyan-soft'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Purchases Log</span>
            </button>

            <button
              onClick={() => setActiveTab('seller_requests')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-display font-semibold text-left transition-all ${
                activeTab === 'seller_requests'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Seller Requests</span>
              {sellerRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-auto bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {sellerRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        </aside>

        <main className="lg:col-span-9 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-cyan-soft">

          {/* SELLER REQUESTS TAB */}
          {activeTab === 'seller_requests' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-bold text-primary">Seller Requests</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Review and approve/reject seller applications.</p>
                </div>
                <button onClick={fetchAdminData} className="p-2 text-gray-400 hover:text-accent hover:bg-accent/5 rounded-xl transition-all">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {sellerRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-emerald-300" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">No seller requests yet.</p>
                  <p className="text-gray-300 text-xs mt-1">Applications will appear here when sellers apply via the Seller Portal.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Applicant</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Applied Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sellerRequests.map(req => (
                        <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">{req.full_name || '—'}</p>
                            <p className="text-xs text-slate-400">{req.email}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {new Date(req.applied_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                              req.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : req.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {req.status === 'pending' && <Clock className="w-3 h-3 inline mr-1" />}
                              {req.status === 'approved' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                              {req.status === 'rejected' && <XCircle className="w-3 h-3 inline mr-1" />}
                              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {req.status === 'pending' && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleApproveseller(req)}
                                  disabled={processingRequestId === req.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 shadow-sm"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {processingRequestId === req.id ? 'Processing…' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleRejectSeller(req)}
                                  disabled={processingRequestId === req.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-all border border-red-200 disabled:opacity-50"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </div>
                            )}
                            {req.status !== 'pending' && (
                              <span className="text-xs text-gray-400 italic text-right block">
                                Reviewed {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString('en-IN') : ''}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 1: Analytics */}
          {activeTab === 'analytics' && (
            <div className="flex flex-col gap-8 animate-fade-in">
              <h2 className="text-xl font-display font-bold text-primary">Marketplace Metrics</h2>
              
              {/* Analytics grid cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Gross revenue card */}
                <div className="border border-gray-150 p-4 rounded-2xl bg-gray-50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 font-display font-bold uppercase tracking-wider block">Total Revenue</span>
                    <span className="font-display font-extrabold text-xl text-primary mt-1 block">₹{totalSales.toFixed(2)}</span>
                  </div>
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                {/* Sales volume card */}
                <div className="border border-gray-150 p-4 rounded-2xl bg-gray-50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 font-display font-bold uppercase tracking-wider block">Sales Volume</span>
                    <span className="font-display font-extrabold text-xl text-primary mt-1 block">{completedOrders.length} orders</span>
                  </div>
                  <div className="p-2 bg-cyan-100 text-accent rounded-xl">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>

                {/* Average order card */}
                <div className="border border-gray-150 p-4 rounded-2xl bg-gray-50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 font-display font-bold uppercase tracking-wider block">Avg Order Val</span>
                    <span className="font-display font-extrabold text-xl text-primary mt-1 block">₹{averageOrderValue}</span>
                  </div>
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                {/* Brevo success rate card */}
                <div className="border border-gray-150 p-4 rounded-2xl bg-gray-50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 font-display font-bold uppercase tracking-wider block">Brevo Success</span>
                    <span className="font-display font-extrabold text-xl text-primary mt-1 block">{emailSuccessRate}%</span>
                  </div>
                  <div className="p-2 bg-yellow-100 text-yellow-650 rounded-xl">
                    <Mail className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Premium custom SVG sales visualization chart */}
              <div className="border border-gray-100 p-6 rounded-2xl shadow-cyan-soft bg-white">
                <h3 className="font-display font-bold text-sm text-primary mb-6">Recent Sales Trend (Simulated Chart)</h3>
                
                {/* SVG Line Chart */}
                <div className="w-full h-56 flex items-end">
                  <svg className="w-full h-full text-accent" viewBox="0 0 500 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1FB6D4" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#1FB6D4" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Fill Area */}
                    <path
                      d="M 0,90 Q 75,70 150,40 T 300,60 T 450,20 L 500,20 L 500,100 L 0,100 Z"
                      fill="url(#chartGradient)"
                      stroke="none"
                    />
                    {/* Stroke line */}
                    <path
                      d="M 0,90 Q 75,70 150,40 T 300,60 T 450,20 L 500,20"
                      fill="none"
                      stroke="#1FB6D4"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    
                    {/* Nodes */}
                    <circle cx="150" cy="40" r="5" fill="#0F2D6B" stroke="#1FB6D4" strokeWidth="2" />
                    <circle cx="300" cy="60" r="5" fill="#0F2D6B" stroke="#1FB6D4" strokeWidth="2" />
                    <circle cx="450" cy="20" r="5" fill="#0F2D6B" stroke="#1FB6D4" strokeWidth="2" />
                  </svg>
                </div>
                {/* Timeline labels */}
                <div className="flex justify-between text-[10px] text-gray-400 font-sans mt-3 px-2">
                  <span>Week 1</span>
                  <span>Week 2</span>
                  <span>Week 3</span>
                  <span>Week 4 (Current)</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Notes List */}
          {activeTab === 'notes' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-primary">Notes Inventory ({sortedNotes.length})</h2>
                <button
                  onClick={openAddNoteModal}
                  className="btn-primary py-2 px-4 text-xs font-bold shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Note</span>
                </button>
              </div>

              {/* Table listing */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-display font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Thumb</th>
                      <th className="py-3 px-4">Title / Course</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedNotes.map((note) => {
                      const matchedCourse = courses.find(c => c.id === note.course_id);
                      return (
                        <tr key={note.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <img src={note.thumbnail_url} className="w-10 h-8 rounded object-cover border" alt="" />
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-primary block leading-relaxed">{note.title}</span>
                            <span className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded-full mt-1 inline-block capitalize font-bold">
                              {matchedCourse?.name || 'Medical'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 font-medium">{note.subject}</td>
                          <td className="py-3 px-4 font-bold text-primary">₹{note.price}</td>
                          {/* Active / Draft Slide toggle */}
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={note.status === 'active'}
                                  onChange={() => handleToggleStatus(note)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                              </label>
                              <span className={`text-[10px] font-display font-bold uppercase ${note.status === 'active' ? 'text-accent' : 'text-gray-400'}`}>
                                {note.status || 'active'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => openEditNoteModal(note)}
                              className="p-1.5 border hover:border-cyan-500 hover:text-accent rounded-lg text-gray-400"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1.5 border hover:border-red-500 hover:text-red-500 rounded-lg text-gray-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Manage Courses */}
          {activeTab === 'courses' && (
            <div className="animate-fade-in grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Add Course form */}
              <div className="md:col-span-5 bg-gray-50 border border-gray-150 p-6 rounded-2xl h-fit">
                <h3 className="font-display font-bold text-base text-primary mb-4">Add Course Category</h3>
                <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-display font-semibold text-gray-400">Course Name</label>
                    <input
                      type="text"
                      placeholder="e.g. BSc Nursing"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      required
                      className="border border-gray-250 focus:border-accent focus:ring-1 focus:ring-accent outline-none px-3 py-2.5 rounded-xl text-xs bg-white text-primary"
                    />
                  </div>
                  <button type="submit" className="btn-primary py-2.5 text-xs font-bold w-full">
                    Register Course
                  </button>
                </form>
              </div>

              {/* Course categories list */}
              <div className="md:col-span-7">
                <h2 className="text-xl font-display font-bold text-primary mb-6">Registered Course Classes ({courses.length})</h2>
                
                <div className="flex flex-col gap-3">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="border border-gray-100 p-4 rounded-xl flex items-center justify-between text-xs"
                    >
                      <span className="font-display font-bold text-primary text-sm">{course.name}</span>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-1.5 border border-gray-100 hover:border-red-500 hover:text-red-500 rounded-lg text-gray-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Orders History Log */}
          {activeTab === 'orders' && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-display font-bold text-primary mb-6">Purchases Transaction Logs ({orders.length})</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-display font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Customer Email</th>
                      <th className="py-3 px-4">Notes Purchased</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Email Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => {
                      // Get items for this order
                      const matchedItems = orderItemsList.filter(item => item.order_id === ord.id);
                      const purchasedTitles = matchedItems
                        .map(item => {
                          const noteObj = notes.find(n => n.id === item.note_id);
                          return noteObj ? noteObj.title : 'Study Note';
                        })
                        .join(', ');

                      return (
                        <tr key={ord.id} className="border-b border-gray-50 py-2 hover:bg-gray-50/50">
                          <td className="py-3 px-4">
                            <span className="font-display font-semibold text-primary block">{ord.customer_name}</span>
                            <span className="text-[10px] text-gray-400 font-sans block mt-0.5">{ord.customer_email}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 max-w-xs truncate font-sans" title={purchasedTitles}>
                            {purchasedTitles || 'No items listed'}
                          </td>
                          <td className="py-3 px-4 font-bold text-primary">₹{ord.total_amount}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block font-display font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                ord.email_status === 'sent'
                                  ? 'bg-cyan-50 text-accent'
                                  : ord.email_status === 'pending'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-red-50 text-red-600'
                              }`}
                            >
                              {ord.email_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleResendEmail(ord.id)}
                              disabled={resendingEmailId === ord.id}
                              className="btn-secondary py-1 px-3 text-[10px] font-bold flex items-center justify-center gap-1.5 ml-auto disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3 h-3 ${resendingEmailId === ord.id ? 'animate-spin' : ''}`} />
                              <span>Resend</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Note Dialog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { if (!isUploading) setShowAddModal(false); }} />
          
          <div className="relative bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto z-10 animate-fade-in flex flex-col justify-between gap-6">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <h3 className="font-display font-extrabold text-xl text-primary">
                {editingNote ? 'Edit Study Guide Details' : 'Add New Note to Catalog'}
              </h3>
              {!isUploading && (
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-50 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>

            {isUploading ? (
              /* Submitting & Progress Bars Layout */
              <div className="flex flex-col gap-6 py-8 px-4 text-center items-center justify-center font-display">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-accent animate-spin" />
                  <Upload className="w-6 h-6 text-accent animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-primary">Uploading Note Materials...</h4>
                  <p className="text-gray-400 text-xs mt-1 max-w-xs leading-relaxed mx-auto">
                    Please keep this window open while files are being uploaded to secure Supabase Storage.
                  </p>
                </div>
                
                <div className="w-full max-w-md flex flex-col gap-4 mt-2 text-xs text-left">
                  {/* PDF Upload Progress */}
                  {(pdfFile || !editingNote) && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between font-semibold text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <FileUp className="w-3.5 h-3.5 text-accent" />
                          <span>PDF Study Notes Document ({uploadStatus.pdf})</span>
                        </span>
                        <span>{uploadProgress.pdf}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-accent h-full transition-all duration-350" style={{ width: `${uploadProgress.pdf}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Thumbnail Progress */}
                  {(thumbnailFile || !editingNote) && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between font-semibold text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                          <span>Thumbnail cover image ({uploadStatus.thumbnail})</span>
                        </span>
                        <span>{uploadProgress.thumbnail}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-accent h-full transition-all duration-350" style={{ width: `${uploadProgress.thumbnail}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Previews Progress */}
                  {previewFiles && previewFiles.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between font-semibold text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                          <span>Preview Sample Images ({uploadStatus.previews})</span>
                        </span>
                        <span>{uploadProgress.previews}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-accent h-full transition-all duration-350" style={{ width: `${uploadProgress.previews}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Main Form Layout */
              <form onSubmit={handleSaveNote} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Note Title */}
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="font-display font-semibold text-gray-400">Note Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Physiology Cardiovascular System Study Guide"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    required
                    className="border border-gray-200 outline-none focus:border-accent p-2.5 rounded-xl bg-white text-primary"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="font-display font-semibold text-gray-400">Description</label>
                  <textarea
                    placeholder="Provide syllabus topics covered, comparison diagrams, homogeneity rules..."
                    rows={3}
                    value={noteDesc}
                    onChange={(e) => setNoteDesc(e.target.value)}
                    required
                    className="border border-gray-200 outline-none focus:border-accent p-2.5 rounded-xl bg-white text-primary resize-none"
                  />
                </div>

                {/* Academic Course */}
                <div className="flex flex-col gap-1">
                  <label className="font-display font-semibold text-gray-400">Academic Course</label>
                  <select
                    value={noteCourseId}
                    onChange={(e) => setNoteCourseId(e.target.value)}
                    className="border border-gray-200 outline-none focus:border-accent p-2.5 rounded-xl bg-white text-primary"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-1">
                  <label className="font-display font-semibold text-gray-400">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Pathology"
                    value={noteSubject}
                    onChange={(e) => setNoteSubject(e.target.value)}
                    required
                    className="border border-gray-200 outline-none focus:border-accent p-2.5 rounded-xl bg-white text-primary"
                  />
                </div>

                {/* Academic Semester */}
                <div className="flex flex-col gap-1">
                  <label className="font-display font-semibold text-gray-400">Semester / Year</label>
                  <select
                    value={noteSemester}
                    onChange={(e) => setNoteSemester(e.target.value)}
                    className="border border-gray-200 outline-none focus:border-accent p-2.5 rounded-xl bg-white text-primary"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="3rd Semester">3rd Semester</option>
                    <option value="4th Semester">4th Semester</option>
                    <option value="5th Semester">5th Semester</option>
                    <option value="6th Semester">6th Semester</option>
                    <option value="7th Semester">7th Semester</option>
                    <option value="8th Semester">8th Semester</option>
                    <option value="9th Semester">9th Semester</option>
                    <option value="10th Semester">10th Semester</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Final Year">Final Year</option>
                  </select>
                </div>

                {/* Price (INR) */}
                <div className="flex flex-col gap-1">
                  <label className="font-display font-semibold text-gray-400">Price (INR)</label>
                  <input
                    type="number"
                    placeholder="199"
                    value={notePrice}
                    onChange={(e) => setNotePrice(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="border border-gray-200 outline-none focus:border-accent p-2.5 rounded-xl bg-white text-primary"
                  />
                </div>

                {/* Note catalog Status Toggle */}
                <div className="flex flex-col gap-1">
                  <label className="font-display font-semibold text-gray-400">Catalog Visibility Status</label>
                  <select
                    value={noteStatus}
                    onChange={(e) => setNoteStatus(e.target.value as any)}
                    className="border border-gray-200 outline-none focus:border-accent p-2.5 rounded-xl bg-white text-primary"
                  >
                    <option value="active">Active (Visible to Students)</option>
                    <option value="draft">Draft (Admin Only)</option>
                  </select>
                </div>

                {/* File Upload fields */}
                <div className="border-t border-gray-100 sm:col-span-2 pt-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* PDF Drag & Drop */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display font-semibold text-gray-400">
                      PDF Document Study Guide {!editingNote && <span className="text-red-500">*</span>}
                    </label>
                    <div
                      onDragEnter={(e) => handleDrag(e, setDragActivePdf)}
                      onDragOver={(e) => handleDrag(e, setDragActivePdf)}
                      onDragLeave={(e) => handleDrag(e, setDragActivePdf)}
                      onDrop={handleDropPdf}
                      className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer min-h-[110px] ${
                        dragActivePdf ? 'border-accent bg-accent/5' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        id="pdf-upload-input"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                        required={!editingNote}
                        className="hidden"
                      />
                      <label htmlFor="pdf-upload-input" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                        <Upload className="w-5 h-5 text-gray-400 mb-1" />
                        {pdfFile ? (
                          <span className="text-xs font-semibold text-primary truncate max-w-[200px]">
                            {pdfFile.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500">
                            Drag & Drop PDF here, or <strong className="text-accent">Browse</strong>
                          </span>
                        )}
                      </label>
                    </div>
                    <span className="text-[10px] text-gray-400 leading-normal block">
                      Max file size: <strong>50MB</strong>. PDF format (.pdf) only.
                    </span>
                  </div>

                  {/* Thumbnail Drag & Drop */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display font-semibold text-gray-400">
                      Thumbnail Cover Image {!editingNote && <span className="text-red-500">*</span>}
                    </label>
                    <div
                      onDragEnter={(e) => handleDrag(e, setDragActiveThumb)}
                      onDragOver={(e) => handleDrag(e, setDragActiveThumb)}
                      onDragLeave={(e) => handleDrag(e, setDragActiveThumb)}
                      onDrop={handleDropThumb}
                      className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer min-h-[110px] ${
                        dragActiveThumb ? 'border-accent bg-accent/5' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        id="thumbnail-upload-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        required={!editingNote}
                        className="hidden"
                      />
                      <label htmlFor="thumbnail-upload-input" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                        <Upload className="w-5 h-5 text-gray-400 mb-1" />
                        {thumbnailFile ? (
                          <span className="text-xs font-semibold text-primary truncate max-w-[200px]">
                            {thumbnailFile.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500">
                            Drag & Drop Cover here, or <strong className="text-accent">Browse</strong>
                          </span>
                        )}
                      </label>
                    </div>
                    <span className="text-[10px] text-gray-400 leading-normal block">
                      Cover thumbnail image uploaded to public bucket.
                    </span>
                  </div>

                  {/* Previews Drag & Drop */}
                  <div className="sm:col-span-2 flex flex-col gap-1.5 border-t border-gray-50 pt-3">
                    <label className="font-display font-semibold text-gray-400 flex items-center justify-between">
                      <span>Preview Sample Pages (Multi-Upload)</span>
                      <span className="text-[10px] font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>2-5 preview files recommended</span>
                      </span>
                    </label>
                    <div
                      onDragEnter={(e) => handleDrag(e, setDragActivePreviews)}
                      onDragOver={(e) => handleDrag(e, setDragActivePreviews)}
                      onDragLeave={(e) => handleDrag(e, setDragActivePreviews)}
                      onDrop={handleDropPreviews}
                      className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer min-h-[110px] ${
                        dragActivePreviews ? 'border-accent bg-accent/5' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        id="previews-upload-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setPreviewFiles(e.target.files)}
                        className="hidden"
                      />
                      <label htmlFor="previews-upload-input" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                        <Upload className="w-5 h-5 text-gray-400 mb-1" />
                        {previewFiles && previewFiles.length > 0 ? (
                          <span className="text-xs font-semibold text-primary truncate max-w-[400px]">
                            {previewFiles.length} file(s) selected
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500">
                            Drag & Drop preview pages here, or <strong className="text-accent">Browse</strong>
                          </span>
                        )}
                      </label>
                    </div>
                    <span className="text-[10px] text-gray-400 leading-normal block">
                      Add sample preview pages of the notes with watermarks. If uploaded, these replace any current previews.
                    </span>
                  </div>
                </div>

                {/* Edit previews list */}
                {editingNote && existingPreviews.length > 0 && (
                  <div className="sm:col-span-2 flex flex-col gap-2 border-t border-gray-50 pt-3">
                    <label className="font-display font-semibold text-gray-400">Existing Preview Images</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://example.com/preview1.png"
                        value={newPreviewUrl}
                        onChange={(e) => setNewPreviewUrl(e.target.value)}
                        className="border border-gray-200 outline-none focus:border-accent p-2 rounded-xl bg-white text-primary flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddPreviewUrl}
                        className="btn-secondary py-2 px-4 rounded-xl font-bold font-display"
                      >
                        Add Url
                      </button>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap mt-1.5">
                      {existingPreviews.map((url, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-250">
                          <span className="max-w-[150px] truncate text-[10px] text-gray-500">{url}</span>
                          <button type="button" onClick={() => handleRemovePreviewUrl(idx)} className="text-red-500 font-bold hover:scale-105">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="sm:col-span-2 flex justify-end gap-3 mt-4 border-t border-gray-50 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary py-2 px-6"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary py-2 px-6 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Note</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
