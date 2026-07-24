import { getPastGradientColor } from './globeUtils';
import type { ArcDatum, HtmlDetailDatum, PointDatum, ThemeMode, TravelPoint } from './types';

export function buildPointsData(
  travelData: TravelPoint[],
  latestColor: string,
  theme: ThemeMode,
  futureArcColor: string,
): PointDatum[] {
  const now = new Date();
  const pastSegments = travelData.slice(1).filter(tp => new Date(`${tp.arrival}T00:00:00`) <= now).length;

  // Pre-compute the color of the arc arriving at each trip index so columns
  // can match the flight path that delivered the leader there.
  const incomingColor: string[] = new Array(travelData.length).fill('');
  let seenPast = 0;
  for (let i = 1; i < travelData.length; i++) {
    const isFuture = new Date(`${travelData[i].arrival}T00:00:00`) > now;
    if (isFuture) {
      incomingColor[i] = futureArcColor;
    } else {
      incomingColor[i] = getPastGradientColor(seenPast, Math.max(pastSegments, 1), theme);
      seenPast++;
    }
  }
  // First trip is the origin — give it the same colour as its outgoing arc.
  incomingColor[0] = incomingColor[1] ?? getPastGradientColor(0, 1, theme);

  return travelData.map((loc, index) => {
    const isLatest = index === travelData.length - 1;
    return {
      id: loc.id,
      lat: loc.coords[0],
      lng: loc.coords[1],
      city: loc.city,
      desc: loc.desc,
      arrival: loc.arrival,
      departure: loc.departure,
      isLatest,
      color: isLatest ? latestColor : incomingColor[index],
    };
  });
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
