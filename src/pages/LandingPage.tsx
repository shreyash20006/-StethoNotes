import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'motion/react';
import { Award, ShieldCheck, Star, ArrowRight, Activity, Users, Smile, ChevronLeft, ChevronRight, Mail, Play, CheckCircle2, Download, FileText, Heart } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// ─── Animated Counter Hook ──────────────────────────────────────────────────
function useCountUp(target: number, duration = 2000, enabled = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, enabled]);
  return count;
}

// ─── Stat Item ──────────────────────────────────────────────────────────────
function StatItem({ value, suffix, label, delay = 0 }: { value: number; suffix: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const count = useCountUp(value, 2200, inView);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="flex flex-col items-center gap-1"
    >
      <span className="font-display font-extrabold text-3xl sm:text-4xl text-white leading-none">
        {count.toLocaleString()}<span className="text-accent">{suffix}</span>
      </span>
      <span className="text-gray-400 text-xs font-sans text-center leading-tight">{label}</span>
    </motion.div>
  );
}

// ─── Hero Illustration ───────────────────────────────────────────────────────
function HeroIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Outer glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 rounded-full bg-accent/20 blur-3xl animate-pulse-glow" />
      </div>

      {/* Central SVG illustration */}
      <div className="relative z-10 w-80 h-80 sm:w-[400px] sm:h-[400px]">
        <svg viewBox="0 0 400 400" fill="none" className="w-full h-full overflow-visible">
          {/* ── Background rotating dashed ring ── */}
          <circle
            cx="200" cy="200" r="170"
            stroke="rgba(31,182,212,0.12)"
            strokeWidth="1"
            strokeDasharray="8 6"
            className="animate-spin-slow"
            style={{ transformOrigin: '200px 200px' }}
          />
          <circle
            cx="200" cy="200" r="140"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            strokeDasharray="4 8"
            className="animate-spin"
            style={{ animationDuration: '40s', animationDirection: 'reverse', transformOrigin: '200px 200px' }}
          />

          {/* ── Medical Book (centre) ── */}
          <g className="animate-float-y" style={{ transformOrigin: '200px 200px' }}>
            {/* Book body left page */}
            <rect x="115" y="120" width="85" height="120" rx="8" fill="#0A1F4D" stroke="rgba(31,182,212,0.5)" strokeWidth="1.5" />
            {/* Book body right page */}
            <rect x="200" y="120" width="85" height="120" rx="8" fill="#0F2D6B" stroke="rgba(31,182,212,0.5)" strokeWidth="1.5" />
            {/* Spine */}
            <rect x="196" y="116" width="8" height="128" rx="4" fill="#1FB6D4" />

            {/* Left page lines */}
            <line x1="130" y1="148" x2="180" y2="148" stroke="rgba(31,182,212,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="130" y1="162" x2="175" y2="162" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="130" y1="176" x2="178" y2="176" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="130" y1="190" x2="172" y2="190" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="130" y1="204" x2="175" y2="204" stroke="rgba(31,182,212,0.3)" strokeWidth="1.5" strokeLinecap="round" />
            {/* Rx symbol left */}
            <text x="152" y="228" textAnchor="middle" fontSize="16" fill="rgba(31,182,212,0.6)" fontFamily="serif" fontWeight="bold">Rx</text>

            {/* Right page lines */}
            <line x1="218" y1="148" x2="268" y2="148" stroke="rgba(31,182,212,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="218" y1="162" x2="263" y2="162" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="218" y1="176" x2="266" y2="176" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="218" y1="190" x2="260" y2="190" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
            {/* Medical cross right page */}
            <rect x="237" y="205" width="5" height="18" rx="2" fill="rgba(31,182,212,0.5)" />
            <rect x="230" y="212" width="19" height="5" rx="2" fill="rgba(31,182,212,0.5)" />
          </g>

          {/* ── Stethoscope wrapping ── */}
          <g>
            <path
              d="M90 155 C70 160 55 185 60 210 C65 235 88 252 112 248 C128 245 140 234 145 218"
              stroke="#1FB6D4"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              opacity="0.85"
            />
            <path
              d="M145 218 C148 208 148 195 145 185 C141 173 135 165 128 158"
              stroke="#1FB6D4"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              opacity="0.85"
            />
            {/* Chest piece */}
            <circle cx="82" cy="155" r="10" fill="#1FB6D4" opacity="0.9" />
            <circle cx="82" cy="155" r="5" fill="#0A1F4D" />
            <circle cx="82" cy="155" r="2.5" fill="#1FB6D4" />
            {/* Earpiece right */}
            <circle cx="310" cy="178" r="12" fill="#1FB6D4" opacity="0.85" />
            <circle cx="310" cy="178" r="6" fill="#0A1F4D" />
            {/* Tubing right */}
            <path
              d="M258 155 C280 148 300 155 310 166"
              stroke="#1FB6D4"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              opacity="0.85"
            />
          </g>

          {/* ── DNA Double Helix (right side) ── */}
          <g opacity="0.7" className="animate-float-y-slow" style={{ transformOrigin: '340px 200px' }}>
            {[0, 1, 2, 3, 4].map((i) => {
              const y = 140 + i * 30;
              const phase = (i * Math.PI * 2) / 5;
              const x1 = 328 + Math.cos(phase) * 12;
              const x2 = 352 - Math.cos(phase) * 12;
              return (
                <g key={i}>
                  <circle cx={x1} cy={y} r="4" fill="#1FB6D4" opacity="0.8" />
                  <circle cx={x2} cy={y} r="4" fill="rgba(255,255,255,0.5)" />
                  <line x1={x1} y1={y} x2={x2} y2={y} stroke="rgba(31,182,212,0.4)" strokeWidth="1.5" />
                </g>
              );
            })}
            {/* Backbone lines */}
            <polyline
              points="322,140 330,155 320,170 328,185 322,200 330,215 320,230 328,245 322,260"
              stroke="#1FB6D4"
              strokeWidth="2"
              fill="none"
              opacity="0.5"
            />
            <polyline
              points="358,140 350,155 360,170 352,185 358,200 350,215 360,230 352,245 358,260"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="2"
              fill="none"
              opacity="0.5"
            />
          </g>

          {/* ── ECG / Heartbeat Line ── */}
          <g>
            <path
              d="M68 308 L110 308 L122 285 L134 330 L148 295 L158 308 L330 308"
              stroke="#1FB6D4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray="280"
              strokeDashoffset="0"
              opacity="0.75"
              className="animate-ecg"
            />
            {/* Glow under ECG */}
            <path
              d="M68 308 L110 308 L122 285 L134 330 L148 295 L158 308 L330 308"
              stroke="#1FB6D4"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.15"
            />
          </g>

          {/* ── Capsule pill ── */}
          <g className="animate-float-card-1" style={{ transformOrigin: '72px 240px' }}>
            <rect x="52" y="232" width="40" height="18" rx="9" fill="rgba(31,182,212,0.2)" stroke="#1FB6D4" strokeWidth="1.5" />
            <rect x="52" y="232" width="20" height="18" rx="9" fill="rgba(31,182,212,0.35)" />
            <line x1="72" y1="233" x2="72" y2="249" stroke="#1FB6D4" strokeWidth="1" opacity="0.6" />
          </g>

          {/* ── Brain outline ── */}
          <g opacity="0.55" className="animate-float-y-slow" style={{ transformOrigin: '80px 88px' }}>
            <path
              d="M65 95 C58 85 60 72 70 70 C70 62 80 58 88 64 C92 58 102 58 106 66 C114 64 118 75 114 82 C120 86 118 96 112 98 C114 106 108 112 100 110 C98 116 90 118 86 112 C80 116 72 112 70 106 C64 106 62 100 65 95Z"
              stroke="#1FB6D4"
              strokeWidth="1.5"
              fill="rgba(31,182,212,0.06)"
            />
            <path d="M88 64 C88 78 88 94 88 110" stroke="rgba(31,182,212,0.3)" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M75 78 C82 82 94 82 101 78" stroke="rgba(31,182,212,0.25)" strokeWidth="1" strokeLinecap="round" />
          </g>
        </svg>

        {/* ── Floating Glassmorphism Cards ── */}
        {/* Card 1: PDF */}
        <div
          className="glass-card-float absolute -left-8 sm:-left-14 top-16 px-3 py-2.5 flex items-center gap-2.5 animate-float-card-1"
          style={{ minWidth: 140 }}
        >
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-white text-[11px] font-display font-semibold leading-none">Anatomy Notes</p>
            <p className="text-accent text-[10px] font-sans mt-0.5">PDF • 48 pages</p>
          </div>
        </div>

        {/* Card 2: Download progress */}
        <div
          className="glass-card-float absolute -right-6 sm:-right-12 top-24 px-3 py-2.5 flex flex-col gap-1.5 animate-float-card-2"
          style={{ minWidth: 130 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-white text-[11px] font-display font-semibold">Downloading</span>
            <Download className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-primary to-accent w-[78%]" />
          </div>
          <span className="text-accent text-[10px] font-sans">78% complete</span>
        </div>

        {/* Card 3: Rating */}
        <div
          className="glass-card-float absolute -right-4 sm:-right-10 bottom-20 px-3 py-2.5 flex items-center gap-2 animate-float-card-1"
          style={{ minWidth: 120, animationDelay: '1s' }}
        >
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          <div>
            <div className="flex gap-0.5 mb-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />)}
            </div>
            <span className="text-white text-[10px] font-sans">10k+ reviews</span>
          </div>
        </div>

        {/* Card 4: Subject tag */}
        <div
          className="glass-card-float absolute -left-6 sm:-left-12 bottom-24 px-3 py-2 flex items-center gap-2 animate-float-card-2"
        >
          <span className="text-[18px]">🩺</span>
          <span className="text-white text-[11px] font-display font-semibold">MBBS Notes</span>
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = [
  { id: 'c1', name: 'MBBS', desc: 'Bachelor of Medicine, Bachelor of Surgery', icon: '🩺', color: 'from-blue-500/10 to-cyan-500/10' },
  { id: 'c2', name: 'BHMS', desc: 'Bachelor of Homoeopathic Medicine and Surgery', icon: '🌿', color: 'from-emerald-500/10 to-teal-500/10' },
  { id: 'c3', name: 'BAMS', desc: 'Bachelor of Ayurvedic Medicine and Surgery', icon: '🍃', color: 'from-green-500/10 to-emerald-500/10' },
  { id: 'c4', name: 'BSc Nursing', desc: 'Bachelor of Science in Nursing care study guides', icon: '🩹', color: 'from-indigo-500/10 to-blue-500/10' },
  { id: 'c5', name: 'B.Pharma', desc: 'Pharmacy and Pharmacology summary papers', icon: '💊', color: 'from-red-500/10 to-orange-500/10' },
  { id: 'c6', name: 'BPT', desc: 'Bachelor of Physiotherapy exercise guides', icon: '🏃', color: 'from-purple-500/10 to-pink-500/10' },
  { id: 'c7', name: 'Paramedical', desc: 'Lab Technician, Radiology & Emergency notes', icon: '🚨', color: 'from-yellow-500/10 to-amber-500/10' }
];

const WHY_US = [
  {
    icon: <Mail className="w-8 h-8 text-primary" />,
    title: 'Instant Email Delivery',
    desc: 'Get your note files sent directly to your email inbox immediately after payment. No manual downloads needed.'
  },
  {
    icon: <Award className="w-8 h-8 text-primary" />,
    title: 'Topper-Curated Content',
    desc: 'Compiled and verified by university rankers and toppers, ensuring maximum accuracy and score success.'
  },
  {
    icon: <Activity className="w-8 h-8 text-primary" />,
    title: 'Affordable Pricing',
    desc: 'Access standard-quality guides at a fraction of standard textbook costs, tailored for student budgets.'
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: 'Secure Payments',
    desc: 'Fully encrypted and secure checkout powered by Razorpay. Safe transactions guaranteed.'
  }
];

const TESTIMONIALS = [
  {
    name: 'Anjali Sharma',
    role: 'MBBS 3rd Year, AIIMS Delhi',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    comment: 'The Pathology and Microbiology notes are absolutely top-notch! The flowcharts and tabular comparisons helped me score an A in my university exams. Thank you, StethoNotes!',
    rating: 5
  },
  {
    name: 'Dr. Vivek Nair',
    role: 'BAMS graduate, Government Ayurvedic College',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
    comment: 'Dravyaguna notes are incredibly hard to write concisely, but this store did it beautifully. All shlokas and property lists are laid out perfectly. Essential for BAMS students.',
    rating: 5
  },
  {
    name: 'Priyanka Das',
    role: 'BSc Nursing 2nd Year, Apollo College',
    avatar: 'https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=150',
    comment: 'Nursing Foundation notes made my clinical placements so much easier. The step-by-step procedures and care plans are explained clearly. Saved me hours of reference work!',
    rating: 4
  }
];

const FEATURE_CHIPS = [
  'Instant Email Delivery',
  'Verified Notes',
  'Secure Payments',
  'Updated Every Semester',
  '48-Hour Secure Download',
];

const STATS = [
  { value: 12000, suffix: '+', label: 'Students' },
  { value: 5000, suffix: '+', label: 'Premium Notes' },
  { value: 98, suffix: '%', label: 'Student Satisfaction' },
  { value: 150, suffix: '+', label: 'Medical Subjects' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  // Auto scroll testimonials
  useEffect(() => {
    const interval = setInterval(nextTestimonial, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden">
      {/* ═══════════════════════════════════════════════════════ */}
      {/* 1. HERO SECTION                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative bg-[#080f1e] text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">

        {/* ── Layered Background Effects ── */}
        {/* Medical grid */}
        <div className="absolute inset-0 hero-grid-bg opacity-60 pointer-events-none" />
        {/* Radial glow top-right */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(31,182,212,0.13) 0%, transparent 65%)', transform: 'translate(25%,-30%)' }} />
        {/* Radial glow bottom-left */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(15,45,107,0.45) 0%, transparent 65%)', transform: 'translate(-30%, 30%)' }} />
        {/* Blurred cyan circle mid-right */}
        <div className="absolute right-[8%] top-[20%] w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        {/* Blurred navy circle mid-left */}
        <div className="absolute left-[5%] bottom-[15%] w-56 h-56 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-6 items-center relative z-10">

          {/* ── Left: Hero Text ── */}
          <div className="lg:col-span-7 flex flex-col items-start gap-5">

            {/* ── Feature Chips ── */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="flex flex-wrap gap-2"
            >
              {FEATURE_CHIPS.map((chip) => (
                <span key={chip} className="hero-chip">
                  <CheckCircle2 className="w-3 h-3" />
                  {chip}
                </span>
              ))}
            </motion.div>

            {/* ── Badge ── */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/15 border border-accent/30 rounded-full"
            >
              <Activity className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span className="text-accent font-display text-xs font-semibold uppercase tracking-widest">
                India's #1 Med-Notes Marketplace
              </span>
            </motion.div>

            {/* ── Heading ── */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-4xl sm:text-5xl xl:text-6xl font-display font-extrabold leading-[1.1] tracking-tight text-white"
            >
              Study Smarter with<br />
              India's Trusted{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-cyan-300 to-blue-400">
                Medical Notes
              </span>{' '}
              Platform
            </motion.h1>

            {/* ── Subheading ── */}
            <motion.p
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-gray-300 text-base sm:text-lg font-sans max-w-xl leading-relaxed"
            >
              Access premium handwritten notes, concise revision PDFs, PYQs, mnemonics, and exam-ready guides for{' '}
              <span className="text-white font-medium">MBBS, BDS, BHMS, BAMS, Nursing, Pharmacy, Physiotherapy,</span>{' '}
              and Paramedical students.
            </motion.p>

            {/* ── CTA Buttons ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.33 }}
              className="flex flex-col sm:flex-row gap-4 mt-2"
            >
              <Link
                to="/courses"
                className="btn-gradient py-3.5 px-8 text-base font-semibold rounded-xl group"
              >
                Browse Notes
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <button
                className="flex items-center justify-center gap-3 py-3.5 px-8 text-base font-display font-semibold text-white rounded-xl border-2 border-white/20 hover:border-white/40 hover:bg-white/6 transition-all duration-200 group"
                onClick={() => {}}
              >
                <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                  <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                </span>
                Watch Demo
              </button>
            </motion.div>

            {/* ── Trust Indicators ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <span className="text-white font-display font-semibold text-sm">4.9/5</span>
                <span className="text-gray-400 text-sm font-sans">from 10,000+ students</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-white/15" />
              <span className="text-gray-400 text-sm font-sans">
                🇮🇳 Trusted by students across India
              </span>
            </motion.div>
          </div>

          {/* ── Right: Floating Illustration ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex justify-center items-center relative min-h-[340px]"
          >
            <HeroIllustration />
          </motion.div>
        </div>

        {/* ── Stats Row ── */}
        <div className="max-w-7xl mx-auto relative z-10 mt-20">
          <div className="border-t border-white/8 pt-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
              {STATS.map((stat, i) => (
                <StatItem
                  key={stat.label}
                  value={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                  delay={i * 0.1}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Course Category Section */}
      <section className="bg-gray-50 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center gap-3">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-primary">
              Notes Classified by Course
            </h2>
            <div className="w-16 h-1 bg-accent rounded-full" />
            <p className="text-gray-500 font-sans text-base mt-2">
              Select your academic discipline to filter our library of university-specific study guides.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORIES.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                onClick={() => navigate(`/courses?course=${encodeURIComponent(cat.name)}`)}
                className="glass-panel p-6 rounded-2xl cursor-pointer hover:shadow-cyan-hover transition-all duration-300 group flex flex-col justify-between border-2 border-transparent hover:border-accent/10"
              >
                <div>
                  <span className="text-4xl mb-4 block" role="img" aria-label={cat.name}>
                    {cat.icon}
                  </span>
                  <h3 className="font-display font-bold text-xl text-primary mb-2 group-hover:text-accent transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-accent font-display text-sm font-semibold mt-6 group-hover:translate-x-1.5 transition-transform duration-300">
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Why StethoNotes Section */}
      <section id="why-us" className="bg-white py-24 px-4 sm:px-6 lg:px-8 border-b border-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center gap-3">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-primary">
              Why Study with StethoNotes?
            </h2>
            <div className="w-16 h-1 bg-accent rounded-full" />
            <p className="text-gray-500 font-sans text-base mt-2">
              Designed specifically to meet the high academic demands of modern medicine and health sciences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {WHY_US.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-accent/20 hover:shadow-cyan-soft transition-all duration-300 flex flex-col items-center text-center gap-4 group"
              >
                <div className="p-4 bg-primary/5 rounded-2xl group-hover:bg-accent/15 group-hover:scale-110 transition-all duration-300">
                  {item.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-primary">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Testimonials Section */}
      <section id="testimonials" className="bg-primary-dark text-white py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(31,182,212,0.15),transparent_45%)]" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16 flex flex-col items-center gap-3">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">
              Loved by Thousands of Medics
            </h2>
            <div className="w-16 h-1 bg-accent rounded-full" />
          </div>

          {/* Testimonial slider */}
          <div className="relative glass-panel-dark p-8 sm:p-12 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-6">
            <div className="flex gap-1 text-accent mb-2">
              {Array.from({ length: TESTIMONIALS[currentTestimonial].rating }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>

            <p className="text-center text-gray-200 text-base sm:text-lg italic leading-relaxed font-sans max-w-2xl">
              "{TESTIMONIALS[currentTestimonial].comment}"
            </p>

            <div className="flex items-center gap-4 mt-4">
              <img
                src={TESTIMONIALS[currentTestimonial].avatar}
                alt={TESTIMONIALS[currentTestimonial].name}
                className="w-12 h-12 rounded-full border-2 border-accent object-cover"
              />
              <div className="text-left">
                <h4 className="font-display font-semibold text-sm text-white">
                  {TESTIMONIALS[currentTestimonial].name}
                </h4>
                <p className="text-accent text-xs font-sans">
                  {TESTIMONIALS[currentTestimonial].role}
                </p>
              </div>
            </div>

            {/* Slider Navigation */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={prevTestimonial}
                className="p-2 border border-white/20 hover:border-accent hover:text-accent rounded-full transition-colors bg-white/5"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextTestimonial}
                className="p-2 border border-white/20 hover:border-accent hover:text-accent rounded-full transition-colors bg-white/5"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. About Section */}
      <section id="about" className="bg-white py-24 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 relative">
            <img
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600"
              alt="Medical Students Studying"
              className="rounded-3xl shadow-cyan-soft border-2 border-gray-100 object-cover w-full h-[400px]"
            />
          </div>
          <div className="lg:col-span-7 flex flex-col items-start gap-5">
            <h2 className="text-3xl font-display font-bold text-primary">
              Empowering the Next Generation of Healthcare Professionals
            </h2>
            <div className="w-16 h-1 bg-accent rounded-full" />
            <p className="text-gray-500 text-sm leading-relaxed mt-2 font-sans">
              StethoNotes was created by medical students, for medical students. We understand that medical and paramedical syllabi are vast, and traditional textbook layouts can sometimes feel overwhelming during revision cycles.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed font-sans">
              Our marketplace brings together university toppers, instructors, and experienced doctors to upload high-yield, structured study notes. Each note PDF undergoes review for accuracy and syllabus coverage, ensuring that your study prep is focused, concise, and highly effective.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4 w-full">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-accent shrink-0" />
                <span className="font-display font-semibold text-primary text-sm">Topper Community</span>
              </div>
              <div className="flex items-center gap-3">
                <Smile className="w-5 h-5 text-accent shrink-0" />
                <span className="font-display font-semibold text-primary text-sm">Affordable Study Aids</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Contact Section */}
      <section id="contact" className="bg-gray-50 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-cyan-soft border border-gray-100 p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto mb-10 flex flex-col items-center gap-3">
            <h2 className="text-3xl font-display font-bold text-primary">
              Have Questions? Get in Touch
            </h2>
            <div className="w-16 h-1 bg-accent rounded-full" />
            <p className="text-gray-500 text-xs mt-1">
              Drop us a message and our support team will reply within 24 hours.
            </p>
          </div>

          <form className="grid grid-cols-1 sm:grid-cols-2 gap-6" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-display font-semibold text-primary">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className="border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none px-4 py-3 rounded-xl text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-display font-semibold text-primary">Email Address</label>
              <input
                type="email"
                placeholder="john@example.com"
                className="border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none px-4 py-3 rounded-xl text-sm"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-2">
              <label className="text-xs font-display font-semibold text-primary">Message</label>
              <textarea
                placeholder="Write your message here..."
                rows={4}
                className="border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none px-4 py-3 rounded-xl text-sm resize-none"
              />
            </div>
            <div className="sm:col-span-2 flex justify-center mt-2">
              <button
                type="button"
                onClick={() => alert('Message Sent! Thank you for contacting StethoNotes.')}
                className="btn-primary py-3 px-10 text-sm font-semibold"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
