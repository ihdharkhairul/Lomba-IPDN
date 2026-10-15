import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Move } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { config } from '@/config';
import type { LocationPickerProps } from './mapTypes';
import { OSM_ATTRIBUTION, OSM_TILES } from './OsmMapView';

const PIN = L.divIcon({
  className: '',
  html: '<span style="display:block;width:26px;height:26px;background:#dc2626;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,.45)"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

/** Penentu lokasi OpenStreetMap: geser peta/pin atau ketuk peta untuk memindahkan titik. */
export default function OsmLocationPicker({ value, onChange, className = 'h-72' }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const lastEmitted = useRef<{ lat: number; lng: number } | null>(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;

  function emit(lat: number, lng: number) {
    lastEmitted.current = { lat, lng };
    changeRef.current(lat, lng);
  }

  function place(map: L.Map, lat: number, lng: number) {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      return;
    }
    const marker = L.marker([lat, lng], { draggable: true, icon: PIN, title: 'Geser untuk menyesuaikan titik' }).addTo(map);
    marker.on('dragend', () => {
      const p = marker.getLatLng();
      emit(p.lat, p.lng);
    });
    markerRef.current = marker;
  }

  useEffect(() => {
    if (!containerRef.current) return;
    const start = valueRef.current;
    const map = L.map(containerRef.current).setView(start ? [start.lat, start.lng] : [config.defaultMapCenter.lat, config.defaultMapCenter.lng], start ? 17 : config.defaultMapZoom);
    L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => {
      place(map, e.latlng.lat, e.latlng.lng);
      emit(e.latlng.lat, e.latlng.lng);
    });
    mapRef.current = map;
    if (start) place(map, start.lat, start.lng);
    const t = setTimeout(() => map.invalidateSize(), 0);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nilai berubah dari luar (mis. "Gunakan Lokasi Saya") -> pindahkan pin & pusatkan peta.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !value) return;
    const same = lastEmitted.current && Math.abs(lastEmitted.current.lat - value.lat) < 1e-9 && Math.abs(lastEmitted.current.lng - value.lng) < 1e-9;
    place(map, value.lat, value.lng);
    if (!same) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 17));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  return (
    <div className={`${className} relative bg-slate-100`}>
      <div ref={containerRef} className="absolute inset-0 z-0" role="application" aria-label="Peta untuk menentukan titik lokasi" />
      <p className="absolute left-2 bottom-6 right-2 sm:right-auto px-2.5 py-1.5 bg-white/95 rounded-md text-xs text-slate-700 flex items-center gap-1.5 shadow-sm pointer-events-none z-[500]">
        <Move className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />Geser pin atau ketuk peta untuk menyesuaikan titik
      </p>
    </div>
  );
}
