import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import type { Note } from '../../types';
import { Star, ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecentlyViewed() {
  const { addItem, items } = useCartStore();
  const { addToast } = useToastStore();
  const [recent, setRecent] = useState<Note[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        // Retrieve recently viewed IDs
        const idsRaw = localStorage.getItem('stetho_recently_viewed');
        let viewedIds: string[] = idsRaw ? JSON.parse(idsRaw) : [];

        const { data: allNotes } = await supabase
          .from('notes')
          .select('*')
          .eq('status', 'active');

        if (!allNotes) return;

        let selected: Note[] = [];
        if (viewedIds.length > 0) {
          selected = allNotes.filter((n: any) => viewedIds.includes(n.id));
        }

        // Fallback to seeding the first 4 active notes if none viewed yet
        if (selected.length === 0) {
          selected = allNotes.slice(0, 4);
        }

        // Exclude notes already in the cart
        const cartIds = items.map(i => i.note.id);
        const filtered = selected.filter((n: any) => !cartIds.includes(n.id));

        setRecent(filtered.slice(0, 4));
      } catch (err) {
        console.error('Failed to load recently viewed items:', err);
      }
    };

    fetchRecent();
  }, [items]);

  const handleQuickAdd = (note: Note) => {
    addItem(note);
    addToast('success', 'Added to Cart', `"${note.title}" added to your study bag.`);
  };

  if (recent.length === 0) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-cyan-soft">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-accent animate-pulse" />
        <h3 className="font-display font-bold text-sm text-primary">
          Recently Viewed Study Guides
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {recent.map((note) => (
          <div
            key={note.id}
            className="border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-gray-150 p-3 rounded-xl flex flex-col justify-between gap-3.5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div>
              <Link to={`/notes/${note.id}`} className="block relative h-20 rounded-lg overflow-hidden border border-gray-100 bg-white">
                <img
                  src={note.thumbnail_url}
                  className="w-full h-full object-cover"
                  alt={note.title}
                />
              </Link>
              <h4 className="font-display font-bold text-[11px] text-primary mt-2 line-clamp-2 leading-tight">
                {note.title}
              </h4>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-display font-extrabold text-primary">
                  ₹{note.price.toFixed(2)}
                </span>
                <div className="flex items-center text-amber-500">
                  <Star className="w-3 h-3 fill-current stroke-none" />
                  <span className="font-semibold ml-0.5 text-gray-500">4.8</span>
                </div>
              </div>

              <button
                onClick={() => handleQuickAdd(note)}
                className="btn-secondary w-full py-1.5 px-3 text-[10px] font-bold font-display flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-accent" />
                <span>Quick Add</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
