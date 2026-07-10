import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToastContainer from './components/Toast';

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

// Layout Wrapper
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

// Student Protected Route Guard
function PrivateRoute() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent" />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

// Admin Protected Route Guard
function AdminRoute() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent" />
      </div>
    );
  }

  return user && user.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
}

function App() {
  const { checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route index element={<LandingPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="notes/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="order-success" element={<OrderConfirmationPage />} />
          <Route path="lookup" element={<OrderLookupPage />} />
          <Route path="login" element={<LoginPage />} />

          {/* Student Private Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>

          {/* Admin Private Routes */}
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>

          {/* Catch-all fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
