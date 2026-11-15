import type { TravelPoint } from '@/lib/types';

export type { TravelPoint };

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

export interface CountryPolygonDatum {
  type: 'Feature';
  countryCode: string;
  geometry: object;
  properties: Record<string, unknown>;
}

export type ThemeMode = 'light' | 'dark';

export type SelectionState = {
  trip: TravelPoint;
  key: number;
} | null;

export type { FirstTripStrategy, Subject, SubjectPageMetadata, SubjectWelcomeCopy } from '@/lib/subjects';

/** The visible date window plus the full extent it can be moved within (all `YYYY-MM-DD`). */
export interface TimelineState {
  from: string;
  to: string;
  min: string;
  max: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export type GlobeHandle = {
  pointOfView: {
    (coords: { lat?: number; lng?: number; altitude?: number }, ms?: number): void;
    (): { lat?: number; lng?: number; altitude?: number };
  };
  controls: () => {
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    enablePan?: boolean;
    enableZoom?: boolean;
    zoomSpeed?: number;
    minDistance?: number;
    maxDistance?: number;
  };
};
