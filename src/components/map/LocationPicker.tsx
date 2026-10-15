import { Suspense, lazy } from 'react';
import { config } from '@/config';
import { isNetworkAvailable } from '@/services/network';
import { GoogleLocationPicker } from './GoogleLocationPicker';
import { MapFallback } from './MapFallback';
import type { LocationPickerProps } from './mapTypes';

const OsmLocationPicker = lazy(() => import('./OsmLocationPicker'));

/** Penentu lokasi: otomatis memakai Google Maps atau OpenStreetMap sesuai config.mapProvider. */
export function LocationPicker(props: LocationPickerProps) {
  if (config.mapProvider === 'google') return <GoogleLocationPicker {...props} />;
  if (!isNetworkAvailable()) return <MapFallback reason="OFFLINE" className={props.className} />;
  return (
    <Suspense fallback={<div className={`${props.className ?? 'h-72'} bg-slate-100`} />}>
      <OsmLocationPicker {...props} />
    </Suspense>
  );
}
