import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useToastStore } from "../../store/useToastStore";
import { Plus, Trash2, Edit2, Layers, ToggleLeft, ToggleRight, X, CheckSquare, Square, Image } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  bundle_price: number;
  is_active: boolean;
  created_at: string;
  items?: CollectionItem[];
}
interface CollectionItem {
  id: string;
  collection_id: string;
  note_id: string;
  note?: { id: string; title: string; subject: string; price: number; };
}
interface Note {
  id: string;
  title: string;
  subject: string;
  price: number;
}

const emptyForm = { name: "", description: "", cover_url: "", bundle_price: 0, is_active: true };

export default function CollectionsManager() {
  const { addToast } = useToastStore();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [noteSearch, setNoteSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: cols }, { data: notes }] = await Promise.all([
        supabase.from("collections").select("*, items:collection_items(*, note:notes(id,title,subject,price))").order("created_at", { ascending: false }),
        supabase.from("notes").select("id,title,subject,price").eq("status", "active").order("title"),
      ]);
      if (cols) setCollections(cols);
      if (notes) setAllNotes(notes);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditingId(null); setForm({ ...emptyForm }); setSelectedNoteIds([]); setNoteSearch(""); setShowForm(true); };
  const openEdit = (col: Collection) => {
    setEditingId(col.id);
    setForm({ name: col.name, description: col.description || "", cover_url: col.cover_url || "", bundle_price: col.bundle_price, is_active: col.is_active });
    setSelectedNoteIds(col.items?.map(i => i.note_id) || []);
    setNoteSearch(""); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };
  const toggleNote = (id: string) => setSelectedNoteIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return addToast("error", "Validation", "Name is required.");
    if (selectedNoteIds.length === 0) return addToast("error", "Validation", "Select at least one note.");
    if (form.bundle_price <= 0) return addToast("error", "Validation", "Bundle price must be > 0.");
    setSaving(true);
    try {
      let collId = editingId;
      if (editingId) {
        const { error } = await supabase.from("collections").update({ name: form.name.trim(), description: form.description || null, cover_url: form.cover_url || null, bundle_price: form.bundle_price, is_active: form.is_active, updated_at: new Date().toISOString() }).eq("id", editingId);
        if (error) throw error;
        await supabase.from("collection_items").delete().eq("collection_id", editingId);
      } else {
        const { data, error } = await supabase.from("collections").insert({ name: form.name.trim(), description: form.description || null, cover_url: form.cover_url || null, bundle_price: form.bundle_price, is_active: form.is_active }).select("id").single();
        if (error) throw error;
        collId = data.id;
      }
      const rows = selectedNoteIds.map((note_id, pos) => ({ collection_id: collId, note_id, position: pos }));
      const { error: ie } = await supabase.from("collection_items").insert(rows);
      if (ie) throw ie;
      addToast("success", editingId ? "Updated" : "Created", `"${form.name}" saved.`);
      closeForm(); fetchData();
    } catch (err: any) { addToast("error", "Save Failed", err.message); }
    finally { setSaving(false); }
  };

  const handleToggle = async (col: Collection) => {
    await supabase.from("collections").update({ is_active: !col.is_active }).eq("id", col.id);
    setCollections(prev => prev.map(c => c.id === col.id ? { ...c, is_active: !c.is_active } : c));
  };

  const handleDelete = async (col: Collection) => {
    if (!confirm(`Delete "${col.name}"?`)) return;
    await supabase.from("collections").delete().eq("id", col.id);
    setCollections(prev => prev.filter(c => c.id !== col.id));
    addToast("success", "Deleted", `"${col.name}" removed.`);
  };

  const filteredNotes = allNotes.filter(n => n.title.toLowerCase().includes(noteSearch.toLowerCase()) || n.subject.toLowerCase().includes(noteSearch.toLowerCase()));
  const individualTotal = selectedNoteIds.reduce((s, id) => s + (allNotes.find(n => n.id === id)?.price || 0), 0);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 rounded-full border-t-2 border-b-2 border-cyan-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0c1230]">Collections</h1>
          <p className="text-sm text-slate-500 mt-1">Bundle notes into themed collections students can buy at a discounted price.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> New Collection
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center"><Layers className="w-8 h-8 text-slate-400" /></div>
          <div><p className="font-semibold text-slate-700">No collections yet</p><p className="text-sm text-slate-400 mt-1">Create a bundle for students to buy as a set.</p></div>
          <button onClick={openCreate} className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 transition-colors">Create First Collection</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {collections.map(col => {
            const indivTotal = col.items?.reduce((s, i) => s + (i.note?.price || 0), 0) || 0;
            const savings = indivTotal - col.bundle_price;
            return (
              <div key={col.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all ${col.is_active ? "border-slate-100" : "border-dashed border-slate-200 opacity-60"}`}>
                <div className="h-36 bg-gradient-to-br from-cyan-50 to-blue-100 relative overflow-hidden">
                  {col.cover_url ? <img src={col.cover_url} alt={col.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Layers className="w-12 h-12 text-cyan-300" /></div>}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => handleToggle(col)} className={`p-1.5 rounded-lg text-white ${col.is_active ? "bg-emerald-500" : "bg-slate-400"}`}>
                      {col.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                  </div>
                  {!col.is_active && <div className="absolute bottom-2 left-2"><span className="px-2 py-0.5 bg-slate-600 text-white text-[10px] font-bold rounded-full uppercase">Draft</span></div>}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{col.name}</h3>
                    {col.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{col.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 rounded-full text-[10px] font-bold">{col.items?.length || 0} notes</span>
                    {savings > 0 && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">Save &#x20B9;{savings}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-900 font-sans">&#x20B9;{col.bundle_price}</p>
                      {indivTotal > col.bundle_price && <p className="text-[10px] text-slate-400 line-through font-sans">&#x20B9;{indivTotal} individually</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(col)} className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-cyan-600 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(col)} className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? "Edit Collection" : "Create Collection"}</h2>
              <button onClick={closeForm} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">Collection Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. MBBS 1st Year Complete Pack" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 bg-slate-50/30" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What is included?" rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 bg-slate-50/30 resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">Cover Image URL</label>
                <div className="flex gap-3 items-center">
                  {form.cover_url ? <img src={form.cover_url} alt="preview" className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0" onError={e => (e.currentTarget.style.display = "none")} /> : <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><Image className="w-6 h-6 text-slate-300" /></div>}
                  <input type="url" value={form.cover_url} onChange={e => setForm(p => ({ ...p, cover_url: e.target.value }))} placeholder="https://..." className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 bg-slate-50/30" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">Bundle Price (&#x20B9;) *</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <input type="number" min={1} step={1} value={form.bundle_price} onChange={e => setForm(p => ({ ...p, bundle_price: Number(e.target.value) }))} className="w-36 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 bg-slate-50/30 font-sans" required />
                  {selectedNoteIds.length > 0 && <span className="text-xs text-slate-500 font-sans">Individual: <strong>&#x20B9;{individualTotal}</strong>{individualTotal > form.bundle_price && <span className="ml-1 text-emerald-600 font-bold">— Save &#x20B9;{individualTotal - form.bundle_price}</span>}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))} className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? "bg-cyan-500" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0"}`} />
                </button>
                <span className="text-sm font-semibold text-slate-700">{form.is_active ? "Active (visible on storefront)" : "Draft (hidden)"}</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Select Notes * ({selectedNoteIds.length} selected)</label>
                </div>
                <input type="text" value={noteSearch} onChange={e => setNoteSearch(e.target.value)} placeholder="Search notes..." className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-cyan-500 bg-slate-50/30 mb-2" />
                <div className="border border-slate-200 rounded-xl overflow-y-auto max-h-52 divide-y divide-slate-50">
                  {filteredNotes.map(note => {
                    const isSel = selectedNoteIds.includes(note.id);
                    return (
                      <div key={note.id} onClick={() => toggleNote(note.id)} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isSel ? "bg-cyan-50" : "hover:bg-slate-50"}`}>
                        {isSel ? <CheckSquare className="w-4 h-4 text-cyan-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-300 shrink-0" />}
                        <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-slate-800 truncate">{note.title}</p><p className="text-[10px] text-slate-400">{note.subject}</p></div>
                        <span className="text-xs font-bold text-slate-600 font-sans shrink-0">&#x20B9;{note.price}</span>
                      </div>
                    );
                  })}
                  {filteredNotes.length === 0 && <p className="text-center py-6 text-xs text-slate-400">No notes found.</p>}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                  {saving ? "Saving..." : editingId ? "Update Collection" : "Create Collection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}