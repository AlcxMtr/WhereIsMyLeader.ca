import { hasTripStarted } from '../tripUtils';
import type { ArcDatum, HtmlDetailDatum, PointDatum, ThemeMode, TravelPoint } from '../types';
import { getPastGradientColor } from './colors';

/**
 * Colour of the arc that arrives at each trip (index 0 has no incoming arc, so it
 * borrows the colour of the first outgoing one). Past arcs form a gradient; future arcs share one colour.
 */
function incomingArcColors(travelData: TravelPoint[], futureArcColor: string, theme: ThemeMode): string[] {
  const now = new Date();
  const pastSegments = Math.max(travelData.slice(1).filter(trip => hasTripStarted(trip, now)).length, 1);

  const colors: string[] = new Array(travelData.length).fill('');
  let seenPast = 0;
  for (let i = 1; i < travelData.length; i++) {
    if (hasTripStarted(travelData[i], now)) {
      colors[i] = getPastGradientColor(seenPast, pastSegments, theme);
      seenPast += 1;
    } else {
      colors[i] = futureArcColor;
    }
  }
  colors[0] = colors[1] ?? getPastGradientColor(0, 1, theme);
  return colors;
}

export function buildPointsData(
  travelData: TravelPoint[],
  latestColor: string,
  theme: ThemeMode,
  futureArcColor: string
): PointDatum[] {
  const arcColors = incomingArcColors(travelData, futureArcColor, theme);

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
      color: isLatest ? latestColor : arcColors[index],
    };
  });
}

export function buildArcsData(travelData: TravelPoint[], futureArcColor: string, theme: ThemeMode): ArcDatum[] {
  const arcColors = incomingArcColors(travelData, futureArcColor, theme);

  return travelData.slice(1).map((loc, i) => {
    const prev = travelData[i];
    return {
      startLat: prev.coords[0],
      startLng: prev.coords[1],
      endLat: loc.coords[0],
      endLng: loc.coords[1],
      color: arcColors[i + 1],
    };
  });
}

export function buildDetailHtmlData(activeDetail: TravelPoint | null): HtmlDetailDatum[] {
  if (!activeDetail) return [];
  return [{ lat: activeDetail.coords[0], lng: activeDetail.coords[1], trip: activeDetail }];
}
