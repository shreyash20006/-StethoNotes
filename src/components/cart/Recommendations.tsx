import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import type { Note } from '../../types';
import { Sparkles, ShoppingCart, Star } from 'lucide-react';

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

  const handleQuickAdd = (note: Note) => {
    addItem(note);
    addToast('success', 'Added to Cart', `"${note.title}" added to your study bag.`);
  };

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
          <div
            key={note.id}
            className="border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-gray-150 p-4 rounded-xl flex flex-col justify-between gap-3 transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex gap-3">
              <img
                src={note.thumbnail_url}
                className="w-12 h-12 object-cover rounded-lg border border-gray-100 shrink-0"
                alt=""
              />
              <div className="min-w-0">
                <h4 className="font-display font-bold text-xs text-primary line-clamp-2 leading-tight">
                  {note.title}
                </h4>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 font-sans">
                  <span>{note.subject}</span>
                  <div className="w-1 h-1 bg-gray-200 rounded-full" />
                  <div className="flex items-center text-amber-500">
                    <Star className="w-3 h-3 fill-current stroke-none" />
                    <span className="font-semibold ml-0.5 text-gray-600">4.8</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-gray-50 pt-2.5 mt-1">
              <span className="font-display font-extrabold text-xs text-primary">
                ₹{note.price.toFixed(2)}
              </span>
              
              <button
                onClick={() => handleQuickAdd(note)}
                className="btn-secondary py-1 px-3 text-[10px] font-bold font-display flex items-center gap-1"
              >
                <ShoppingCart className="w-3 h-3 text-accent" />
                <span>Quick Add</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
