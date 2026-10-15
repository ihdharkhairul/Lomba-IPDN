import { useCallback, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { FlowLayout } from '@/components/layout/FlowLayout';
import { MainLayout } from '@/components/layout/MainLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { SplashScreen } from '@/components/SplashScreen';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { RequireAuth } from '@/features/auth/RouteGuards';
import { FlowGuard, ReportFlowProvider } from '@/features/reports/ReportFlowContext';
import { ReportDataProvider } from '@/features/reports/ReportDataContext';
import { SyncProvider } from '@/features/reports/SyncContext';
import { AiProcessingStep } from '@/features/reports/steps/AiProcessingStep';
import { AiResultStep } from '@/features/reports/steps/AiResultStep';
import { DetailStep } from '@/features/reports/steps/DetailStep';
import { IntroStep } from '@/features/reports/steps/IntroStep';
import { LocationStep } from '@/features/reports/steps/LocationStep';
import { PhotoStep } from '@/features/reports/steps/PhotoStep';
import { ReviewStep } from '@/features/reports/steps/ReviewStep';
import { SuccessStep } from '@/features/reports/steps/SuccessStep';
import { ConnectivityProvider } from '@/hooks/useConnectivity';
import { Spinner } from '@/components/ui/Spinner';
import { DraftsPage } from '@/pages/DraftsPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { HomePage } from '@/pages/HomePage';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TrackingPage } from '@/pages/TrackingPage';

/** Halaman publik (landing/masuk/daftar). Bila sudah login -> ke tujuan semula atau Beranda. */
function PublicOnly() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Spinner label="Memeriksa sesi…" />;
  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? '/beranda'} replace />;
  }
  return <Outlet />;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIK */}
      <Route element={<PublicOnly />}>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
        <Route path="/masuk" element={<LoginPage />} />
        <Route path="/daftar" element={<RegisterPage />} />
        <Route path="/lupa-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* PRIVAT: wajib login */}
      <Route element={<RequireAuth />}>
        <Route element={<MainLayout />}>
          <Route path="/beranda" element={<HomePage />} />
          <Route path="/riwayat" element={<HistoryPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/draft" element={<DraftsPage />} />
          <Route path="/pengaturan" element={<SettingsPage />} />
          <Route path="/laporan/:id" element={<TrackingPage />} />

          {/* Alur pelaporan (bingkai kartu) */}
          <Route element={<FlowLayout />}>
            <Route path="/lapor" element={<IntroStep />} />
            <Route path="/lapor/foto" element={<PhotoStep />} />
            <Route element={<FlowGuard require="photo" />}>
              <Route path="/lapor/lokasi" element={<LocationStep />} />
            </Route>
            <Route element={<FlowGuard require="location" />}>
              <Route path="/lapor/detail" element={<DetailStep />} />
            </Route>
            <Route element={<FlowGuard require="details" />}>
              <Route path="/lapor/review" element={<ReviewStep />} />
              <Route path="/lapor/validasi" element={<AiProcessingStep />} />
            </Route>
            <Route element={<FlowGuard require="ai" />}>
              <Route path="/lapor/hasil" element={<AiResultStep />} />
            </Route>
            <Route path="/lapor/sukses/:id" element={<SuccessStep />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

const SPLASH_KEY = 'laporin.splashSeen';

/** Splash hanya tampil di layar HP, di halaman awal, sekali per sesi. */
function readSplashSeen(): boolean {
  try {
    const isPhone = window.matchMedia?.('(max-width: 767px)').matches ?? false;
    if (!isPhone || window.location.pathname !== '/') return true;
    return sessionStorage.getItem(SPLASH_KEY) === '1';
  } catch {
    return true;
  }
}

/** Router (BrowserRouter) dipasang di main.tsx agar App mudah diuji dengan MemoryRouter. */
export default function App() {
  const [splashSeen, setSplashSeen] = useState(readSplashSeen);
  const finishSplash = useCallback(() => {
    try {
      sessionStorage.setItem(SPLASH_KEY, '1');
    } catch {
      /* abaikan */
    }
    setSplashSeen(true);
  }, []);

  return (
    <ConnectivityProvider>
      <AuthProvider>
        <AppShell>
          {!splashSeen ? (
            <SplashScreen onDone={finishSplash} />
          ) : (
            <ReportDataProvider>
              <SyncProvider>
                <ReportFlowProvider>
                  <AppRoutes />
                </ReportFlowProvider>
              </SyncProvider>
            </ReportDataProvider>
          )}
        </AppShell>
      </AuthProvider>
    </ConnectivityProvider>
  );
}
