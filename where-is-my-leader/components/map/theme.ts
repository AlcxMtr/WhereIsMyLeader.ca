import type { ThemeMode } from './types';

export function getThemeColors(theme: ThemeMode) {
  if (theme === 'dark') {
    return {
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
      globeBg: '#030712',
      atmosphere: '#60a5fa',
      futureArc: '#38bdf8',
      point: '#fb7185',
      latestPoint: '#22c55e',
      globeImageUrl: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
      bumpImageUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
      backgroundImageUrl: 'https://unpkg.com/three-globe/example/img/night-sky.png',
    };
  }

  return {
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
    globeBg: '#d5e3fa',
    atmosphere: '#3b82f6',
    futureArc: '#2563eb',
    point: '#e11d48',
    latestPoint: '#16a34a',
    globeImageUrl: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    bumpImageUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
    backgroundImageUrl: undefined,
  };
}

export type ThemeColors = ReturnType<typeof getThemeColors>;
