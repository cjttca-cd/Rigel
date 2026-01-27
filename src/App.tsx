import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { Loading } from './components/ui/Loading';
import { ToastContainer } from './components/ui/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider, isSupportedLang, useI18n } from './contexts/I18nContext';
import { ToastProvider } from './contexts/ToastContext';
import { DashboardPage } from './pages/DashboardPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ReportsPage } from './pages/ReportsPage';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { lang } = useParams();
  const { t } = useI18n();

  if (loading) {
    return <Loading fullScreen text={t('加载中...')} />;
  }

  if (!isAuthenticated) {
    return <Navigate to={`/${lang}/login`} replace />;
  }

  return <>{children}</>;
}

// Public Route wrapper (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { lang } = useParams();
  const { t } = useI18n();

  if (loading) {
    return <Loading fullScreen text={t('加载中...')} />;
  }

  if (isAuthenticated) {
    return <Navigate to={`/${lang}`} replace />;
  }

  return <>{children}</>;
}

function LangRoutes() {
  const { lang } = useParams();
  const location = useLocation();

  if (!isSupportedLang(lang)) {
    const restPath = location.pathname.replace(/^\/[^/]+/, '');
    const target = `/zh${restPath || ''}${location.search}`;
    return <Navigate to={target || '/zh'} replace />;
  }

  return (
    <I18nProvider lang={lang}>
      <Routes>
        {/* Public routes */}
        <Route
          path="login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          index
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="transactions"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to={`/${lang}`} replace />} />
      </Routes>
    </I18nProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/zh" replace />} />
      <Route path="/:lang/*" element={<LangRoutes />} />
      <Route path="*" element={<Navigate to="/zh" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
