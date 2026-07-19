import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { memo, useState, useEffect } from 'react';
import {
  Award, ShieldCheck, Star, ArrowRight, Activity, Users, Smile,
  ChevronLeft, ChevronRight, Trophy, Sparkles, BookOpen, Heart,
  Zap, Shield, Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import SEOHead from '../components/SEOHead';
import { pageMeta, generateOrganizationLD, generateFAQLD } from '../lib/seo';
import { COURSE_CATEGORIES, CourseIcon } from '../components/icons/CourseIcons';
import { useSpecialty, SPECIALTIES } from '../context/SpecialtyContext';
import { useLenis } from '../hooks/useLenis';

// ─── Category Card ────────────────────────────────────────────

const CategoryCard = memo(({ cat, idx, navigate }: { cat: any; idx: number; navigate: (url: string) => void }) => {
  const { specialty } = useSpecialty();
  const cfg = SPECIALTIES[specialty.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: idx * 0.06 }}
      whileHover={{ y: -6, scale: 1.02 }}
      onClick={() => navigate(`/courses?course=${encodeURIComponent(cat.name)}`)}
      className="glass-card-v2 rounded-3xl cursor-pointer relative overflow-hidden group flex flex-col h-auto"
      style={{ borderColor: 'var(--glass-border)' }}
    >
      {/* Cover Image Container */}
      <div className="relative w-full overflow-hidden" style={{ background: 'var(--bg-layer)', borderBottom: '1px solid var(--glass-border)' }}>
        {cat.coverImage ? (
          <img
            src={cat.coverImage}
            alt={`${cat.name} cover`}
            className="w-full h-auto block transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
        )}
      </div>

      <div className="p-6 flex flex-col justify-between flex-grow gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500"
              style={{
                background: `color-mix(in srgb, ${cfg.primaryColor} 8%, var(--surface))`,
                border: `1px solid ${cfg.primaryColor}25`,
              }}
            >
              <CourseIcon name={cat.name} size={24} />
            </div>
            <h3 className="font-display font-bold text-xl group-hover:text-primary transition-colors" style={{ color: 'var(--text-primary)' }}>
              {cat.name}
            </h3>
          </div>
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {cat.desc}
          </p>
        </div>

        <div className="flex items-center gap-2 font-display text-xs font-semibold mt-4 group-hover:translate-x-1.5 transition-transform duration-300" style={{ color: cfg.primaryColor }}>
          <span>Explore Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
});
CategoryCard.displayName = 'CategoryCard';

// ─── Seller Card ──────────────────────────────────────────────

const SellerCard = memo(({ seller, idx }: { seller: any; idx: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: idx * 0.1 }}
    className="glass-card-v2 p-6 rounded-2xl text-center flex flex-col items-center gap-4"
  >
    <div className="w-16 h-16 rounded-full overflow-hidden" style={{ border: '2px solid var(--glass-border)' }}>
      {seller.avatar_url
        ? <img src={seller.avatar_url} alt={seller.store_name} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: 'var(--surface)' }}>👤</div>
      }
    </div>
    <div>
      <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{seller.store_name}</p>
      <p className="text-xs mt-0.5 font-sans" style={{ color: 'var(--text-muted)' }}>{seller.specialty || 'Medical Expert'}</p>
    </div>
    <div className="flex items-center gap-1" style={{ color: '#F59E0B' }}>
      {Array.from({ length: 5 }, (_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
    </div>
  </motion.div>
));
SellerCard.displayName = 'SellerCard';

// ─── WhyUs Card ───────────────────────────────────────────────

const WhyUsCard = memo(({ item, idx }: { item: any; idx: number }) => {
  const { specialty } = useSpecialty();
  const cfg = SPECIALTIES[specialty.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: idx * 0.08 }}
      whileHover={{ y: -3 }}
      className="glass-card-v2 p-8 rounded-3xl flex flex-col gap-4 group"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500"
        style={{
          background: `color-mix(in srgb, ${cfg.primaryColor} 10%, var(--surface))`,
          border: `1px solid ${cfg.primaryColor}25`,
        }}
      >
        <item.icon className="w-6 h-6" style={{ color: cfg.primaryColor }} />
      </div>
      <h3 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
      <p className="text-xs leading-relaxed font-sans" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
    </motion.div>
  );
});
WhyUsCard.displayName = 'WhyUsCard';

