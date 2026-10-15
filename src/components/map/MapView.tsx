import { Suspense, lazy } from 'react';
import { config } from '@/config';
import { isNetworkAvailable } from '@/services/network';
import { GoogleMapView } from './GoogleMapView';
import { MapFallback } from './MapFallback';
import type { MapViewProps } from './mapTypes';

const OsmMapView = lazy(() => import('./OsmMapView'));

export type { MapMarker } from './mapTypes';

/** Peta tampilan: otomatis memakai Google Maps atau OpenStreetMap sesuai config.mapProvider. */
export function MapView(props: MapViewProps) {
  if (config.mapProvider === 'google') return <GoogleMapView {...props} />;
  if (!isNetworkAvailable()) return <MapFallback reason="OFFLINE" className={props.className} />;
  return (
    <Suspense fallback={<div className={`${props.className ?? 'h-44'} bg-slate-100`} />}>
      <OsmMapView {...props} />
    </Suspense>
  );
}
