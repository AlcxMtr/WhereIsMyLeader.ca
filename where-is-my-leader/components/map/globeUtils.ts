import type { ThemeMode } from './types';

export function sleep(ms: number) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeLng(lng: number) {
  let value = lng;
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
  return value;
}

function shortestLngDelta(fromLng: number, toLng: number) {
  let delta = toLng - fromLng;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

function sphericalDistance(a: [number, number], b: [number, number]) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(shortestLngDelta(lng1, lng2));
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const hav =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
}

export function getDistanceBasedMidAltitude(from: [number, number], to: [number, number]) {
  const radians = sphericalDistance(from, to);
  const normalized = Math.min(radians / Math.PI, 1);
  return lerp(0.95, 2.6, normalized);
}

function latLngToVector(lat: number, lng: number) {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const cosLat = Math.cos(latRad);

  return {
    x: cosLat * Math.cos(lngRad),
    y: Math.sin(latRad),
    z: cosLat * Math.sin(lngRad),
  };
}

function vectorToLatLng(x: number, y: number, z: number) {
  const length = Math.sqrt(x * x + y * y + z * z) || 1;
  const nx = x / length;
  const ny = y / length;
  const nz = z / length;

  const lat = (Math.asin(clamp(ny, -1, 1)) * 180) / Math.PI;
  const lng = (Math.atan2(nz, nx) * 180) / Math.PI;

  return {
    lat,
    lng: normalizeLng(lng),
  };
}

function slerpLatLng(from: [number, number], to: [number, number], t: number) {
  const a = latLngToVector(from[0], from[1]);
  const b = latLngToVector(to[0], to[1]);

  const dot = clamp(a.x * b.x + a.y * b.y + a.z * b.z, -1, 1);
  const omega = Math.acos(dot);

  if (omega < 1e-6) {
    return {
      lat: lerp(from[0], to[0], t),
      lng: normalizeLng(from[1] + shortestLngDelta(from[1], to[1]) * t),
    };
  }

  const sinOmega = Math.sin(omega);
  const scaleA = Math.sin((1 - t) * omega) / sinOmega;
  const scaleB = Math.sin(t * omega) / sinOmega;

  const x = a.x * scaleA + b.x * scaleB;
  const y = a.y * scaleA + b.y * scaleB;
  const z = a.z * scaleA + b.z * scaleB;

  return vectorToLatLng(x, y, z);
}

export function buildGreatCirclePath(from: [number, number], to: [number, number], steps = 72) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const ease = 0.5 - Math.cos(Math.PI * t) / 2;
    return slerpLatLng(from, to, ease);
  });
}

export function getPastGradientColor(index: number, total: number, theme: ThemeMode): string {
  const stopsDark: [number, number, number][] = [
    [239, 68, 68],
    [249, 115, 22],
    [234, 179, 8],
    [34, 197, 94],
  ];

  const stopsLight: [number, number, number][] = [
    [185, 28, 28],
    [194, 65, 12],
    [161, 98, 7],
    [21, 128, 61],
  ];

  const stops = theme === 'dark' ? stopsDark : stopsLight;

  if (total <= 1) {
    const [r, g, b] = stops[stops.length - 1];
    return `rgb(${r}, ${g}, ${b})`;
  }

  const t = index / (total - 1);
  const scaled = t * (stops.length - 1);
  const lo = Math.floor(scaled);
  const hi = Math.min(lo + 1, stops.length - 1);
  const frac = scaled - lo;

  const [r1, g1, b1] = stops[lo];
  const [r2, g2, b2] = stops[hi];

  return `rgb(${Math.round(r1 + (r2 - r1) * frac)}, ${Math.round(g1 + (g2 - g1) * frac)}, ${Math.round(
    b1 + (b2 - b1) * frac
  )})`;
}
