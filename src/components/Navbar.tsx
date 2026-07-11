import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import {
  ShoppingCart,
  User,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  BookOpen,
  Search,
  Heart,
  Bell,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Browse Notes', to: '/courses' },
  { label: 'Courses', to: '/courses' },
  { label: 'Pricing', to: '/#pricing' },
  { label: 'Track Order', to: '/lookup' },
  { label: 'Resources', to: '/#resources' },
  { label: 'Become a Seller', to: '/#seller' },
];

const MOBILE_NAV_LINKS = [
  { label: 'Browse Notes', to: '/courses' },
  { label: 'Courses', to: '/courses' },
  { label: 'Pricing', to: '/#pricing' },
  { label: 'Track Order', to: '/lookup' },
  { label: 'Resources', to: '/#resources' },
  { label: 'Become a Seller', to: '/#seller' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { items } = useCartStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const cartCount = items.length;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  const handleLogout = async () => {
    await signOut();
    setIsDropdownOpen(false);
    navigate('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <>
      {/* ─── NAVBAR ─────────────────────────────────────────── */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass-nav-scrolled' : 'glass-nav'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-8">
          <div
            className={`flex items-center gap-3 lg:gap-4 transition-all duration-300 ${
              scrolled ? 'h-[72px]' : 'h-[84px]'
            }`}
          >
            {/* ── Logo ────────────────────────────── */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              {/* Icon container */}
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
                <svg
                  className="w-[22px] h-[22px] relative z-10"
                  viewBox="0 0 32 32"
                  fill="none"
                >
                  {/* Stethoscope shape */}
                  <circle cx="23" cy="23" r="5" stroke="#1FB6D4" strokeWidth="2.5" fill="none" />
                  <path
                    d="M23 18V12C23 7.58 19.42 4 15 4H13C8.58 4 5 7.58 5 12V20C5 23.31 7.69 26 11 26"
                    stroke="#0F2D6B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M11 26H16C16 26 18 25.5 18 23.5"
                    stroke="#0F2D6B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Small doc lines */}
                  <rect x="8" y="9" width="10" height="1.5" rx="0.75" fill="#1FB6D4" />
                  <rect x="8" y="12.5" width="7" height="1.5" rx="0.75" fill="#1FB6D4" opacity="0.6" />
                </svg>
              </div>

              {/* Brand name */}
              <span className="font-display font-bold text-2xl lg:text-[1.55rem] tracking-tight text-primary leading-none">
                Stetho<span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary-light">Notes</span>
              </span>
            </Link>

            {/* ── Desktop Search Bar (xl+) ────────── */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden xl:flex items-center w-[280px] shrink-0 relative"
            >
              <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, subjects..."
                className="w-full pl-10 pr-4 py-2 text-xs font-sans rounded-full border border-gray-200 bg-gray-50/80 focus:bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all duration-200 placeholder:text-gray-400 text-primary"
              />
            </form>

            {/* ── Desktop Nav Links ────────────────── */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-5 flex-1 justify-center">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  className={({ isActive }) =>
                    `nav-link text-[13px] ${isActive ? 'active' : ''} whitespace-nowrap`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* ── Right Actions ────────────────────── */}
            <div className="hidden lg:flex items-center gap-1.5 shrink-0">
              {/* Wishlist */}
              <button
                className="relative p-2 text-gray-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-200"
                title="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </button>

              {/* Search icon for lg (below xl) */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="xl:hidden relative p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-xl transition-all duration-200"
                title="Search"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              {/* Notifications (future) */}
              <button
                className="relative p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-xl transition-all duration-200"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-xl transition-all duration-200"
                title="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-accent text-white font-sans text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-200 mx-1" />

              {/* Auth */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 rounded-xl hover:border-accent/50 hover:bg-accent/5 transition-all duration-200 text-primary font-display text-sm font-medium"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">
                        {user.name?.[0]?.toUpperCase() ?? 'U'}
                      </span>
                    </div>
                    <span className="max-w-[90px] truncate">{user.name}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-gray-50">
                            <p className="text-xs text-gray-400 font-sans">Logged in as</p>
                            <p className="font-display font-semibold text-sm text-primary truncate">
                              {user.name}
                            </p>
                            <span className="inline-block mt-1 bg-accent/10 text-accent font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">
                              {user.role}
                            </span>
                          </div>

                          {user.role === 'admin' && (
                            <Link
                              to="/admin"
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-accent/5 hover:text-accent transition-colors"
                            >
                              <ShieldAlert className="w-4 h-4" />
                              <span>Admin Panel</span>
                            </Link>
                          )}

                          <Link
                            to="/dashboard"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-accent/5 hover:text-accent transition-colors"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>My Purchases</span>
                          </Link>

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-display font-semibold text-primary border-2 border-primary/20 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/login?signup=true"
                    className="btn-gradient px-4 py-2 text-sm font-semibold rounded-xl"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* ── Mobile Right Controls ─────────────── */}
            <div className="flex items-center gap-2 lg:hidden ml-auto">
              {/* Mobile search toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-gray-500 hover:text-primary transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 text-gray-500 hover:text-primary transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-accent text-white font-sans text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Hamburger */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-primary hover:text-accent transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Search Bar ─────────────────── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t border-gray-100 bg-white/95"
            >
              <form onSubmit={handleSearchSubmit} className="px-4 py-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Anatomy, Pharmacology, Nursing..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-sans rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-full hover:bg-accent-hover transition-colors"
                >
                  Search
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── MOBILE DRAWER ──────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[300px] bg-white shadow-2xl flex flex-col lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
                <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <svg viewBox="0 0 32 32" fill="none" className="w-4 h-4">
                      <circle cx="23" cy="23" r="5" stroke="white" strokeWidth="2.5" fill="none" />
                      <path d="M23 18V12C23 7.58 19.42 4 15 4H13C8.58 4 5 7.58 5 12V20C5 23.31 7.69 26 11 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    </svg>
                  </div>
                  <span className="font-display font-bold text-xl text-primary">
                    Stetho<span className="text-accent">Notes</span>
                  </span>
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav Links */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
                {MOBILE_NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                  >
                    <NavLink
                      to={link.to}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `block px-4 py-3 rounded-xl font-display font-medium text-sm transition-all duration-150 ${
                          isActive
                            ? 'bg-accent/10 text-accent'
                            : 'text-primary hover:bg-gray-50 hover:text-accent'
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}

                {/* Divider */}
                <div className="my-3 border-t border-gray-100" />

                {/* Wishlist + Cart row */}
                <div className="flex gap-3 px-1">
                  <Link
                    to="/cart"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-display font-medium text-primary hover:border-accent hover:text-accent transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Cart {cartCount > 0 && <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cartCount}</span>}
                  </Link>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-display font-medium text-primary hover:border-rose-400 hover:text-rose-500 transition-all">
                    <Heart className="w-4 h-4" />
                    Wishlist
                  </button>
                </div>
              </div>

              {/* Auth Section */}
              <div className="px-4 py-5 border-t border-gray-100 bg-gray-50/50">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-sm">
                          {user.name?.[0]?.toUpperCase() ?? 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-display font-semibold text-sm text-primary">{user.name}</p>
                        <p className="text-xs text-gray-500 font-sans">{user.email}</p>
                      </div>
                    </div>

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-primary hover:bg-accent/5 hover:text-accent transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-primary hover:bg-accent/5 hover:text-accent transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      My Purchases
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center py-2.5 text-sm font-display font-semibold text-primary border-2 border-primary/20 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      Login
                    </Link>
                    <Link
                      to="/login?signup=true"
                      onClick={() => setIsOpen(false)}
                      className="btn-gradient py-2.5 text-sm rounded-xl flex items-center justify-center gap-1.5"
                    >
                      Sign Up
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

