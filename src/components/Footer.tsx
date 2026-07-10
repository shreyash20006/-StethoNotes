import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, FileText } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white font-sans pt-16 pb-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand block */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.26-2.5 3.19-2.5 5.5" />
                  <path d="M12 2v10a4 4 0 0 0 8 0V2" />
                  <path d="M12 12a4 4 0 0 1-8 0V2" />
                  <path d="M22 2h-4" />
                  <path d="M6 2H2" />
                </svg>
              </div>
              <span className="font-display font-bold text-xl tracking-tight">
                Stetho<span className="text-accent">Notes</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mt-2">
              Your stethoscope to success. Providing medical, paramedical, nursing, and pharmaceutical students with high-yield, topper-curated study guides.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a href="#" className="p-2 bg-white/5 hover:bg-accent/20 hover:text-accent rounded-lg transition-all" aria-label="Twitter">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="p-2 bg-white/5 hover:bg-accent/20 hover:text-accent rounded-lg transition-all" aria-label="LinkedIn">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="#" className="p-2 bg-white/5 hover:bg-accent/20 hover:text-accent rounded-lg transition-all" aria-label="GitHub">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display font-semibold text-base mb-5 text-white">Quick Links</h4>
            <ul className="flex flex-col gap-3 text-sm text-gray-400">
              <li>
                <Link to="/courses" className="hover:text-accent transition-colors flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-accent/80" />
                  Browse Notes
                </Link>
              </li>
              <li>
                <a href="/#about" className="hover:text-accent transition-colors">
                  About StethoNotes
                </a>
              </li>
              <li>
                <a href="/#why-us" className="hover:text-accent transition-colors">
                  Why Topper Notes?
                </a>
              </li>
              <li>
                <a href="/#testimonials" className="hover:text-accent transition-colors">
                  Success Stories
                </a>
              </li>
            </ul>
          </div>

          {/* Course categories */}
          <div>
            <h4 className="font-display font-semibold text-base mb-5 text-white">Popular Courses</h4>
            <ul className="flex flex-col gap-3 text-sm text-gray-400">
              <li>
                <Link to="/courses?course=MBBS" className="hover:text-accent transition-colors">
                  MBBS Study Material
                </Link>
              </li>
              <li>
                <Link to="/courses?course=BHMS" className="hover:text-accent transition-colors">
                  BHMS Homoeopathy Guides
                </Link>
              </li>
              <li>
                <Link to="/courses?course=BAMS" className="hover:text-accent transition-colors">
                  BAMS Ayurvedic Notes
                </Link>
              </li>
              <li>
                <Link to="/courses?course=BSc+Nursing" className="hover:text-accent transition-colors">
                  BSc Nursing Guides
                </Link>
              </li>
              <li>
                <Link to="/courses?course=B.Pharma" className="hover:text-accent transition-colors">
                  B.Pharma / D.Pharma
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="font-display font-semibold text-base mb-5 text-white">Contact Info</h4>
            <ul className="flex flex-col gap-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>Medical Campus Road, Sector-12, New Delhi, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <span>support@stethonotes.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} StethoNotes. All rights reserved. Created for medical excellence.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-accent transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-accent transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
