import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 min-h-[8vh]">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 shadow-cyan-soft relative overflow-hidden">
        {/* Decorative accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-[100px] pointer-events-none" />

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-3xl text-primary tracking-tight">Terms of Service</h1>
            <p className="text-gray-400 text-xs mt-1">Last Updated: July 11, 2026</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-gray-600 text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or purchasing from StethoNotes ("we", "our", or "us"), you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the application.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">2. Description of Service</h2>
            <p>
              StethoNotes is a digital marketplace specializing in medical study materials, notes, and course study helpers. Digital materials are purchased online and delivered exclusively to the customer's validated email address as PDF downloads. There are no physical shipping options.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">3. Purchases and Digital Delivery</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>All payments are processed securely via Razorpay checkout.</li>
              <li>Upon successful transaction, PDF download links are sent to your verified email.</li>
              <li>Generated download links are active for a duration of 48 hours for security purposes. You can generate fresh links at any time using our order tracking tool.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">4. User Conduct & Copyright Rules</h2>
            <p>
              All files, designs, texts, and diagrams hosted on StethoNotes are copyrighted property. Purchased materials are licensed solely for individual academic study. Sharing, distributing, reselling, or uploading files to shared network drives is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">5. Returns & Refunds</h2>
            <p>
              Due to the immediate, digital nature of study PDF downloads, all sales are final. Refunds are not issued once files are delivered. If you receive the wrong file or encounter download errors, please notify us for manual correction.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-primary mb-2">6. Contact Information</h2>
            <p>
              For legal support, terms validation, or invoice inquiries, please contact us at <a href="mailto:support@stethonotes.store" className="text-accent hover:underline">support@stethonotes.store</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
