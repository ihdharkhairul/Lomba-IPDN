import { Loader2, Move } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { config } from '@/config';
import { loadGoogleMaps, MapsError, onMapsAuthFailure, type MapsErrorCode } from '@/services/map/googleMapsLoader';
import { MapFallback } from './MapFallback';
import type { LatLng, LocationPickerProps } from './mapTypes';


function readPosition(p: google.maps.LatLng | google.maps.LatLngLiteral | google.maps.LatLngAltitude | google.maps.LatLngAltitudeLiteral | null | undefined): LatLng | null {
  if (!p) return null;
  const anyP = p as { lat: number | (() => number); lng: number | (() => number) };
  const lat = typeof anyP.lat === 'function' ? anyP.lat() : anyP.lat;
  const lng = typeof anyP.lng === 'function' ? anyP.lng() : anyP.lng;
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/**
 * Peta interaktif ala Google Maps: geser/zoom peta, geser pin merah, atau ketuk peta
 * untuk memindahkan titik laporan. Posisi awal biasanya dari GPS.
 */
export function GoogleLocationPicker({ value, onChange, className = 'h-72' }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const lastEmitted = useRef<LatLng | null>(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;
  const [status, setStatus] = useState<'loading' | 'ready' | MapsErrorCode>('loading');

  function emit(pos: LatLng) {
    lastEmitted.current = pos;
    changeRef.current(pos.lat, pos.lng);
  }

  function placeMarker(map: google.maps.Map, pos: LatLng) {
    if (markerRef.current) {
      markerRef.current.position = pos;
      return;
    }
    const pin = new google.maps.marker.PinElement({ background: '#dc2626', borderColor: '#ffffff', glyphColor: '#ffffff', scale: 1.2 });
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: pos,
      content: pin.element,
      gmpDraggable: true,
      title: 'Geser untuk menyesuaikan titik',
    });
    marker.addListener('dragend', () => {
      const p = readPosition(marker.position);
      if (p) emit(p);
    });
    markerRef.current = marker;
  }

  // Muat API & buat peta sekali.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const start = valueRef.current;
        const map = new google.maps.Map(containerRef.current, {
          center: start ?? config.defaultMapCenter,
          zoom: start ? 17 : config.defaultMapZoom,
          mapId: config.googleMapsMapId,
          gestureHandling: 'greedy',
          zoomControl: true,
          mapTypeControl: true, // peta/satelit
          streetViewControl: false,
          fullscreenControl: true,
        });
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          const p = readPosition(e.latLng);
          if (!p) return;
          placeMarker(map, p);
          emit(p);
        });
        mapRef.current = map;
        if (start) placeMarker(map, start);
        setStatus('ready');
      })
      .catch((err) => !cancelled && setStatus(err instanceof MapsError ? err.code : 'LOAD_FAILED'));
    const off = onMapsAuthFailure(() => !cancelled && setStatus('AUTH_FAILED'));
    return () => {
      cancelled = true;
      off();
      if (markerRef.current) markerRef.current.map = null;
      markerRef.current = null;
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nilai berubah dari luar (mis. tombol "Gunakan Lokasi Saya") -> pindahkan pin & pusatkan peta.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready' || !value) return;
    const same = lastEmitted.current && Math.abs(lastEmitted.current.lat - value.lat) < 1e-9 && Math.abs(lastEmitted.current.lng - value.lng) < 1e-9;
    placeMarker(map, value);
    if (!same) {
      map.panTo(value);
      if ((map.getZoom() ?? 0) < 16) map.setZoom(17);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng, status]);

  if (status !== 'loading' && status !== 'ready') return <MapFallback reason={status} className={className} />;

  return (
    <div className={`${className} relative bg-slate-100`}>
      <div ref={containerRef} className="absolute inset-0" role="application" aria-label="Peta untuk menentukan titik lokasi" />
      {status === 'loading' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-500 gap-2 text-xs" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Memuat peta…
        </div>
      ) : (
        <p className="absolute left-2 bottom-2 right-2 sm:right-auto px-2.5 py-1.5 bg-white/95 rounded-md text-xs text-slate-700 flex items-center gap-1.5 shadow-sm pointer-events-none">
          <Move className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />Geser pin atau ketuk peta untuk menyesuaikan titik
        </p>
      )}
    </div>
  );
}
