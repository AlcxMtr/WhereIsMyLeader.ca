import { getPastGradientColor } from './globeUtils';
import type { ArcDatum, HtmlDetailDatum, PointDatum, ThemeMode, TravelPoint } from './types';

export function buildPointsData(travelData: TravelPoint[], latestColor: string, pointColor: string): PointDatum[] {
  return travelData.map((loc, index) => ({
    id: loc.id,
    lat: loc.coords[0],
    lng: loc.coords[1],
    city: loc.city,
    desc: loc.desc,
    arrival: loc.arrival,
    departure: loc.departure,
    isLatest: index === travelData.length - 1,
    color: index === travelData.length - 1 ? latestColor : pointColor,
  }));
}

export function buildPointMap(travelData: TravelPoint[]): globalThis.Map<number, TravelPoint> {
  const map: globalThis.Map<number, TravelPoint> = new globalThis.Map<number, TravelPoint>();
  travelData.forEach(trip => map.set(trip.id, trip));
  return map;
}

export function buildArcsData(travelData: TravelPoint[], futureArcColor: string, theme: ThemeMode): ArcDatum[] {
  const now = new Date();
  const pastSegments = travelData.slice(1).filter(tp => new Date(`${tp.arrival}T00:00:00`) <= now).length;
  let seenPast = 0;

  return travelData
    .map((loc, i) => {
      if (i === 0) return null;

      const prev = travelData[i - 1];
      const isFuture = new Date(`${loc.arrival}T00:00:00`) > now;

      let color = futureArcColor;
      if (!isFuture) {
        color = getPastGradientColor(seenPast, Math.max(pastSegments, 1), theme);
        seenPast += 1;
      }

      return {
        startLat: prev.coords[0],
        startLng: prev.coords[1],
        endLat: loc.coords[0],
        endLng: loc.coords[1],
        color,
      };
    })
    .filter((arc): arc is ArcDatum => arc !== null);
}

export function buildDetailHtmlData(activeDetail: TravelPoint | null): HtmlDetailDatum[] {
  if (!activeDetail) return [];

  return [
    {
      lat: activeDetail.coords[0],
      lng: activeDetail.coords[1],
      trip: activeDetail,
    },
  ];
}
