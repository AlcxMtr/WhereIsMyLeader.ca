export interface TravelPoint {
  id: number;
  city: string;
  coords: [number, number];
  desc: string;
  arrival: string;
  departure: string;
  summary: string;
  citations: string[];
}
