import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
import { MotionConfig, AnimatePresence, motion } from 'motion/react';
import { CLERK_PUBLISHABLE_KEY, isClerkConfigured } from './lib/clerkConfig';
import { AppAuthProvider } from './context/AppAuthContext';
import { CartProvider } from './context/CartContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { MealDetailPage } from './pages/MealDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { CartPage } from './pages/CartPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { AccountPage } from './pages/AccountPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  const baseSegment = pathname.split('/')[1] || '';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [baseSegment]);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  // Key by top-level route segment so Clerk multi-step sub-routes (/sign-up/verify-email-address, etc.)
  // stay mounted smoothly without AnimatePresence remounting the Clerk widget mid-flow.
  const routeGroup = '/' + (location.pathname.split('/')[1] || '');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeGroup}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/menu/:id" element={<MealDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/*"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function ClerkRouterBridge({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  if (!isClerkConfigured) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ClerkRouterBridge>
          <AppAuthProvider>
            <CartProvider>
              <ScrollToTop />
              <Layout>
                <AnimatedRoutes />
              </Layout>
            </CartProvider>
          </AppAuthProvider>
        </ClerkRouterBridge>
      </BrowserRouter>
    </MotionConfig>
  );
}
