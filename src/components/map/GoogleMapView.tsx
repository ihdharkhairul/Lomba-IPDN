import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { config } from '@/config';
import { loadGoogleMaps, MapsError, onMapsAuthFailure, type MapsErrorCode } from '@/services/map/googleMapsLoader';
import { MapFallback } from './MapFallback';
import type { MapViewProps } from './mapTypes';


/** Peta Google Maps nyata. Bila tidak bisa dimuat (offline / tanpa key) menampilkan MapFallback. */
export function GoogleMapView({ markers = [], userLocation = null, selectedId = null, onMarkerClick, recenterKey = 0, className = 'h-44' }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerObjs = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const userMarker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const clickRef = useRef(onMarkerClick);
  clickRef.current = onMarkerClick;
  const [status, setStatus] = useState<'loading' | 'ready' | MapsErrorCode>('loading');
  const [version, setVersion] = useState(0);

  // Muat API & buat peta sekali.
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: config.defaultMapCenter,
          zoom: config.defaultMapZoom,
          mapId: config.googleMapsMapId,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        });
        setStatus('ready');
        setVersion((v) => v + 1);
      })
      .catch((err) => {
        if (!cancelled) setStatus(err instanceof MapsError ? err.code : 'LOAD_FAILED');
      });
    const off = onMapsAuthFailure(() => !cancelled && setStatus('AUTH_FAILED'));
    return () => {
      cancelled = true;
      off();
      markerObjs.current.forEach((m) => (m.map = null));
      markerObjs.current = [];
      if (userMarker.current) userMarker.current.map = null;
      userMarker.current = null;
      mapRef.current = null;
    };
  }, []);

  // Render marker laporan & atur viewport.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;
    markerObjs.current.forEach((m) => (m.map = null));
    markerObjs.current = markers.map((m) => {
      const pin = new google.maps.marker.PinElement({
        background: m.color,
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        scale: m.id === selectedId ? 1.3 : 1,
      });
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: m.lat, lng: m.lng },
        title: m.title,
        content: pin.element,
        gmpClickable: true,
      });
      marker.addListener('click', () => clickRef.current?.(m.id));
      return marker;
    });

    const points = [...markers.map((m) => ({ lat: m.lat, lng: m.lng })), ...(userLocation ? [userLocation] : [])];
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(16);
    } else if (points.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      points.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 48);
    }
    // userLocation sengaja tidak jadi dependency: dikelola efek terpisah di bawah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, selectedId, status, version]);

  // Titik "lokasi saya" (lingkaran biru).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;
    if (userMarker.current) userMarker.current.map = null;
    userMarker.current = null;
    if (!userLocation) return;
    const dot = document.createElement('div');
    dot.style.cssText = 'width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.25)';
    userMarker.current = new google.maps.marker.AdvancedMarkerElement({ map, position: userLocation, title: 'Lokasi Anda', content: dot });
  }, [userLocation, status, version]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready' || !userLocation || recenterKey === 0) return;
    map.panTo(userLocation);
    map.setZoom(16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterKey]);

  if (status !== 'loading' && status !== 'ready') return <MapFallback reason={status} className={className} />;

  return (
    <div className={`${className} relative bg-slate-100`}>
      <div ref={containerRef} className="absolute inset-0" role="application" aria-label="Peta Google Maps" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-500 gap-2 text-xs" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Memuat peta…
        </div>
      )}
    </div>
  );
}
