import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Moon, Sun, ShoppingCart, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth, useTheme } from '@/hooks';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Browse', href: '/courses' },
    { label: 'About', href: '/#why-us' },
    { label: 'Become a Seller', href: '/seller/login' },
    { label: 'Contact', href: '/contact' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-display font-bold text-primary">
              Stetho<span className="text-accent">Notes</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-accent transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-600" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Cart Icon */}
            <Link to="/cart" className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors relative">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <span className="absolute top-0 right-0 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center">0</span>
            </Link>

            {/* Auth / Profile */}
            {user ? (
              <div className="hidden sm:flex items-center gap-3">
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4" />
                    {user.name?.split(' ')[0]}
                  </Button>
                </Link>
                <button onClick={handleLogout} className="w-10 h-10 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors">
                  <LogOut className="w-5 h-5 text-red-500" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:block">
                <Button size="sm">Sign In</Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden pb-4 border-t border-gray-100"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block py-2 text-sm font-medium text-gray-600 hover:text-accent"
              >
                {link.label}
              </a>
            ))}
            {!user && (
              <Link to="/login">
                <Button className="w-full mt-4" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
