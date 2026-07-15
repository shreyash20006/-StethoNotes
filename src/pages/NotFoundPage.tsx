import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { pageMeta } from '../lib/seo';
import { FileQuestion, Home, BookOpen, Search } from 'lucide-react';

export default function NotFoundPage() {
  const meta = pageMeta.notFound();

  return (
    <>
      <SEOHead {...meta} />
      <div className="min-h-screen bg-[#07091a] flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          {/* 404 Visual */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center">
              <FileQuestion className="w-12 h-12 text-purple-400" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-7xl font-black text-white mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            404
          </h1>
          <h2 className="text-2xl font-bold text-purple-300 mb-4">Page Not Found</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
            Try browsing our medical study notes instead.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors border border-white/20"
            >
              <BookOpen className="w-4 h-4" />
              Browse Notes
            </Link>
            <Link
              to="/track-order"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors border border-white/20"
            >
              <Search className="w-4 h-4" />
              Track Order
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
