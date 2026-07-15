import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Note, Course } from '../types';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, GraduationCap, ShoppingCart, Check } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useToastStore } from '../store/useToastStore';
import { NoteCardSkeleton } from '../components/Skeleton';
import SEOHead from '../components/SEOHead';
import { pageMeta, generateBreadcrumbLD } from '../lib/seo';

export default function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const subjectsList = ['All', ...Array.from(new Set(
    notes
      .filter(n => selectedCourse === 'All' || (n as any).course?.name === selectedCourse)
      .map(n => n.subject)
  ))];

  // Filtering logic
  const filteredNotes = notes
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
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // newest
    });

  const handleCourseFilter = (courseName: string) => {
    setSelectedCourse(courseName);
    setSelectedSubject('All'); // Reset subject filter when changing course
    
    // Update search query params
    if (courseName === 'All') {
      searchParams.delete('course');
    } else {
      searchParams.set('course', courseName);
    }
    setSearchParams(searchParams);
  };

  const handleAddToCart = (note: Note) => {
    addItem(note);
    addToast('success', 'Added to Cart', `${note.title} has been added to your shopping cart.`);
  };

  const activeCourseName = selectedCourse !== 'All' ? selectedCourse : undefined;
  const seoMeta = pageMeta.courses(activeCourseName);
  const breadcrumbSchema = generateBreadcrumbLD([
    { name: 'Home', url: 'https://www.stethonotes.store/' },
    { name: 'Courses', url: 'https://www.stethonotes.store/courses' },
    ...(activeCourseName ? [{ name: activeCourseName, url: `https://www.stethonotes.store/courses?course=${encodeURIComponent(activeCourseName)}` }] : [])
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <SEOHead {...seoMeta} jsonLd={breadcrumbSchema} />
      {/* Header and Title */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-primary tracking-tight">
            Study Guides Library
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Browse through {filteredNotes.length} medical notes carefully structured for exam preparation.
          </p>
          {selectedSeller !== 'All' && (
            <div className="flex items-center gap-2 bg-accent/15 border border-accent/20 px-3 py-1.5 rounded-full text-accent text-xs font-semibold w-fit mt-2">
              <span>Notes by {(notes.find(n => n.seller_id === selectedSeller) as any)?.seller?.store_name || 'Verified Seller'}</span>
              <button 
                onClick={() => {
                  searchParams.delete('seller_id');
                  setSearchParams(searchParams);
                }} 
                className="hover:text-primary transition-colors ml-1 font-bold text-sm"
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
            className="w-full pl-11 pr-4 py-3 border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl text-sm transition-all"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar filters - Desktop */}
        <aside className="hidden lg:block lg:col-span-3 bg-white border border-gray-100 rounded-2xl p-6 shadow-cyan-soft sticky top-24">
          <div className="flex items-center gap-2 font-display font-bold text-primary mb-6 border-b border-gray-100 pb-3">
            <Filter className="w-5 h-5 text-accent" />
            <span>Filter Catalog</span>
          </div>

          {/* Courses selection */}
          <div className="mb-6">
            <h3 className="text-xs font-display font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Academic Courses
            </h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleCourseFilter('All')}
                className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCourse === 'All'
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-primary hover:bg-gray-50'
                }`}
              >
                All Courses
              </button>
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => handleCourseFilter(course.name)}
                  className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                    selectedCourse === course.name
                      ? 'bg-accent/10 text-accent font-semibold'
                      : 'text-primary hover:bg-gray-50'
                  }`}
                >
                  <span>{course.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subjects selection */}
          <div className="mb-6">
            <h3 className="text-xs font-display font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Subjects
            </h3>
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
              {subjectsList.map((subject) => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedSubject === subject
                      ? 'bg-primary/5 text-primary font-semibold border-l-2 border-accent pl-2.5'
                      : 'text-gray-500 hover:bg-gray-50'
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
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 text-xs text-primary font-semibold border border-gray-200 bg-white px-3 py-2 rounded-xl"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>
              <span className="text-xs text-gray-400 font-sans hidden sm:inline">
                Showing {filteredNotes.length} results
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium text-primary outline-none focus:border-accent"
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
                <NoteCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl flex flex-col items-center gap-4">
              <GraduationCap className="w-16 h-16 text-gray-300" />
              <h3 className="font-display font-bold text-xl text-primary">No Study Guides Found</h3>
              <p className="text-gray-400 text-sm max-w-sm">
                Try widening your search terms or selecting a different course classification above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.map((note) => {
                const added = isInCart(note.id);
                return (
                  <div
                    key={note.id}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-cyan-hover transition-all duration-300 flex flex-col justify-between group"
                  >
                    {/* Thumbnail Wrapper */}
                    <Link to={`/notes/${note.id}`} className="relative aspect-[4/3] overflow-hidden bg-gray-100 block">
                      <img
                        src={note.thumbnail_url}
                        alt={note.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-primary/95 text-white text-[10px] font-display font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                        {(note as any).course?.name || 'Medical'}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-accent text-white text-xs font-display font-bold px-3 py-1 rounded-xl shadow-md">
                        ₹{note.price}
                      </div>
                    </Link>

                    {/* Card Content */}
                    <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-sans font-semibold text-accent tracking-wider uppercase">
                          {note.subject}
                        </span>
                        <Link
                          to={`/notes/${note.id}`}
                          className="font-display font-bold text-base text-primary hover:text-accent transition-colors mt-1 block line-clamp-2"
                        >
                          {note.title}
                        </Link>
                        <p className="text-gray-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                          {note.description}
                        </p>
                      </div>

                      {/* Add to Cart Footer */}
                      <div className="flex gap-2">
                        {added ? (
                          <Link
                            to="/cart"
                            className="w-full py-2.5 bg-accent/10 text-accent font-display text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-accent/15 transition-all"
                          >
                            <Check className="w-4 h-4" />
                            <span>In Cart — Checkout</span>
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(note)}
                            className="w-full py-2.5 bg-accent text-white font-display text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-accent-hover transition-all"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Add to Cart</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />

          {/* Drawer body */}
          <div className="relative ml-0 mr-auto w-full max-w-xs h-full bg-white shadow-2xl p-6 flex flex-col justify-between z-10 animate-slide-right">
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
                <span className="font-display font-bold text-primary flex items-center gap-2">
                  <Filter className="w-5 h-5 text-accent" />
                  <span>Filters</span>
                </span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  Close
                </button>
              </div>

              {/* Courses */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Courses</h4>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      handleCourseFilter('All');
                      setMobileFilterOpen(false);
                    }}
                    className={`text-left px-3 py-2 rounded-xl text-sm font-medium ${
                      selectedCourse === 'All' ? 'bg-accent/10 text-accent' : 'text-primary'
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
                      className={`text-left px-3 py-2 rounded-xl text-sm font-medium ${
                        selectedCourse === course.name ? 'bg-accent/10 text-accent' : 'text-primary'
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
              className="btn-primary w-full py-3"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
