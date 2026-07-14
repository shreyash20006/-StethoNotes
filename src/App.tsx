import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToastContainer from './components/Toast';
import { supabase } from './lib/supabase';

// Pages
import LandingPage from './pages/LandingPage';
import CoursesPage from './pages/CoursesPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/Cart';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import OrderLookupPage from './pages/OrderLookupPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import Contact from './pages/Contact';
import AuthCallbackPage from './pages/AuthCallbackPage';
import SellerLoginPage from './pages/SellerLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import SellerPendingPage from './pages/SellerPendingPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import DownloadPage from './pages/DownloadPage';
import CollectionsPage from './pages/CollectionsPage';

// ============================================================
// LAYOUT WRAPPERS
// ============================================================

/** Standard layout with Navbar + Footer (public pages) */
function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <Outlet />
      </div>
      <Footer />
      <ToastContainer />
    </div>
  );
}

/** Full-page layout without Navbar/Footer (auth pages, dashboards) */
function FullPageLayout() {
  return (
    <>
      <Outlet />
      <ToastContainer />
    </>
  );
}

// ============================================================
// ROUTE GUARDS
// ============================================================

/** Student only — redirects non-students away (super_admin has full access) */
function StudentRoute() {
  const { user, loading } = useAuthStore();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'super_admin') return <Outlet />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'seller') return <Navigate to="/seller/dashboard" replace />;
  if (user.role === 'seller_pending') return <Navigate to="/seller/application-pending" replace />;
  return <Outlet />;
}

/** Admin only — allows 'admin' and 'super_admin' */
function AdminRoute() {
  const { user, loading } = useAuthStore();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'admin' && user.role !== 'super_admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Approved seller only — also allows super_admin */
function SellerRoute() {
  const { user, loading } = useAuthStore();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/seller/login" replace />;
  if (user.role === 'super_admin') return <Outlet />;
  if (user.role === 'seller_pending') return <Navigate to="/seller/application-pending" replace />;
  if (user.role !== 'seller') return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Seller pending only */
function SellerPendingRoute() {
  const { user, loading } = useAuthStore();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/seller/login" replace />;
  if (user.role === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'seller') return <Navigate to="/seller/dashboard" replace />;
  if (user.role !== 'seller_pending') return <Navigate to="/" replace />;
  return <Outlet />;
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07091a]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent" />
    </div>
  );
}

// ============================================================
// APP
// ============================================================

function App() {
  const { checkSession } = useAuthStore();

  useEffect(() => {
    // Intercept Google OAuth redirects that land on '/' instead of '/auth/callback' due to Supabase redirect URI config mismatches
    const hasCode = window.location.search.includes('code=') || window.location.hash.includes('access_token=');
    const isCallback = window.location.pathname.startsWith('/auth/callback');

    if (hasCode && !isCallback) {
      console.log('[DEBUG] OAuth tokens detected on non-callback path. Forwarding to /auth/callback...');
      const search = window.location.search;
      const hash = window.location.hash;
      window.location.href = `/auth/callback${search}${hash}`;
      return;
    }

    checkSession();

    // Fetch direct download mode setting on startup
    supabase.from('settings')
      .select('*')
      .eq('key', 'direct_download_mode')
      .maybeSingle()
      .then(({ data }: { data: any }) => {
        if (data) {
          const isEnabled = data.value === true || data.value === 'true';
          localStorage.setItem('direct_download_mode', String(isEnabled));
        }
      })
      .catch((err: any) => console.error('Failed to fetch direct download setting:', err));

    // Fetch brand logo setting on startup
    supabase.from('settings')
      .select('*')
      .eq('key', 'brand_logo')
      .maybeSingle()
      .then(({ data }: { data: any }) => {
        if (data && data.value) {
          localStorage.setItem('brand_logo', String(data.value));
        }
      })
      .catch((err: any) => console.error('Failed to fetch brand logo setting:', err));
  }, [checkSession]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ─── AUTH CALLBACK (no layout) ─── */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* ─── FULL-PAGE AUTH PAGES (no navbar) ─── */}
        <Route element={<FullPageLayout />}>
          <Route path="/seller/login" element={<SellerLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Seller pending holding page */}
          <Route element={<SellerPendingRoute />}>
            <Route path="/seller/application-pending" element={<SellerPendingPage />} />
          </Route>

          {/* Seller dashboard */}
          <Route element={<SellerRoute />}>
            <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
          </Route>

          {/* Admin panel */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminPage />} />
          </Route>
        </Route>

        {/* ─── PUBLIC ROUTES (with Navbar + Footer) ─── */}
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="notes/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="order-success" element={<OrderConfirmationPage />} />
          <Route path="track-order" element={<OrderLookupPage />} />
          <Route path="download/:orderId/:noteId" element={<DownloadPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="privacy" element={<PrivacyPolicyPage />} />
          <Route path="terms" element={<TermsOfServicePage />} />
          <Route path="contact" element={<Contact />} />

          {/* Student protected dashboard */}
          <Route element={<StudentRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
