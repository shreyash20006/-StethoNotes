import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Note, Review, Comment } from '../types';
import { useCartStore } from '../store/useCartStore';
import { useToastStore } from '../store/useToastStore';
import { useAuthStore } from '../store/useAuthStore';
import { getDirectDownloadMode } from '../config/features';
import { formatFileSize, getPdfFiles, normalizeStoragePath } from '../lib/pdfFiles';
import { pageMeta, generateProductLD, generateBreadcrumbLD } from '../lib/seo';
import {
  Star, ShoppingCart, ArrowLeft, Send, Heart, MessageSquare,
  CornerDownRight, ShieldCheck, Sparkles, BookOpen,
  GraduationCap, Clock, Brain, FileText, Target, CheckCircle2,
  RefreshCw, Share2, ThumbsUp, Check, Edit2,
  Trash2, EyeOff, Paperclip, Lock, Download, Mail, X
} from 'lucide-react';
import { ProductDetailSkeleton } from '../components/Skeleton';
import SEOHead from '../components/SEOHead';
import ImageGallery from '../components/ui/ImageGallery';
import type { GalleryImage } from '../components/ui/ImageGallery';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addItem, isInCart } = useCartStore();
  const { addToast } = useToastStore();

  const [note, setNote] = useState<Note | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [relatedNotes, setRelatedNotes] = useState<Note[]>([]);
  const [frequentNote, setFrequentNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  const isDirectDownload = getDirectDownloadMode();
  const [downloading, setDownloading] = useState(false);

  // Wishlist and Buyer Status
  const [inWishlist, setInWishlist] = useState(false);
  const [isVerifiedBuyer, setIsVerifiedBuyer] = useState(false);

  // Review Form States
  const [newRating, setNewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewImageFile, setReviewImageFile] = useState<File | null>(null);
  const [reviewImagePreview, setReviewImagePreview] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Review Admin / Edit States
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewComment, setEditingReviewComment] = useState('');

  // Comment Form States
  const [newComment, setNewComment] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [newReply, setNewReply] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Active Preview image index in layout
  const [_, setActivePreviewIndex] = useState(0);

  const [activeInfoTab, setActiveInfoTab] = useState<'about' | 'reviews' | 'discussion'>('about');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    fetchProductDetails();
  }, [id, user]);

  const fetchProductDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Fetch note with course details
      const { data: noteData, error: noteErr } = await supabase
        .from('notes')
        .select('*, course:courses(name)')
        .eq('id', id)
        .single();

      if (noteErr || !noteData) {
        throw new Error('Study note not found');
      }
      setNote(noteData);
      setActivePreviewIndex(0);

      // 2. Log Recently Viewed (Fire-and-forget)
      if (user) {
        Promise.resolve(
          supabase.from('recently_viewed').upsert({
            user_id: user.id,
            note_id: id,
            viewed_at: new Date().toISOString()
          }, { onConflict: 'user_id,note_id' })
        ).catch(console.error);

        // Check wishlist
        const { data: wish } = await supabase
          .from('wishlist')
          .select('id')
          .eq('user_id', user.id)
          .eq('note_id', id)
          .single();
        setInWishlist(!!wish);

        // Check if user is verified buyer
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('id, order:orders(payment_status, customer_email)')
          .eq('note_id', id);

        const bought = (orderItems || []).some((item: any) => 
          item.order?.payment_status === 'completed' && 
          item.order?.customer_email?.toLowerCase() === user.email.toLowerCase()
        );
        setIsVerifiedBuyer(bought);
      }

      // 3. Fetch tags
      const { data: tagsData } = await supabase
        .from('product_tags')
        .select('tag')
        .eq('note_id', id);

      if (tagsData && tagsData.length > 0) {
        setTags(tagsData.map((t: any) => t.tag));
      } else {
        // Fallback default tags
        setTags([noteData.subject, noteData.semester || 'Medical Notes', 'Study Guide', 'High Yield'].filter(Boolean));
      }

      // 4. Fetch related notes
      const { data: relatedData } = await supabase
        .from('notes')
        .select('*')
        .eq('course_id', noteData.course_id)
        .limit(4);

      if (relatedData) {
        const others = relatedData.filter((n: Note) => n.id !== id);
        setRelatedNotes(others.slice(0, 3));
        if (others.length > 0) {
          setFrequentNote(others[0]);
        }
      }

      // 5. Fetch reviews and their helpfulness votes
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, profile:profiles(full_name, avatar_url)')
        .eq('note_id', id);

      if (reviewsData) {
        const reviewIds = reviewsData.map((r: any) => r.id);
        
        let votesData: any[] = [];
        if (reviewIds.length > 0) {
          const { data: votes } = await supabase
            .from('review_votes')
            .select('*')
            .in('review_id', reviewIds);
          votesData = votes || [];
        }

        setReviews(reviewsData.map((r: any) => {
          const helpfulVotes = votesData.filter((v: any) => v.review_id === r.id && v.vote_type === 'helpful');
          const myVote = user ? votesData.find((v: any) => v.review_id === r.id && v.user_id === user.id) : null;
          return {
            ...r,
            user_name: r.profile?.full_name || 'Verified Student',
            user_avatar: r.profile?.avatar_url,
            helpful_count: helpfulVotes.length,
            user_vote: myVote ? myVote.vote_type : null
          };
        }));
      }

      // 6. Fetch Q&A comments with replies & likes
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*, profile:profiles(full_name, role, avatar_url)')
        .eq('note_id', id)
        .order('created_at', { ascending: true });

      const { data: repliesData } = await supabase
        .from('comment_replies')
        .select('*, profile:profiles(full_name, role, avatar_url)')
        .order('created_at', { ascending: true });

      const { data: likesData } = await supabase
        .from('comment_likes')
        .select('*');

      if (commentsData) {
        setComments(commentsData.map((c: any) => {
          const commentLikes = (likesData || []).filter((l: any) => l.comment_id === c.id);
          const likedByMe = user ? (likesData || []).some((l: any) => l.comment_id === c.id && l.user_id === user.id) : false;

          const commentReplies = (repliesData || [])
            .filter((r: any) => r.comment_id === c.id)
            .map((r: any) => {
              const replyLikes = (likesData || []).filter((l: any) => l.reply_id === r.id);
              const replyLikedByMe = user ? (likesData || []).some((l: any) => l.reply_id === r.id && l.user_id === user.id) : false;
              return {
                id: r.id,
                comment_id: r.comment_id,
                user_id: r.user_id,
                user_name: r.profile?.full_name || 'Support Team',
                user_role: r.profile?.role || 'student',
                user_avatar: r.profile?.avatar_url,
                reply: r.reply,
                is_reported: r.is_reported,
                is_official: r.is_official || false,
                created_at: r.created_at,
                likes_count: replyLikes.length,
                liked_by_me: replyLikedByMe
              };
            });

          return {
            id: c.id,
            note_id: c.note_id,
            user_id: c.user_id,
            user_name: c.profile?.full_name || 'Medical Student',
            user_role: c.profile?.role || 'student',
            user_avatar: c.profile?.avatar_url,
            comment: c.comment,
            is_reported: c.is_reported,
            created_at: c.created_at,
            replies: commentReplies,
            likes_count: commentLikes.length,
            liked_by_me: likedByMe
          };
        }));
      }

    } catch (err: any) {
      console.error(err);
      addToast('error', 'Error Loading Product', err.message || 'Could not retrieve product information.');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectDownload = async (filePath?: string, fileName?: string) => {
    if (!note) return;
    setDownloading(true);
    try {
      addToast('info', 'Preparing Download', 'Generating secure download link...');
      const relativePath = normalizeStoragePath(filePath || getPdfFiles(note)[0]?.path || note.pdf_url);

      const { data, error } = await supabase.storage
        .from('notes-pdfs')
        .createSignedUrl(relativePath, 60);

      if (error || !data?.signedUrl) {
        throw new Error(error?.message || 'Signed URL generation failed');
      }

      addToast('success', 'Download Started', 'Your PDF notes are downloading.');
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.target = '_blank';
      link.setAttribute('download', fileName || `${note.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Direct download error:', err);
      addToast('error', 'Download Failed', err.message || 'Could not download note.');
    } finally {
      setDownloading(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      addToast('info', 'Auth Required', 'Please sign in to save items to your wishlist.');
      navigate('/login');
      return;
    }
    try {
      if (inWishlist) {
        await supabase.from('wishlist').delete().eq('user_id', user.id).eq('note_id', id);
        setInWishlist(false);
        addToast('info', 'Removed from Wishlist', 'Item removed from your bookmark list.');
      } else {
        await supabase.from('wishlist').insert({ user_id: user.id, note_id: id });
        setInWishlist(true);
        addToast('success', 'Added to Wishlist', 'Study guide bookmarked successfully.');
      }
    } catch (err: any) {
      addToast('error', 'Wishlist Action Failed', err.message);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('info', 'Auth Required', 'Please sign in to leave a review.');
      navigate('/login');
      return;
    }

    if (!newReviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      let uploadedImageUrl = null;
      if (reviewImageFile) {
        const fileExt = reviewImageFile.name.split('.').pop();
        const fileName = `reviews/${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('previews')
          .upload(fileName, reviewImageFile);
        if (uploadErr) throw uploadErr;

        const { data } = supabase.storage.from('previews').getPublicUrl(fileName);
        uploadedImageUrl = data.publicUrl;
      }

      const reviewPayload = {
        note_id: id,
        user_id: user.id,
        rating: newRating,
        comment: newReviewComment,
        image_url: uploadedImageUrl,
        is_verified_purchase: isVerifiedBuyer
      };

      const { error } = await supabase.from('reviews').insert(reviewPayload);
      if (error) throw error;

      addToast('success', 'Review Submitted', 'Thank you for your valuable feedback!');
      setNewReviewComment('');
      setReviewImageFile(null);
      setReviewImagePreview(null);
      fetchProductDetails();
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Review Submission Failed', err.message || 'Error occurred while saving review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    if (!user) {
      addToast('info', 'Auth Required', 'Please log in to vote on reviews.');
      navigate('/login');
      return;
    }
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (review?.user_vote === 'helpful') {
        const { error } = await supabase
          .from('review_votes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('review_votes')
          .upsert({
            review_id: reviewId,
            user_id: user.id,
            vote_type: 'helpful'
          }, { onConflict: 'review_id,user_id' });
        if (error) throw error;
      }
      fetchProductDetails();
    } catch (err: any) {
      addToast('error', 'Action Failed', err.message);
    }
  };

  // Admin Review Moderation Actions
  const handleModerateReviewVisibility = async (reviewId: string, hide: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_hidden: hide })
        .eq('id', reviewId);
      if (error) throw error;

      addToast('success', hide ? 'Review Moderated (Hidden)' : 'Review Moderated (Approved)', 'Review status saved.');
      fetchProductDetails();
    } catch (err: any) {
      addToast('error', 'Moderation Failed', err.message);
    }
  };

  const handleSaveEditReview = async (reviewId: string) => {
    if (!editingReviewComment.trim()) return;
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ comment: editingReviewComment })
        .eq('id', reviewId);
      if (error) throw error;

      addToast('success', 'Review Updated', 'Review comments edited successfully.');
      setEditingReviewId(null);
      fetchProductDetails();
    } catch (err: any) {
      addToast('error', 'Edit Failed', err.message);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      if (error) throw error;

      addToast('info', 'Review Deleted', 'Review removed from product.');
      fetchProductDetails();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  // Comments / Discussion Q&A Handlers
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('info', 'Auth Required', 'Please sign in to ask a question.');
      navigate('/login');
      return;
    }

    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase.from('comments').insert({
        note_id: id,
        user_id: user.id,
        comment: newComment
      });

      if (error) throw error;

      addToast('success', 'Question Posted', 'Your question has been posted to the discussion feed.');
      setNewComment('');
      fetchProductDetails();
    } catch (err: any) {
      addToast('error', 'Failed to Post Question', err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!user) {
      addToast('info', 'Auth Required', 'Please sign in to reply.');
      navigate('/login');
      return;
    }

    if (!newReply.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase.from('comment_replies').insert({
        comment_id: commentId,
        user_id: user.id,
        reply: newReply
      });

      if (error) throw error;

      addToast('success', 'Reply Added', 'Your reply has been posted.');
      setNewReply('');
      setReplyToCommentId(null);
      fetchProductDetails();
    } catch (err: any) {
      addToast('error', 'Failed to Post Reply', err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string, isReply: boolean = false) => {
    if (!user) {
      addToast('info', 'Auth Required', 'Please log in to like comments.');
      navigate('/login');
      return;
    }
    try {
      const tableField = isReply ? 'reply_id' : 'comment_id';
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq(tableField, commentId)
        .maybeSingle();

      if (existingLike) {
        await supabase.from('comment_likes').delete().eq('id', existingLike.id);
      } else {
        await supabase.from('comment_likes').insert({
          user_id: user.id,
          [tableField]: commentId
        });
      }
      fetchProductDetails();
    } catch (err: any) {
      console.error('Like error:', err);
      addToast('error', 'Action Failed', err.message);
    }
  };

  const handleToggleOfficialReply = async (replyId: string, currentVal: boolean) => {
    const isSellerOfProduct = note?.seller_id === user?.id;
    if (!isAdmin && !isSellerOfProduct) {
      addToast('error', 'Unauthorized', 'Only the seller or admin can mark official replies.');
      return;
    }
    try {
      const { error } = await supabase
        .from('comment_replies')
        .update({ is_official: !currentVal })
        .eq('id', replyId);
      if (error) throw error;

      addToast('success', !currentVal ? 'Marked as Official Answer' : 'Removed Official Badge', 'Reply status updated.');
      fetchProductDetails();
    } catch (err: any) {
      addToast('error', 'Action Failed', err.message);
    }
  };

  const handleBundleAddToCart = () => {
    if (!note || !frequentNote) return;
    addItem(note);
    addItem(frequentNote);
    addToast('success', 'Bundle Added to Cart', 'Both guides added to your cart.');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('success', 'Link Copied', 'Product details link copied to clipboard.');
  };

  const added = isInCart(note?.id || '');

  const visibleReviews = useMemo(() => reviews.filter(r => !r.is_hidden), [reviews]);
  const averageRating = useMemo(() => visibleReviews.length > 0
    ? (visibleReviews.reduce((acc, r) => acc + r.rating, 0) / visibleReviews.length).toFixed(1)
    : '4.8', [visibleReviews]);

  const coverImage = note?.thumbnail_url;
  const samplePages = useMemo(() => note?.preview_images || [], [note?.preview_images]);
  const galleryImages = useMemo<GalleryImage[]>(() => {
    if (!coverImage) return [];
    return [coverImage, ...samplePages.filter(img => img !== coverImage)]
      .filter(Boolean)
      .map((url, idx) => ({
        url,
        label: idx === 0 ? 'Cover' : `Page ${idx}`,
        alt: `${note?.title || 'Product'} ${idx === 0 ? 'cover' : `sample page ${idx}`}`,
      }));
  }, [coverImage, samplePages, note?.title]);

  const pdfFiles = useMemo(() => getPdfFiles(note || undefined), [note]);

  const highlights = useMemo(() => [
    { icon: CheckCircle2, label: 'High Yield Notes', desc: 'Curated by toppers, focusing strictly on high-probability questions.' },
    { icon: Target, label: 'University Focused', desc: 'Directly structured to address college syllabus parameters and exam keys.' },
    { icon: FileText, label: 'Easy Language', desc: 'Complex topics broken down into simple, easy-to-understand explanations.' },
    { icon: Sparkles, label: 'Diagrams Included', desc: 'Visual flowcharts, comparison tables, and custom diagrams.' },
    { icon: Brain, label: 'Exam Oriented', desc: 'Highlights repeating patterns and answers highly preferred by evaluators.' },
    { icon: RefreshCw, label: 'Quick Revision', desc: 'Saves time during hectic last-minute revision cycles.' },
    { icon: Download, label: 'Instant Download', desc: 'Instant access. Retrieve files from your dashboard immediately.' },
    { icon: Lock, label: 'Secure Purchase', desc: 'Fully encrypted transaction processing with verified delivery logs.' }
  ], []);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!note) return null;

  const seoMeta = pageMeta.product({
    id: note.id,
    title: note.title,
    description: note.description,
    price: note.price,
    thumbnail_url: note.thumbnail_url,
    subject: note.subject,
    course: (note as any).course,
    avg_rating: parseFloat(averageRating),
    review_count: visibleReviews.length
  });

  const productSchema = generateProductLD({
    id: note.id,
    title: note.title,
    description: note.description,
    price: note.price,
    thumbnail_url: note.thumbnail_url,
    subject: note.subject,
    course: (note as any).course,
    avg_rating: parseFloat(averageRating),
    review_count: visibleReviews.length,
    created_at: note.created_at
  });

  const breadcrumbSchema = generateBreadcrumbLD([
    { name: 'Home', url: 'https://www.stethonotes.store/' },
    { name: (note as any).course?.name || 'Courses', url: `https://www.stethonotes.store/courses` },
    { name: note.subject || 'Notes', url: `https://www.stethonotes.store/courses` },
    { name: note.title, url: `https://www.stethonotes.store/notes/${note.id}` }
  ]);

  return (
    <div className="bg-void text-white min-h-screen pt-24 pb-24 lg:pb-16 font-display">
      <SEOHead {...seoMeta} jsonLd={[productSchema, breadcrumbSchema]} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Study Library</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* ==========================================
              LEFT COLUMN (PDF Previews, Desc, Reviews, Q&A)
              ========================================== */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Cover & Gallery with Lightbox */}
            <div className="space-y-4" onContextMenu={(e) => e.preventDefault()}>
              <ImageGallery
                images={galleryImages}
                coverLabel="Cover Image"
                showPinterestGrid={samplePages.length > 0}
              />
              <p className="text-muted text-[10px] font-sans text-center italic select-none">
                * The fully unlocked PDF study guide will be delivered securely to your account panel.
              </p>
            </div>

            {/* Dynamic Info Tabs */}
            <div className="flex border-b border-white/5 pb-px gap-6 text-sm font-semibold font-sans mb-8">
              {[
                { id: 'about', label: 'About Study Guide' },
                { id: 'reviews', label: `Reviews (${reviews.length})` },
                { id: 'discussion', label: `Discussions (${comments.length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveInfoTab(tab.id as any)}
                  className={`pb-4 border-b-2 transition-all relative ${
                    activeInfoTab === tab.id
                      ? 'border-primary text-white font-bold'
                      : 'border-transparent text-muted hover:text-white'
                  }`}
                >
                  {tab.label}
                  {activeInfoTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_#1FB6D4]" />
                  )}
                </button>
              ))}
            </div>

            {activeInfoTab === 'about' && (
              <div className="space-y-8 animate-fade-in text-left">
                {/* Features Section */}
                <div className="glass-card-v2 rounded-3xl p-6 sm:p-8 bg-card/30">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">✨</span>
                    What makes these notes stand out
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {highlights.map((item, idx) => (
                      <div key={idx} className="p-4 bg-void/50 border border-white/5 rounded-2xl flex gap-3.5 hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-200 group">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-void transition-colors duration-300">
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{item.label}</h4>
                          <p className="text-[11px] text-muted mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description Section */}
                <div className="glass-card-v2 rounded-3xl p-6 sm:p-8 space-y-6 bg-card/30">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">📖</span>
                    About this Study Guide
                  </h2>
                  
                  {/* Quick Metadata Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-void/50 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><BookOpen className="w-4 h-4" /></div>
                      <div>
                        <span className="text-[10px] text-muted block font-semibold">Subject</span>
                        <span className="text-xs font-bold text-white line-clamp-1">{note.subject}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><GraduationCap className="w-4 h-4" /></div>
                      <div>
                        <span className="text-[10px] text-muted block font-semibold">University</span>
                        <span className="text-xs font-bold text-white line-clamp-1">NMC / Syllabus</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Clock className="w-4 h-4" /></div>
                      <div>
                        <span className="text-[10px] text-muted block font-semibold">Reading Time</span>
                        <span className="text-xs font-bold text-white">4-5 Hours</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Brain className="w-4 h-4" /></div>
                      <div>
                        <span className="text-[10px] text-muted block font-semibold">Difficulty</span>
                        <span className="text-xs font-bold text-white">High-Yield Prep</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-muted text-sm leading-relaxed whitespace-pre-line font-sans pt-2">
                    {note.description}
                  </p>
                </div>

                {/* Product Information Cards Grid */}
                <div className="space-y-4 pt-6 border-t border-white/5">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📄</span> Guide Technical Details
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-card/45 border border-white/5 rounded-2xl p-4 text-center">
                      <span className="text-[10px] text-muted font-semibold block">Total Pages</span>
                      <span className="text-lg font-bold text-white block mt-1">{pdfFiles.reduce((sum, file) => sum + (file.pages || 0), 0) || note.page_count || 32} Pages</span>
                    </div>
                    <div className="bg-card/45 border border-white/5 rounded-2xl p-4 text-center">
                      <span className="text-[10px] text-muted font-semibold block">File Size</span>
                      <span className="text-lg font-bold text-white block mt-1">{formatFileSize(pdfFiles.reduce((sum, file) => sum + (file.size || 0), 0) || note.file_size)}</span>
                    </div>
                    <div className="bg-card/45 border border-white/5 rounded-2xl p-4 text-center">
                      <span className="text-[10px] text-muted font-semibold block">Format</span>
                      <span className="text-lg font-bold text-white block mt-1">{pdfFiles.length || 1} PDF File{(pdfFiles.length || 1) === 1 ? '' : 's'}</span>
                    </div>
                    <div className="bg-card/45 border border-white/5 rounded-2xl p-4 text-center">
                      <span className="text-[10px] text-muted font-semibold block">Last Updated</span>
                      <span className="text-sm font-bold text-white block mt-1.5">
                        {new Date(note.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Secure PDF Watermark Details */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-450" />
                    <span>Digital Watermark & Rights Protection</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted font-sans">
                    <div className="flex gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block">Personalized Footer Watermark</span>
                        <span>Every page features your customer name, email, and private purchase ID to discourage distribution.</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block">Unique Verification Link</span>
                        <span>A QR verification link is embedded inside the PDF to validate the integrity of your purchase.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Tags list */}
                {tags.length > 0 && (
                  <div className="space-y-3 pt-6 border-t border-white/5">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">Study Guide Tags</span>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-primary hover:bg-primary/5 text-muted hover:text-primary text-xs font-semibold rounded-full cursor-pointer transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeInfoTab === 'reviews' && (
              <div className="space-y-8 animate-fade-in text-left">
                {/* Reviews moderating block */}
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">Student Reviews ({reviews.length})</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex text-primary">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(Number(averageRating)) ? 'fill-current' : 'text-white/20'}`} />
                          ))}
                        </div>
                        <span className="text-sm font-bold text-white">{averageRating} out of 5</span>
                      </div>
                    </div>

                    {/* Verified purchase indicator */}
                    {isVerifiedBuyer && (
                      <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Verified Buyer
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                     {/* Review input card */}
                     <div className="md:col-span-5 bg-card/60 rounded-3xl p-5 border border-white/10 space-y-4 shadow-2xl">
                       <h3 className="font-bold text-sm text-white font-display">Write a Product Review</h3>
                       {user ? (
                         <form onSubmit={handleReviewSubmit} className="space-y-4">
                           {/* Stars Select */}
                           <div className="flex flex-col gap-2">
                             <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Rating</span>
                             <div className="flex gap-1.5">
                               {[1, 2, 3, 4, 5].map((star) => (
                                 <button
                                   type="button"
                                   key={star}
                                   onClick={() => setNewRating(star)}
                                   className="text-primary hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none"
                                 >
                                   <Star className={`w-6 h-6 ${star <= newRating ? 'fill-current' : 'text-white/20'}`} />
                                 </button>
                               ))}
                             </div>
                           </div>

                           {/* Comment text */}
                           <div className="flex flex-col gap-2">
                             <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Feedback Comment</span>
                             <textarea
                               placeholder="Share your study experience with these notes. Help other medical students decide..."
                               rows={4}
                               value={newReviewComment}
                               onChange={(e) => setNewReviewComment(e.target.value)}
                               required
                               className="border border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none p-3 rounded-xl text-xs bg-void text-white resize-none transition-all duration-200"
                             />
                           </div>

                           {/* Review image upload */}
                           <div className="flex flex-col gap-2">
                             <span className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                               <Paperclip className="w-3.5 h-3.5" /> Attach Photo (Optional)
                             </span>
                             <input 
                               type="file" 
                               accept="image/*"
                               onChange={(e) => {
                                 const file = e.target.files?.[0] || null;
                                 setReviewImageFile(file);
                                 if (file) {
                                   setReviewImagePreview(URL.createObjectURL(file));
                                 } else {
                                   setReviewImagePreview(null);
                                 }
                               }}
                               className="text-xs text-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-white/5 file:text-white hover:file:bg-white/10 cursor-pointer transition-colors"
                             />
                             {reviewImagePreview && (
                               <div className="mt-2 relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 hover:shadow-md transition-shadow">
                                 <img src={reviewImagePreview} alt="" className="w-full h-full object-cover" />
                                 <button 
                                   type="button" 
                                   onClick={() => {
                                     setReviewImageFile(null);
                                     setReviewImagePreview(null);
                                   }}
                                   className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black transition-colors"
                                 >
                                   <X className="w-2.5 h-2.5" />
                                 </button>
                               </div>
                             )}
                           </div>

                           <button
                             type="submit"
                             disabled={submittingReview}
                             className="w-full py-3.5 btn-primary disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all duration-200"
                           >
                             <Send className="w-3.5 h-3.5" />
                             <span>{submittingReview ? 'Submitting...' : 'Post Review'}</span>
                           </button>
                         </form>
                       ) : (
                         <div className="text-center py-6">
                           <p className="text-xs text-muted mb-4">Please log in to leave an official product review.</p>
                           <Link to="/login" className="btn-secondary py-2 px-4 text-xs inline-block">Log In</Link>
                         </div>
                       )}
                     </div>

                     {/* Reviews Grid List */}
                     <div className="md:col-span-7 space-y-4">
                       {reviews.filter(r => !r.is_hidden).length === 0 ? (
                         <div className="text-center py-12 border border-white/5 rounded-2xl bg-card/20">
                           <p className="text-xs text-muted font-sans">No verified reviews posted yet. Be the first to share your thoughts!</p>
                         </div>
                       ) : (
                         reviews.filter(r => !r.is_hidden).map((rev) => (
                           <div key={rev.id} className="border border-white/5 rounded-2xl p-5 bg-card/25 hover:border-white/10 transition-all duration-300 space-y-3 group relative">
                             <div className="flex justify-between items-start gap-4">
                               <div className="flex items-center gap-3">
                                 <img 
                                   src={rev.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} 
                                   alt="" 
                                   className="w-8 h-8 rounded-full border border-white/5 object-cover" 
                                 />
                                 <div>
                                   <h4 className="font-bold text-xs text-white">{rev.user_name}</h4>
                                   <div className="flex items-center gap-1.5 mt-0.5">
                                     <div className="flex text-primary">
                                       {Array.from({ length: 5 }).map((_, i) => (
                                         <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-white/20'}`} />
                                       ))}
                                     </div>
                                     {rev.is_verified_purchase && (
                                       <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-extrabold border border-emerald-500/20">Verified Buyer</span>
                                     )}
                                   </div>
                                 </div>
                               </div>
                               <span className="text-[10px] text-muted">{new Date(rev.created_at).toLocaleDateString()}</span>
                             </div>

                             {editingReviewId === rev.id ? (
                               <div className="space-y-2">
                                 <textarea
                                   value={editingReviewComment}
                                   onChange={(e) => setEditingReviewComment(e.target.value)}
                                   className="w-full border border-white/10 rounded-xl p-2.5 text-xs outline-none focus:border-primary bg-void text-white"
                                   rows={3}
                                 />
                                 <div className="flex gap-2">
                                   <button onClick={() => handleSaveEditReview(rev.id)} className="px-3 py-1.5 bg-primary text-void rounded-lg text-[9px] font-bold hover:bg-primary-dark transition-colors">Save</button>
                                   <button onClick={() => setEditingReviewId(null)} className="px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg text-[9px] font-bold hover:bg-white/10 transition-colors">Cancel</button>
                                 </div>
                               </div>
                             ) : (
                               <p className="text-xs text-muted leading-relaxed font-sans">{rev.comment}</p>
                             )}

                             {rev.image_url && (
                               <div className="mt-2 max-w-[150px] rounded-lg overflow-hidden border border-white/10 hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open(rev.image_url, '_blank')}>
                                 <img src={rev.image_url} alt="" className="w-full h-auto object-contain max-h-32" />
                               </div>
                             )}

                             {/* Helpfulness and moderation */}
                             <div className="flex justify-between items-center pt-2 border-t border-white/5">
                               <button
                                 onClick={() => handleLikeReview(rev.id)}
                                 className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-200 ${
                                   rev.user_vote === 'helpful' ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm' : 'bg-white/5 border border-white/10 text-muted hover:bg-white/10'
                                 }`}
                               >
                                 <ThumbsUp className="w-3.5 h-3.5" />
                                 <span>Helpful ({rev.helpful_count || 0})</span>
                               </button>

                               {/* Admin moderation tools */}
                               {isAdmin && (
                                 <div className="flex items-center gap-1.5 bg-void p-1 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                   <button
                                     onClick={() => {
                                       setEditingReviewId(rev.id);
                                       setEditingReviewComment(rev.comment);
                                     }}
                                     className="p-1.5 text-muted hover:text-primary hover:bg-white/5 rounded-md transition-colors"
                                     title="Edit Review"
                                    >
                                     <Edit2 className="w-3.5 h-3.5" />
                                   </button>
                                   <button
                                     onClick={() => handleModerateReviewVisibility(rev.id, true)}
                                     className="p-1.5 text-muted hover:text-amber-400 hover:bg-white/5 rounded-md transition-colors"
                                     title="Hide / Reject"
                                   >
                                     <EyeOff className="w-3.5 h-3.5" />
                                   </button>
                                   <button
                                     onClick={() => handleDeleteReview(rev.id)}
                                     className="p-1.5 text-muted hover:text-red-400 hover:bg-white/5 rounded-md transition-colors"
                                     title="Delete"
                                   >
                                     <Trash2 className="w-3.5 h-3.5" />
                                   </button>
                                 </div>
                               )}
                             </div>
                           </div>
                         ))
                       )}

                      {/* Rejected list for Admin only */}
                      {isAdmin && reviews.some(r => r.is_hidden) && (
                        <div className="mt-8 space-y-3 pt-6 border-t border-white/5">
                          <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1">
                            Moderated / Hidden Reviews ({reviews.filter(r => r.is_hidden).length})
                          </h4>
                          {reviews.filter(r => r.is_hidden).map((rev) => (
                            <div key={rev.id} className="border border-amber-500/20 rounded-2xl p-4 bg-amber-500/5 space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-xs text-white">{rev.user_name}</span>
                                <span className="text-[9px] text-muted">{new Date(rev.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-muted leading-relaxed font-sans">{rev.comment}</p>
                              <div className="flex justify-between items-center pt-2 border-t border-amber-500/10">
                                <span className="text-[9px] text-amber-400 font-extrabold uppercase">Rejected / Hidden</span>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => handleModerateReviewVisibility(rev.id, false)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-bold"
                                  >
                                    Approve / Show
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReview(rev.id)}
                                    className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[9px] font-bold"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                     </div>
                  </div>
                </div>
              </div>
            )}

            {activeInfoTab === 'discussion' && (
              <div className="space-y-8 animate-fade-in text-left">
                {/* Interactive Q&A Discussions */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white font-display">Interactive Discussions ({comments.length})</h2>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    {/* Question list feed */}
                    <div className="md:col-span-7 space-y-4">
                      {comments.length === 0 ? (
                        <p className="text-xs text-muted py-10 text-center bg-card/20 border border-white/5 rounded-2xl font-sans">
                          No questions or discussion comments posted yet.
                        </p>
                      ) : (
                        comments.map(c => (
                           <div key={c.id} className="p-5 border border-white/5 rounded-2xl bg-card/25 hover:border-white/10 transition-all duration-200 space-y-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex items-center gap-3">
                                <img src={c.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} alt="" className="w-8 h-8 rounded-full border border-white/5 object-cover" />
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-white">{c.user_name}</span>
                                    {c.user_role === 'admin' || c.user_role === 'super_admin' ? (
                                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[8px] font-bold uppercase tracking-wider">Staff</span>
                                    ) : c.user_role === 'seller' ? (
                                      <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 text-[8px] font-bold uppercase tracking-wider">Seller</span>
                                    ) : null}
                                  </div>
                                  <span className="text-[9px] text-muted block mt-0.5">{new Date(c.created_at).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-muted leading-relaxed font-sans">{c.comment}</p>

                            {/* Question Likes & Replies toolbar */}
                             <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                               <button
                                 onClick={() => handleLikeComment(c.id, false)}
                                 className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-full transition-all duration-200 ${
                                   c.liked_by_me ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm' : 'text-muted hover:text-white hover:bg-white/5'
                                 }`}
                               >
                                 <ThumbsUp className="w-3.5 h-3.5" />
                                 <span>Like ({c.likes_count || 0})</span>
                               </button>

                               <button
                                 onClick={() => setReplyToCommentId(replyToCommentId === c.id ? null : c.id)}
                                 className="text-[10px] text-primary font-bold flex items-center gap-1.5 hover:underline transition-colors"
                               >
                                 <CornerDownRight className="w-3.5 h-3.5" />
                                 <span>Reply</span>
                               </button>
                             </div>

                            {/* Replies List */}
                            {c.replies && c.replies.length > 0 && (
                              <div className="pl-4 border-l-2 border-white/5 space-y-3 pt-2">
                                {c.replies.map(rep => (
                                  <div key={rep.id} className="space-y-1.5 bg-void/40 p-3.5 rounded-xl border border-white/5 relative">
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="flex items-center gap-2">
                                        <img src={rep.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} alt="" className="w-6 h-6 rounded-full border border-white/5 object-cover" />
                                        <div>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[11px] font-bold text-white">{rep.user_name}</span>
                                            {rep.user_role === 'admin' || rep.user_role === 'super_admin' ? (
                                              <span className="px-1 py-0.2 rounded bg-primary/10 text-primary text-[7px] font-bold uppercase border border-primary/20">Staff</span>
                                            ) : rep.user_role === 'seller' ? (
                                              <span className="px-1 py-0.2 rounded bg-accent/10 text-accent text-[7px] font-bold uppercase border border-accent/20">Seller</span>
                                            ) : null}
                                            {rep.is_official && (
                                              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-450 text-[7px] font-extrabold uppercase border border-emerald-500/20">✔ Official</span>
                                            )}
                                          </div>
                                          <span className="text-[8px] text-muted block mt-0.2">{new Date(rep.created_at).toLocaleDateString()}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <p className="text-[11px] text-muted leading-relaxed font-sans">{rep.reply}</p>

                                    <div className="flex items-center gap-3 pt-1 border-t border-white/5 mt-1">
                                      <button
                                        onClick={() => handleLikeComment(rep.id, true)}
                                        className={`flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                                          rep.liked_by_me ? 'bg-primary/20 text-primary' : 'text-muted hover:bg-white/5'
                                        }`}
                                      >
                                        <ThumbsUp className="w-2.5 h-2.5" />
                                        <span>({rep.likes_count || 0})</span>
                                      </button>

                                      {/* Official Reply Toggle */}
                                      {(user?.role === 'admin' || user?.role === 'super_admin' || note.seller_id === user?.id) && (
                                        <button
                                          onClick={() => handleToggleOfficialReply(rep.id, !!rep.is_official)}
                                          className="text-[8px] text-muted hover:text-primary font-bold transition-colors"
                                        >
                                          {rep.is_official ? 'Remove Official' : 'Mark Official'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Inline reply box */}
                            {replyToCommentId === c.id && (
                              <div className="flex gap-2 pt-2">
                                <input
                                  type="text"
                                  placeholder="Type reply..."
                                  value={newReply}
                                  onChange={(e) => setNewReply(e.target.value)}
                                  className="flex-grow px-3 py-1.5 border border-white/10 rounded-xl text-xs outline-none focus:border-primary bg-void text-white"
                                />
                                <button
                                  onClick={() => handleReplySubmit(c.id)}
                                  className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-void rounded-xl text-xs font-bold transition-all"
                                >
                                  Send
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                     {/* Ask Question Card */}
                     <div className="md:col-span-5 bg-card/60 rounded-3xl p-6 border border-white/10 space-y-4 shadow-2xl text-white text-left">
                       <h3 className="font-bold text-sm text-white flex items-center gap-2">
                         <MessageSquare className="w-4 h-4 text-primary" />
                         Ask a Question
                       </h3>
                       <form onSubmit={handleCommentSubmit} className="space-y-4">
                         <textarea
                           placeholder="Ask about syllabus, preview pages, updates, or exam focus..."
                           rows={4}
                           value={newComment}
                           onChange={(e) => setNewComment(e.target.value)}
                           required
                           className="w-full border border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none p-3 rounded-xl text-xs bg-void text-white resize-none transition-all duration-200"
                         />
                         <button
                           type="submit"
                           disabled={submittingComment}
                           className="w-full py-3.5 btn-primary disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all duration-200"
                         >
                           <MessageSquare className="w-4 h-4" />
                           <span>Post Question</span>
                         </button>
                       </form>
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* ==========================================
              RIGHT COLUMN (Sticky Buy Box, Related, Bundle)
              ========================================== */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            
            {/* Main Purchase Card */}
            <div className="glass-card-v2 bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl space-y-6 text-left">
              
              {/* Header info */}
              <div>
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                  Semester: {note.semester || '1st Semester'}
                </span>
                <h1 className="text-xl font-bold text-white mt-3.5 leading-tight tracking-tight font-display">
                  {note.title}
                </h1>
                <p className="text-[11px] text-muted mt-2">Subject: <b className="text-white">{note.subject}</b></p>
              </div>

              <div className="flex items-center justify-between border-y border-white/5 py-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-current text-primary" />
                  <span className="font-bold text-white">{averageRating}</span>
                  <span className="text-[10px] text-muted">({reviews.length} Reviews)</span>
                </div>

                <span className="text-[10px] text-muted font-bold bg-white/5 px-2.5 py-0.5 rounded-full font-sans border border-white/5">
                  120+ Downloads
                </span>
              </div>

              {/* Price Box */}
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white font-sans tracking-tight">₹{note.price}</span>
                  <span className="text-xs text-muted line-through font-sans">₹{(note.price * 1.5).toFixed(0)}</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-sans">
                    33% OFF
                  </span>
                </div>
                <span className="text-[10px] text-muted block font-sans">Lifetime Access • Secure checkout.</span>
              </div>

              {/* Quick Feature Checklist */}
              <div className="space-y-2.5 text-[11px] text-muted font-sans border-t border-white/5 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Instant PDF Download (Secure delivery)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Verified Creator Note (Medical Topper)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Includes hand-drawn diagrams & charts</span>
                </div>
              </div>

              {/* Checkout CTA Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                {isDirectDownload ? (
                  <div className="space-y-2">
                    {pdfFiles.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => handleDirectDownload(file.path, file.name)}
                        disabled={downloading}
                        className="w-full py-3.5 bg-primary hover:bg-primary-dark text-void rounded-2xl font-bold text-sm shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>{downloading ? 'Downloading...' : `Download ${file.name}`}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => { addItem(note); navigate('/cart'); }}
                      className="w-full py-3.5 bg-primary hover:bg-primary-dark text-void rounded-2xl font-display font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 hover:shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Buy Now</span>
                    </button>
                    
                    {added ? (
                      <Link
                        to="/cart"
                        className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold text-xs flex items-center justify-center transition-all"
                      >
                        Go to Checkout
                      </Link>
                    ) : (
                      <button
                        onClick={() => { addItem(note); addToast('success', 'Added to Cart', 'Guide added to shopping cart.'); }}
                        className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold text-xs transition-all active:scale-[0.98]"
                      >
                        Add to Cart
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Wishlist & Share buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <button 
                  onClick={handleWishlistToggle}
                  className="py-2.5 px-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                >
                  <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-muted'}`} />
                  <span>{inWishlist ? 'Saved' : 'Wishlist'}</span>
                </button>

                <button 
                  onClick={handleShare}
                  className="py-2.5 px-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-muted" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Secure purchase assurances */}
            <div className="bg-card/40 border border-white/5 rounded-3xl p-5 space-y-4 text-muted">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Security Assurances</h4>
              <div className="space-y-3.5">
                <div className="flex gap-2 text-[11px]">
                  <Lock className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Protected PDF</span>
                    <span>Personalized watermarking details are processed securely.</span>
                  </div>
                </div>
                <div className="flex gap-2 text-[11px]">
                  <Download className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Instant Download</span>
                    <span>Acquire download links instantly post verified transaction.</span>
                  </div>
                </div>
                <div className="flex gap-2 text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Email Delivery</span>
                    <span>Receive direct transaction invoices and download copies.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Frequently Bought Together Bundle */}
            {frequentNote && (
              <div className="bg-card/45 border border-white/10 rounded-3xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                  <span>Frequently Bought Together</span>
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <img src={note.thumbnail_url} alt="" className="w-9 h-9 rounded-lg object-cover border border-white/10" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-white truncate">{note.title}</p>
                      <span className="text-[9px] text-muted font-sans">₹{note.price}</span>
                    </div>
                  </div>

                  <div className="text-center text-xs font-bold text-muted">+</div>

                  <div className="flex items-center gap-2">
                    <img src={frequentNote.thumbnail_url} alt="" className="w-9 h-9 rounded-lg object-cover border border-white/10" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-white truncate">{frequentNote.title}</p>
                      <span className="text-[9px] text-muted font-sans">₹{frequentNote.price}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] text-muted block font-semibold">Bundle Price</span>
                    <span className="text-base font-black text-white font-sans">₹{note.price + frequentNote.price}</span>
                  </div>
                  <button
                    onClick={handleBundleAddToCart}
                    className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-void rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add Both</span>
                  </button>
                </div>
              </div>
            )}

            {/* Related Guides List */}
            {relatedNotes.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest">Related study guides</h4>
                <div className="-mx-4 px-4 overflow-x-auto scrollbar-none">
                  <div className="flex gap-4 min-w-max sm:grid sm:grid-cols-3">
                    {relatedNotes.map((relNote) => (
                      <div 
                        key={relNote.id} 
                        className="w-72 sm:w-auto p-4 bg-card/60 border border-white/5 rounded-2xl flex gap-3.5 hover:border-white/10 transition-all duration-200 group shrink-0"
                      >
                        <Link to={`/notes/${relNote.id}`} className="w-16 h-16 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-void block shrink-0 border border-white/10">
                          <img src={relNote.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        </Link>
                        <div className="min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <span className="text-[8px] font-bold text-primary uppercase tracking-wider block">{relNote.subject}</span>
                            <Link to={`/notes/${relNote.id}`} className="font-bold text-xs text-white hover:text-primary transition-colors line-clamp-2 block mt-0.5">
                              {relNote.title}
                            </Link>
                          </div>
                          <span className="text-xs font-bold text-white font-sans mt-1">₹{relNote.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Mobile Sticky Bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-white/10 p-4 flex items-center justify-between z-40 shadow-2xl text-white">
        <div>
          <span className="text-[10px] text-muted block font-semibold">Instant Access</span>
          <span className="text-xl font-bold text-white font-sans">₹{note.price}</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleWishlistToggle}
            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
          >
            <Heart className={`w-5 h-5 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-muted'}`} />
          </button>
          {isDirectDownload ? (
            <div className="flex gap-2 overflow-x-auto max-w-[70vw] scrollbar-thin">
              {pdfFiles.map((file) => (
                <button
                  key={file.path}
                  onClick={() => handleDirectDownload(file.path, file.name)}
                  disabled={downloading}
                  className="py-3 px-4 bg-primary hover:bg-primary-dark text-void rounded-xl font-bold text-xs shadow-md transition-colors disabled:opacity-55 whitespace-nowrap active:scale-95"
                >
                  {downloading ? 'Downloading...' : file.name.replace(/\.pdf$/i, '')}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => { addItem(note); navigate('/cart'); }}
              className="py-3 px-6 btn-primary font-bold text-xs"
            >
              Buy Now
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
