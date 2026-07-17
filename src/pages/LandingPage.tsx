import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { memo } from 'react';
import { Award, ShieldCheck, Star, ArrowRight, Activity, Users, Smile, ChevronLeft, ChevronRight, Mail, Trophy, Sparkles, BookOpen, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import SEOHead from '../components/SEOHead';
import { pageMeta, generateOrganizationLD, generateFAQLD } from '../lib/seo';
import HeroSection from '../components/hero/HeroSection';
import { COURSE_CATEGORIES, CourseIcon } from '../components/icons/CourseIcons';

const CategoryCard = memo(({ cat, idx, navigate }: { cat: any; idx: number; navigate: (url: string) => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: idx * 0.05 }}
    onClick={() => navigate(`/courses?course=${encodeURIComponent(cat.name)}`)}
    className="glass-card-v2 p-8 rounded-3xl cursor-pointer hover:border-primary/40 relative overflow-hidden group flex flex-col justify-between h-72 border border-white/5 bg-gradient-to-br from-card/80 to-void/35"
  >
    {/* Decorative inner gradient orbs */}
    <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />

    <div>
      <div className="w-14 h-14 mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
        <CourseIcon name={cat.name} size={40} />
      </div>
      <h3 className="font-display font-bold text-xl text-white mb-2 group-hover:text-primary transition-colors">
        {cat.name}
      </h3>
      <p className="text-muted text-xs leading-relaxed">
        {cat.desc}
      </p>
    </div>
    <div className="flex items-center gap-2 text-primary font-display text-xs font-semibold mt-6 group-hover:translate-x-1.5 transition-transform duration-300">
      <span>Explore Catalog</span>
      <ArrowRight className="w-4 h-4" />
    </div>
  </motion.div>
));

CategoryCard.displayName = 'CategoryCard';

