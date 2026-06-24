import type { ThemeMode } from './types';

export function getThemeColors(theme: ThemeMode) {
  if (theme === 'dark') {
    return {
      pageBg: '#020617',
      panelBg: 'rgba(15, 23, 42, 0.94)',
      panelBorder: '#1e293b',
      panelSoft: '#0f172a',
      panelHover: '#111c32',
      panelSelected: '#172554',
      panelNow: '#052e16',
      text: '#e2e8f0',
      textSoft: '#94a3b8',
      textMuted: '#cbd5e1',
      inputBg: '#0f172a',
      inputBorder: '#334155',
      buttonBg: '#1e293b',
      buttonText: '#e2e8f0',
      toggleOn: '#3b82f6',
      toggleOff: '#475569',
      detailBg: 'rgba(15, 23, 42, 0.97)',
      detailBorder: 'rgba(148, 163, 184, 0.28)',
      detailText: '#f8fafc',
      detailSub: '#cbd5e1',
      globeBg: '#020617',
      atmosphere: '#60a5fa',
      futureArc: '#60a5fa',
      point: '#f87171',
      latestPoint: '#4ade80',
      globeImageUrl: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
      bumpImageUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
      backgroundImageUrl: 'https://unpkg.com/three-globe/example/img/night-sky.png',
    };
  }

  return {
    pageBg: '#eaf4ff',
    panelBg: 'rgba(255, 255, 255, 0.96)',
    panelBorder: '#dbe4ee',
    panelSoft: '#f8fafc',
    panelHover: '#f1f5f9',
    panelSelected: '#dbeafe',
    panelNow: '#dcfce7',
    text: '#0f172a',
    textSoft: '#64748b',
    textMuted: '#334155',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
    buttonBg: '#e2e8f0',
    buttonText: '#0f172a',
    toggleOn: '#2563eb',
    toggleOff: '#94a3b8',
    detailBg: 'rgba(255, 255, 255, 0.98)',
    detailBorder: 'rgba(148, 163, 184, 0.35)',
    detailText: '#0f172a',
    detailSub: '#475569',
    globeBg: '#dbeafe',
    atmosphere: '#38bdf8',
    futureArc: '#2563eb',
    point: '#dc2626',
    latestPoint: '#16a34a',
    globeImageUrl: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    bumpImageUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
    backgroundImageUrl: undefined,
  };
}

export type ThemeColors = ReturnType<typeof getThemeColors>;
