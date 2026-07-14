import { Link } from 'react-router-dom';
import { Mail, MapPin, FileText } from 'lucide-react';

export default function Footer() {
  const storedLogo = localStorage.getItem('brand_logo') || 'https://res.cloudinary.com/dsqxboxoc/image/upload/v1783892715/file_00000000663871fa96d4e5a32de37be1_adwo6u.png';

  return (
    <footer className="bg-primary-dark text-white font-sans pt-16 pb-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand block */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-white/10 p-1 rounded-xl flex items-center justify-center w-8 h-8 shrink-0 overflow-hidden">
                <img src={storedLogo} alt="StethoNotes Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">
                Stetho<span className="text-accent">Notes</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mt-2">
              Your stethoscope to success. Providing medical, paramedical, nursing, and pharmaceutical students with high-yield, topper-curated study guides.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-accent/20 hover:text-accent rounded-lg transition-all" aria-label="Twitter">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-accent/20 hover:text-accent rounded-lg transition-all" aria-label="LinkedIn">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-accent/20 hover:text-accent rounded-lg transition-all" aria-label="GitHub">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-accent/20 hover:text-accent rounded-lg transition-all" aria-label="Instagram">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-accent/20 hover:text-accent rounded-lg transition-all" aria-label="YouTube">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.388.511a3.002 3.002 0 0 0-2.11 2.107C0 8.046 0 12 0 12s0 3.954.502 5.837a3.002 3.002 0 0 0 2.11 2.107c1.883.511 9.388.511 9.388.511s7.505 0 9.388-.511a3.002 3.002 0 0 0 2.11-2.107c.502-1.883.502-5.837.502-5.837s0-3.954-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-accent/20 hover:text-accent rounded-lg transition-all" aria-label="Telegram">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.58.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.99.53-1.41.52-.46-.01-1.36-.26-2.02-.48-.82-.27-1.47-.42-1.42-.88.03-.24.35-.49.97-.74 3.79-1.65 6.32-2.73 7.59-3.25 3.61-1.48 4.36-1.74 4.85-1.75.11 0 .35.03.5.16.13.12.17.27.18.39-.01.08 0 .23-.01.29z"/></svg>
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
                <Link to="/collections" className="hover:text-accent transition-colors flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-accent/80" />
                  Collections
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
                <span>Nagpur, Maharashtra, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <a href="mailto:support@stethonotes.store" className="hover:text-accent transition-colors">
                  support@stethonotes.store
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2026 StethoNotes. All Rights Reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
            <a href="#" className="hover:text-accent transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