// ─── Static data ──────────────────────────────────────────────

const WHY_US = [
  { icon: ShieldCheck, title: 'Verified Medical Content', desc: 'Every note is reviewed for accuracy against current MBBS, BDS, and BAMS syllabi.' },
  { icon: Award,       title: 'Topper-Curated Notes',   desc: 'Written by university rank holders and experienced clinicians with exam-tested material.' },
  { icon: Zap,         title: 'Instant PDF Access',     desc: 'Download your purchased notes immediately — no waiting, no delays, any device.' },
  { icon: Shield,      title: 'Secure Checkout',        desc: 'Razorpay-powered payments with full encryption. Your data is always protected.' },
];

const TESTIMONIALS = [
  { name: 'Anjali Sharma',    role: 'MBBS 3rd Year, AIIMS Delhi',              avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150', comment: 'The Pathology and Microbiology notes are absolutely top-notch! The flowcharts and tabular comparisons helped me score an A in my university exams.', rating: 5 },
  { name: 'Dr. Vivek Nair',   role: 'BAMS graduate, Government Ayurvedic College', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150', comment: 'Dravyaguna notes are incredibly hard to write concisely, but this store did it beautifully. Essential for BAMS students.', rating: 5 },
  { name: 'Priyanka Das',     role: 'BSc Nursing 2nd Year, Apollo College',    avatar: 'https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=150', comment: 'Nursing Foundation notes made my clinical placements so much easier. Saved me hours of reference work!', rating: 5 },
];

const STATS = [
  { value: '12,000+', label: 'Students Enrolled' },
  { value: '500+',    label: 'Verified Notes' },
  { value: '50+',     label: 'Expert Sellers' },
  { value: '4.9★',    label: 'Average Rating' },
];

// ─── Main Page ────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [featuredSellers, setFeaturedSellers] = useState<any[]>([]);
  const { specialty } = useSpecialty();
  useLenis();

  const nextTestimonial = () => setCurrentTestimonial(p => (p + 1) % TESTIMONIALS.length);
  const prevTestimonial = () => setCurrentTestimonial(p => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const { data } = await supabase.from('featured_sellers').select('*').limit(4);
        if (data) setFeaturedSellers(data);
      } catch (err) { /* silent */ }
    };
    fetchSellers();
  }, []);

  useEffect(() => {
    const interval = setInterval(nextTestimonial, 6000);
    return () => clearInterval(interval);
  }, []);

  const meta = pageMeta.home();
  const orgSchema = generateOrganizationLD();
  const faqSchema = generateFAQLD();
  const cfg = SPECIALTIES[specialty.id];

  return (
    <div className="overflow-hidden min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <SEOHead {...meta} jsonLd={[orgSchema, faqSchema]} />

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — ANATOMY HERO
          Two-column: Left = tagline/CTA, Right = interactive body
         ═══════════════════════════════════════════════════════ */}
      <section className="min-h-screen relative flex items-center overflow-hidden">

        {/* ── Cinematic Video Background ── */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="fixed inset-0 w-full h-full object-cover z-0"
          style={{ objectPosition: 'center center' }}
          aria-hidden="true"
        >
          <source
            src="https://res.cloudinary.com/dsqxboxoc/video/upload/v1784456953/Create_an_ultra_realistic_cine_zvgdrm.mp4"
            type="video/mp4"
          />
        </video>

        {/* ── Gradient overlay — dark in dark mode, soft in light mode ── */}
        <div
          className="fixed inset-0 z-[1] pointer-events-none"
          style={{
            background: `var(--video-overlay, linear-gradient(
              135deg,
              rgba(7, 23, 43, 0.88) 0%,
              rgba(7, 23, 43, 0.72) 45%,
              rgba(7, 23, 43, 0.52) 75%,
              rgba(7, 23, 43, 0.38) 100%
            ))`,
          }}
        />

        {/* Dynamic specialty background glow — on top of video */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-[2]"
          animate={{
            background: `radial-gradient(ellipse at 75% 50%, ${cfg.glowColor} 0%, transparent 55%),
                         radial-gradient(ellipse at 20% 80%, ${cfg.primaryColor}08 0%, transparent 45%)`,
          }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />

        {/* Medical grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04] z-[2]"
          style={{
            backgroundImage: `linear-gradient(var(--accent-primary) 1px, transparent 1px), linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full relative z-[10] flex flex-col items-center justify-center text-center">
          <div className="max-w-3xl flex flex-col items-center gap-8 z-10 relative">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-2 w-fit px-4 py-2 rounded-full text-xs font-bold font-display uppercase tracking-wider"
              style={{
                background: `color-mix(in srgb, ${cfg.primaryColor} 10%, transparent)`,
                border: `1px solid ${cfg.primaryColor}30`,
                color: cfg.primaryColor,
                transition: 'all 0.8s ease',
              }}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>India's #1 Medical Notes Platform</span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-display font-bold tracking-tight leading-[1.08]" style={{ color: 'var(--text-primary)' }}>
                {specialty.id === 'default' ? (
                  <>
                    Notes That<br />
                    <span style={{ color: cfg.primaryColor }}>Diagnose</span> Your Doubts.
                  </>
                ) : (
                  <>
                    Master <span style={{ color: cfg.primaryColor }}>{specialty.label}</span> Like a Pro.
                  </>
                )}
              </h1>
            </motion.div>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg leading-relaxed max-w-xl font-sans"
              style={{ color: 'var(--text-muted)' }}
            >
              {specialty.id === 'default'
                ? 'Premium handwritten notes, PYQs, and study guides — curated by toppers for MBBS, BDS, BAMS, BPT, B.Sc Nursing and more.'
                : specialty.description
              }
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to={specialty.id !== 'default' ? `/courses?specialty=${encodeURIComponent(specialty.label)}` : '/courses'}
                className="btn-primary py-3.5 px-8 text-sm font-bold flex items-center gap-2 justify-center"
                style={specialty.id !== 'default' ? {
                  background: cfg.primaryColor,
                  boxShadow: `0 8px 32px ${cfg.glowColor}`,
                } : {}}
              >
                <BookOpen className="w-4 h-4" />
                {specialty.id !== 'default' ? `Browse ${specialty.label} Notes` : 'Browse All Notes'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/seller/login"
                className="btn-secondary py-3.5 px-8 text-sm font-bold flex items-center gap-2 justify-center"
              >
                <Download className="w-4 h-4" />
                Become a Seller
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 w-full"
              style={{ borderTop: '1px solid var(--glass-border)' }}
            >
              {STATS.map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-xl sm:text-2xl font-display font-bold" style={{ color: cfg.primaryColor, transition: 'color 0.6s' }}>{s.value}</p>
                  <p className="text-[11px] font-sans mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <div className="w-1 h-2 rounded-full" style={{ background: 'var(--accent-primary)' }} />
          </motion.div>
          <p className="text-[10px] font-sans opacity-40" style={{ color: 'var(--text-muted)' }}>Scroll to explore</p>
        </motion.div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — COURSE CATEGORIES
         ═══════════════════════════════════════════════════════ */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 relative" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <MedicalGridLines />
        <div className="max-w-7xl mx-auto relative z-10">
          <SectionHeader
            badge={<><Sparkles className="w-3.5 h-3.5" />Academic Catalog</>}
            title="Notes Classified by Course"
            subtitle="Select your academic discipline to filter our library of university-specific study guides, handwritten topper cards, and diagrams."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {COURSE_CATEGORIES.map((cat, idx) => (
              <CategoryCard key={cat.id} cat={cat} idx={idx} navigate={navigate} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — FEATURED SELLERS
         ═══════════════════════════════════════════════════════ */}
      {featuredSellers.length > 0 && (
        <section className="py-28 px-4 sm:px-6 lg:px-8 relative" style={{ borderTop: '1px solid var(--glass-border)' }}>
          <div className="max-w-7xl mx-auto relative z-10">
            <SectionHeader
              badge={<><Trophy className="w-3.5 h-3.5" />Verified Authors</>}
              title="Top Verified Creators"
              subtitle="Study from premium notes uploaded by university toppers, reviewed for accuracy and medical curriculum alignment."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
              {featuredSellers.map((seller, idx) => (
                <SellerCard key={seller.id} seller={seller} idx={idx} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — WHY STETHONOTES
         ═══════════════════════════════════════════════════════ */}
      <section id="why-us" className="py-28 px-4 sm:px-6 lg:px-8 relative" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge={<><BookOpen className="w-3.5 h-3.5" />Core Benefits</>}
            title="Why Study with StethoNotes?"
            subtitle="Designed specifically to meet the high academic demands of modern medicine, surgery, and health sciences."
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
            {WHY_US.map((item, idx) => (
              <WhyUsCard key={idx} item={item} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5 — TESTIMONIALS
         ═══════════════════════════════════════════════════════ */}
      <section id="testimonials" className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="max-w-4xl mx-auto relative z-10">
          <SectionHeader
            badge={<><Heart className="w-3.5 h-3.5" />Wall of Love</>}
            title="Loved by Thousands of Medics"
          />
          <div className="mt-12 relative rounded-3xl border p-8 sm:p-14 flex flex-col items-center gap-6"
            style={{ background: 'var(--surface)', borderColor: 'var(--glass-border)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-4 w-full"
              >
                <div className="flex gap-1" style={{ color: cfg.primaryColor }}>
                  {Array.from({ length: TESTIMONIALS[currentTestimonial].rating }, (_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-center text-base sm:text-lg italic leading-relaxed font-sans max-w-2xl" style={{ color: 'var(--text-muted)' }}>
                  "{TESTIMONIALS[currentTestimonial].comment}"
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <img src={TESTIMONIALS[currentTestimonial].avatar} alt={TESTIMONIALS[currentTestimonial].name}
                    className="w-12 h-12 rounded-full object-cover" style={{ border: '2px solid var(--glass-border)' }} />
                  <div>
                    <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{TESTIMONIALS[currentTestimonial].name}</p>
                    <p className="text-xs font-sans" style={{ color: cfg.primaryColor }}>{TESTIMONIALS[currentTestimonial].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-4 mt-2">
              <button onClick={prevTestimonial} className="p-2.5 rounded-xl transition-colors"
                style={{ border: '1px solid var(--glass-border)', background: 'color-mix(in srgb, var(--text-primary) 5%, transparent)', color: 'var(--text-muted)' }}>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextTestimonial} className="p-2.5 rounded-xl transition-colors"
                style={{ border: '1px solid var(--glass-border)', background: 'color-mix(in srgb, var(--text-primary) 5%, transparent)', color: 'var(--text-muted)' }}>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 6 — ABOUT
         ═══════════════════════════════════════════════════════ */}
      <section id="about" className="py-28 px-4 sm:px-6 lg:px-8 relative" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <img
              src="https://res.cloudinary.com/dsqxboxoc/image/upload/v1784056611/ChatGPT_Image_Jul_15_2026_12_45_53_AM_edclrq.png"
              alt="Medical Students Studying"
              className="rounded-3xl object-cover w-full h-[420px]"
              style={{ border: '1px solid var(--glass-border)' }}
            />
          </motion.div>
          <motion.div
            className="lg:col-span-7 flex flex-col items-start gap-5"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Empowering the Next Generation of Healthcare Professionals
            </h2>
            <div className="w-12 h-1 rounded-full" style={{ background: cfg.primaryColor, transition: 'background 0.6s' }} />
            <p className="text-sm leading-relaxed font-sans" style={{ color: 'var(--text-muted)' }}>
              StethoNotes was created by medical students, for medical students. We understand that medical and paramedical syllabi are vast, and traditional textbook layouts can feel overwhelming during final revision cycles.
            </p>
            <p className="text-sm leading-relaxed font-sans" style={{ color: 'var(--text-muted)' }}>
              Our marketplace brings together university toppers, instructors, and experienced doctors to upload high-yield, structured study notes. Each PDF undergoes review for accuracy and syllabus coverage.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4 w-full">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 shrink-0" style={{ color: cfg.primaryColor }} />
                <span className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Topper Community</span>
              </div>
              <div className="flex items-center gap-3">
                <Smile className="w-5 h-5 shrink-0" style={{ color: cfg.primaryColor }} />
                <span className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Affordable Study Aids</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 7 — CONTACT
         ═══════════════════════════════════════════════════════ */}
      <section id="contact" className="py-28 px-4 sm:px-6 lg:px-8 relative" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="max-w-4xl mx-auto rounded-3xl border p-8 sm:p-14 shadow-xl relative z-10"
          style={{ background: 'var(--surface)', borderColor: 'var(--glass-border)' }}>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-display font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Have Questions? Get in Touch
            </h2>
            <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              Drop us a message and our support team will reply within 24 hours.
            </p>
          </div>
          <form className="grid grid-cols-1 sm:grid-cols-2 gap-6" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-display font-semibold" style={{ color: 'var(--text-primary)' }}>Full Name</label>
              <input type="text" placeholder="John Doe" className="input-field" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-display font-semibold" style={{ color: 'var(--text-primary)' }}>Email Address</label>
              <input type="email" placeholder="john@example.com" className="input-field" />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-2">
              <label className="text-xs font-display font-semibold" style={{ color: 'var(--text-primary)' }}>Message</label>
              <textarea placeholder="Write your message here..." rows={4} className="input-field resize-none" />
            </div>
            <div className="sm:col-span-2 flex flex-col items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => alert('Message sent! Thank you for contacting StethoNotes.')}
                className="btn-primary py-3 px-12 text-xs font-bold uppercase tracking-wider"
                style={specialty.id !== 'default' ? { background: cfg.primaryColor, boxShadow: `0 4px 20px ${cfg.glowColor}` } : {}}
              >
                Send Message
              </button>
              <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
                We respect your privacy. Read our{' '}
                <Link to="/privacy" className="hover:underline" style={{ color: cfg.primaryColor }}>Privacy Policy</Link>.
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

// ─── Reusable Section Header ──────────────────────────────────

function SectionHeader({ badge, title, subtitle }: { badge: React.ReactNode; title: string; subtitle?: string }) {
  const { specialty } = useSpecialty();
  const cfg = SPECIALTIES[specialty.id];

  return (
    <motion.div
      className="text-center max-w-3xl mx-auto flex flex-col items-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div
        className="flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold tracking-wider uppercase"
        style={{
          background: `color-mix(in srgb, ${cfg.primaryColor} 10%, transparent)`,
          borderColor: `${cfg.primaryColor}30`,
          color: cfg.primaryColor,
          transition: 'all 0.6s ease',
        }}
      >
        {badge}
      </div>
      <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {subtitle && (
        <p className="font-sans text-sm max-w-2xl mt-1" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

// ─── Medical grid lines (subtle background) ───────────────────

function MedicalGridLines() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.025 }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="var(--accent-primary)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

