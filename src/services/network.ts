/**
 * Status jaringan yang dibaca oleh service non-React (AI, peta, sinkronisasi).
 * Sumber utamanya adalah navigator.onLine. `simulatedOffline` hanya aktif di mode demo
 * (VITE_DEMO_MODE=true) untuk keperluan presentasi, bukan fitur untuk pengguna biasa.
 */
let simulatedOffline = false;

export function setSimulatedOffline(value: boolean): void {
  simulatedOffline = value;
}

export function isSimulatedOffline(): boolean {
  return simulatedOffline;
}

export function isNetworkAvailable(): boolean {
  const browserOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
  return browserOnline && !simulatedOffline;
}
