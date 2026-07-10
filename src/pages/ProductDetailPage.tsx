import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Note, Review } from '../types';
import { useCartStore } from '../store/useCartStore';
import { useToastStore } from '../store/useToastStore';
import { useAuthStore } from '../store/useAuthStore';
import { Star, ShoppingCart, ArrowLeft, FileText, Send, Calendar, Mail } from 'lucide-react';
import { NoteDetailSkeleton } from '../components/Skeleton';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addItem, isInCart } = useCartStore();
  const { addToast } = useToastStore();

  const [note, setNote] = useState<Note | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedNotes, setRelatedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Form States
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch specific note
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

        // Fetch related notes (same course)
        const { data: relatedData } = await supabase
          .from('notes')
          .select('*')
          .eq('course_id', noteData.course_id)
          .limit(4);

        if (relatedData) {
          setRelatedNotes(relatedData.filter((n: Note) => n.id !== id).slice(0, 3));
        }

        // Fetch reviews for this note
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('note_id', id)
          .order('created_at', { ascending: false });

        if (reviewsData) {
          setReviews(reviewsData);
        }
      } catch (err: any) {
        console.error(err);
        addToast('error', 'Error Loading Product', err.message || 'Could not retrieve product information.');
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id, navigate]);

  if (loading) {
    return <NoteDetailSkeleton />;
  }

  if (!note) return null;

  const added = isInCart(note.id);
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '4.8';

  const handleAddToCart = () => {
    addItem(note);
    addToast('success', 'Added to Cart', `${note.title} has been added to your shopping cart.`);
  };

  const handleBuyNow = () => {
    addItem(note);
    navigate('/cart');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('info', 'Auth Required', 'Please sign in to write a product review.');
      navigate('/login');
      return;
    }

    if (!newComment.trim()) return;

    setSubmittingReview(true);
    try {
      const reviewPayload = {
        note_id: note.id,
        user_id: user.id,
        user_name: user.name,
        rating: newRating,
        comment: newComment
      };

      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewPayload);

      if (error) throw error;

      addToast('success', 'Review Submitted', 'Thank you for your feedback!');
      setReviews([data as any, ...reviews]);
      setNewComment('');
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Review Error', err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const previewGallery = [
    note.thumbnail_url,
    ...(note.preview_images || [])
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      {/* Back button */}
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-accent transition-colors mb-8 font-display font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Study Library</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
        {/* Left Column: Previews and Gallery */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Main Preview Container */}
          <div className="aspect-[4/3] w-full rounded-3xl border border-gray-100 bg-gray-50 shadow-cyan-soft overflow-hidden watermark-container relative">
            <img
              src={previewGallery[activePreviewIndex]}
              alt={`${note.title} preview`}
              className="w-full h-full object-cover"
            />
            {/* Watermark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>

          {/* Thumbnail slides */}
          <div className="flex gap-3 overflow-x-auto py-1">
            {previewGallery.map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => setActivePreviewIndex(idx)}
                className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                  activePreviewIndex === idx
                    ? 'border-accent scale-95 shadow-cyan-soft'
                    : 'border-transparent hover:border-gray-200'
                }`}
              >
                <img src={imgUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <p className="text-gray-400 text-[10px] font-sans text-center mt-2 italic">
            * Notes PDF will be sent to your email within minutes of purchase.
          </p>
        </div>

        {/* Right Column: Metadata and purchasing */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div>
            {/* Category badge */}
            <span className="inline-block bg-primary/5 text-primary text-[10px] font-display font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              {(note as any).course?.name || 'Medical Guide'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-primary tracking-tight leading-tight">
              {note.title}
            </h1>
            <div className="flex items-center gap-4 mt-3">
              <span className="font-display font-medium text-xs text-gray-500">
                Subject: <span className="text-primary font-semibold">{note.subject}</span>
              </span>
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
              <div className="flex items-center gap-1.5">
                <div className="flex text-accent">
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <span className="font-sans text-sm text-primary font-semibold">{averageRating}</span>
                <span className="text-xs text-gray-400 font-sans">({reviews.length} reviews)</span>
              </div>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs text-gray-400 font-sans block mb-1">PDF Email Delivery Price</span>
              <span className="font-display font-extrabold text-3xl text-primary">
                ₹{note.price}
              </span>
              <span className="text-[10px] text-gray-400 font-sans ml-2">Inc. of all taxes</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:w-auto w-full">
              <button
                onClick={handleBuyNow}
                className="btn-primary py-3.5 px-6 font-bold text-sm shadow-md"
              >
                Buy Now
              </button>
              {added ? (
                <Link
                  to="/cart"
                  className="btn-secondary py-3.5 px-6 font-bold text-sm flex items-center justify-center"
                >
                  Go to Cart
                </Link>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="btn-secondary py-3.5 px-6 font-bold text-sm"
                >
                  <ShoppingCart className="w-4.5 h-4.5" />
                  Add to Cart
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <h3 className="font-display font-bold text-base text-primary">About this Study Guide</h3>
            <p className="text-gray-600 text-sm leading-relaxed font-sans whitespace-pre-line">
              {note.description}
            </p>
          </div>

          {/* Feature List */}
          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-accent" />
              <span className="text-xs font-medium text-gray-600">Printable A4 PDF Format</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-accent" />
              <span className="text-xs font-medium text-gray-600">Instant Email Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Ratings section */}
      <section className="border-t border-gray-100 pt-16 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Reviews List */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <h2 className="text-2xl font-display font-bold text-primary">
              Student Reviews ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-2xl text-center text-gray-400 text-sm font-sans">
                No reviews yet. Be the first to purchase and review this note!
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="border border-gray-100 rounded-2xl p-5 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-display font-semibold text-sm text-primary">
                          {rev.user_name || 'Anonymous student'}
                        </h4>
                        <div className="flex text-accent mt-1">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed font-sans">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave a review Form */}
          <div className="lg:col-span-5 bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 className="font-display font-bold text-lg text-primary mb-4">
              Write a Review
            </h3>
            
            {user ? (
              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                {/* Rating selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-display font-semibold text-gray-400">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="text-accent hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newRating ? 'fill-current' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Box */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-display font-semibold text-gray-400">Your Review</label>
                  <textarea
                    placeholder="Provide details about your study experience with these notes..."
                    rows={4}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                    className="border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none px-4 py-3 rounded-xl text-xs bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-primary py-3 text-xs font-bold w-full disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-400 text-xs font-sans mb-4">
                  You must be logged in to leave a review.
                </p>
                <Link to="/login" className="btn-secondary py-2 text-xs font-bold w-full block">
                  Log In / Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related notes section */}
      {relatedNotes.length > 0 && (
        <section className="border-t border-gray-100 pt-16">
          <h2 className="text-2xl font-display font-bold text-primary mb-8">
            Related Study Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedNotes.map((relNote) => (
              <div
                key={relNote.id}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-cyan-hover transition-all duration-300 flex flex-col justify-between group"
              >
                <Link to={`/notes/${relNote.id}`} className="aspect-[4/3] overflow-hidden bg-gray-50 block">
                  <img
                    src={relNote.thumbnail_url}
                    alt={relNote.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                <div className="p-4 flex flex-col gap-3">
                  <div>
                    <span className="text-[9px] font-sans font-bold text-accent tracking-wider uppercase">
                      {relNote.subject}
                    </span>
                    <Link
                      to={`/notes/${relNote.id}`}
                      className="font-display font-bold text-sm text-primary hover:text-accent transition-colors mt-0.5 block line-clamp-1"
                    >
                      {relNote.title}
                    </Link>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-display font-extrabold text-sm text-primary">₹{relNote.price}</span>
                    <Link
                      to={`/notes/${relNote.id}`}
                      className="text-xs text-accent font-display font-bold hover:underline"
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
