import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Note, Course } from '../types';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, GraduationCap, ShoppingCart, Check, Star, BookOpen } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useToastStore } from '../store/useToastStore';
import { ProductCardSkeleton } from '../components/Skeleton';
import SEOHead from '../components/SEOHead';
import { pageMeta, generateBreadcrumbLD } from '../lib/seo';

const NoteCard = memo(({ note, added, onAddToCart }: { note: Note; added: boolean; onAddToCart: (note: Note) => void }) => (
  <div
    className="glass-card-v2 border border-white/8 rounded-2xl overflow-hidden hover:border-primary/45 transition-all duration-300 flex flex-col justify-between group h-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-[#102640]"
  >
    <Link to={`/notes/${note.id}`} className="relative aspect-[16/10] overflow-hidden bg-void/30 block border-b border-white/8">
      <img
        src={note.thumbnail_url}
        alt={note.title}
        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 filter brightness-[0.92] group-hover:brightness-100"
      />
      <div className="absolute top-4 left-4 bg-void/90 backdrop-blur-md text-primary border border-primary/20 text-[9px] font-display font-semibold tracking-widest px-3 py-1 rounded-md uppercase shadow-sm">
        {(note as any).course?.name || 'Medical'}
      </div>
      <div className="absolute bottom-4 right-4 bg-[#07172B] border border-white/10 text-white text-xs font-display font-bold px-3.5 py-1.5 rounded-lg shadow-md">
        ₹{note.price}
      </div>
    </Link>
    
    <div className="p-6 flex flex-col flex-1 justify-between gap-5">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-display font-medium text-primary tracking-widest uppercase">
            {note.subject}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-400/5 border border-amber-400/10 px-1.5 py-0.5 rounded">
            <Star className="w-3 h-3 fill-current" />
            <span>4.9</span>
          </div>
        </div>
        
        <Link
          to={`/notes/${note.id}`}
          className="font-display font-bold text-base text-white hover:text-primary transition-colors mt-2 block line-clamp-1 leading-snug tracking-tight"
        >
          {note.title}
        </Link>
        
        <p className="text-muted text-xs mt-2 line-clamp-2 leading-relaxed font-sans font-light">
          {note.description}
        </p>

        {/* Apple-style thin metadata tags */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5 text-[10px] text-muted/80">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-primary/70" />
            <span>PDF Study Guide</span>
          </span>
          <span className="w-1 h-1 bg-white/15 rounded-full" />
          <span>Topper Verified</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        {added ? (
          <Link
            to="/cart"
            className="w-full py-2.5 bg-primary/10 text-primary border border-primary/25 font-display text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-primary/20 transition-all tracking-wide"
          >
            <Check className="w-4 h-4" />
            <span>In Cart — Checkout</span>
          </Link>
        ) : (
          <button
            onClick={() => onAddToCart(note)}
            className="w-full py-2.5 bg-primary text-void font-display text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-primary-dark transition-all hover:shadow-[0_4px_20px_rgba(34,199,242,0.25)] tracking-wide"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        )}
      </div>
    </div>
  </div>
));

NoteCard.displayName = 'NoteCard';

export default function CoursesPage() {
  const [searchParams, searchSetParams] = useSearchParams();
  const { addItem, isInCart } = useCartStore();
  const { addToast } = useToastStore();

  const [notes, setNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get('course') || 'All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedSeller, setSelectedSeller] = useState(searchParams.get('seller_id') || 'All');
  const [sortBy, setSortBy] = useState('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync course and seller from query param
  useEffect(() => {
    const courseParam = searchParams.get('course');
    setSelectedCourse(courseParam || 'All');
    
    const sellerParam = searchParams.get('seller_id');
    setSelectedSeller(sellerParam || 'All');
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch courses
        const { data: coursesData } = await supabase.from('courses').select('*');
        if (coursesData) {
          setCourses(coursesData);
        }

        // Fetch notes (with course relation join and seller store name)
        const { data: notesData } = await supabase
          .from('notes')
          .select('*, course:courses(*), seller:seller_profiles(store_name)')
          .eq('status', 'active');
        if (notesData) {
          setNotes(notesData);
        }
      } catch (err) {
        console.error('Error fetching catalog data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique subjects for current course filter
  const subjectsList = useMemo(() => ['All', ...Array.from(new Set(
    notes
      .filter(n => selectedCourse === 'All' || (n as any).course?.name === selectedCourse)
      .map(n => n.subject)
  ))], [notes, selectedCourse]);

  const filteredNotes = useMemo(() => notes
    .filter((note) => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            note.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const courseName = (note as any).course?.name;
      const matchesCourse = selectedCourse === 'All' || courseName === selectedCourse;
      const matchesSubject = selectedSubject === 'All' || note.subject === selectedSubject;
      const matchesSeller = selectedSeller === 'All' || note.seller_id === selectedSeller;

      return matchesSearch && matchesCourse && matchesSubject && matchesSeller;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }), [notes, searchQuery, selectedCourse, selectedSubject, selectedSeller, sortBy]);

  const handleCourseFilter = useCallback((courseName: string) => {
    setSelectedCourse(courseName);
    setSelectedSubject('All');
    
    if (courseName === 'All') {
      searchParams.delete('course');
    } else {
      searchParams.set('course', courseName);
    }
    searchSetParams(searchParams);
  }, [searchParams, searchSetParams]);

  const handleAddToCart = useCallback((note: Note) => {
    addItem(note);
    addToast('success', 'Added to Cart', `${note.title} has been added to your shopping cart.`);
  }, [addItem, addToast]);

  const activeCourseName = selectedCourse !== 'All' ? selectedCourse : undefined;
  const seoMeta = pageMeta.courses(activeCourseName);
  const breadcrumbSchema = generateBreadcrumbLD([
    { name: 'Home', url: 'https://www.stethonotes.store/' },
    { name: 'Courses', url: 'https://www.stethonotes.store/courses' },
    ...(activeCourseName ? [{ name: activeCourseName, url: `https://www.stethonotes.store/courses?course=${encodeURIComponent(activeCourseName)}` }] : [])
  ]);

  return (
    <div className="bg-void min-h-screen text-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SEOHead {...seoMeta} jsonLd={breadcrumbSchema} />
        {/* Header and Title */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/8 pb-8">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">
              Study Guides Library
            </h1>
            <p className="text-muted text-sm mt-1">
              Browse through {filteredNotes.length} medical notes carefully structured for exam preparation.
            </p>
            {selectedSeller !== 'All' && (
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-primary text-xs font-semibold w-fit mt-3">
                <span>Notes by {(notes.find(n => n.seller_id === selectedSeller) as any)?.seller?.store_name || 'Verified Seller'}</span>
                <button 
                  onClick={() => {
                    searchParams.delete('seller_id');
                    searchSetParams(searchParams);
                  }} 
                  className="hover:text-white transition-colors ml-1 font-bold text-sm"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Search Input bar */}
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Search by title, subject, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#102640] border border-white/8 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none rounded-xl text-sm transition-all text-white"
            />
            <Search className="w-5 h-5 text-muted absolute left-4 top-3.5" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar filters - Desktop */}
          <aside className="hidden lg:block lg:col-span-3 bg-[#102640] border border-white/8 rounded-2xl p-6 shadow-xl sticky top-24">
            <div className="flex items-center gap-2 font-display font-bold text-white mb-6 border-b border-white/8 pb-3">
              <Filter className="w-5 h-5 text-primary" />
              <span>Filter Catalog</span>
            </div>

            {/* Courses selection */}
            <div className="mb-6">
              <h3 className="text-xs font-display font-bold text-muted uppercase tracking-wider mb-3">
                Academic Courses
              </h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleCourseFilter('All')}
                  className={`text-left px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                    selectedCourse === 'All'
                      ? 'bg-primary text-void border-primary'
                      : 'text-muted hover:text-white hover:bg-white/5 border-transparent'
                  }`}
                >
                  All Courses
                </button>
                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleCourseFilter(course.name)}
                    className={`text-left px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                      selectedCourse === course.name
                        ? 'bg-primary text-void border-primary'
                        : 'text-muted hover:text-white hover:bg-white/5 border-transparent'
                    }`}
                  >
                    <span>{course.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subjects selection */}
            <div className="mb-6">
              <h3 className="text-xs font-display font-bold text-muted uppercase tracking-wider mb-3">
                Subjects
              </h3>
              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
                {subjectsList.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedSubject === subject
                        ? 'bg-primary/10 text-primary font-semibold pl-3'
                        : 'text-muted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main List Grid */}
          <main className="lg:col-span-9 flex flex-col gap-6">
            {/* Sorting and mobile filter trigger */}
            <div className="flex items-center justify-between bg-card/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 text-xs text-white font-semibold border border-white/10 bg-card px-3 py-2 rounded-xl"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                </button>
                <span className="text-xs text-muted font-sans hidden sm:inline">
                  Showing {filteredNotes.length} results
                </span>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-muted" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-void border border-white/10 rounded-xl px-3 py-1.5 text-xs font-medium text-white outline-none focus:border-primary"
                >
                  <option value="newest">Newest Releases</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="title">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Loading Skeletons */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-20 bg-card/30 rounded-3xl border border-white/5 flex flex-col items-center gap-4">
                <GraduationCap className="w-14 h-14 text-muted" />
                <h3 className="font-display font-bold text-xl text-white">No Study Guides Found</h3>
                <p className="text-muted text-xs max-w-xs">
                  Try widening your search terms or selecting a different course classification from the sidebar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map((note) => {
                  const added = isInCart(note.id);
                  return (
                    <NoteCard
                      key={note.id}
                      note={note}
                      added={added}
                      onAddToCart={handleAddToCart}
                    />
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* Mobile Drawer filter Overlay */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-void/80 backdrop-blur-sm"
              onClick={() => setMobileFilterOpen(false)}
            />

            {/* Drawer body */}
            <div className="relative ml-0 mr-auto w-full max-w-xs h-full bg-[#102640] border-r border-white/8 shadow-xl p-6 flex flex-col justify-between z-10 animate-slide-right text-white">
              <div>
                <div className="flex justify-between items-center mb-6 border-b border-white/8 pb-3">
                  <span className="font-display font-bold text-white flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" />
                    <span>Filters</span>
                  </span>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-muted hover:text-white"
                  >
                    Close
                  </button>
                </div>

                {/* Courses */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Courses</h4>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        handleCourseFilter('All');
                        setMobileFilterOpen(false);
                      }}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                        selectedCourse === 'All' ? 'bg-primary text-void' : 'text-muted hover:bg-white/5'
                      }`}
                    >
                      All Courses
                    </button>
                    {courses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => {
                          handleCourseFilter(course.name);
                          setMobileFilterOpen(false);
                        }}
                        className={`text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                          selectedCourse === course.name ? 'bg-primary text-void' : 'text-muted hover:bg-white/5'
                        }`}
                      >
                        {course.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setMobileFilterOpen(false)}
                className="btn-primary w-full py-3 text-xs font-bold uppercase tracking-wider"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
