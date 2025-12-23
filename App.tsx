import { useState, useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import { MainApp } from './components/MainApp';
import { LandingPage } from './components/LandingPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import { ErrorNotifier } from './components/ErrorNotifier';
import { FigmaErrorSuppressor } from './components/FigmaErrorSuppressor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';

// Only enable error suppression in production
if (import.meta.env.PROD) {
  import('./utils/suppress-figma-errors');
}

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const { user, loading } = useAuth();

  // إذا كان المستخدم مسجل دخول، انتقل مباشرة للـ Dashboard
  useEffect(() => {
    if (!loading && user) {
      setShowLanding(false);
    }
  }, [user, loading]);

  if (loading) {
    return null; // سيعرض ProtectedRoute شاشة التحميل
  }

  if (showLanding && !user) {
    return (
      <>
        <FigmaErrorSuppressor />
        <LandingPage onGetStarted={() => setShowLanding(false)} />
        <Toaster richColors position="top-center" />
      </>
    );
  }

  return (
    <ErrorBoundary>
      <AppProvider>
        <FigmaErrorSuppressor />
        <ProtectedRoute>
          <MainApp />
        </ProtectedRoute>
        <ErrorNotifier />
        <Toaster richColors position="top-center" />
      </AppProvider>
    </ErrorBoundary>
  );
}
