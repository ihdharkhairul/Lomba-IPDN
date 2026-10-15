export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  /** Warna penanda (hex). */
  color: string;
}

export interface MapViewProps {
  markers?: MapMarker[];
  userLocation?: LatLng | null;
  selectedId?: string | null;
  onMarkerClick?: (id: string) => void;
  /** Mengubah nilai ini memusatkan ulang peta ke lokasi user. */
  recenterKey?: number;
  className?: string;
}

export interface LocationPickerProps {
  value: LatLng | null;
  /** Dipanggil saat user menggeser pin atau mengetuk peta. */
  onChange: (lat: number, lng: number) => void;
  className?: string;
}