const SellerCard = memo(({ seller, idx }: { seller: any; idx: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: idx * 0.1 }}
    className="glass-card-v2 rounded-3xl p-6 flex flex-col justify-between group bg-gradient-to-b from-card to-void/20 hover:border-primary/30 border border-white/5"
  >
    <div>
      <div className="flex items-center gap-3.5 mb-5">
        {seller.avatar_url ? (
          <img 
            src={seller.avatar_url} 
            alt={seller.store_name || seller.name} 
            className="w-11 h-11 rounded-2xl object-cover border border-white/10 group-hover:border-primary/30 transition-all"
          />
        ) : (
          <div className="w-11 h-11 rounded-2xl bg-primary/5 border border-white/10 flex items-center justify-center text-primary text-lg font-bold shrink-0">
            {(seller.store_name || seller.name || 'S').substring(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="font-display font-bold text-white text-sm group-hover:text-primary transition-colors">
            {seller.store_name || seller.name}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-primary bg-primary/10 px-2 py-0.5 rounded-full text-[9px] font-semibold w-fit border border-primary/20">
            <ShieldCheck className="w-3 h-3" />
            <span>Verified Topper</span>
          </div>
        </div>
      </div>
      <p className="text-muted text-xs leading-relaxed mb-6 line-clamp-3">
        {seller.bio || 'Author of premium medical study guides and high-yield handwritten revisions.'}
      </p>
    </div>
    <div>
      <div className="flex items-center justify-between border-t border-white/5 pt-4 mb-4">
        <div className="flex items-center gap-1.5 text-muted text-xs">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>{seller.total_sales}+ Sales</span>
        </div>
        <div className="text-[10px] text-primary/70 font-semibold uppercase tracking-wider">
          {seller.refund_rate < 0.1 ? '99% Trust' : 'Approved Creator'}
        </div>
      </div>
      <Link
        to={`/courses?seller_id=${seller.id}`}
        className="w-full py-2.5 rounded-xl text-xs font-semibold text-center block bg-white/5 border border-white/10 text-white hover:bg-primary hover:border-primary hover:text-void transition-all duration-300"
      >
        View Notes
      </Link>
    </div>
  </motion.div>
));

SellerCard.displayName = 'SellerCard';

const WhyUsCard = memo(({ item, idx }: { item: any; idx: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: idx * 0.1 }}
    className="glass-card-v2 p-8 rounded-3xl flex flex-col items-center text-center gap-4 hover:border-primary/30"
  >
    <div className="p-4 bg-primary/5 border border-white/5 rounded-2xl group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
      {item.icon}
    </div>
    <h3 className="font-display font-bold text-lg text-white">
      {item.title}
    </h3>
    <p className="text-muted text-xs leading-relaxed">
      {item.desc}
    </p>
  </motion.div>
));

WhyUsCard.displayName = 'WhyUsCard';

const WHY_US = [
  {
    icon: <Mail className="w-7 h-7 text-primary" />,
    title: 'Instant Email Delivery',
    desc: 'Get your note files sent directly to your email inbox immediately after payment. No manual downloads needed.'
  },
  {
    icon: <Award className="w-7 h-7 text-primary" />,
    title: 'Topper-Curated Content',
    desc: 'Compiled and verified by university rankers and toppers, ensuring maximum accuracy and score success.'
  },
  {
    icon: <Activity className="w-7 h-7 text-primary" />,
    title: 'Affordable Pricing',
    desc: 'Access standard-quality guides at a fraction of standard textbook costs, tailored for student budgets.'
  },
  {
    icon: <ShieldCheck className="w-7 h-7 text-primary" />,
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
    rating: 5
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [featuredSellers, setFeaturedSellers] = useState<any[]>([]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  // Fetch featured sellers
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const { data } = await supabase
          .from('featured_sellers')
          .select('*')
          .limit(4);
        if (data) setFeaturedSellers(data);
      } catch (err) {
        console.error('Error fetching featured sellers:', err);
      }
    };
    fetchSellers();
  }, []);

  // Auto scroll testimonials
  useEffect(() => {
    const interval = setInterval(nextTestimonial, 6000);
    return () => clearInterval(interval);
  }, []);

  const meta = pageMeta.home();
  const orgSchema = generateOrganizationLD();
  const faqSchema = generateFAQLD();

  return (
    <div className="overflow-hidden bg-void min-h-screen text-white">
      <SEOHead {...meta} jsonLd={[orgSchema, faqSchema]} />
      {/* 1. Premium Interactive Hero Section */}
      <HeroSection />

      {/* 2. Course Category Section */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold tracking-wider text-primary uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Academic Catalog</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
              Notes Classified by Course
            </h2>
            <p className="text-muted font-sans text-sm max-w-2xl mt-1">
              Select your academic discipline to filter our library of university-specific study guides, handwritten topper cards, and diagrams.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {COURSE_CATEGORIES.map((cat, idx) => (
              <CategoryCard key={cat.id} cat={cat} idx={idx} navigate={navigate} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Sellers Section */}
      {featuredSellers.length > 0 && (
        <section className="py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5 relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold tracking-wider text-primary uppercase">
                <Trophy className="w-3.5 h-3.5" />
                <span>Verified Authors</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
                Top Verified Creators
              </h2>
              <p className="text-muted font-sans text-sm max-w-2xl mt-1">
                Study from premium notes uploaded by university toppers, reviewed for accuracy and medical curriculum alignments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredSellers.map((seller, idx) => (
                <SellerCard key={seller.id} seller={seller} idx={idx} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Why StethoNotes Bento Section */}
      <section id="why-us" className="py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold tracking-wider text-primary uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Core Benefits</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
              Why Study with StethoNotes?
            </h2>
            <p className="text-muted font-sans text-sm max-w-2xl mt-1">
              Designed specifically to meet the high academic demands of modern medicine, surgery, and health sciences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {WHY_US.map((item, idx) => (
              <WhyUsCard key={idx} item={item} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Testimonials Section */}
      <section id="testimonials" className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(31,182,212,0.08),transparent_45%)]" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold tracking-wider text-primary uppercase">
              <Heart className="w-3.5 h-3.5" />
              <span>Wall of Love</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
              Loved by Thousands of Medics
            </h2>
          </div>

          {/* Testimonial slider */}
          <div className="relative bg-card/60 backdrop-blur-md p-8 sm:p-14 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-6">
            <div className="flex gap-1 text-primary mb-2">
              {Array.from({ length: TESTIMONIALS[currentTestimonial].rating }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current text-primary" />
              ))}
            </div>

            <p className="text-center text-gray-200 text-base sm:text-lg italic leading-relaxed font-sans max-w-2xl">
              "{TESTIMONIALS[currentTestimonial].comment}"
            </p>

            <div className="flex items-center gap-4 mt-4">
              <img
                src={TESTIMONIALS[currentTestimonial].avatar}
                alt={TESTIMONIALS[currentTestimonial].name}
                className="w-12 h-12 rounded-full border border-primary/30 object-cover"
              />
              <div className="text-left">
                <h4 className="font-display font-bold text-sm text-white">
                  {TESTIMONIALS[currentTestimonial].name}
                </h4>
                <p className="text-primary text-xs font-sans">
                  {TESTIMONIALS[currentTestimonial].role}
                </p>
              </div>
            </div>

            {/* Slider Navigation */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={prevTestimonial}
                className="p-2.5 border border-white/10 hover:border-primary hover:text-primary rounded-xl transition-colors bg-white/5"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextTestimonial}
                className="p-2.5 border border-white/10 hover:border-primary hover:text-primary rounded-xl transition-colors bg-white/5"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. About Section */}
      <section id="about" className="py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 relative group">
            {/* Soft glowing mesh frame */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-primary to-accent rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-300" />
            <img
              src="https://res.cloudinary.com/dsqxboxoc/image/upload/v1784056611/ChatGPT_Image_Jul_15_2026_12_45_53_AM_edclrq.png"
              alt="Medical Students Studying"
              className="rounded-3xl border border-white/10 relative z-10 object-cover w-full h-[420px]"
            />
          </div>
          <div className="lg:col-span-7 flex flex-col items-start gap-5">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
              Empowering the Next Generation of Healthcare Professionals
            </h2>
            <div className="w-12 h-1 bg-primary rounded-full" />
            <p className="text-muted text-sm leading-relaxed mt-2 font-sans">
              StethoNotes was created by medical students, for medical students. We understand that medical and paramedical syllabi are vast, and traditional textbook layouts can sometimes feel overwhelming during final revision cycles.
            </p>
            <p className="text-muted text-sm leading-relaxed font-sans">
              Our marketplace brings together university toppers, instructors, and experienced doctors to upload high-yield, structured study notes. Each note PDF undergoes review for accuracy and syllabus coverage, ensuring that your study prep is focused, concise, and highly effective.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4 w-full">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary shrink-0" />
                <span className="font-display font-semibold text-white text-sm">Topper Community</span>
              </div>
              <div className="flex items-center gap-3">
                <Smile className="w-5 h-5 text-primary shrink-0" />
                <span className="font-display font-semibold text-white text-sm">Affordable Study Aids</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Contact Section */}
      <section id="contact" className="py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-darkest/30 relative">
        <div className="max-w-4xl mx-auto bg-card rounded-3xl border border-white/10 p-8 sm:p-14 shadow-2xl relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-12 flex flex-col items-center gap-3">
            <h2 className="text-3xl font-display font-bold text-white tracking-tight">
              Have Questions? Get in Touch
            </h2>
            <p className="text-muted text-xs">
              Drop us a message and our support team will reply within 24 hours.
            </p>
          </div>

          <form className="grid grid-cols-1 sm:grid-cols-2 gap-6" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-display font-semibold text-white">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className="bg-void border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none px-4 py-3.5 rounded-xl text-sm text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-display font-semibold text-white">Email Address</label>
              <input
                type="email"
                placeholder="john@example.com"
                className="bg-void border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none px-4 py-3.5 rounded-xl text-sm text-white"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-2">
              <label className="text-xs font-display font-semibold text-white">Message</label>
              <textarea
                placeholder="Write your message here..."
                rows={4}
                className="bg-void border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none px-4 py-3.5 rounded-xl text-sm text-white resize-none"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => alert('Message Sent! Thank you for contacting StethoNotes.')}
                className="btn-primary py-3 px-12 text-xs font-bold uppercase tracking-wider shadow-md"
              >
                Send Message
              </button>
              <p className="text-xs text-muted text-center mt-2">
                We respect your privacy. Read our{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>{' '}
                to learn how we handle your data.
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
