import { useState, useEffect, memo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import type { Note } from '../../types';
import { Sparkles, ShoppingCart, Star } from 'lucide-react';

const RecommendationCard = memo(({ note, onAdd }: { note: Note; onAdd: (note: Note) => void }) => (
  <div
    className="border border-white/5 bg-[#102640] hover:border-primary/30 p-4 rounded-xl flex flex-col justify-between gap-3 transition-all duration-300 shadow-md hover:-translate-y-0.5"
  >
    <div className="flex gap-3">
      <img
        src={note.thumbnail_url}
        className="w-12 h-12 object-cover rounded-lg border border-white/5 shrink-0"
        alt=""
        loading="lazy"
      />
      <div className="min-w-0">
        <h4 className="font-display font-bold text-xs text-white line-clamp-1 leading-tight hover:text-primary transition-colors">
          {note.title}
        </h4>
        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted font-sans">
          <span>{note.subject}</span>
          <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
          <div className="flex items-center text-amber-400">
            <Star className="w-3 h-3 fill-current stroke-none" />
            <span className="font-semibold ml-0.5">4.8</span>
          </div>
        </div>
      </div>
    </div>

    <div className="flex justify-between items-center border-t border-white/5 pt-2.5 mt-1">
      <span className="font-display font-extrabold text-xs text-primary">
        ₹{note.price.toFixed(2)}
      </span>
      
      <button
        onClick={() => onAdd(note)}
        className="btn-secondary py-1.5 px-3 text-[10px] font-bold font-display flex items-center gap-1.5"
      >
        <ShoppingCart className="w-3 h-3 text-primary" />
        <span>Quick Add</span>
      </button>
    </div>
  </div>
));

RecommendationCard.displayName = 'RecommendationCard';

export default function Recommendations() {
  const { items, addItem } = useCartStore();
  const { addToast } = useToastStore();
  const [recommended, setRecommended] = useState<Note[]>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data: allNotes } = await supabase
          .from('notes')
          .select('*')
          .eq('status', 'active');

        if (!allNotes) return;

        // Filter out items already in the cart
        const cartIds = items.map(i => i.note.id);
        const candidates = allNotes.filter((n: any) => !cartIds.includes(n.id));

        // Group by relevance
        const cartCourseIds = items.map(i => i.note.course_id);
        const related = candidates.filter((n: any) => cartCourseIds.includes(n.course_id));

        // If we have related notes, show them, otherwise fallback to any candidates
        const finalSelection = related.length > 0 ? related : candidates;

        // Shuffle & slice 3 items
        setRecommended(finalSelection.sort(() => 0.5 - Math.random()).slice(0, 3));
      } catch (err) {
        console.error('Failed to load recommended items:', err);
      }
    };

    fetchRecommendations();
  }, [items]);

  const handleQuickAdd = useCallback((note: Note) => {
    addItem(note);
    addToast('success', 'Added to Cart', `${note.title} added to cart.`);
  }, [addItem, addToast]);

  if (recommended.length === 0) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-cyan-soft">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-accent animate-pulse" />
        <h3 className="font-display font-bold text-sm text-primary">
          You May Also Like (AI Recommendations)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommended.map((note) => (
          <RecommendationCard
            key={note.id}
            note={note}
            onAdd={handleQuickAdd}
          />
        ))}
      </div>
    </div>
  );
}
