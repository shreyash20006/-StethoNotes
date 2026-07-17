import { User, Mail, Phone, CheckCircle2 } from 'lucide-react';

interface CheckoutFormProps {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
}

export default function CheckoutForm({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone
}: CheckoutFormProps) {
  // Regex validations
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPhoneValid = /^[6-9]\d{9}$/.test(phone.trim()); // Standard Indian phone number format

  return (
    <div className="glass-card-v2 bg-card/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-white shadow-[0_0_50px_-12px_rgba(31,182,212,0.05)]">
      <h3 className="font-display font-extrabold text-base text-white border-b border-white/5 pb-3">
        Secure Checkout Details
      </h3>

      <div className="flex flex-col gap-4 text-xs">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="font-display font-semibold text-muted">Full Name</label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full pl-10 pr-10 py-3.5 bg-void/50 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none rounded-xl text-white transition-all duration-200"
            />
            <User className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
            {name.trim().length >= 3 && (
              <span className="absolute right-3.5 top-3.5 text-primary">
                <CheckCircle2 className="w-5 h-5 drop-shadow-[0_0_8px_rgba(31,182,212,0.5)]" />
              </span>
            )}
          </div>
        </div>

        {/* Email Address */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="font-display font-semibold text-muted">Email Address</label>
          <div className="relative">
            <input
              type="email"
              placeholder="rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-10 py-3.5 bg-void/50 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none rounded-xl text-white transition-all duration-200"
            />
            <Mail className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
            {isEmailValid && (
              <span className="absolute right-3.5 top-3.5 text-primary">
                <CheckCircle2 className="w-5 h-5 drop-shadow-[0_0_8px_rgba(31,182,212,0.5)]" />
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted leading-normal block italic mt-0.5">
            📧 We will deliver your note PDF download links to this email. Please double-check it.
          </p>
        </div>

        {/* Phone Number */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="font-display font-semibold text-muted">Phone Number</label>
          <div className="relative">
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              required
              className="w-full pl-10 pr-10 py-3.5 bg-void/50 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none rounded-xl text-white transition-all duration-200"
            />
            <Phone className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
            {isPhoneValid && (
              <span className="absolute right-3.5 top-3.5 text-primary">
                <CheckCircle2 className="w-5 h-5 drop-shadow-[0_0_8px_rgba(31,182,212,0.5)]" />
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted leading-normal block mt-0.5">
            Used only for Razorpay checkout validation and SMS notifications.
          </p>
        </div>
      </div>
    </div>
  );
}
