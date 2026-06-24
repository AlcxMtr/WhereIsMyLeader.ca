export interface TravelPoint {
  id: number;
  city: string;
  coords: [number, number];
  desc: string;
  arrival: string;
  departure: string;
}

export interface PointDatum {
  id: number;
  lat: number;
  lng: number;
  city: string;
  desc: string;
  arrival: string;
  departure: string;
  isLatest: boolean;
  color: string;
}

export interface ArcDatum {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}

export interface HtmlDetailDatum {
  lat: number;
  lng: number;
  trip: TravelPoint;
}

export type ThemeMode = 'light' | 'dark';

export type SelectionState = {
  trip: TravelPoint;
  key: number;
} | null;

export type GlobeHandle = {
  pointOfView: (coords: { lat?: number; lng?: number; altitude?: number }, ms?: number) => void;
  controls: () => {
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    enablePan?: boolean;
    enableZoom?: boolean;
    minDistance?: number;
    maxDistance?: number;
  };
};
