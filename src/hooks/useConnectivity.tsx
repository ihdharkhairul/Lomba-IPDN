import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { config } from '@/config';
import { setSimulatedOffline as setNetworkSimulatedOffline } from '@/services/network';

interface ConnectivityValue {
  /** Status koneksi perangkat (navigator.onLine + event online/offline). */
  isOnline: boolean;
  /** Hanya mungkin true di mode demo. */
  simulatedOffline: boolean;
  setSimulatedOffline: (value: boolean) => void;
}

const ConnectivityContext = createContext<ConnectivityValue | null>(null);
const SIM_KEY = 'laporin.simulateOffline';

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [browserOnline, setBrowserOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [simulatedOffline, setSimulated] = useState(() => {
    if (!config.isDemoMode) return false;
    try {
      return localStorage.getItem(SIM_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const goOnline = () => setBrowserOnline(true);
    const goOffline = () => setBrowserOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Sinkronkan ke modul non-React (service AI/peta/sync membaca dari sana).
  useEffect(() => {
    setNetworkSimulatedOffline(simulatedOffline);
  }, [simulatedOffline]);

  const setSimulatedOffline = useCallback((value: boolean) => {
    if (!config.isDemoMode) return;
    setSimulated(value);
    try {
      localStorage.setItem(SIM_KEY, value ? '1' : '0');
    } catch {
      /* abaikan */
    }
  }, []);

  const value = useMemo<ConnectivityValue>(
    () => ({ isOnline: browserOnline && !simulatedOffline, simulatedOffline, setSimulatedOffline }),
    [browserOnline, simulatedOffline, setSimulatedOffline],
  );
  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export function useConnectivity(): ConnectivityValue {
  const ctx = useContext(ConnectivityContext);
  if (!ctx) throw new Error('useConnectivity harus dipakai di dalam <ConnectivityProvider>');
  return ctx;
}
