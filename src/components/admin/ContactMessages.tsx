import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToastStore } from '../../store/useToastStore';
import type { ContactMessage, ContactMessageReply } from '../../types';
import {
  Mail, Search, Archive, Trash2, Reply, Download, Eye, EyeOff,
  CheckCircle2, XCircle, Clock, Loader2, X, Send
} from 'lucide-react';

export default function ContactMessages() {
  const { addToast } = useToastStore();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [replies, setReplies] = useState<ContactMessageReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      addToast('error', 'Load Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const fetchReplies = async (messageId: string) => {
    const { data } = await supabase
      .from('contact_message_replies')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: true });
    setReplies(data || []);
  };

  const updateStatus = async (id: string, status: ContactMessage['status']) => {
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);
    if (error) { addToast('error', 'Update Failed', error.message); return; }
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    addToast('success', 'Updated', `Message marked as ${status}.`);
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Delete this message permanently?')) return;
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) { addToast('error', 'Delete Failed', error.message); return; }
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
    addToast('info', 'Deleted', 'Message removed.');
  };

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    setReplying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ messageId: selected.id, replyBody: replyText }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      addToast('success', 'Reply Sent', `Email ${result.emailStatus === 'delivered' ? 'delivered' : 'failed'}.`);
      setReplyText('');
      setShowReplyModal(false);
      fetchReplies(selected.id);
      updateStatus(selected.id, 'replied');
    } catch (err: any) {
      addToast('error', 'Reply Failed', err.message);
    } finally {
      setReplying(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Subject', 'Message', 'Status', 'Date'];
    const rows = filtered.map(m => [
      m.name, m.email, m.subject, `"${m.message.replace(/"/g, '""')}"`, m.status, m.created_at
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact-messages-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = messages.filter(m => {
    const matchSearch = !search || [m.name, m.email, m.subject, m.message].some(
      f => f.toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openMessage = (msg: ContactMessage) => {
    setSelected(msg);
    fetchReplies(msg.id);
    if (msg.status === 'unread') updateStatus(msg.id, 'read');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-cyan-400" />
            Contact Messages
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h2>
          <p className="text-slate-400 text-xs mt-1">{messages.length} total messages</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-500 outline-none"
        >
          <option value="all">All Status</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message list */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No messages found.</p>
            ) : filtered.map(msg => (
              <button
                key={msg.id}
                onClick={() => openMessage(msg)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selected?.id === msg.id
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {msg.status === 'unread' && <span className="w-2 h-2 bg-cyan-400 rounded-full shrink-0" />}
                      <span className="font-bold text-white text-sm truncate">{msg.subject}</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{msg.name} · {msg.email}</p>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2">{msg.message}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    msg.status === 'unread' ? 'bg-cyan-500/20 text-cyan-300' :
                    msg.status === 'replied' ? 'bg-emerald-500/20 text-emerald-300' :
                    msg.status === 'archived' ? 'bg-slate-600/50 text-slate-400' :
                    'bg-slate-700 text-slate-300'
                  }`}>{msg.status}</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-2">{new Date(msg.created_at).toLocaleString()}</p>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {selected ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-lg">{selected.subject}</h3>
                  <p className="text-slate-400 text-xs mt-1">{selected.name} · {selected.email}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{new Date(selected.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-4 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {selected.message}
              </div>

              {/* Reply history */}
              {replies.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Reply History</h4>
                  {replies.map(r => (
                    <div key={r.id} className="bg-slate-900/30 border border-slate-700/30 rounded-xl p-3">
                      <p className="text-slate-300 text-xs whitespace-pre-wrap">{r.reply_body}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px]">
                        {r.email_status === 'delivered' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : r.email_status === 'failed' ? (
                          <XCircle className="w-3 h-3 text-red-400" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-400" />
                        )}
                        <span className="text-slate-500 capitalize">{r.email_status}</span>
                        {r.sent_at && <span className="text-slate-600">· {new Date(r.sent_at).toLocaleString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/50">
                <button onClick={() => setShowReplyModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-colors">
                  <Reply className="w-3.5 h-3.5" /> Reply
                </button>
                {selected.status === 'unread' ? (
                  <button onClick={() => updateStatus(selected.id, 'read')} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl">
                    <Eye className="w-3.5 h-3.5" /> Mark Read
                  </button>
                ) : (
                  <button onClick={() => updateStatus(selected.id, 'unread')} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl">
                    <EyeOff className="w-3.5 h-3.5" /> Mark Unread
                  </button>
                )}
                <button onClick={() => updateStatus(selected.id, 'archived')} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl">
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
                <button onClick={() => deleteMessage(selected.id)} className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-xl">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center bg-slate-800/30 border border-slate-700/30 border-dashed rounded-2xl min-h-[300px]">
              <p className="text-slate-500 text-sm">Select a message to view details</p>
            </div>
          )}
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white">Reply to {selected.name}</h3>
              <button onClick={() => setShowReplyModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-slate-400 text-xs">Sending to: {selected.email}</p>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={6}
              placeholder="Type your reply..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm resize-none focus:border-cyan-500 outline-none"
            />
            <button
              onClick={handleReply}
              disabled={replying || !replyText.trim()}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {replying ? 'Sending...' : 'Send Email via Brevo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
