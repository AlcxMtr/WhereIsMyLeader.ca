import type { ThemeMode } from '../types';

type Rgb = [number, number, number];

const PAST_ARC_STOPS: Record<ThemeMode, Rgb[]> = {
  dark: [
    [220, 38, 38],
    [234, 88, 12],
    [202, 138, 4],
    [22, 163, 74],
  ],
  light: [
    [185, 28, 28],
    [194, 65, 12],
    [161, 98, 7],
    [21, 128, 61],
  ],
};

/** Colour for the `index`-th of `total` past arcs: red (oldest) fading to green (most recent). */
export function getPastGradientColor(index: number, total: number, theme: ThemeMode): string {
  const stops = PAST_ARC_STOPS[theme];

  if (total <= 1) {
    const [r, g, b] = stops[stops.length - 1];
    return `rgb(${r}, ${g}, ${b})`;
  }

  const scaled = (index / (total - 1)) * (stops.length - 1);
  const lo = Math.floor(scaled);
  const hi = Math.min(lo + 1, stops.length - 1);
  const frac = scaled - lo;

  const [r1, g1, b1] = stops[lo];
  const [r2, g2, b2] = stops[hi];

  return `rgb(${Math.round(r1 + (r2 - r1) * frac)}, ${Math.round(g1 + (g2 - g1) * frac)}, ${Math.round(
    b1 + (b2 - b1) * frac
  )})`;
}

function hexChannels(hex: string): Rgb {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexChannels(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Like `hexToRgba` but scales each channel by `boost` (clamped to 255). */
export function hexBrightRgba(hex: string, boost: number, alpha: number): string {
  const [r, g, b] = hexChannels(hex).map(c => Math.min(255, Math.round(c * boost)));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
