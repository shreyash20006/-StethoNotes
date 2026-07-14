import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCartStore } from "../store/useCartStore";
import { useToastStore } from "../store/useToastStore";
import { Layers, ShoppingCart, Zap, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

interface Note {
  id: string;
  title: string;
  subject: string;
  price: number;
  thumbnail_url?: string;
}
interface Collection {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  bundle_price: number;
  items?: { note_id: string; note?: Note; }[];
}

export default function CollectionsPage() {
  const { addItem, isInCart } = useCartStore();
  const { addToast } = useToastStore();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("collections")
      .select("*, items:collection_items(note_id, note:notes(id,title,subject,price,thumbnail_url))")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: any }) => {
        if (data) setCollections(data);
        setLoading(false);
      });
  }, []);

  const handleBuyCollection = (col: Collection) => {
    const notes = (col.items || []).map(i => i.note).filter(Boolean) as Note[];
    if (notes.length === 0) return addToast("error", "Empty Collection", "No notes in this collection.");

    let added = 0;
    for (const note of notes) {
      if (!isInCart(note.id)) {
        addItem(note as any);
        added++;
      }
    }

    if (added === 0) {
      addToast("info", "Already in Cart", "All notes from this collection are already in your cart.");
    } else {
      addToast("success", `${added} Note${added > 1 ? "s" : ""} Added`, `Added ${added} note${added > 1 ? "s" : ""} from "${col.name}" to your cart.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#07091a] via-[#0f2046] to-[#07091a] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-bold uppercase tracking-widest">
            <Layers className="w-4 h-4" /> Study Collections
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Buy a Complete Study Pack</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Hand-picked bundles of notes for every semester and subject. Buy the entire collection and save more than buying individually.
          </p>
        </div>
      </div>

      {/* Collections */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin w-10 h-10 rounded-full border-t-2 border-b-2 border-cyan-500" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-20 h-20 rounded-full bg-white border border-gray-200 flex items-center justify-center mx-auto shadow">
              <Layers className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700">No Collections Yet</h2>
            <p className="text-gray-500">Check back soon â€” study packs are being curated.</p>
            <Link to="/courses" className="inline-block mt-4 px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors">Browse Individual Notes</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {collections.map(col => {
              const notes = (col.items || []).map(i => i.note).filter(Boolean) as Note[];
              const individualTotal = notes.reduce((s, n) => s + (n.price || 0), 0);
              const savings = individualTotal - col.bundle_price;
              const savingsPct = individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;
              const isExpanded = expandedId === col.id;

              return (
                <div key={col.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
                  {/* Cover Image */}
                  <div className="h-48 bg-gradient-to-br from-cyan-100 to-blue-200 relative overflow-hidden">
                    {col.cover_url ? (
                      <img src={col.cover_url} alt={col.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Layers className="w-16 h-16 text-cyan-300" />
                      </div>
                    )}
                    {savingsPct > 0 && (
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Save {savingsPct}%
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <h2 className="text-white font-bold text-xl drop-shadow">{col.name}</h2>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4">
                    {col.description && <p className="text-gray-600 text-sm">{col.description}</p>}

                    {/* Stats Row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-xs font-semibold">
                        <BookOpen className="w-3.5 h-3.5" /> {notes.length} Notes Included
                      </span>
                      {savings > 0 && (
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                          You Save &#x20B9;{savings}
                        </span>
                      )}
                    </div>

                    {/* Notes List (expandable) */}
                    <div>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : col.id)}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-cyan-600 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {isExpanded ? "Hide notes" : `View all ${notes.length} notes`}
                      </button>
                      {isExpanded && (
                        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
                          {notes.map(note => (
                            <Link
                              key={note.id}
                              to={`/notes/${note.id}`}
                              className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 hover:border-cyan-300 hover:bg-cyan-50/30 transition-all group"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-cyan-700 transition-colors">{note.title}</p>
                                <p className="text-[10px] text-gray-400">{note.subject}</p>
                              </div>
                              <span className="text-xs font-bold text-gray-600 font-sans shrink-0">&#x20B9;{note.price}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-2xl font-bold text-gray-900 font-sans">&#x20B9;{col.bundle_price}</p>
                        {individualTotal > col.bundle_price && (
                          <p className="text-xs text-gray-400 line-through font-sans">&#x20B9;{individualTotal} if bought separately</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleBuyCollection(col)}
                        className="flex items-center gap-2 px-5 py-3 bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white rounded-2xl font-bold text-sm transition-all shadow-md hover:shadow-cyan-200"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Buy Full Collection
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}