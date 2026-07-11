import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 min-h-[8vh]">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 shadow-cyan-soft relative overflow-hidden">
        {/* Decorative accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-[100px] pointer-events-none" />

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-3xl text-primary tracking-tight">Privacy Policy</h1>
            <p className="text-gray-400 text-xs mt-1">Last Updated: July 11, 2026</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-gray-600 text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">1. Information We Collect</h2>
            <p>
              We collect information to provide better services to our users. This includes:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Personal details:</strong> Your name, email address, phone number, and account credentials.</li>
              <li><strong>Transaction Info:</strong> Order records and delivery states (processed securely via Razorpay). We do not store raw card numbers or banking secrets.</li>
              <li><strong>OAuth Profiles:</strong> If you sign in via Google, we retrieve your email address, name, and profile picture url to construct your student account.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">2. How We Use Information</h2>
            <p>
              Your data is utilized solely to power the StethoNotes study portal:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Processing your payments and dispatching purchased PDF notes to your email inbox.</li>
              <li>Validating your identity to secure downloads.</li>
              <li>Providing responsive student support and assistance.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">3. Information Sharing</h2>
            <p>
              We do not sell, lease, or distribute your email addresses or profiles to advertising companies. We share data only with trusted infrastructure providers required to operate the service (Supabase for databases, Brevo for order delivery, and Razorpay for payment validation).
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">4. Data Security</h2>
            <p>
              We implement industry-standard database connection encryption, secure server token access controls, and private file storage vaults to ensure your digital materials and purchase records remain completely secure.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">5. Contact Us</h2>
            <p>
              If you have any questions regarding your account data or privacy rights, please reach out to our team at <a href="mailto:support@stethonotes.store" className="text-accent hover:underline">support@stethonotes.store</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
