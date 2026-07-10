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
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-cyan-soft flex flex-col gap-5">
      <h3 className="font-display font-extrabold text-base text-primary border-b border-gray-50 pb-3">
        Secure Checkout Details
      </h3>

      <div className="flex flex-col gap-4 text-xs">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="font-display font-semibold text-gray-400">Full Name</label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3.5 border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl bg-white text-primary"
            />
            <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            {name.trim().length >= 3 && (
              <span className="absolute right-3.5 top-3.5 text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            )}
          </div>
        </div>

        {/* Email Address */}
        <div className="flex flex-col gap-1.5">
          <label className="font-display font-semibold text-gray-400">Email Address</label>
          <div className="relative">
            <input
              type="email"
              placeholder="rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-10 py-3.5 border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl bg-white text-primary"
            />
            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            {isEmailValid && (
              <span className="absolute right-3.5 top-3.5 text-emerald-500">
                <CheckCircle2 className="w-5 h-5 fill-current text-white stroke-emerald-500" />
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 leading-normal block italic">
            📧 We will deliver your note PDF download links to this email. Please double-check it.
          </p>
        </div>

        {/* Phone Number */}
        <div className="flex flex-col gap-1.5">
          <label className="font-display font-semibold text-gray-400">Phone Number</label>
          <div className="relative">
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              required
              className="w-full pl-10 pr-4 py-3.5 border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl bg-white text-primary"
            />
            <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            {isPhoneValid && (
              <span className="absolute right-3.5 top-3.5 text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 leading-normal block">
            Used only for Razorpay checkout validation and SMS notifications.
          </p>
        </div>
      </div>
    </div>
  );
}
