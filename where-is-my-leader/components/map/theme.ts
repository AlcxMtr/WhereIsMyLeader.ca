import type { CSSProperties } from 'react';

import type { ThemeMode } from './types';

interface ImageUrls {
  globeImageUrl: string;
  bumpImageUrl: string;
  backgroundImageUrl: string | undefined;
}

interface ThemePalette {
  pageBg: string;
  panelBg: string;
  panelBorder: string;
  panelSoft: string;
  panelHover: string;
  panelSelected: string;
  panelNow: string;
  text: string;
  textSoft: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  buttonBg: string;
  buttonText: string;
  toggleOn: string;
  toggleOff: string;
  detailBg: string;
  detailBorder: string;
  detailText: string;
  detailSub: string;
  detailSubtitle: string;
  globeBg: string;
  atmosphere: string;
  futureArc: string;
  point: string;
  latestPoint: string;
  welcomeGradientStart: string;
  currentGradientStart: string;
  gradientEnd: string;
  cardShadow: string;
  stayShadow: string;
  rowBg: string;
  flagPlaceholderBg: string;
  nowBadgeBg: string;
  switchTrack: string;
  switchTrackBorder: string;
  switchKnobIcon: string;
  handleShadow: string;
}

export type ThemeColors = ThemePalette & ImageUrls;

const dark: ThemeColors = {
  pageBg: '#030712',
  panelBg: 'rgba(8, 15, 34, 0.92)',
  panelBorder: '#1b2a4a',
  panelSoft: '#09122a',
  panelHover: 'rgba(30, 58, 138, 0.22)',
  panelSelected: 'rgba(8, 145, 178, 0.26)',
  panelNow: 'rgba(22, 163, 74, 0.24)',
  text: '#e6edf8',
  textSoft: '#9fb1cc',
  textMuted: '#c7d6ee',
  inputBg: '#0b1732',
  inputBorder: '#27406f',
  buttonBg: 'rgba(17, 33, 64, 0.9)',
  buttonText: '#dce9ff',
  toggleOn: '#2563eb',
  toggleOff: '#334e7d',
  detailBg: 'rgba(8, 15, 34, 0.96)',
  detailBorder: 'rgba(56, 189, 248, 0.36)',
  detailText: '#eef6ff',
  detailSub: '#adc2e0',
  detailSubtitle: '#adc2e0',
  globeBg: '#030712',
  atmosphere: '#60a5fa',
  futureArc: '#38bdf8',
  point: '#e11d48',
  latestPoint: '#22c55e',
  welcomeGradientStart: 'rgba(8, 145, 178, 0.4)',
  currentGradientStart: 'rgba(22, 163, 74, 0.42)',
  gradientEnd: 'rgba(9, 18, 42, 0.94)',
  cardShadow: '0 14px 32px rgba(0,0,0,0.42)',
  stayShadow: '0 8px 20px rgba(2,6,23,0.26)',
  rowBg: 'rgba(7,14,33,0.5)',
  flagPlaceholderBg: '#334155',
  nowBadgeBg: '#16a34a',
  switchTrack: '#1b2338',
  switchTrackBorder: '#2d3a5d',
  switchKnobIcon: '#223052',
  handleShadow: '0 1px 7px rgba(2,6,23,0.44)',
  globeImageUrl: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
  bumpImageUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
  backgroundImageUrl: 'https://unpkg.com/three-globe/example/img/night-sky.png',
};

const light: ThemeColors = {
  pageBg: '#e7edf8',
  panelBg: 'rgba(237, 244, 255, 0.94)',
  panelBorder: '#9db2d8',
  panelSoft: '#e4ecfa',
  panelHover: 'rgba(37, 99, 235, 0.12)',
  panelSelected: 'rgba(37, 99, 235, 0.2)',
  panelNow: 'rgba(22, 163, 74, 0.2)',
  text: '#13294b',
  textSoft: '#4f6488',
  textMuted: '#314d78',
  inputBg: '#f5f8ff',
  inputBorder: '#8fa6cf',
  buttonBg: 'rgba(214, 226, 246, 0.95)',
  buttonText: '#12305f',
  toggleOn: '#2563eb',
  toggleOff: '#7d97c0',
  detailBg: 'rgba(239, 245, 255, 0.97)',
  detailBorder: 'rgba(37, 99, 235, 0.34)',
  detailText: '#13294b',
  detailSub: '#46628b',
  detailSubtitle: '#13294b',
  globeBg: '#d5e3fa',
  atmosphere: '#3b82f6',
  futureArc: '#2563eb',
  point: '#e11d48',
  latestPoint: '#16a34a',
  welcomeGradientStart: 'rgba(37, 99, 235, 0.26)',
  currentGradientStart: 'rgba(22, 163, 74, 0.28)',
  gradientEnd: 'rgba(228, 236, 250, 0.96)',
  cardShadow: '0 14px 32px rgba(15,23,42,0.14)',
  stayShadow: '0 8px 18px rgba(15,23,42,0.08)',
  rowBg: 'rgba(241,245,249,0.62)',
  flagPlaceholderBg: '#e2e8f0',
  nowBadgeBg: '#22c55e',
  switchTrack: '#9fb4ef',
  switchTrackBorder: '#8ea7e8',
  switchKnobIcon: '#5a6fb0',
  handleShadow: '0 1px 7px rgba(15,23,42,0.12)',
  globeImageUrl: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
  bumpImageUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
  backgroundImageUrl: undefined,
};

export function getThemeColors(theme: ThemeMode): ThemeColors {
  return theme === 'dark' ? dark : light;
}

const kebab = (name: string) => name.replace(/[A-Z]/g, ch => `-${ch.toLowerCase()}`);

/**
 * Exposes the palette as `--wiml-*` CSS custom properties (e.g. `detailBorder` -> `--wiml-detail-border`)
 * so stylesheets can use theme colours without receiving them as props. Image URLs are excluded.
 */
export function themeCssVars(colors: ThemeColors): CSSProperties {
  const vars: Record<string, string> = {};
  for (const [name, value] of Object.entries(colors)) {
    if (typeof value === 'string' && !name.endsWith('ImageUrl')) vars[`--wiml-${kebab(name)}`] = value;
  }
  return vars as CSSProperties;
}
