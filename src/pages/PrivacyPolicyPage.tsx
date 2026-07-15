import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 min-h-[8vh]" data-testid="privacy-policy-page">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 shadow-cyan-soft relative overflow-hidden">
        {/* Decorative accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-[100px] pointer-events-none" />

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-3xl text-primary tracking-tight">Privacy Policy</h1>
            <p className="text-gray-400 text-xs mt-1">Effective Date: January 15, 2026 · Last Updated: January 15, 2026</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-gray-600 text-sm leading-relaxed space-y-6">
          <section>
            <p>
              StethoNotes (&ldquo;<strong>StethoNotes</strong>&rdquo;, &ldquo;<strong>we</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;, or &ldquo;<strong>our</strong>&rdquo;) operates the website <a href="https://stethonotes.store" className="text-accent hover:underline">https://stethonotes.store</a> (the &ldquo;Service&rdquo;), an online marketplace for medical, paramedical, nursing and pharmaceutical study notes curated by university toppers and instructors. This Privacy Policy explains what information we collect, how we use it, how we protect it, and the choices you have regarding your data. By using the Service you agree to the practices described below.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">1. Information We Collect</h2>
            <p>We collect only the minimum information required to operate the Service:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Account details you provide:</strong> Full name, email address, phone number (optional), and password. Sellers additionally provide their qualification, institution, and payout details.</li>
              <li><strong>Google account data (only if you choose &ldquo;Sign in with Google&rdquo;):</strong> Your name, email address, Google profile picture URL, and Google account unique identifier. We request only the standard <code>openid</code>, <code>email</code> and <code>profile</code> OAuth scopes — nothing more.</li>
              <li><strong>Transaction data:</strong> Order ID, product purchased, order amount, and payment confirmation status. Card numbers, UPI PINs, net-banking credentials or wallet PINs are <strong>never</strong> seen or stored by StethoNotes — payments are handled entirely by Razorpay.</li>
              <li><strong>Usage & device data:</strong> Browser type, device type, referring page, pages viewed, and approximate location derived from IP address. This is used strictly for analytics and fraud prevention.</li>
              <li><strong>Support communications:</strong> Emails and messages you send us for support purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">2. How We Use Your Information</h2>
            <p>We use the information collected exclusively for the following purposes:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>To create and secure your student, seller or administrator account.</li>
              <li>To authenticate you when you log in (via password, email OTP, or Google Sign-In).</li>
              <li>To process purchases, deliver purchased PDF study notes, and email order receipts.</li>
              <li>To provide customer support and respond to your requests.</li>
              <li>To detect, prevent and investigate fraud, abuse and violations of our Terms of Service.</li>
              <li>To send transactional emails (order confirmations, password resets, receipts). We do <strong>not</strong> send marketing emails without your explicit opt-in.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">3. Google User Data — Limited Use Disclosure</h2>
            <p>
              StethoNotes&apos;s use and transfer of information received from Google APIs to any other app will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google API Services User Data Policy</a>, including the <strong>Limited Use requirements</strong>. Specifically:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>We use Google user data only to provide user-facing features of the StethoNotes application — namely to create your account, log you in, and display your name and profile picture inside the app.</li>
              <li>We do <strong>not</strong> transfer Google user data to third parties except (a) as necessary to provide or improve user-facing features, (b) to comply with applicable law, or (c) as part of a merger, acquisition, or sale of assets with notice to users.</li>
              <li>We do <strong>not</strong> use Google user data to serve ads, including retargeted, personalized or interest-based advertising.</li>
              <li>We do <strong>not</strong> allow humans to read Google user data unless we have your affirmative consent, it is necessary for security purposes, to comply with law, or the data is aggregated and used for internal operations in accordance with applicable privacy laws.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">4. How We Share Information</h2>
            <p>
              We do <strong>not</strong> sell, rent, or trade your personal information. We share limited data only with the following trusted service providers who are contractually bound to protect it:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Supabase</strong> — hosted database and authentication provider (stores account records).</li>
              <li><strong>Razorpay</strong> — payment gateway (processes payments; PCI-DSS Level 1 certified).</li>
              <li><strong>Brevo (Sendinblue)</strong> — transactional email delivery (sends order receipts and password reset emails).</li>
              <li><strong>Cloudinary</strong> — hosts non-sensitive static assets such as study-note preview thumbnails.</li>
              <li><strong>Legal authorities</strong> — only when compelled by a valid legal request or to protect the rights, property or safety of StethoNotes, our users, or the public.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">5. Data Retention</h2>
            <p>
              We retain your account information for as long as your account is active. Order records and invoices are retained for up to 7 years to comply with Indian taxation and consumer protection laws. If you delete your account, all personally identifiable data (name, email, phone, Google profile fields) is permanently erased within 30 days, and only anonymized aggregate transaction records are retained for legal compliance.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">6. Your Rights & Data Deletion</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Access</strong> the personal data we hold about you.</li>
              <li><strong>Correct</strong> inaccurate information from your account settings.</li>
              <li><strong>Delete</strong> your account and associated personal data.</li>
              <li><strong>Revoke</strong> Google Sign-In access at any time from your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google Account permissions page</a>.</li>
              <li><strong>Withdraw consent</strong> at any time where processing is based on consent.</li>
            </ul>
            <p className="mt-3">
              To request account or data deletion, email <a href="mailto:privacy@stethonotes.store" className="text-accent hover:underline">privacy@stethonotes.store</a> from the address associated with your account. We will confirm deletion within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">7. Data Security</h2>
            <p>
              We protect your data using industry-standard measures: TLS 1.2+ encryption for all data in transit, encrypted-at-rest storage via Supabase Postgres, bcrypt password hashing, role-based access controls, and private file storage for purchased study notes. Access to production systems is limited to authorized personnel and logged for audit purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">8. Children&apos;s Privacy</h2>
            <p>
              StethoNotes is intended for users aged 17 and above (undergraduate medical and paramedical students). We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">9. International Users</h2>
            <p>
              StethoNotes is operated from India. If you access the Service from outside India, please be aware that your information may be transferred to, stored in, and processed in India where our servers and central database are located.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated by email and by posting an updated &ldquo;Last Updated&rdquo; date at the top of this page. Continued use of the Service after such changes constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">11. Contact Us</h2>
            <p>
              For any questions about this Privacy Policy or how your data is handled:
            </p>
            <ul className="list-none pl-0 mt-2 space-y-1">
              <li><strong>Email:</strong> <a href="mailto:privacy@stethonotes.store" className="text-accent hover:underline">privacy@stethonotes.store</a></li>
              <li><strong>Support:</strong> <a href="mailto:support@stethonotes.store" className="text-accent hover:underline">support@stethonotes.store</a></li>
              <li><strong>Address:</strong> StethoNotes, Nagpur, Maharashtra, India</li>
              <li><strong>Website:</strong> <a href="https://stethonotes.store" className="text-accent hover:underline">https://stethonotes.store</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
