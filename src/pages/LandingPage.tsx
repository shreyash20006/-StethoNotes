import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, ShieldCheck, Star, ArrowRight, Activity, Users, Smile, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';

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
      {/* 1. Hero Section */}
      <section className="relative bg-dark-navy text-white pt-24 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,182,212,0.15),transparent_45%)]" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Hero text */}
          <div className="lg:col-span-7 flex flex-col items-start gap-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 border border-accent/30 rounded-full"
            >
              <Activity className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-accent font-display text-xs font-semibold uppercase tracking-wider">
                India's First Med-Notes Marketplace
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-6xl font-display font-extrabold leading-tight tracking-tight text-white"
            >
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-white">Stethoscope</span> <br />
              to Academic Success
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-gray-300 text-lg sm:text-xl font-sans max-w-2xl leading-relaxed"
            >
              Exclusively compiled digital study notes, handwritten summaries, and exam-cracking guides created by top medical and paramedical toppers.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4"
            >
              <Link to="/courses" className="btn-primary py-4 px-8 text-base">
                Browse Study Notes
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#about" className="btn-outline-white py-4 px-8 text-base">
                Learn More
              </a>
            </motion.div>

            {/* Quick Metrics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-3 gap-6 pt-8 mt-4 border-t border-white/10 w-full max-w-md"
            >
              <div>
                <h4 className="font-display font-bold text-2xl text-accent">500+</h4>
                <p className="text-gray-400 text-xs mt-1">Syllabus PDFs</p>
              </div>
              <div>
                <h4 className="font-display font-bold text-2xl text-accent">10k+</h4>
                <p className="text-gray-400 text-xs mt-1">Active Students</p>
              </div>
              <div>
                <h4 className="font-display font-bold text-2xl text-accent">4.9★</h4>
                <p className="text-gray-400 text-xs mt-1">Average Rating</p>
              </div>
            </motion.div>
          </div>

          {/* Hero Image / Animated graphic */}
          <div className="lg:col-span-5 flex justify-center relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-72 h-72 sm:w-96 sm:h-96"
            >
              {/* Decorative Pulsing circles */}
              <div className="absolute inset-0 bg-accent/10 rounded-full filter blur-2xl animate-pulse" />
              
              {/* Core SVG illustration representing medical study */}
              <svg className="w-full h-full text-accent relative z-10" viewBox="0 0 200 200" fill="none">
                <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" className="animate-spin" style={{ animationDuration: '30s' }} />
                
                {/* Book */}
                <rect x="55" y="65" width="90" height="70" rx="4" fill="#0F2D6B" stroke="currentColor" strokeWidth="3" />
                <path d="M100 65v70" stroke="currentColor" strokeWidth="2" />
                <path d="M65 80h25M65 95h25M65 110h25M110 80h25M110 95h25M110 110h25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                
                {/* Stethoscope wrapping book */}
                <path d="M40 70c-15 15-20 40-10 60s35 25 55 15c10-5 15-15 15-25" stroke="#1FB6D4" strokeWidth="4" strokeLinecap="round" />
                <path d="M100 130c0 15 10 30 30 35s40-5 45-25c3-12-2-25-10-30" stroke="#1FB6D4" strokeWidth="4" strokeLinecap="round" />
                <circle cx="165" cy="110" r="10" fill="#1FB6D4" />
                <circle cx="165" cy="110" r="4" fill="#0F2D6B" />
              </svg>
            </motion.div>
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
  src="/src/assets/hero.png"
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
            <div className="sm:col-span-2 flex flex-col items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => alert('Message Sent! Thank you for contacting StethoNotes.')}
                className="btn-primary py-3 px-10 text-sm font-semibold"
              >
                Send Message
              </button>
              <p className="text-xs text-gray-400 text-center">
                We respect your privacy. Read our{' '}
                <Link to="/privacy" className="text-accent hover:underline">
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
