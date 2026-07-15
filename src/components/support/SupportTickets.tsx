import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { LifeBuoy, Plus, Send, X, Circle, CheckCircle2, Clock, ArrowLeft } from 'lucide-react';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  last_message_at: string;
  created_at: string;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

interface Props {
  mode: 'student' | 'admin';
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  awaiting_user: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-100 text-slate-500 border-slate-200',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'text-slate-400',
  normal: 'text-slate-600',
  high: 'text-amber-600',
  urgent: 'text-rose-600 font-bold',
};

export default function SupportTickets({ mode }: Props) {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New ticket form
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [creating, setCreating] = useState(false);

  const loadTickets = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let q = supabase
        .from('tickets')
        .select('*')
        .order('last_message_at', { ascending: false });
      if (mode === 'student') q = q.eq('user_id', user.id);
      if (filterStatus !== 'all') q = q.eq('status', filterStatus);
      const { data } = await q;
      setTickets((data || []) as Ticket[]);
    } catch (err: any) {
      addToast('error', 'Load Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setMessages((data || []) as Message[]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => { loadTickets(); }, [user?.id, filterStatus, mode]);
  useEffect(() => {
    if (selectedTicket) loadMessages(selectedTicket.id);
    else setMessages([]);
  }, [selectedTicket?.id]);

  const createTicket = async () => {
    if (!user?.id) return;
    if (!subject.trim() || !body.trim()) {
      addToast('error', 'Fields required', 'Please provide both subject and description.');
      return;
    }
    setCreating(true);
    try {
      // Generate a fallback ticket number in case RPC nextval isn't exposed
      const ticketNumber = `TKT-${Date.now().toString().slice(-8)}`;

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({
          ticket_number: ticketNumber,
          user_id: user.id,
          subject: subject.trim(),
          category,
          priority,
          status: 'open',
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_role: 'student',
        body: body.trim(),
      });

      addToast('success', 'Ticket Created', `Reference: ${ticket.ticket_number}`);
      setShowNewModal(false);
      setSubject(''); setBody(''); setCategory('general'); setPriority('normal');
      loadTickets();
      setSelectedTicket(ticket as Ticket);
    } catch (err: any) {
      addToast('error', 'Create Failed', err.message);
    } finally {
      setCreating(false);
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !user?.id || !reply.trim()) return;
    setSending(true);
    try {
      const senderRole = mode === 'admin' ? 'admin' : 'student';
      await supabase.from('ticket_messages').insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        sender_role: senderRole,
        body: reply.trim(),
      });

      // Update ticket's last_message_at + status
      const newStatus = mode === 'admin' ? 'awaiting_user' : 'in_progress';
      await supabase
        .from('tickets')
        .update({ last_message_at: new Date().toISOString(), status: newStatus })
        .eq('id', selectedTicket.id);

      setReply('');
      loadMessages(selectedTicket.id);
      loadTickets();
    } catch (err: any) {
      addToast('error', 'Send Failed', err.message);
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async (status: 'resolved' | 'closed') => {
    if (!selectedTicket) return;
    try {
      await supabase
        .from('tickets')
        .update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null })
        .eq('id', selectedTicket.id);
      addToast('success', 'Ticket Updated', `Marked as ${status}.`);
      loadTickets();
      setSelectedTicket({ ...selectedTicket, status });
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    }
  };

  return (
    <div data-testid={`support-tickets-${mode}`} className={mode === 'admin' ? 'p-6 lg:p-10' : ''}>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {selectedTicket && (
            <button
              onClick={() => setSelectedTicket(null)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              data-testid="tickets-back-btn"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="font-display font-extrabold text-xl text-slate-900 flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-cyan-500" />
              {mode === 'admin' ? 'Support Tickets' : 'My Support'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'admin' ? 'Respond to student queries and resolve issues.' : 'Contact our team for help with orders, downloads, or payments.'}
            </p>
          </div>
        </div>
        {mode === 'student' && !selectedTicket && (
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold"
            data-testid="ticket-new-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            New Ticket
          </button>
        )}
      </div>

      {!selectedTicket ? (
        <>
          {/* Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(['all', 'open', 'in_progress', 'awaiting_user', 'resolved', 'closed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filterStatus === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                data-testid={`ticket-filter-${s}`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Ticket list */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {tickets.length === 0 && !loading && (
              <div className="p-12 text-center text-slate-400 text-sm">
                {mode === 'admin' ? 'No tickets found.' : 'You haven\'t opened any support tickets yet.'}
              </div>
            )}
            <div className="divide-y divide-slate-100">
              {tickets.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50/50 flex items-center justify-between"
                  data-testid={`ticket-row-${t.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-slate-400">{t.ticket_number}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${STATUS_STYLES[t.status] || 'bg-slate-50'}`}>
                        {t.status === 'resolved' || t.status === 'closed' ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        {t.status.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] uppercase font-bold ${PRIORITY_STYLES[t.priority]}`}>{t.priority}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-800 truncate">{t.subject}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Last activity: {new Date(t.last_message_at).toLocaleString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        // Thread view
        <div className="bg-white border border-slate-200 rounded-2xl">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] text-slate-400">{selectedTicket.ticket_number}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${STATUS_STYLES[selectedTicket.status]}`}>
                  {selectedTicket.status.replace('_', ' ')}
                </span>
              </div>
              <div className="font-semibold text-slate-800">{selectedTicket.subject}</div>
            </div>
            {mode === 'admin' && (
              <div className="flex gap-2">
                <button
                  onClick={() => closeTicket('resolved')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase rounded-lg"
                  data-testid="ticket-resolve-btn"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => closeTicket('closed')}
                  className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-[10px] font-bold uppercase rounded-lg"
                  data-testid="ticket-close-btn"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="p-5 max-h-[500px] overflow-y-auto space-y-4" data-testid="ticket-messages">
            {messages.map(m => {
              const isCurrentUser = m.sender_id === user?.id;
              const isAdmin = m.sender_role === 'admin';
              return (
                <div key={m.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isAdmin
                      ? 'bg-cyan-50 border border-cyan-100'
                      : isCurrentUser
                      ? 'bg-primary text-white'
                      : 'bg-slate-100'
                  }`}>
                    <div className={`text-[10px] uppercase font-semibold mb-1 ${isCurrentUser && !isAdmin ? 'text-white/70' : 'text-slate-500'}`}>
                      {m.sender_role} · {new Date(m.created_at).toLocaleString()}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply */}
          {selectedTicket.status !== 'closed' && (
            <div className="border-t border-slate-100 p-4">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Type your reply..."
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                data-testid="ticket-reply-input"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                  data-testid="ticket-reply-send"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? 'Sending…' : 'Send Reply'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => !creating && setShowNewModal(false)}
          data-testid="new-ticket-modal"
        >
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowNewModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-cyan-500" />
              New Support Ticket
            </h3>

            <label className="block text-xs font-semibold text-slate-500 mb-1">Subject *</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary mb-3"
              data-testid="new-ticket-subject"
            />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none" data-testid="new-ticket-category">
                  <option value="general">General</option>
                  <option value="payment">Payment</option>
                  <option value="download">Download</option>
                  <option value="account">Account</option>
                  <option value="seller">Seller</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none" data-testid="new-ticket-priority">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <label className="block text-xs font-semibold text-slate-500 mb-1">Describe your issue *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Please provide as much detail as possible..."
              rows={5}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary resize-none"
              data-testid="new-ticket-body"
            />

            <button
              onClick={createTicket}
              disabled={creating}
              className="w-full mt-4 py-3 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-xl disabled:opacity-50"
              data-testid="new-ticket-submit"
            >
              {creating ? <Clock className="w-4 h-4 animate-pulse inline mr-1.5" /> : null}
              {creating ? 'Creating…' : 'Create Ticket'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
