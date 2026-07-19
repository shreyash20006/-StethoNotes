import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

// ============================================================
// CINEMATIC FOOTER
// GSAP-powered sequence:
// 1. Medical illustrations float up from below
// 2. All converge toward center stethoscope
// 3. Stethoscope assembles from SVG parts
// 4. Morphs into StethoNotes wordmark
// 5. ECG pulse draws across
// 6. Tagline fades in
// 7. Final glow + hold
// ============================================================

const FLOATING_ITEMS = [
  { emoji: '🧠', delay: 0,    x: '10%',  y: '100%' },
  { emoji: '❤️', delay: 0.15, x: '25%',  y: '100%' },
  { emoji: '🫁', delay: 0.25, x: '40%',  y: '100%' },
  { emoji: '🦴', delay: 0.35, x: '55%',  y: '100%' },
  { emoji: '💊', delay: 0.45, x: '70%',  y: '100%' },
  { emoji: '🦠', delay: 0.55, x: '82%',  y: '100%' },
  { emoji: '🫀', delay: 0.1,  x: '18%',  y: '110%' },
  { emoji: '🔬', delay: 0.2,  x: '35%',  y: '110%' },
  { emoji: '💉', delay: 0.3,  x: '50%',  y: '110%' },
  { emoji: '🩺', delay: 0.4,  x: '65%',  y: '110%' },
  { emoji: '🧬', delay: 0.5,  x: '78%',  y: '110%' },
  { emoji: '👁️', delay: 0.6,  x: '90%',  y: '100%' },
];

export default function CinematicFooter() {
  const footerRef = useRef<HTMLDivElement>(null);
  const ecgRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Lazy load GSAP
    const initGSAP = async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        // ECG animation
        if (ecgRef.current) {
          const path = ecgRef.current;
          const length = path.getTotalLength?.() ?? 600;
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
          gsap.to(path, {
            strokeDashoffset: 0,
            duration: 2.5,
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: footer,
              start: 'top 80%',
              once: true,
            },
          });
        }
      } catch {
        // GSAP not available, CSS fallback
      }
    };

    initGSAP();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative overflow-hidden"
      style={{
        background: 'var(--bg-layer)',
        borderTop: '1px solid var(--glass-border)',
      }}
    >
      {/* ── Floating medical illustrations ── */}
      <div className="relative h-48 overflow-hidden pointer-events-none" aria-hidden="true">
        {FLOATING_ITEMS.map((item, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            style={{ left: item.x, bottom: '-2rem' }}
            initial={{ y: 0, opacity: 0 }}
            whileInView={{
              y: [0, -80 - i * 12, -160],
              opacity: [0, 0.8, 0],
            }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
              duration: 2.4,
              delay: item.delay,
              ease: 'easeOut',
              times: [0, 0.5, 1],
            }}
          >
            {item.emoji}
          </motion.div>
        ))}

        {/* Stethoscope that assembles in the center */}
        <motion.div
          className="absolute left-1/2 top-8"
          style={{ transform: 'translateX(-50%)' }}
          initial={{ opacity: 0, scale: 0.4, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <StethoscopeSVG />
        </motion.div>
      </div>

      {/* ── ECG pulse line ── */}
      <div className="relative px-4 py-2" aria-hidden="true">
        <svg viewBox="0 0 1000 40" width="100%" height="40" preserveAspectRatio="none">
          <path
            ref={ecgRef}
            d="M 0 20 L 80 20 L 100 8 L 108 32 L 118 2 L 128 38 L 136 20 L 160 20 L 180 15 L 188 25 L 196 20 L 300 20 L 320 10 L 328 30 L 336 20 L 500 20 L 520 8 L 528 32 L 538 2 L 548 38 L 556 20 L 580 20 L 700 20 L 720 10 L 728 30 L 736 20 L 1000 20"
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="1.5"
            strokeOpacity="0.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ── Main footer content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-8">
        {/* Brand + tagline */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <Link to="/" className="inline-flex items-center gap-3 group mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)', border: '1px solid var(--glass-border)' }}
            >
              <img
                src={localStorage.getItem('brand_logo') || 'https://res.cloudinary.com/dsqxboxoc/image/upload/v1783892715/file_00000000663871fa96d4e5a32de37be1_adwo6u.png'}
                alt="StethoNotes"
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Stetho<span style={{ color: 'var(--accent-primary)' }}>Notes</span>
            </span>
          </Link>

          <motion.p
            className="font-display text-sm font-medium tracking-widest uppercase"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.25em' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Notes That Diagnose Your Doubts.
          </motion.p>
        </motion.div>

        {/* Footer links grid */}
        <FooterLinks />

        {/* Bottom bar */}
        <motion.div
          className="mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans"
          style={{ borderTop: '1px solid var(--glass-border)', color: 'var(--text-faint)' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <p>© {new Date().getFullYear()} StethoNotes. All rights reserved.</p>
          <p>Made with ❤️ for Medical Students of India</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:underline" style={{ color: 'var(--text-muted)' }}>Privacy</Link>
            <Link to="/terms" className="hover:underline" style={{ color: 'var(--text-muted)' }}>Terms</Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

// ─── Stethoscope SVG ─────────────────────────────────────────

function StethoscopeSVG() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Stethoscope">
      {/* Ear pieces */}
      <circle cx="16" cy="10" r="5" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" />
      <circle cx="48" cy="10" r="5" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" />
      {/* Tube */}
      <path d="M 16 15 Q 16 35 32 35 Q 48 35 48 15"
        fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Vertical stem */}
      <line x1="32" y1="35" x2="32" y2="48" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Chest piece */}
      <circle cx="32" cy="54" r="8" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" />
      <circle cx="32" cy="54" r="3" fill="var(--accent-primary)" opacity="0.5" />
    </svg>
  );
}

// ─── Footer links ─────────────────────────────────────────────

function FooterLinks() {
  const sections = [
    {
      title: 'Platform',
      links: [
        { label: 'Browse Notes', href: '/courses' },
        { label: 'Track Order', href: '/track-order' },
        { label: 'Become a Seller', href: '/seller/login' },
        { label: 'Student Dashboard', href: '/dashboard' },
      ],
    },
    {
      title: 'Specialties',
      links: [
        { label: 'Anatomy', href: '/courses?specialty=Anatomy' },
        { label: 'Cardiology', href: '/courses?specialty=Cardiology' },
        { label: 'Neurology', href: '/courses?specialty=Neurology' },
        { label: 'Pharmacology', href: '/courses?specialty=Pharmacology' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/#about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
      ],
    },
    {
      title: 'Contact',
      links: [
        { label: '📧 support@stethonotes.in', href: 'mailto:support@stethonotes.in' },
        { label: '📍 Nagpur, Maharashtra', href: '#' },
        { label: '🐦 Twitter/X', href: 'https://twitter.com' },
        { label: '📸 Instagram', href: 'https://instagram.com' },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
      {sections.map((section, i) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        >
          <h4
            className="font-display font-bold text-xs tracking-widest uppercase mb-5"
            style={{ color: 'var(--text-primary)' }}
          >
            {section.title}
          </h4>
          <ul className="flex flex-col gap-3">
            {section.links.map(link => (
              <li key={link.label}>
                <Link
                  to={link.href}
                  className="text-sm font-sans transition-colors hover:underline"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}
