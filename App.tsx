import { useState, useEffect } from 'react';
import './utils/suppress-figma-errors'; // تفعيل قمع أخطاء Figma فوراً
import { AppProvider } from './contexts/AppContext';
import { MainApp } from './components/MainApp';
import { LandingPage } from './components/LandingPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import { ErrorNotifier } from './components/ErrorNotifier';
import { FigmaErrorSuppressor } from './components/FigmaErrorSuppressor';
import { useAuth } from './hooks/useAuth';

export type Task = {
  id: string;
  name: string;
  description: string;
  type: 'scraping' | 'login' | 'registration' | 'testing' | 'screenshot' | 'custom';
  status: 'idle' | 'running' | 'completed' | 'failed';
  script: string;
  targetUrl: string;
  schedule?: string;
  createdAt: Date;
  lastRun?: Date;
  metadata?: {
    source?: 'visual-builder' | 'advanced-builder' | 'smart-builder' | 'task-editor' | 'template';
    stepsData?: string; // JSON string of steps for visual builders
    [key: string]: any;
  };
};

export type ExecutionLog = {
  id: string;
  taskId: string;
  taskName: string;
  status: 'success' | 'failed' | 'running';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  logs: string[];
  screenshot?: string;
  data?: any;
};

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
    <AppProvider>
      <FigmaErrorSuppressor />
      <ProtectedRoute>
        <MainApp />
      </ProtectedRoute>
      <ErrorNotifier />
      <Toaster richColors position="top-center" />
    </AppProvider>
  );
}