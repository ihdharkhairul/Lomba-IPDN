import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { config } from '@/config';
import type { MapViewProps } from './mapTypes';

export const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Peta OpenStreetMap (Leaflet): gratis, tanpa API key. Menampilkan marker laporan & lokasi user. */
export default function OsmMapView({ markers = [], userLocation = null, selectedId = null, onMarkerClick, recenterKey = 0, className = 'h-44' }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const userRef = useRef<L.CircleMarker | null>(null);
  const clickRef = useRef(onMarkerClick);
  clickRef.current = onMarkerClick;

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current).setView([config.defaultMapCenter.lat, config.defaultMapCenter.lng], config.defaultMapZoom);
    L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 0);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      userRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    markers.forEach((m) => {
      L.circleMarker([m.lat, m.lng], {
        radius: m.id === selectedId ? 12 : 9,
        color: '#ffffff',
        weight: 3,
        fillColor: m.color,
        fillOpacity: 1,
      })
        .bindTooltip(m.title)
        .on('click', () => clickRef.current?.(m.id))
        .addTo(layer);
    });
    const pts: L.LatLngTuple[] = markers.map((m) => [m.lat, m.lng]);
    if (userLocation) pts.push([userLocation.lat, userLocation.lng]);
    if (pts.length === 1) map.setView(pts[0], 16);
    else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
    // userLocation dikelola efek terpisah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    userRef.current?.remove();
    userRef.current = null;
    if (!userLocation) return;
    userRef.current = L.circleMarker([userLocation.lat, userLocation.lng], { radius: 8, color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 })
      .bindTooltip('Lokasi Anda')
      .addTo(map);
  }, [userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation || recenterKey === 0) return;
    map.setView([userLocation.lat, userLocation.lng], 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterKey]);

  return <div ref={containerRef} className={`${className} bg-slate-100 z-0`} role="application" aria-label="Peta OpenStreetMap" />;
}
