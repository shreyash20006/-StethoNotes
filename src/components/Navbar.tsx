import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import {
  ShoppingCart, User, LogOut, Menu, X, ShieldAlert,
  BookOpen, Store, Clock, Package, Users, BarChart3, DollarSign
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { items } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
    ? { label: roleLabel, className: 'bg-blue-100 text-blue-700' }
    : isSeller
    ? { label: roleLabel, className: 'bg-emerald-100 text-emerald-700' }
    : isSellerPending
    ? { label: roleLabel, className: 'bg-amber-100 text-amber-700' }
    : { label: roleLabel, className: 'bg-accent/10 text-accent' };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-primary/5 p-2 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-primary/10">
                <svg className="w-8 h-8 text-primary group-hover:text-accent transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.26-2.5 3.19-2.5 5.5" />
                  <path d="M12 2v10a4 4 0 0 0 8 0V2" />
                  <path d="M12 12a4 4 0 0 1-8 0V2" />
                  <path d="M22 2h-4" />
                  <path d="M6 2H2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" fill="#1FB6D4" stroke="none" />
                </svg>
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-primary">
                Stetho<span className="text-accent">Notes</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          {!isAdmin && (
            <div className="hidden md:flex items-center gap-8">
              <NavLink
                to="/courses"
                className={({ isActive }) =>
                  `font-display font-medium text-sm transition-colors ${isActive ? 'text-accent' : 'text-primary hover:text-accent'}`
                }
              >
                Courses
              </NavLink>
              <NavLink
                to="/track-order"
                className={({ isActive }) =>
                  `font-display font-medium text-sm transition-colors ${isActive ? 'text-accent' : 'text-primary hover:text-accent'}`
                }
              >
                Track Order
              </NavLink>
              <Link to="/#about" className="font-display font-medium text-sm text-primary hover:text-accent transition-colors">
                About Us
              </Link>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `font-display font-medium text-sm transition-colors ${isActive ? 'text-accent' : 'text-primary hover:text-accent'}`
                }
              >
                Contact
              </NavLink>
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-5">
            {/* Cart (only for students/public) */}
            {!isAdmin && !isSeller && !isSellerPending && (
              <Link to="/cart" className="relative p-2 text-primary hover:text-accent transition-colors rounded-full hover:bg-gray-50">
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-white font-sans text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
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
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 transition-all text-primary font-display text-sm font-medium"
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
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 overflow-hidden font-display">
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-xs text-gray-400 font-sans">Logged in as</p>
                        <p className="font-display font-semibold text-sm text-primary truncate">{user.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                        <span className={`inline-block mt-1 font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadge.className}`}>
                          {roleBadge.label}
                        </span>
                      </div>

                      {/* Admin links */}
                      {isAdmin && (
                        <>
                          <Link to="/admin/dashboard" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-accent/5 hover:text-accent transition-colors">
                            <ShieldAlert className="w-4 h-4 text-blue-500" />
                            <span>Admin Dashboard</span>
                          </Link>
                          <Link to="/admin/dashboard?tab=notes" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-accent/5 hover:text-accent transition-colors">
                            <Package className="w-4 h-4 text-slate-500" />
                            <span>Products</span>
                          </Link>
                          <Link to="/admin/dashboard?tab=orders" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-accent/5 hover:text-accent transition-colors">
                            <ShoppingCart className="w-4 h-4 text-slate-500" />
                            <span>Orders</span>
                          </Link>
                          <Link to="/admin/dashboard?tab=sellers" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-accent/5 hover:text-accent transition-colors">
                            <Users className="w-4 h-4 text-slate-500" />
                            <span>Sellers</span>
                          </Link>
                          <Link to="/admin/dashboard?tab=analytics" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-accent/5 hover:text-accent transition-colors">
                            <BarChart3 className="w-4 h-4 text-slate-500" />
                            <span>Analytics</span>
                          </Link>
                        </>
                      )}

                      {/* Seller approved links */}
                      {isSeller && (
                        <>
                          <Link to="/seller/dashboard" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                            <Store className="w-4 h-4 text-emerald-500" />
                            <span>Seller Dashboard</span>
                          </Link>
                          <Link to="/seller/dashboard?tab=products" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                            <Package className="w-4 h-4 text-slate-500" />
                            <span>Products</span>
                          </Link>
                          <Link to="/seller/dashboard?tab=orders" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                            <ShoppingCart className="w-4 h-4 text-slate-500" />
                            <span>Orders</span>
                          </Link>
                          <Link to="/seller/dashboard?tab=overview" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                            <DollarSign className="w-4 h-4 text-slate-500" />
                            <span>Earnings</span>
                          </Link>
                          <Link to="/seller/dashboard?tab=profile" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                            <User className="w-4 h-4 text-slate-500" />
                            <span>Profile</span>
                          </Link>
                        </>
                      )}

                      {/* Seller pending links */}
                      {isSellerPending && (
                        <>
                          <Link to="/seller/application-pending" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors">
                            <Clock className="w-4 h-4" />
                            <span>Application Status</span>
                          </Link>
                          <Link to="/seller/application-pending" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-650 hover:bg-amber-50 transition-colors">
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                          </Link>
                        </>
                      )}

                      {/* Student links */}
                      {isStudent && (
                        <>
                          <Link to="/dashboard" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-accent/5 hover:text-accent transition-colors">
                            <BookOpen className="w-4 h-4 text-accent" />
                            <span>Dashboard</span>
                          </Link>
                          <Link to="/dashboard?tab=purchases" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-accent/5 hover:text-accent transition-colors">
                            <BookOpen className="w-4 h-4 text-slate-500" />
                            <span>My Purchases</span>
                          </Link>
                          <Link to="/dashboard?tab=profile" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-accent/5 hover:text-accent transition-colors">
                            <User className="w-4 h-4 text-slate-500" />
                            <span>Profile</span>
                          </Link>
                          <Link to="/seller/login" onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                            <Store className="w-4 h-4 text-emerald-500" />
                            <span>Become a Seller</span>
                          </Link>
                        </>
                      )}

                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left border-t border-gray-50 mt-1">
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-secondary py-2 px-4 text-sm">Login</Link>
                <Link to="/login?signup=true" className="btn-primary py-2 px-4 text-sm">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center md:hidden gap-4">
            {!isAdmin && !isSeller && !isSellerPending && (
              <Link to="/cart" className="relative p-2 text-primary hover:text-accent transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-accent text-white font-sans text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-primary hover:text-accent transition-colors">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-6 flex flex-col gap-3 shadow-lg font-display">
          {!isAdmin && (
            <>
              <NavLink to="/courses" onClick={() => setIsOpen(false)}
                className={({ isActive }) => `font-display font-medium text-base p-2 rounded-xl ${isActive ? 'bg-accent/10 text-accent' : 'text-primary hover:bg-gray-50'}`}>
                Courses
              </NavLink>
              <NavLink to="/track-order" onClick={() => setIsOpen(false)}
                className={({ isActive }) => `font-display font-medium text-base p-2 rounded-xl ${isActive ? 'bg-accent/10 text-accent' : 'text-primary hover:bg-gray-50'}`}>
                Track Order
              </NavLink>
              <a href="/#about" onClick={() => setIsOpen(false)} className="font-display font-medium text-base p-2 rounded-xl text-primary hover:bg-gray-50">
                About Us
              </a>
              <NavLink to="/contact" onClick={() => setIsOpen(false)}
                className={({ isActive }) => `font-display font-medium text-base p-2 rounded-xl ${isActive ? 'bg-accent/10 text-accent' : 'text-primary hover:bg-gray-50'}`}>
                Contact
              </NavLink>
            </>
          )}

          <div className="border-t border-gray-50 pt-3 flex flex-col gap-2">
            {user ? (
              <>
                <div className="px-2 py-1">
                  <p className="font-display font-semibold text-primary">{user.name}</p>
                  <p className="text-xs text-gray-500 font-sans">{user.email}</p>
                  <span className={`inline-block mt-1 font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadge.className}`}>
                    {roleBadge.label}
                  </span>
                </div>

                {/* Mobile Admin links */}
                {isAdmin && (
                  <>
                    <Link to="/admin/dashboard" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-primary hover:bg-accent/5 hover:text-accent">
                      <ShieldAlert className="w-4 h-4 text-blue-500" />
                      <span>Admin Dashboard</span>
                    </Link>
                    <Link to="/admin/dashboard?tab=notes" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-primary hover:bg-accent/5 hover:text-accent">
                      <Package className="w-4 h-4 text-slate-500" />
                      <span>Products</span>
                    </Link>
                    <Link to="/admin/dashboard?tab=orders" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-primary hover:bg-accent/5 hover:text-accent">
                      <ShoppingCart className="w-4 h-4 text-slate-500" />
                      <span>Orders</span>
                    </Link>
                    <Link to="/admin/dashboard?tab=sellers" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-primary hover:bg-accent/5 hover:text-accent">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>Sellers</span>
                    </Link>
                    <Link to="/admin/dashboard?tab=analytics" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-primary hover:bg-accent/5 hover:text-accent">
                      <BarChart3 className="w-4 h-4 text-slate-500" />
                      <span>Analytics</span>
                    </Link>
                  </>
                )}

                {/* Mobile Seller links */}
                {isSeller && (
                  <>
                    <Link to="/seller/dashboard" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-emerald-600 hover:bg-emerald-50">
                      <Store className="w-4 h-4 text-emerald-500" />
                      <span>Seller Dashboard</span>
                    </Link>
                    <Link to="/seller/dashboard?tab=products" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-emerald-650 hover:bg-emerald-50">
                      <Package className="w-4 h-4 text-slate-500" />
                      <span>Products</span>
                    </Link>
                    <Link to="/seller/dashboard?tab=orders" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-emerald-650 hover:bg-emerald-50">
                      <ShoppingCart className="w-4 h-4 text-slate-500" />
                      <span>Orders</span>
                    </Link>
                    <Link to="/seller/dashboard?tab=overview" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-emerald-650 hover:bg-emerald-50">
                      <DollarSign className="w-4 h-4 text-slate-500" />
                      <span>Earnings</span>
                    </Link>
                    <Link to="/seller/dashboard?tab=profile" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-emerald-650 hover:bg-emerald-50">
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Profile</span>
                    </Link>
                  </>
                )}

                {/* Mobile Seller Pending links */}
                {isSellerPending && (
                  <>
                    <Link to="/seller/application-pending" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-amber-600 hover:bg-amber-50">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Application Status</span>
                    </Link>
                    <Link to="/seller/application-pending" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-amber-650 hover:bg-amber-50">
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                  </>
                )}

                {/* Mobile Student links */}
                {isStudent && (
                  <>
                    <Link to="/dashboard" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-primary hover:bg-accent/5 hover:text-accent">
                      <BookOpen className="w-4 h-4 text-accent" />
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/dashboard?tab=purchases" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-primary hover:bg-accent/5 hover:text-accent">
                      <BookOpen className="w-4 h-4 text-slate-500" />
                      <span>My Purchases</span>
                    </Link>
                    <Link to="/dashboard?tab=profile" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-primary hover:bg-accent/5 hover:text-accent">
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Profile</span>
                    </Link>
                    <Link to="/seller/login" onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-sm text-primary hover:bg-emerald-50 hover:text-emerald-600">
                      <Store className="w-4 h-4 text-emerald-500" />
                      <span>Become a Seller</span>
                    </Link>
                  </>
                )}

                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-sm text-red-600 hover:bg-red-50 text-left border-t border-gray-50 mt-1">
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
