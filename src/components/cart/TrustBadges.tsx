import { ShieldCheck, Mail, CheckCircle2, Clock, Award } from 'lucide-react';

export default function TrustBadges() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-cyan-soft grid grid-cols-1 sm:grid-cols-5 gap-4">
      {/* Instant Email Delivery */}
      <div className="flex items-center sm:flex-col sm:text-center gap-3">
        <div className="w-10 h-10 bg-cyan-50 border border-cyan-100 text-accent rounded-xl flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-display font-extrabold text-primary">Instant Email Delivery</h4>
          <span className="text-[10px] text-gray-400 font-sans block mt-0.5">PDF guides sent within 5 mins</span>
        </div>
      </div>

      {/* Secure Payments */}
      <div className="flex items-center sm:flex-col sm:text-center gap-3">
        <div className="w-10 h-10 bg-cyan-50 border border-cyan-100 text-accent rounded-xl flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-display font-extrabold text-primary">Secure Payments</h4>
          <span className="text-[10px] text-gray-400 font-sans block mt-0.5">Powered by Razorpay API</span>
        </div>
      </div>

      {/* Verified Notes */}
      <div className="flex items-center sm:flex-col sm:text-center gap-3">
        <div className="w-10 h-10 bg-cyan-50 border border-cyan-100 text-accent rounded-xl flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-display font-extrabold text-primary">Verified Notes</h4>
          <span className="text-[10px] text-gray-400 font-sans block mt-0.5">Topper curated guides</span>
        </div>
      </div>

      {/* 48-Hour Download Access */}
      <div className="flex items-center sm:flex-col sm:text-center gap-3">
        <div className="w-10 h-10 bg-cyan-50 border border-cyan-100 text-accent rounded-xl flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-display font-extrabold text-primary">48h Signed Link Expiry</h4>
          <span className="text-[10px] text-gray-400 font-sans block mt-0.5">Secure links prevent piracy</span>
        </div>
      </div>

      {/* Trusted by Medical Students */}
      <div className="flex items-center sm:flex-col sm:text-center gap-3">
        <div className="w-10 h-10 bg-cyan-50 border border-cyan-100 text-accent rounded-xl flex items-center justify-center shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-display font-extrabold text-primary">Trusted by Medical Students</h4>
          <span className="text-[10px] text-gray-400 font-sans block mt-0.5">Curations checked by experts</span>
        </div>
      </div>
    </div>
  );
}
