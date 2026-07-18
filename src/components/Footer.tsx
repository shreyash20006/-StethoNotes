import { Link } from 'react-router-dom';
import { Mail, MapPin, FileText } from 'lucide-react';

export default function Footer() {
  const storedLogo = localStorage.getItem('brand_logo') || 'https://res.cloudinary.com/dsqxboxoc/image/upload/v1783892715/file_00000000663871fa96d4e5a32de37be1_adwo6u.png';

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate premium newsletter feedback
    alert('Thank you for subscribing to StethoNotes Intel!');
  };

  return (
    <footer
      className="font-sans pt-20 pb-10 relative overflow-hidden"
      style={{ background: 'var(--bg-layer)', color: 'var(--text-primary)', borderTop: '1px solid var(--glass-border)' }}
    >
      {/* Decorative Blur Orb */}
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'color-mix(in srgb, var(--accent-primary) 5%, transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand block */}
          <div className="flex flex-col gap-5">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-primary/5 p-1.5 rounded-xl flex items-center justify-center w-9 h-9 shrink-0 overflow-hidden border border-white/5">
                <img src={storedLogo} alt="StethoNotes Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white">
                Stetho<span className="text-primary">Notes</span>
              </span>
            </Link>
            <p className="text-muted text-sm leading-relaxed">
              Notes That Diagnose Your Doubts. Nagpur's leading study resources hub, providing medical and paramedical students with topper-curated exam study guides.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl border border-white/5 transition-all" aria-label="Twitter">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl border border-white/5 transition-all" aria-label="LinkedIn">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl border border-white/5 transition-all" aria-label="Instagram">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display font-bold text-sm tracking-widest uppercase mb-5 text-white">Quick Links</h4>
            <ul className="flex flex-col gap-3.5 text-sm text-muted">
              <li>
                <Link to="/courses" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary" />
                  Browse Notes
                </Link>
              </li>
              <li>
                <a href="/#about" className="hover:text-primary transition-colors">
                  About StethoNotes
                </a>
              </li>
              <li>
                <a href="/#why-us" className="hover:text-primary transition-colors">
                  Why Topper Notes?
                </a>
              </li>
              <li>
                <a href="/#testimonials" className="hover:text-primary transition-colors">
                  Success Stories
                </a>
              </li>
            </ul>
          </div>

          {/* Course categories */}
          <div>
            <h4 className="font-display font-bold text-sm tracking-widest uppercase mb-5 text-white">Popular Courses</h4>
            <ul className="flex flex-col gap-3.5 text-sm text-muted">
              <li>
                <Link to="/courses?course=MBBS" className="hover:text-primary transition-colors">
                  MBBS Study Material
                </Link>
              </li>
              <li>
                <Link to="/courses?course=BHMS" className="hover:text-primary transition-colors">
                  BHMS Homoeopathy Guides
                </Link>
              </li>
              <li>
                <Link to="/courses?course=BAMS" className="hover:text-primary transition-colors">
                  BAMS Ayurvedic Notes
                </Link>
              </li>
              <li>
                <Link to="/courses?course=BSc+Nursing" className="hover:text-primary transition-colors">
                  BSc Nursing Guides
                </Link>
              </li>
              <li>
                <Link to="/courses?course=B.Pharma" className="hover:text-primary transition-colors">
                  B.Pharma / D.Pharma
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="font-display font-bold text-sm tracking-widest uppercase mb-5 text-white">Contact Info</h4>
            <ul className="flex flex-col gap-4.5 text-sm text-muted">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Nagpur, Maharashtra, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href="mailto:support@stethonotes.store" className="hover:text-primary transition-colors">
                  support@stethonotes.store
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter & Copyright row */}
        <div className="border-t border-white/5 pt-10 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="w-full lg:max-w-md">
            <h4 className="font-display font-semibold text-sm text-white">Subscribe to StethoNotes Intel</h4>
            <p className="text-muted text-xs mt-1">Get updates on new exam guides, high-yield topper notes, and contributor offers.</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-2 w-full lg:max-w-md">
            <input 
              type="email" 
              placeholder="future.doctor@domain.com" 
              className="bg-card border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 flex-grow" 
              required 
            />
            <button type="submit" className="btn-primary py-2 px-5 text-xs font-bold whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>

        {/* Bottom footer links */}
        <div className="border-t border-white/5 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted">
          <p>© 2026 StethoNotes. Designed for Medical Academic Excellence.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <a href="#" className="hover:text-primary transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
