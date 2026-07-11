import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { Note, Course } from '../../types';
import { useToastStore } from '../../store/useToastStore';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Trash2, Edit2, CheckCircle2, Plus,
  Download, Upload, Copy, FileSpreadsheet, X, Save
} from 'lucide-react';

interface RichTextToolbarProps {
  onCommand: (command: string, value?: string) => void;
}

function RichTextToolbar({ onCommand }: RichTextToolbarProps) {
  return (
    <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b border-slate-200 rounded-t-xl text-slate-600">
      {[
        { label: "B", cmd: "bold", title: "Bold" },
        { label: "I", cmd: "italic", title: "Italic" },
        { label: "U", cmd: "underline", title: "Underline" },
        { label: "H1", cmd: "formatBlock", val: "H1", title: "Heading 1" },
        { label: "H2", cmd: "formatBlock", val: "H2", title: "Heading 2" },
        { label: "• List", cmd: "insertUnorderedList", title: "Bullet List" },
        { label: "1. List", cmd: "insertOrderedList", title: "Numbered List" },
        { label: "</>", cmd: "formatBlock", val: "PRE", title: "Code Block" },
        { label: "Link", cmd: "createLink", val: "prompt", title: "Insert Link" }
      ].map((btn, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => {
            if (btn.cmd === 'createLink') {
              const url = prompt('Enter link URL:');
              if (url) onCommand(btn.cmd, url);
            } else {
              onCommand(btn.cmd, btn.val);
            }
          }}
          title={btn.title}
          className="px-2 py-1 hover:bg-slate-200 rounded text-xs font-semibold font-mono"
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

export default function NotesManager() {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  
  // Bulk Selection
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  
  // Drawer & Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  // Note Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('1st Semester');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<'active' | 'draft'>('active');
  
  // Files
  const [pdfUrl, setPdfUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  
  // SEO params
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');

  // Editor ref
  const editorRef = useRef<HTMLDivElement>(null);

  // Import State
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importReport, setImportReport] = useState<string[]>([]);

  useEffect(() => {
    fetchNotesData();
  }, []);

  const fetchNotesData = async () => {
    setLoading(true);
    try {
      const { data: notesData } = await supabase.from('notes').select('*');
      const { data: coursesData } = await supabase.from('courses').select('*');
      if (notesData) setNotes(notesData);
      if (coursesData) {
        setCourses(coursesData);
        if (coursesData.length > 0) setCourseId(coursesData[0].id);
      }
    } catch (err) {
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommand = (cmd: string, val: string = '') => {
    document.execCommand(cmd, false, val);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get rich editor content
    const richDesc = editorRef.current?.innerHTML || description;

    if (!title.trim() || !price.trim() || !subject.trim()) {
      addToast('error', 'Missing Fields', 'Please complete note Title, Subject, and Price.');
      return;
    }

    const payload = {
      title,
      description: richDesc,
      course_id: courseId,
      subject,
      semester,
      price: Number(price),
      status,
      pdf_url: pdfUrl || 'pdfs/anatomy_upper_limb.pdf', // Seed safe fallback
      thumbnail_url: thumbnailUrl || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400',
      preview_images: previewImages.length > 0 ? previewImages : [
        'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&q=80&w=400'
      ]
    };

    try {
      if (editingNote) {
        // UPDATE
        const { error } = await supabase
          .from('notes')
          .update(payload)
          .eq('id', editingNote.id);
        if (error) throw error;
        
        // Save SEO Meta
        await supabase.from('seo_metadata').upsert({
          path: `/notes/${editingNote.id}`,
          meta_title: seoTitle || title,
          meta_description: seoDesc || richDesc.substring(0, 150),
          meta_keywords: seoKeywords,
          canonical_url: canonicalUrl
        });

        addToast('success', 'Note Updated', 'The study notes details were updated successfully.');
      } else {
        // CREATE
        const newId = `n-${Math.random().toString(36).substr(2, 9)}`;
        const { error } = await supabase
          .from('notes')
          .insert({ id: newId, ...payload });
        if (error) throw error;

        // Save SEO Meta
        await supabase.from('seo_metadata').upsert({
          path: `/notes/${newId}`,
          meta_title: seoTitle || title,
          meta_description: seoDesc || richDesc.substring(0, 150),
          meta_keywords: seoKeywords,
          canonical_url: canonicalUrl
        });

        addToast('success', 'Note Created', 'The new note was published successfully.');
      }

      setIsDrawerOpen(false);
      setEditingNote(null);
      clearForm();
      fetchNotesData();
    } catch (err: any) {
      addToast('error', 'Operation Failed', err.message);
    }
  };

  const clearForm = () => {
    setTitle('');
    setDescription('');
    setSubject('');
    setSemester('1st Semester');
    setPrice('');
    setStatus('active');
    setPdfUrl('');
    setThumbnailUrl('');
    setPreviewImages([]);
    setSeoTitle('');
    setSeoDesc('');
    setSeoKeywords('');
    setCanonicalUrl('');
    if (editorRef.current) editorRef.current.innerHTML = '';
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setDescription(note.description);
    setCourseId(note.course_id);
    setSubject(note.subject);
    setSemester(note.semester || '1st Semester');
    setPrice(note.price.toString());
    setStatus(note.status);
    setPdfUrl(note.pdf_url);
    setThumbnailUrl(note.thumbnail_url);
    setPreviewImages(note.preview_images || []);
    setIsDrawerOpen(true);
    
    // Set rich text content on editor load
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = note.description;
    }, 100);
  };

  const handleDuplicate = async (note: Note) => {
    try {
      const newId = `n-${Math.random().toString(36).substr(2, 9)}`;
      const { error } = await supabase.from('notes').insert({
        ...note,
        id: newId,
        title: `${note.title} (Copy)`,
        created_at: new Date().toISOString()
      });
      if (error) throw error;

      addToast('success', 'Note Duplicated', `Created a copy of ${note.title}.`);
      fetchNotesData();
    } catch (err: any) {
      addToast('error', 'Duplication Failed', err.message);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const { error } = await supabase.from('notes').delete().eq('id', noteId);
      if (error) throw error;

      addToast('info', 'Note Deleted', 'The note was successfully removed.');
      fetchNotesData();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  // Bulk Operations
  const toggleSelectNote = (id: string) => {
    setSelectedNoteIds(prev => 
      prev.includes(id) ? prev.filter(nid => nid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedNoteIds.length === filteredNotes.length) {
      setSelectedNoteIds([]);
    } else {
      setSelectedNoteIds(filteredNotes.map(n => n.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNoteIds.length === 0) return;
    if (!confirm(`Are you sure you want to bulk-delete ${selectedNoteIds.length} notes?`)) return;

    try {
      const { error } = await supabase.from('notes').delete().in('id', selectedNoteIds);
      if (error) throw error;

      addToast('info', 'Bulk Deleted', `Successfully deleted ${selectedNoteIds.length} notes.`);
      setSelectedNoteIds([]);
      fetchNotesData();
    } catch (err: any) {
      addToast('error', 'Bulk Delete Failed', err.message);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedNoteIds.length === 0) return;
    try {
      const { error } = await supabase
        .from('notes')
        .update({ status: 'active' })
        .in('id', selectedNoteIds);
      if (error) throw error;

      addToast('success', 'Bulk Published', `Activated status for ${selectedNoteIds.length} notes.`);
      setSelectedNoteIds([]);
      fetchNotesData();
    } catch (err: any) {
      addToast('error', 'Bulk Publish Failed', err.message);
    }
  };

  // CSV Import/Export
  const handleExportCSV = () => {
    let csv = 'ID,Title,Subject,Semester,Price,Status,Downloads,Revenue\n';
    filteredNotes.forEach(n => {
      csv += `"${n.id}","${n.title}","${n.subject}","${n.semester || ''}",${n.price},"${n.status}",0,0\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `StethoNotes_Products_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgress(0);
    setImportReport([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      
      const reports: string[] = [];
      const parsedNotes: any[] = [];

      // Skip CSV header line
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length < 5) continue;

        const csvTitle = cols[0];
        const csvSubject = cols[1];
        const csvSem = cols[2];
        const csvPrice = Number(cols[3]);
        const csvDesc = cols[4] || 'Imported note description.';

        // Validation duplicates check
        const isDuplicate = notes.some(n => n.title.toLowerCase() === csvTitle.toLowerCase());
        if (isDuplicate) {
          reports.push(`Row ${i} Ignored: Duplicate note title "${csvTitle}" exists.`);
          continue;
        }

        parsedNotes.push({
          id: `n-imp-${Math.random().toString(36).substr(2, 9)}`,
          title: csvTitle,
          description: csvDesc,
          course_id: courses[0]?.id || 'c1',
          subject: csvSubject,
          semester: csvSem || '1st Semester',
          price: isNaN(csvPrice) ? 199 : csvPrice,
          status: 'active',
          pdf_url: 'pdfs/anatomy_upper_limb.pdf',
          thumbnail_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400',
          preview_images: ['https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&q=80&w=400']
        });
      }

      if (parsedNotes.length > 0) {
        // Insert whitelisted records
        for (let j = 0; j < parsedNotes.length; j++) {
          const item = parsedNotes[j];
          await supabase.from('notes').insert(item);
          setImportProgress(Math.round(((j + 1) / parsedNotes.length) * 100));
        }
        reports.push(`Import complete. Successfully added ${parsedNotes.length} notes.`);
        fetchNotesData();
      } else {
        reports.push('Import failed. No valid new notes found in CSV.');
      }

      setImportReport(reports);
      setImporting(false);
    };

    reader.readAsText(file);
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse ? n.course_id === selectedCourse : true;
    const matchesSem = selectedSemester ? n.semester === selectedSemester : true;
    return matchesSearch && matchesCourse && matchesSem;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-display">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0c1230]">Notes Catalogue</h1>
          <p className="text-sm text-slate-500 mt-1">Manage notes listings, bulk publish resources, and configure SEO.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { clearForm(); setEditingNote(null); setIsDrawerOpen(true); }}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-750 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Study Note</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search bar */}
          <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 bg-slate-50/20"
            />
          </div>

          {/* Course filter */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-cyan-500 bg-slate-50/20"
          >
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Semester filter */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-cyan-500 bg-slate-50/20"
          >
            <option value="">All Semesters</option>
            {['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'].map(sem => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>

          {/* BULK ACTIONS */}
          {selectedNoteIds.length > 0 && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">{selectedNoteIds.length} Selected</span>
              <button
                onClick={handleBulkPublish}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border border-emerald-100"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publish</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="p-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border border-red-150"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* CSV Import widget */}
        <div className="border-t border-slate-50 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileSpreadsheet className="w-4 h-4 text-cyan-600" />
            <span>Need to upload in bulk? Import notes from spreadsheet {importProgress > 0 && `(${importProgress}%)`}:</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors border border-slate-250 flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              <span>{importing ? 'Importing...' : 'Upload CSV'}</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                disabled={importing}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {importReport.length > 0 && (
          <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl space-y-1.5 text-xs text-slate-600 font-sans max-h-32 overflow-y-auto">
            <h4 className="font-semibold text-slate-800">CSV Import Log Report:</h4>
            {importReport.map((rpt, idx) => <p key={idx}>{rpt}</p>)}
          </div>
        )}
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                <th className="px-6 py-4 text-center shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedNoteIds.length === filteredNotes.length && filteredNotes.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-cyan-600"
                  />
                </th>
                <th className="px-6 py-4">Thumbnail</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Semester</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs text-slate-800">
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-450">No note matching search criteria.</td>
                </tr>
              ) : (
                filteredNotes.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50/40">
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedNoteIds.includes(n.id)}
                        onChange={() => toggleSelectNote(n.id)}
                        className="rounded border-slate-300 text-cyan-600"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <img src={n.thumbnail_url} alt={n.title} className="w-10 h-10 rounded-lg object-cover border border-slate-100" />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 truncate max-w-[200px]">{n.title}</p>
                      <span className="text-[10px] text-slate-400">ID: {n.id}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{n.subject}</td>
                    <td className="px-6 py-4 text-slate-450 font-sans">{n.semester || '1st Semester'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 font-sans">₹{n.price}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        n.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(n)}
                          className="p-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 hover:border-cyan-200 rounded-lg transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(n)}
                          className="p-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg transition-all"
                          title="Duplicate note"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="p-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-650 hover:bg-red-50 hover:border-red-150 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT DRAWER FOR ADD/EDIT NOTE */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900 z-50 pointer-events-auto"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{editingNote ? 'Edit Study Note' : 'Publish New Note'}</h3>
                  <p className="text-xs text-slate-450 mt-0.5">Define metadata, tags, and document references.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-slate-450 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body Scroll */}
              <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-6 space-y-6">
                {/* 1. Core Fields */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Core Content</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Note Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Pathology Cardiovascular Notes"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 bg-slate-50/20"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Course Type</label>
                      <select
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-cyan-500 bg-slate-50/20"
                      >
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Subject Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Pathology"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 bg-slate-50/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Semester</label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-cyan-500 bg-slate-50/20"
                      >
                        {['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'].map(sem => (
                          <option key={sem} value={sem}>{sem}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Note Price (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 299"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 bg-slate-50/20"
                        required
                      />
                    </div>
                  </div>

                  {/* Rich Text Editor */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Note Description (Rich Text Editor)</label>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <RichTextToolbar onCommand={handleCommand} />
                      <div
                        ref={editorRef}
                        contentEditable
                        className="p-4 text-xs min-h-36 max-h-56 overflow-y-auto focus:outline-none text-slate-800 leading-relaxed font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Media Upload simulation paths */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-2">Media & Documents</h4>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">PDF File Storage Path</label>
                      <input
                        type="text"
                        placeholder="e.g. pdfs/my_notes.pdf"
                        value={pdfUrl}
                        onChange={(e) => setPdfUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none bg-slate-50/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Cover Thumbnail Image URL</label>
                      <input
                        type="text"
                        placeholder="e.g. https://images.unsplash.com/..."
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans focus:outline-none bg-slate-50/20"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. SEO Settings */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-2">SEO Configurations</h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">SEO Custom Title</label>
                      <input
                        type="text"
                        placeholder="Target SEO Meta Title"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none bg-slate-50/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">SEO Meta Description</label>
                      <textarea
                        placeholder="Target SEO Description (150 chars)..."
                        rows={2}
                        value={seoDesc}
                        onChange={(e) => setSeoDesc(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none bg-slate-50/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Switch */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Catalog Visibility</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none bg-slate-50/20 font-semibold"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>

                {/* Submit button */}
                <div className="flex gap-3 pt-6 border-t border-slate-100 mt-8">
                  <button
                    type="submit"
                    className="flex-grow py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingNote ? 'Save Updates' : 'Publish Note'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-6 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
