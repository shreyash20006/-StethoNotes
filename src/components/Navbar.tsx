import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useThemeStore } from '../store/useThemeStore';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingCart, User, LogOut, Menu, X, ShieldAlert,
  BookOpen, Store, Clock, Package, Users, BarChart3, DollarSign,
  Sun, Moon
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { items } = useCartStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const storedLogo = localStorage.getItem('brand_logo') || 'https://res.cloudinary.com/dsqxboxoc/image/upload/v1783892715/file_00000000663871fa96d4e5a32de37be1_adwo6u.png';

  const cartCount = items.length;

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSeller = user?.role === 'seller';
  const isSellerPending = user?.role === 'seller_pending';
  const isStudent = user?.role === 'student';

  const handleLogout = async () => {
    await signOut();
    setIsDropdownOpen(false);
    setIsOpen(false);
    if (isAdmin) navigate('/admin/login');
    else if (isSeller || isSellerPending) navigate('/seller/login');
    else navigate('/');
  };

  // Role labels mapped dynamically
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'seller': return 'Seller';
      case 'seller_pending': return 'Seller Pending';
      default: return 'Student';
    }
  };

  const roleLabel = getRoleLabel(user?.role || 'student');

  const roleBadge = isAdmin
    ? { label: roleLabel, className: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' }
    : isSeller
    ? { label: roleLabel, className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' }
    : isSellerPending
    ? { label: roleLabel, className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' }
    : { label: roleLabel, className: 'bg-primary/10 text-primary border border-primary/20' };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-5'}`}
      style={{ background: isScrolled ? 'color-mix(in srgb, var(--bg-base) 70%, transparent)' : 'transparent' }}
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
        isScrolled 
          ? 'glass-panel-dark shadow-xl mx-4 lg:mx-auto py-1 rounded-2xl border'
          : 'bg-transparent border border-transparent mx-6 lg:mx-auto py-0'
      }`}
        style={{ borderColor: isScrolled ? 'var(--glass-border)' : 'transparent' }}
      >
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-primary/5 p-1 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-primary/10 w-9 h-9 shrink-0 overflow-hidden border border-white/5 group-hover:border-primary/20">
                <img src={storedLogo} alt="StethoNotes Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-primary transition-colors">
                Stetho<span className="text-primary">Notes</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          {!isAdmin && (
            <div className="hidden md:flex items-center gap-8">
              <NavLink
                to="/courses"
                className={({ isActive }) =>
                  `font-display font-medium text-xs tracking-wider uppercase transition-colors relative py-1 ${isActive ? 'text-primary' : 'text-muted hover:text-white'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>Courses</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
              <NavLink
                to="/track-order"
                className={({ isActive }) =>
                  `font-display font-medium text-xs tracking-wider uppercase transition-colors relative py-1 ${isActive ? 'text-primary' : 'text-muted hover:text-white'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>Track Order</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
              <Link to="/#about" className="font-display font-medium text-xs tracking-wider uppercase text-muted hover:text-white transition-colors py-1">
                About Us
              </Link>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `font-display font-medium text-xs tracking-wider uppercase transition-colors relative py-1 ${isActive ? 'text-primary' : 'text-muted hover:text-white'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>Contact</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="theme-toggle w-9 h-9 flex items-center justify-center"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              role="switch"
              aria-checked={theme === 'light'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                  <motion.div
                    key="moon"
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <Moon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun"
                    initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <Sun className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Cart (only for students/public) */}
            {!isAdmin && !isSeller && !isSellerPending && (
              <Link to="/cart" className="relative p-2 text-muted hover:text-white transition-colors rounded-full hover:bg-white/5">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-void font-sans text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full border border-void animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Auth state */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/5 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all text-white font-display text-xs font-semibold"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-accent" />
                  )}
                  <span>{user.name}</span>
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-60 bg-card rounded-2xl shadow-2xl border border-white/10 py-2 z-20 overflow-hidden font-display text-white">
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-xs text-muted font-sans">Logged in as</p>
                        <p className="font-display font-semibold text-sm text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-muted truncate">{user.email}</p>
                        <span className={`inline-block mt-1 font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadge.className}`}>
                          {roleBadge.label}
                        </span>
                      </div>

                      {/* Admin links */}
                      {isAdmin && (
                        <>
                          <Link to="/admin/dashboard" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-primary/5 hover:text-primary transition-colors">
                            <ShieldAlert className="w-4 h-4 text-primary" />
                            <span>Admin Dashboard</span>
                          </Link>
                          <Link to="/admin/dashboard?tab=notes" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-primary/5 hover:text-primary transition-colors">
                            <Package className="w-4 h-4 text-muted" />
                            <span>Products</span>
                          </Link>
                          <Link to="/admin/dashboard?tab=orders" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-primary/5 hover:text-primary transition-colors">
                            <ShoppingCart className="w-4 h-4 text-muted" />
                            <span>Orders</span>
                          </Link>
                          <Link to="/admin/dashboard?tab=sellers" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-primary/5 hover:text-primary transition-colors">
                            <Users className="w-4 h-4 text-muted" />
                            <span>Sellers</span>
                          </Link>
                          <Link to="/admin/dashboard?tab=analytics" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-primary/5 hover:text-primary transition-colors">
                            <BarChart3 className="w-4 h-4 text-muted" />
                            <span>Analytics</span>
                          </Link>
                        </>
                      )}

                      {/* Seller approved links */}
                      {isSeller && (
                        <>
                          <Link to="/seller/dashboard" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-emerald-500/5 hover:text-emerald-400 transition-colors">
                            <Store className="w-4 h-4 text-emerald-400" />
                            <span>Seller Dashboard</span>
                          </Link>
                          <Link to="/seller/dashboard?tab=products" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-emerald-500/5 hover:text-emerald-400 transition-colors">
                            <Package className="w-4 h-4 text-muted" />
                            <span>Products</span>
                          </Link>
                          <Link to="/seller/dashboard?tab=orders" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-emerald-500/5 hover:text-emerald-400 transition-colors">
                            <ShoppingCart className="w-4 h-4 text-muted" />
                            <span>Orders</span>
                          </Link>
                          <Link to="/seller/dashboard?tab=overview" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-emerald-500/5 hover:text-emerald-400 transition-colors">
                            <DollarSign className="w-4 h-4 text-muted" />
                            <span>Earnings</span>
                          </Link>
                          <Link to="/seller/dashboard?tab=profile" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-emerald-500/5 hover:text-emerald-400 transition-colors">
                            <User className="w-4 h-4 text-muted" />
                            <span>Profile</span>
                          </Link>
                        </>
                      )}

                      {/* Seller pending links */}
                      {isSellerPending && (
                        <>
                          <Link to="/seller/application-pending" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-450 hover:bg-amber-500/5 transition-colors">
                            <Clock className="w-4 h-4" />
                            <span>Application Status</span>
                          </Link>
                          <Link to="/seller/application-pending" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-450 hover:bg-amber-500/5 transition-colors">
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                          </Link>
                        </>
                      )}

                      {/* Student links */}
                      {isStudent && (
                        <>
                          <Link to="/dashboard" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-primary/5 hover:text-primary transition-colors">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <span>Dashboard</span>
                          </Link>
                          <Link to="/dashboard?tab=purchases" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-primary/5 hover:text-primary transition-colors">
                            <BookOpen className="w-4 h-4 text-muted" />
                            <span>My Purchases</span>
                          </Link>
                          <Link to="/dashboard?tab=profile" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-primary/5 hover:text-primary transition-colors">
                            <User className="w-4 h-4 text-muted" />
                            <span>Profile</span>
                          </Link>
                          <Link to="/seller/login" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-emerald-500/5 hover:text-emerald-400 transition-colors">
                            <Store className="w-4 h-4 text-emerald-400" />
                            <span>Become a Seller</span>
                          </Link>
                        </>
                      )}

                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors text-left border-t border-white/5 mt-1 font-semibold">
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-secondary py-1.5 px-4 text-xs">Login</Link>
                <Link to="/login?signup=true" className="btn-primary py-1.5 px-4 text-xs">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center md:hidden gap-2">
            {/* Mobile theme toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle w-9 h-9 flex items-center justify-center"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                  <motion.div
                    key="moon-mobile"
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Moon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun-mobile"
                    initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Sun className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {!isAdmin && !isSeller && !isSellerPending && (
              <Link to="/cart" className="relative p-2 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-primary text-void font-sans text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-void">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 transition-colors" style={{ color: 'var(--text-muted)' }}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="md:hidden border-t px-4 pt-2 pb-6 flex flex-col gap-3 shadow-2xl font-display backdrop-blur-xl"
          style={{ borderColor: 'var(--glass-border)', background: 'color-mix(in srgb, var(--bg-layer) 95%, transparent)' }}
        >
          {!isAdmin && (
            <>
              <NavLink to="/courses" onClick={() => setIsOpen(false)}
                className={({ isActive }) => `font-display font-medium text-sm p-2.5 rounded-xl ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-white/5'}`}>
                Courses
              </NavLink>
              <NavLink to="/track-order" onClick={() => setIsOpen(false)}
                className={({ isActive }) => `font-display font-medium text-sm p-2.5 rounded-xl ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-white/5'}`}>
                Track Order
              </NavLink>
              <a href="/#about" onClick={() => setIsOpen(false)} className="font-display font-medium text-sm p-2.5 rounded-xl text-muted hover:bg-white/5">
                About Us
              </a>
              <NavLink to="/contact" onClick={() => setIsOpen(false)}
                className={({ isActive }) => `font-display font-medium text-sm p-2.5 rounded-xl ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-white/5'}`}>
                Contact
              </NavLink>
            </>
          )}

          <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
            {user ? (
              <>
                <div className="px-2 py-1">
                  <p className="font-display font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-muted font-sans">{user.email}</p>
                  <span className={`inline-block mt-1 font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadge.className}`}>
                    {roleBadge.label}
                  </span>
                </div>

                {/* Mobile Admin links */}
                {isAdmin && (
                  <>
                    <Link to="/admin/dashboard" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-primary/5 hover:text-primary">
                      <ShieldAlert className="w-4 h-4 text-primary" />
                      <span>Admin Dashboard</span>
                    </Link>
                    <Link to="/admin/dashboard?tab=notes" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-primary/5 hover:text-primary">
                      <Package className="w-4 h-4 text-muted" />
                      <span>Products</span>
                    </Link>
                    <Link to="/admin/dashboard?tab=orders" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-primary/5 hover:text-primary">
                      <ShoppingCart className="w-4 h-4 text-muted" />
                      <span>Orders</span>
                    </Link>
                    <Link to="/admin/dashboard?tab=sellers" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-primary/5 hover:text-primary">
                      <Users className="w-4 h-4 text-muted" />
                      <span>Sellers</span>
                    </Link>
                    <Link to="/admin/dashboard?tab=analytics" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-primary/5 hover:text-primary">
                      <BarChart3 className="w-4 h-4 text-muted" />
                      <span>Analytics</span>
                    </Link>
                  </>
                )}

                {/* Mobile Seller links */}
                {isSeller && (
                  <>
                    <Link to="/seller/dashboard" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-emerald-500/5 hover:text-emerald-400">
                      <Store className="w-4 h-4 text-emerald-400" />
                      <span>Seller Dashboard</span>
                    </Link>
                    <Link to="/seller/dashboard?tab=products" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-emerald-500/5 hover:text-emerald-400">
                      <Package className="w-4 h-4 text-muted" />
                      <span>Products</span>
                    </Link>
                    <Link to="/seller/dashboard?tab=orders" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-emerald-500/5 hover:text-emerald-400">
                      <ShoppingCart className="w-4 h-4 text-muted" />
                      <span>Orders</span>
                    </Link>
                    <Link to="/seller/dashboard?tab=overview" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-emerald-500/5 hover:text-emerald-400">
                      <DollarSign className="w-4 h-4 text-muted" />
                      <span>Earnings</span>
                    </Link>
                    <Link to="/seller/dashboard?tab=profile" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-emerald-500/5 hover:text-emerald-400">
                      <User className="w-4 h-4 text-muted" />
                      <span>Profile</span>
                    </Link>
                  </>
                )}

                {/* Mobile Seller Pending links */}
                {isSellerPending && (
                  <>
                    <Link to="/seller/application-pending" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-amber-500/5 hover:text-amber-400">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Application Status</span>
                    </Link>
                    <Link to="/seller/application-pending" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-amber-500/5 hover:text-amber-400">
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                  </>
                )}

                {/* Mobile Student links */}
                {isStudent && (
                  <>
                    <Link to="/dashboard" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-primary/5 hover:text-primary">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/dashboard?tab=purchases" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-primary/5 hover:text-primary">
                      <BookOpen className="w-4 h-4 text-muted" />
                      <span>My Purchases</span>
                    </Link>
                    <Link to="/dashboard?tab=profile" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-primary/5 hover:text-primary">
                      <User className="w-4 h-4 text-muted" />
                      <span>Profile</span>
                    </Link>
                    <Link to="/seller/login" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-muted hover:bg-emerald-500/5 hover:text-emerald-400">
                      <Store className="w-4 h-4 text-emerald-400" />
                      <span>Become a Seller</span>
                    </Link>
                  </>
                )}

                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-sm text-red-400 hover:bg-red-500/5 text-left border-t border-white/5 mt-1 font-semibold">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Link to="/login" onClick={() => setIsOpen(false)} className="btn-secondary py-2 text-center text-sm">Login</Link>
                <Link to="/login?signup=true" onClick={() => setIsOpen(false)} className="btn-primary py-2 text-center text-sm">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
