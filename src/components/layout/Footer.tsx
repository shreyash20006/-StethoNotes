import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { label: 'Browse Notes', href: '/courses' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Features', href: '#features' },
    ],
    Company: [
      { label: 'About Us', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
    ],
    Support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Status', href: '/status' },
    ],
    Legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/refund' },
    ],
  };

  const socials = [
    { icon: '𝕏', label: 'Twitter', href: 'https://twitter.com/stethonotes' },
    { icon: 'f', label: 'Facebook', href: 'https://facebook.com/stethonotes' },
    { icon: 'in', label: 'LinkedIn', href: 'https://linkedin.com/company/stethonotes' },
    { icon: 'ig', label: 'Instagram', href: 'https://instagram.com/stethonotes' },
  ];

  return (
    <footer className="bg-primary text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12"
        >
          {/* Logo & Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <h3 className="text-2xl font-display font-bold">
                Stetho<span className="text-accent">Notes</span>
              </h3>
              <p className="text-white/60 text-sm mt-2">
                India's premier medical study marketplace.
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              {socials.map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-accent hover:text-primary flex items-center justify-center transition-all duration-300"
                  title={social.label}
                >
                  <span className="text-xs font-bold">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link, idx) => (
                  <li key={idx}>
                    <Link
                      to={link.href}
                      className="text-white/70 hover:text-accent text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Divider */}
        <div className="border-t border-white/10 my-8" />

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col md:flex-row justify-between items-center gap-4"
        >
          {/* Copyright */}
          <p className="text-white/60 text-sm text-center md:text-left">
            &copy; {currentYear} StethoNotes. All rights reserved. | Built with ❤️ for medical students.
          </p>

          {/* Contact Info */}
          <div className="flex flex-col sm:flex-row gap-6 text-white/60 text-xs">
            <a href="mailto:support@stethonotes.store" className="hover:text-accent transition-colors flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              support@stethonotes.store
            </a>
            <a href="tel:+91-1234567890" className="hover:text-accent transition-colors flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              +91-1234567890
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
