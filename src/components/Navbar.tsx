import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { ShoppingCart, User, LogOut, Menu, X, ShieldAlert, BookOpen } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { items } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const cartCount = items.length;

  const handleLogout = async () => {
    await signOut();
    setIsDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              {/* White background block wrapper for logo contrast */}
              <div className="bg-primary/5 p-2 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-primary/10">
                <svg className="w-8 h-8 text-primary group-hover:text-accent transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {/* Stethoscope + Note motif */}
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
          <div className="hidden md:flex items-center gap-8">
            <NavLink
              to="/courses"
              className={({ isActive }) =>
                `font-display font-medium text-sm transition-colors ${
                  isActive ? 'text-accent' : 'text-primary hover:text-accent'
                }`
              }
            >
              Courses
            </NavLink>
            <NavLink
              to="/track-order"
              className={({ isActive }) =>
                `font-display font-medium text-sm transition-colors ${
                  isActive ? 'text-accent' : 'text-primary hover:text-accent'
                }`
              }
            >
              Track Order
            </NavLink>
            <Link
              to="/#about"
              className="font-display font-medium text-sm text-primary hover:text-accent transition-colors"
            >
              About Us
            </Link>
            <Link
              to="/#contact"
              className="font-display font-medium text-sm text-primary hover:text-accent transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Actions: Cart & Auth */}
          <div className="hidden md:flex items-center gap-5">
            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2 text-primary hover:text-accent transition-colors rounded-full hover:bg-gray-50"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white font-sans text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth Button or User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 transition-all text-primary font-display text-sm font-medium"
                >
                  <User className="w-4 h-4 text-accent" />
                  <span>{user.name}</span>
                </button>

                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 overflow-hidden">
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
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-secondary py-2 px-4 text-sm">
                  Login
                </Link>
                <Link to="/login?signup=true" className="btn-primary py-2 px-4 text-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex items-center md:hidden gap-4">
            <Link
              to="/cart"
              className="relative p-2 text-primary hover:text-accent transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-accent text-white font-sans text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-primary hover:text-accent transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-6 flex flex-col gap-3 shadow-lg">
          <NavLink
            to="/courses"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `font-display font-medium text-base p-2 rounded-xl ${
                isActive ? 'bg-accent/10 text-accent' : 'text-primary hover:bg-gray-50'
              }`
            }
          >
            Courses
          </NavLink>
          <NavLink
            to="/track-order"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `font-display font-medium text-base p-2 rounded-xl ${
                isActive ? 'bg-accent/10 text-accent' : 'text-primary hover:bg-gray-50'
              }`
            }
          >
            Track Order
          </NavLink>
          <a
            href="/#about"
            onClick={() => setIsOpen(false)}
            className="font-display font-medium text-base p-2 rounded-xl text-primary hover:bg-gray-50"
          >
            About Us
          </a>
          <a
            href="/#contact"
            onClick={() => setIsOpen(false)}
            className="font-display font-medium text-base p-2 rounded-xl text-primary hover:bg-gray-50"
          >
            Contact
          </a>

          <div className="border-t border-gray-50 pt-3 flex flex-col gap-2">
            {user ? (
              <>
                <div className="px-2 py-1">
                  <p className="font-display font-semibold text-primary">{user.name}</p>
                  <p className="text-xs text-gray-500 font-sans">{user.email}</p>
                </div>

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-xl text-sm text-primary hover:bg-accent/5 hover:text-accent"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-xl text-sm text-primary hover:bg-accent/5 hover:text-accent"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>My Purchases</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-sm text-red-600 hover:bg-red-50 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary py-2 text-center text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/login?signup=true"
                  onClick={() => setIsOpen(false)}
                  className="btn-primary py-2 text-center text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
