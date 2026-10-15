import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Kembali ke halaman sebelumnya; bila tidak ada riwayat (mis. dibuka langsung) pakai fallback. */
export function useGoBack(fallback: string) {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(() => {
    if (location.key !== 'default') navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, location.key, fallback]);
}
