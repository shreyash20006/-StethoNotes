import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, FileText, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Full name is required.';
    
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    
    if (!subject.trim()) newErrors.subject = 'Subject is required.';
    if (!message.trim()) newErrors.message = 'Message body cannot be empty.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    // Simulate sending time or prepare API call
    try {
      /*
      // FUTURE BREVO API CONFIGURATION:
      // You can replace this block with an Edge Function fetch or Brevo API call directly:
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });
      if (!response.ok) throw new Error('API dispatch failed');
      */

      // Fallback action for now: trigger mailto link to support email
      const emailBody = `Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0AMessage:%0D%0A${message}`;
      const mailtoUrl = `mailto:support@stethonotes.store?subject=${encodeURIComponent(subject)}&body=${emailBody}`;
      
      // Open default mail client
      window.location.href = mailtoUrl;

      // Set success state
      setSuccess(true);
      
      // Clear form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-10 shadow-cyan-soft relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-[100px] pointer-events-none" />

      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-display font-extrabold text-xl text-primary">Message Sent Successfully!</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
            Thank you for reaching out. We have opened your mail app to finalize delivery. Our support team will get back to you shortly.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="btn-secondary py-2.5 px-6 text-xs mt-4"
          >
            Send Another Message
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-xs sm:text-sm">
          <div className="mb-2">
            <h3 className="font-display font-extrabold text-xl text-primary tracking-tight">Send us a Message</h3>
            <p className="text-gray-400 text-xs mt-1">Have custom note requests or corporate inquiries?</p>
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display font-bold text-gray-500 text-xs">Full Name</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Dr. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border ${
                  errors.name ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
                } focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl bg-white text-primary text-xs`}
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
            {errors.name && <span className="text-red-500 text-[10px]">{errors.name}</span>}
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display font-bold text-gray-500 text-xs">Email Address</label>
            <div className="relative">
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border ${
                  errors.email ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
                } focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl bg-white text-primary text-xs`}
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
            {errors.email && <span className="text-red-500 text-[10px]">{errors.email}</span>}
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display font-bold text-gray-500 text-xs">Subject</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g., Note Download Issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border ${
                  errors.subject ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
                } focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl bg-white text-primary text-xs`}
              />
              <FileText className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
            {errors.subject && <span className="text-red-500 text-[10px]">{errors.subject}</span>}
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display font-bold text-gray-500 text-xs">Your Message</label>
            <div className="relative">
              <textarea
                placeholder="Write your request details here..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border ${
                  errors.message ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
                } focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl bg-white text-primary text-xs resize-none`}
              />
              <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
            {errors.message && <span className="text-red-500 text-[10px]">{errors.message}</span>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-3.5 mt-2 font-display font-bold text-xs w-full shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Opening mail app...' : 'Send Message'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
