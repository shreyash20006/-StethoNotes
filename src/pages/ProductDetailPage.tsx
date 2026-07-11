import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Note, Review, Comment } from '../types';
import { useCartStore } from '../store/useCartStore';
import { useToastStore } from '../store/useToastStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  Star, ShoppingCart, ArrowLeft, FileText, Send, Mail,
  Heart, MessageSquare, CornerDownRight, ShieldCheck, UserCheck, Sparkles
} from 'lucide-react';
import { NoteDetailSkeleton } from '../components/Skeleton';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addItem, isInCart } = useCartStore();
  const { addToast } = useToastStore();

  const [note, setNote] = useState<Note | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedNotes, setRelatedNotes] = useState<Note[]>([]);
  const [frequentNote, setFrequentNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  // Wishlist and Viewed Stats
  const [inWishlist, setInWishlist] = useState(false);
  const [isVerifiedBuyer, setIsVerifiedBuyer] = useState(false);

  // Review Form States
  const [newRating, setNewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Comment Form States
  const [newComment, setNewComment] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [newReply, setNewReply] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Preview Index
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  useEffect(() => {
    fetchProductDetails();
  }, [id, user]);

  const fetchProductDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Fetch note
      const { data: noteData, error: noteErr } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();

      if (noteErr || !noteData) {
        throw new Error('Study note not found');
      }
      setNote(noteData);
      setActivePreviewIndex(0);

      // 2. Log Recently Viewed (Fire-and-forget)
      if (user) {
        supabase.from('recently_viewed').upsert({
          user_id: user.id,
          note_id: id,
          viewed_at: new Date().toISOString()
        }, { onConflict: 'user_id,note_id' }).catch(console.error);

        // Check if item is in user's wishlist
        const { data: wish } = await supabase
          .from('wishlist')
          .select('id')
          .eq('user_id', user.id)
          .eq('note_id', id)
          .single();
        setInWishlist(!!wish);

        // Check if user is a verified buyer (completed order for this note)
        const { data: orderItem } = await supabase
          .from('order_items')
          .select('id, order:orders(payment_status, customer_email)')
          .eq('note_id', id);

        const bought = (orderItem || []).some((item: any) => 
          item.order?.payment_status === 'completed' && 
          item.order?.customer_email?.toLowerCase() === user.email.toLowerCase()
        );
        setIsVerifiedBuyer(bought);
      }

      // 3. Fetch related notes (same course)
      const { data: relatedData } = await supabase
        .from('notes')
        .select('*')
        .eq('course_id', noteData.course_id)
        .limit(4);

      if (relatedData) {
        const others = relatedData.filter((n: Note) => n.id !== id);
        setRelatedNotes(others.slice(0, 3));
        if (others.length > 0) {
          setFrequentNote(others[0]); // Recommended bundle item
        }
      }

      // 4. Fetch reviews (including user profile name + avatar)
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, profile:profiles(full_name, avatar_url)')
        .eq('note_id', id);

      if (reviewsData) {
        setReviews(reviewsData.map((r: any) => ({
          ...r,
          user_name: r.profile?.full_name || 'Verified Student',
          user_avatar: r.profile?.avatar_url
        })));
      }

      // 5. Fetch comments and nested replies
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*, profile:profiles(full_name, role, avatar_url)')
        .eq('note_id', id)
        .order('created_at', { ascending: true });

      const { data: repliesData } = await supabase
        .from('comment_replies')
        .select('*, profile:profiles(full_name, role, avatar_url)')
        .order('created_at', { ascending: true });

      if (commentsData) {
        const commentsList: Comment[] = commentsData.map((c: any) => {
          const commentReplies = (repliesData || [])
            .filter((r: any) => r.comment_id === c.id)
            .map((r: any) => ({
              id: r.id,
              comment_id: r.comment_id,
              user_id: r.user_id,
              user_name: r.profile?.full_name || 'Support Team',
              user_role: r.profile?.role || 'student',
              user_avatar: r.profile?.avatar_url,
              reply: r.reply,
              is_reported: r.is_reported,
              created_at: r.created_at
            }));

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
            replies: commentReplies
          };
        });
        setComments(commentsList);
      }

    } catch (err: any) {
      console.error(err);
      addToast('error', 'Error Loading Product', err.message || 'Could not retrieve product information.');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      addToast('info', 'Auth Required', 'Please sign in to add note to wishlist.');
      navigate('/login');
      return;
    }

    try {
      if (inWishlist) {
        await supabase.from('wishlist').delete().eq('user_id', user.id).eq('note_id', id);
        setInWishlist(false);
        addToast('info', 'Removed from Wishlist', 'Note removed.');
      } else {
        await supabase.from('wishlist').insert({ user_id: user.id, note_id: id });
        setInWishlist(true);
        addToast('success', 'Added to Wishlist', 'Note bookmarked in dashboard.');
      }
    } catch (err: any) {
      addToast('error', 'Wishlist Action Failed', err.message);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('info', 'Auth Required', 'Please sign in to write a product review.');
      navigate('/login');
      return;
    }

    if (!newReviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const reviewPayload = {
        note_id: id,
        user_id: user.id,
        rating: newRating,
        comment: newReviewComment,
        is_verified_purchase: isVerifiedBuyer
      };

      const { error } = await supabase.from('reviews').insert(reviewPayload);
      if (error) throw error;

      addToast('success', 'Review Submitted', 'Thank you for your feedback!');
      setNewReviewComment('');
      fetchProductDetails();
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Review Error', err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('info', 'Auth Required', 'Please sign in to post questions/comments.');
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

      addToast('success', 'Comment Posted', 'Your question/comment has been listed.');
      setNewComment('');
      fetchProductDetails();
    } catch (err: any) {
      addToast('error', 'Failed to Comment', err.message);
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

      addToast('success', 'Reply Added', 'Your reply thread was updated.');
      setNewReply('');
      setReplyToCommentId(null);
      fetchProductDetails();
    } catch (err: any) {
      addToast('error', 'Failed to Reply', err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleBundleAddToCart = () => {
    if (!note || !frequentNote) return;
    addItem(note);
    addItem(frequentNote);
    addToast('success', 'Bundle Added to Cart', 'Both notes added to your shopping cart.');
  };

  if (loading) {
    return <NoteDetailSkeleton />;
  }

  if (!note) return null;

  const added = isInCart(note.id);
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '4.8';

  const previewGallery = [
    note.thumbnail_url,
    ...(note.preview_images || [])
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen font-display">
      {/* Back button */}
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-cyan-600 transition-colors mb-8 font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Study Library</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
        {/* Left Column: Previews and Gallery */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="aspect-[4/3] w-full rounded-3xl border border-gray-150 bg-gray-50 shadow-sm overflow-hidden relative">
            <img
              src={previewGallery[activePreviewIndex]}
              alt={`${note.title} preview`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
            
            {/* Wishlist Heart */}
            <button
              onClick={handleWishlistToggle}
              className="absolute top-4 right-4 p-3 bg-white/90 hover:bg-white border border-slate-100 rounded-full shadow-lg transition-transform hover:scale-105"
            >
              <Heart className={`w-5 h-5 transition-colors ${inWishlist ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
            </button>
          </div>

          {/* Gallery sliders */}
          <div className="flex gap-3 overflow-x-auto py-1">
            {previewGallery.map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => setActivePreviewIndex(idx)}
                className={`w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                  activePreviewIndex === idx
                    ? 'border-cyan-500 scale-95 shadow'
                    : 'border-transparent hover:border-gray-200'
                }`}
              >
                <img src={imgUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <p className="text-gray-400 text-[10px] font-sans text-center mt-2 italic">
            * PDF document will be delivered to your registered email address instantly.
          </p>
        </div>

        {/* Right Column: Metadata and purchasing */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div>
            <span className="inline-block bg-cyan-500/10 text-cyan-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              Semester: {note.semester || '1st Semester'}
            </span>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0c1230] tracking-tight leading-tight">
              {note.title}
            </h1>

            <div className="flex items-center gap-4 mt-3">
              <span className="font-medium text-xs text-slate-500">
                Subject: <span className="text-[#0c1230] font-semibold">{note.subject}</span>
              </span>
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-450">
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <span className="font-sans text-sm text-slate-900 font-semibold">{averageRating}</span>
                <span className="text-xs text-slate-400 font-sans">({reviews.length} reviews)</span>
              </div>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs text-slate-450 font-sans block mb-1">Instant PDF Delivery Price</span>
              <span className="font-extrabold text-3xl text-[#0c1230] font-sans">
                ₹{note.price}
              </span>
              <span className="text-[10px] text-slate-400 font-sans ml-2">Inc. of all taxes</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:w-auto w-full">
              <button
                onClick={() => { addItem(note); navigate('/cart'); }}
                className="py-3.5 px-6 font-bold text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md transition-colors"
              >
                Buy Now
              </button>
              {added ? (
                <Link
                  to="/cart"
                  className="py-3.5 px-6 font-bold text-sm bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-all"
                >
                  Go to Cart
                </Link>
              ) : (
                <button
                  onClick={() => { addItem(note); addToast('success', 'Added to Cart', 'Product added to cart.'); }}
                  className="py-3.5 px-6 font-bold text-sm bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl transition-all"
                >
                  Add to Cart
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-base text-[#0c1230]">About this Study Guide</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-sans whitespace-pre-line">
              {note.description}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-cyan-600" />
              <span className="text-xs font-semibold text-slate-600">Printable A4 PDF Format</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-cyan-600" />
              <span className="text-xs font-semibold text-slate-600">Instant Email Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* FREQUENTLY BOUGHT TOGETHER (RECOMMENDED BUNDLE) */}
      {frequentNote && (
        <section className="bg-slate-50 border border-slate-150 rounded-3xl p-6 mb-16">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" />
            <span>Frequently Bought Together</span>
          </h3>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Product 1 */}
              <div className="flex items-center gap-3">
                <img src={note.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                <div>
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{note.title}</p>
                  <span className="text-[10px] text-slate-500 font-sans">₹{note.price}</span>
                </div>
              </div>

              <span className="text-lg font-bold text-slate-400">+</span>

              {/* Product 2 */}
              <div className="flex items-center gap-3">
                <img src={frequentNote.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                <div>
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{frequentNote.title}</p>
                  <span className="text-[10px] text-slate-500 font-sans">₹{frequentNote.price}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Bundle Price</span>
                <span className="text-xl font-black text-slate-900 font-sans">₹{note.price + frequentNote.price}</span>
              </div>
              <button
                onClick={handleBundleAddToCart}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add Both to Cart</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* REVIEWS & RATINGS TAB */}
      <section className="border-t border-slate-100 pt-16 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Reviews List */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-[#0c1230]">
              Student Reviews ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <div className="bg-slate-50 p-8 rounded-2xl text-center text-slate-400 text-xs font-sans">
                No reviews yet. Be the first to purchase and review this note!
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="border border-slate-100 rounded-2xl p-5 bg-white space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img src={rev.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
                        <div>
                          <h4 className="font-semibold text-xs text-slate-800">
                            {rev.user_name}
                          </h4>
                          <div className="flex text-amber-450 mt-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs text-slate-650 leading-relaxed font-sans">{rev.comment}</p>
                    
                    <div className="flex items-center gap-2 pt-2 text-[10px] text-slate-400">
                      {rev.is_verified_purchase && (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">Verified Purchase</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave a review Form */}
          <div className="lg:col-span-5 bg-slate-50 rounded-3xl p-6 border border-slate-100">
            <h3 className="font-bold text-lg text-slate-900 mb-4">
              Write a Review
            </h3>
            
            {user ? (
              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                {/* Rating selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-450">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="text-amber-450 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newRating ? 'fill-current' : 'text-slate-350'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Box */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-450">Your Review</label>
                  <textarea
                    placeholder="Provide details about your study experience with these notes..."
                    rows={4}
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    required
                    className="border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none px-4 py-3 rounded-xl text-xs bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="py-3 bg-cyan-600 hover:bg-cyan-750 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReview ? 'Submitting...' : 'Post Review'}</span>
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-450 text-xs font-sans mb-4">
                  You must be logged in to leave a review.
                </p>
                <Link to="/login" className="px-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl block text-center">
                  Log In / Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* COMMENTS & INTERACTIVE DISCUSSION SECTION */}
      <section className="border-t border-slate-100 pt-16 mb-16">
        <h2 className="text-2xl font-bold text-[#0c1230] mb-8">Interactive Discussions ({comments.length})</h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Comments Feed */}
          <div className="lg:col-span-7 space-y-6">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-450 py-10 text-center bg-slate-50 rounded-2xl">No questions or discussion comments posted yet.</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="p-5 border border-slate-150 rounded-2xl bg-white space-y-4">
                  {/* Author Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <img src={c.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{c.user_name}</span>
                          {c.user_role === 'admin' || c.user_role === 'super_admin' ? (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" /> Staff
                            </span>
                          ) : c.user_role === 'seller' ? (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                              <UserCheck className="w-2.5 h-2.5" /> Seller
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[9px] text-slate-450 font-sans block mt-0.5">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-sans">{c.comment}</p>

                  {/* Replies thread */}
                  {c.replies && c.replies.length > 0 && (
                    <div className="pl-6 border-l border-slate-200 space-y-3 pt-2">
                      {c.replies.map(rep => (
                        <div key={rep.id} className="text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{rep.user_name}</span>
                            {rep.user_role === 'admin' || rep.user_role === 'super_admin' ? (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" /> Staff
                              </span>
                            ) : rep.user_role === 'seller' ? (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                                <UserCheck className="w-2.5 h-2.5" /> Seller
                              </span>
                            ) : null}
                            <span className="text-[9px] text-slate-400 font-sans">{new Date(rep.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-650 leading-relaxed font-sans pl-1">{rep.reply}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions & Inline Reply */}
                  <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                    <button
                      onClick={() => setReplyToCommentId(replyToCommentId === c.id ? null : c.id)}
                      className="text-[10px] text-cyan-600 font-bold flex items-center gap-1 hover:underline"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </div>

                  {/* Inline Reply Input */}
                  {replyToCommentId === c.id && (
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Add a reply..."
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        className="flex-grow px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50/20"
                      />
                      <button
                        onClick={() => handleReplySubmit(c.id)}
                        className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-750 text-white rounded-xl text-xs font-bold"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Comment */}
          <div className="lg:col-span-5 bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Ask a Question</h3>
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <textarea
                placeholder="Type your question or query here..."
                rows={4}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
                className="w-full border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none px-4 py-3 rounded-xl text-xs bg-white resize-none"
              />
              <button
                type="submit"
                disabled={submittingComment}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Post Question</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Related notes section */}
      {relatedNotes.length > 0 && (
        <section className="border-t border-slate-100 pt-16">
          <h2 className="text-2xl font-bold text-[#0c1230] mb-8">
            Related Study Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedNotes.map((relNote) => (
              <div
                key={relNote.id}
                className="bg-white border border-slate-100 rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                <Link to={`/notes/${relNote.id}`} className="aspect-[4/3] overflow-hidden bg-gray-50 block">
                  <img
                    src={relNote.thumbnail_url}
                    alt={relNote.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                <div className="p-5 flex flex-col gap-3">
                  <div>
                    <span className="text-[9px] font-bold text-cyan-600 tracking-wider uppercase">
                      {relNote.subject}
                    </span>
                    <Link
                      to={`/notes/${relNote.id}`}
                      className="font-bold text-sm text-[#0c1230] hover:text-cyan-600 transition-colors mt-0.5 block line-clamp-1"
                    >
                      {relNote.title}
                    </Link>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-extrabold text-sm text-slate-850 font-sans">₹{relNote.price}</span>
                    <Link
                      to={`/notes/${relNote.id}`}
                      className="text-xs text-cyan-600 font-bold hover:underline"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
