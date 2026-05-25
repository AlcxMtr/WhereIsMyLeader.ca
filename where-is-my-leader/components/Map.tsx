/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

interface TravelPoint {
  id: number;
  city: string;
  coords: [number, number];
  desc: string;
  arrival: string;
  departure: string;
}

interface PointDatum {
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

interface ArcDatum {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}

interface HtmlDetailDatum {
  lat: number;
  lng: number;
  trip: TravelPoint;
}

type ThemeMode = 'light' | 'dark';

type SelectionState = {
  trip: TravelPoint;
  key: number;
} | null;

type GlobeHandle = {
  pointOfView: (coords: { lat?: number; lng?: number; altitude?: number }, ms?: number) => void;
  controls: () => {
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    enablePan?: boolean;
    enableZoom?: boolean;
    minDistance?: number;
    maxDistance?: number;
  };
};

const countryNameToCode: Record<string, string> = {
  Canada: 'ca',
  China: 'cn',
  Qatar: 'qa',
  Switzerland: 'ch',
  India: 'in',
  Australia: 'au',
  Japan: 'jp',
  Norway: 'no',
  'United Kingdom': 'gb',
  UK: 'gb',
  Britain: 'gb',
  England: 'gb',
  Scotland: 'gb',
  Wales: 'gb',
  'United States': 'us',
  USA: 'us',
  'United States of America': 'us',
  America: 'us',
  France: 'fr',
  Germany: 'de',
  Italy: 'it',
  Spain: 'es',
  Portugal: 'pt',
  Netherlands: 'nl',
  Belgium: 'be',
  Luxembourg: 'lu',
  Austria: 'at',
  Ireland: 'ie',
  Denmark: 'dk',
  Sweden: 'se',
  Finland: 'fi',
  Iceland: 'is',
  Poland: 'pl',
  Ukraine: 'ua',
  Armenia: 'am',
  Հայաստան: 'am',
  Turkey: 'tr',
  Türkiye: 'tr',
  Greece: 'gr',
  Cyprus: 'cy',
  Israel: 'il',
  Palestine: 'ps',
  Jordan: 'jo',
  Egypt: 'eg',
  'Saudi Arabia': 'sa',
  'United Arab Emirates': 'ae',
  UAE: 'ae',
  Kuwait: 'kw',
  Bahrain: 'bh',
  Oman: 'om',
  Lebanon: 'lb',
  Iraq: 'iq',
  Iran: 'ir',
  Pakistan: 'pk',
  Bangladesh: 'bd',
  Nepal: 'np',
  Bhutan: 'bt',
  'Sri Lanka': 'lk',
  Thailand: 'th',
  Vietnam: 'vn',
  Singapore: 'sg',
  Malaysia: 'my',
  Indonesia: 'id',
  Philippines: 'ph',
  'South Korea': 'kr',
  Korea: 'kr',
  'North Korea': 'kp',
  Taiwan: 'tw',
  'Hong Kong': 'hk',
  Mongolia: 'mn',
  Kazakhstan: 'kz',
  Uzbekistan: 'uz',
  Kyrgyzstan: 'kg',
  Tajikistan: 'tj',
  Turkmenistan: 'tm',
  Georgia: 'ge',
  Azerbaijan: 'az',
  Kosovo: 'xk',
  Albania: 'al',
  Serbia: 'rs',
  Croatia: 'hr',
  Slovenia: 'si',
  'Bosnia and Herzegovina': 'ba',
  Montenegro: 'me',
  Macedonia: 'mk',
  'North Macedonia': 'mk',
  Romania: 'ro',
  Bulgaria: 'bg',
  Hungary: 'hu',
  Czechia: 'cz',
  'Czech Republic': 'cz',
  Slovakia: 'sk',
  Estonia: 'ee',
  Latvia: 'lv',
  Lithuania: 'lt',
  Moldova: 'md',
  Belarus: 'by',
  Russia: 'ru',
  Morocco: 'ma',
  Algeria: 'dz',
  Tunisia: 'tn',
  Libya: 'ly',
  Sudan: 'sd',
  Ethiopia: 'et',
  Kenya: 'ke',
  Tanzania: 'tz',
  Uganda: 'ug',
  Rwanda: 'rw',
  Nigeria: 'ng',
  Ghana: 'gh',
  Senegal: 'sn',
  'South Africa': 'za',
  Mexico: 'mx',
  Brazil: 'br',
  Argentina: 'ar',
  Chile: 'cl',
  Peru: 'pe',
  Colombia: 'co',
  Ecuador: 'ec',
  Uruguay: 'uy',
  Paraguay: 'py',
  Bolivia: 'bo',
  Venezuela: 've',
  'New Zealand': 'nz',
  Fiji: 'fj',
  'Vatican City': 'va',
  'Holy See': 'va',
};

const cityNameToCode: Record<string, string> = {
  Ottawa: 'ca',
  Toronto: 'ca',
  Vancouver: 'ca',
  Calgary: 'ca',
  Montreal: 'ca',
  Quebec: 'ca',
  Edmonton: 'ca',
  Winnipeg: 'ca',
  Halifax: 'ca',
  Yerevan: 'am',
  Geneva: 'ch',
  Zurich: 'ch',
  Bern: 'ch',
  Doha: 'qa',
  Beijing: 'cn',
  Shanghai: 'cn',
  Tokyo: 'jp',
  Oslo: 'no',
  London: 'gb',
  Delhi: 'in',
  Mumbai: 'in',
  Sydney: 'au',
  Melbourne: 'au',
  Rome: 'it',
  'Vatican City': 'va',
};

function normalizePlaceName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[().]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getCountryInfo(city: string): { name: string | null; code: string | null } {
  const parts = city.split(',').map(part => part.trim()).filter(Boolean);
  const cityPart = parts[0] ?? '';
  const rawCountry = parts[parts.length - 1] ?? '';

  const normalizedCountry = normalizePlaceName(rawCountry);
  const normalizedCity = normalizePlaceName(cityPart);

  let code =
    countryNameToCode[rawCountry] ??
    cityNameToCode[cityPart] ??
    null;

  if (!code && normalizedCountry) {
    const matchedCountry = Object.entries(countryNameToCode).find(
      ([name]) => normalizePlaceName(name) === normalizedCountry
    );
    if (matchedCountry) code = matchedCountry[1];
  }

  if (!code && normalizedCity) {
    const matchedCity = Object.entries(cityNameToCode).find(
      ([name]) => normalizePlaceName(name) === normalizedCity
    );
    if (matchedCity) code = matchedCity[1];
  }

  return {
    name: rawCountry || cityPart || null,
    code,
  };
}

function parseDateSafe(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(value: string): Date | null {
  const d = parseDateSafe(value);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(value: string): Date | null {
  const d = parseDateSafe(value);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function tripOverlapsRange(trip: TravelPoint, fromDate: string, toDate: string): boolean {
  const tripStart = startOfDay(trip.arrival || trip.departure);
  const tripEnd = endOfDay(trip.departure || trip.arrival);

  if (!tripStart || !tripEnd) return true;

  const from = fromDate ? startOfDay(fromDate) : null;
  const to = toDate ? endOfDay(toDate) : null;

  if (from && tripEnd < from) return false;
  if (to && tripStart > to) return false;

  return true;
}

function sleep(ms: number) {
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

function getDistanceBasedMidAltitude(from: [number, number], to: [number, number]) {
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

function buildGreatCirclePath(from: [number, number], to: [number, number], steps = 72) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const ease = 0.5 - Math.cos(Math.PI * t) / 2;
    return slerpLatLng(from, to, ease);
  });
}

function getPastGradientColor(index: number, total: number, theme: ThemeMode): string {
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

function getThemeColors(theme: ThemeMode) {
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

function ThemeToggle({
  theme,
  onToggle,
  colors,
}: {
  theme: ThemeMode;
  onToggle: () => void;
  colors: ReturnType<typeof getThemeColors>;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        border: `1px solid ${colors.inputBorder}`,
        background: colors.buttonBg,
        color: colors.buttonText,
        borderRadius: '10px',
        padding: '8px 10px',
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}

function FilterToggle({
  enabled,
  onToggle,
  colors,
}: {
  enabled: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof getThemeColors>;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '999px',
        border: 'none',
        background: enabled ? colors.toggleOn : colors.toggleOff,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        flexShrink: 0,
      }}
      aria-label="Toggle date filter"
      title="Toggle date filter"
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: enabled ? '23px' : '3px',
          width: '18px',
          height: '18px',
          borderRadius: '999px',
          background: '#ffffff',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        }}
      />
    </button>
  );
}

function Sidebar({
  travelData,
  theme,
  setTheme,
  filterEnabled,
  setFilterEnabled,
  filterFrom,
  setFilterFrom,
  filterTo,
  setFilterTo,
  onSelect,
  activeId,
  isCollapsed,
  onToggleCollapsed,
}: {
  travelData: TravelPoint[];
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  filterEnabled: boolean;
  setFilterEnabled: (value: boolean) => void;
  filterFrom: string;
  setFilterFrom: (value: string) => void;
  filterTo: string;
  setFilterTo: (value: string) => void;
  onSelect: (loc: TravelPoint) => void;
  activeId: number | null;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const colors = getThemeColors(theme);
  const sorted = [...travelData].reverse();

  return (
    <div
      style={{
        width: '300px',
        minWidth: '300px',
        height: '100vh',
        overflowY: 'auto',
        background: colors.panelBg,
        borderRight: `1px solid ${colors.panelBorder}`,
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
      }}
    >
      <div style={{ padding: '16px', borderBottom: `1px solid ${colors.panelBorder}`, position: 'relative' }}>
        <button
          onClick={onToggleCollapsed}
          aria-label="Hide sidebar"
          title="Hide sidebar"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            border: `1px solid ${colors.inputBorder}`,
            background: colors.buttonBg,
            color: colors.buttonText,
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', paddingRight: '48px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: colors.text }}>Mark Carney</div>
            <div style={{ fontSize: '12px', color: colors.textSoft, marginTop: '2px' }}>Travel Log</div>
          </div>
          <ThemeToggle
            theme={theme}
            onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            colors={colors}
          />
        </div>

        <div
          style={{
            marginTop: '14px',
            padding: '12px',
            borderRadius: '14px',
            background: colors.panelSoft,
            border: `1px solid ${colors.panelBorder}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>Date filter</div>
              <div style={{ fontSize: '11px', color: colors.textSoft, marginTop: '2px' }}>
                Show only trips in a selected range
              </div>
            </div>
            <FilterToggle
              enabled={filterEnabled}
              onToggle={() => setFilterEnabled(!filterEnabled)}
              colors={colors}
            />
          </div>

          {filterEnabled ? (
            <div style={{ marginTop: '12px', display: 'grid', gap: '10px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: colors.textSoft,
                    marginBottom: '4px',
                  }}
                >
                  From
                </label>
                <input
                  type="date"
                  value={filterFrom}
                  onChange={e => setFilterFrom(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    border: `1px solid ${colors.inputBorder}`,
                    background: colors.inputBg,
                    color: colors.text,
                    padding: '9px 10px',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: colors.textSoft,
                    marginBottom: '4px',
                  }}
                >
                  To
                </label>
                <input
                  type="date"
                  value={filterTo}
                  onChange={e => setFilterTo(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    border: `1px solid ${colors.inputBorder}`,
                    background: colors.inputBg,
                    color: colors.text,
                    padding: '9px 10px',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                onClick={() => {
                  setFilterFrom('');
                  setFilterTo('');
                }}
                style={{
                  marginTop: '2px',
                  border: `1px solid ${colors.inputBorder}`,
                  background: colors.buttonBg,
                  color: colors.buttonText,
                  borderRadius: '10px',
                  padding: '8px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Clear dates
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '16px', color: colors.textSoft, fontSize: '13px' }}>No trips in this date range.</div>
        ) : (
          sorted.map((loc, i) => {
            const { code } = getCountryInfo(loc.city);
            const flagUrl = code ? `https://flagcdn.com/w40/${code}.png` : null;
            const isLatest = i === 0;
            const isActive = loc.id === activeId;
            const arrivalLabel = formatDateLabel(loc.arrival);
            const departureLabel = formatDateLabel(loc.departure);
            const rangeLabel =
              arrivalLabel && departureLabel ? `${arrivalLabel} – ${departureLabel}` : arrivalLabel || departureLabel;

            return (
              <div
                key={loc.id}
                onClick={() => onSelect(loc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  borderBottom: `1px solid ${colors.panelBorder}`,
                  background: isActive ? colors.panelSelected : isLatest ? colors.panelNow : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = colors.panelHover;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = isActive
                    ? colors.panelSelected
                    : isLatest
                      ? colors.panelNow
                      : 'transparent';
                }}
              >
                {flagUrl ? (
                  <img
                    src={flagUrl}
                    alt=""
                    loading="lazy"
                    width={28}
                    height={19}
                    style={{
                      width: '28px',
                      height: '19px',
                      objectFit: 'cover',
                      borderRadius: '3px',
                      boxShadow: '0 0 3px rgba(0,0,0,0.2)',
                      flexShrink: 0,
                      background: theme === 'dark' ? '#334155' : '#e2e8f0',
                    }}
                    onError={e => {
                      const img = e.currentTarget;
                      img.style.display = 'none';
                      const fallback = img.nextElementSibling as HTMLDivElement | null;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                ) : null}

                <div
                  style={{
                    width: '28px',
                    height: '19px',
                    background: theme === 'dark' ? '#334155' : '#e2e8f0',
                    borderRadius: '3px',
                    flexShrink: 0,
                    display: flagUrl ? 'none' : 'block',
                  }}
                />

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: colors.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {loc.city.split(',')[0]}
                    {isLatest ? (
                      <span
                        style={{
                          marginLeft: '6px',
                          fontSize: '10px',
                          background: theme === 'dark' ? '#16a34a' : '#22c55e',
                          color: '#fff',
                          borderRadius: '4px',
                          padding: '1px 5px',
                          verticalAlign: 'middle',
                        }}
                      >
                        NOW
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.textSoft, marginTop: '1px' }}>{rangeLabel}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function GlobeMap({
  travelData,
  theme,
  selection,
  onSelect,
  activeDetail,
  setActiveDetail,
  sidebarVisible,
}: {
  travelData: TravelPoint[];
  theme: ThemeMode;
  selection: SelectionState;
  onSelect: (trip: TravelPoint) => void;
  activeDetail: TravelPoint | null;
  setActiveDetail: (trip: TravelPoint | null) => void;
  sidebarVisible: boolean;
}) {
  const colors = getThemeColors(theme);
  const globeRef = useRef<GlobeHandle | null>(null);
  const animationTokenRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });

  useEffect(() => {
    const updateSize = () => {
      const sidebarWidth = sidebarVisible ? 300 : 0;
      setDimensions({
        width: Math.max(window.innerWidth - sidebarWidth, 320),
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [sidebarVisible]);

  const pointsData = useMemo<PointDatum[]>(() => {
    return travelData.map((loc, index) => ({
      id: loc.id,
      lat: loc.coords[0],
      lng: loc.coords[1],
      city: loc.city,
      desc: loc.desc,
      arrival: loc.arrival,
      departure: loc.departure,
      isLatest: index === travelData.length - 1,
      color: index === travelData.length - 1 ? colors.latestPoint : colors.point,
    }));
  }, [travelData, colors.latestPoint, colors.point]);

  const pointMap = useMemo(() => {
    const map: globalThis.Map<number, TravelPoint> = new globalThis.Map<number, TravelPoint>();
    travelData.forEach(trip => map.set(trip.id, trip));
    return map;
  }, [travelData]);

  const arcsData = useMemo<ArcDatum[]>(() => {
    const now = new Date();
    const pastSegments = travelData.slice(1).filter(tp => new Date(tp.arrival) <= now).length;
    let seenPast = 0;

    return travelData
      .map((loc, i) => {
        if (i === 0) return null;

        const prev = travelData[i - 1];
        const isFuture = new Date(loc.arrival) > now;

        let color = colors.futureArc;
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
  }, [travelData, colors.futureArc, theme]);

  const detailHtmlData = useMemo<HtmlDetailDatum[]>(() => {
    if (!activeDetail) return [];
    return [
      {
        lat: activeDetail.coords[0],
        lng: activeDetail.coords[1],
        trip: activeDetail,
      },
    ];
  }, [activeDetail]);

  const renderDetailHtml = useCallback(
    (datum: object) => {
      const item = datum as HtmlDetailDatum;
      const trip = item.trip;
      const { name: countryName, code: countryCode } = getCountryInfo(trip.city);
      const flagUrl = countryCode ? `https://flagcdn.com/w80/${countryCode}.png` : null;
      const arrivalLabel = formatDateLabel(trip.arrival);
      const departureLabel = formatDateLabel(trip.departure);
      const rangeLabel =
        arrivalLabel && departureLabel ? `${arrivalLabel} → ${departureLabel}` : arrivalLabel || departureLabel;

      const wrapper = document.createElement('div');
      wrapper.style.width = '280px';
      wrapper.style.pointerEvents = 'auto';
      wrapper.style.transform = 'translate(18px, -82%)';

      const card = document.createElement('div');
      card.style.background = colors.detailBg;
      card.style.color = colors.detailText;
      card.style.border = `1px solid ${colors.detailBorder}`;
      card.style.borderRadius = '14px';
      card.style.padding = '14px';
      card.style.boxShadow =
        theme === 'dark' ? '0 14px 32px rgba(0,0,0,0.42)' : '0 14px 32px rgba(15,23,42,0.14)';
      card.style.backdropFilter = 'blur(12px)';
      card.style.position = 'relative';

      const closeButton = document.createElement('button');
      closeButton.innerText = '×';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '8px';
      closeButton.style.right = '10px';
      closeButton.style.border = 'none';
      closeButton.style.background = 'transparent';
      closeButton.style.color = colors.detailSub;
      closeButton.style.fontSize = '18px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.lineHeight = '1';
      closeButton.onclick = e => {
        e.stopPropagation();
        setActiveDetail(null);
      };

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.gap = '10px';
      header.style.paddingRight = '22px';

      if (flagUrl) {
        const flag = document.createElement('img');
        flag.src = flagUrl;
        flag.alt = countryName ?? '';
        flag.style.width = '30px';
        flag.style.height = '20px';
        flag.style.borderRadius = '4px';
        flag.style.objectFit = 'cover';
        flag.style.boxShadow = '0 0 4px rgba(0,0,0,0.2)';
        header.appendChild(flag);
      }

      const titleWrap = document.createElement('div');
      titleWrap.style.minWidth = '0';

      const title = document.createElement('div');
      title.innerText = trip.city;
      title.style.fontWeight = '800';
      title.style.fontSize = '14px';
      title.style.lineHeight = '1.35';
      title.style.color = colors.detailText;

      titleWrap.appendChild(title);

      if (rangeLabel) {
        const subtitle = document.createElement('div');
        subtitle.innerText = rangeLabel;
        subtitle.style.fontSize = '12px';
        subtitle.style.marginTop = '2px';
        subtitle.style.color = colors.detailSub;
        titleWrap.appendChild(subtitle);
      }

      header.appendChild(titleWrap);

      const body = document.createElement('div');
      body.innerText = trip.desc;
      body.style.marginTop = '12px';
      body.style.fontSize = '13px';
      body.style.lineHeight = '1.6';
      body.style.color = colors.detailText;

      const stem = document.createElement('div');
      stem.style.position = 'absolute';
      stem.style.left = '18px';
      stem.style.bottom = '-10px';
      stem.style.width = '18px';
      stem.style.height = '18px';
      stem.style.background = colors.detailBg;
      stem.style.borderRight = `1px solid ${colors.detailBorder}`;
      stem.style.borderBottom = `1px solid ${colors.detailBorder}`;
      stem.style.transform = 'rotate(45deg)';

      card.appendChild(closeButton);
      card.appendChild(header);
      card.appendChild(body);
      card.appendChild(stem);
      wrapper.appendChild(card);

      return wrapper;
    },
    [colors.detailBg, colors.detailBorder, colors.detailSub, colors.detailText, setActiveDetail, theme]
  );

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !travelData.length) return;

    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = false;
      controls.enablePan = false;
      controls.enableZoom = true;
      controls.minDistance = 90;
      controls.maxDistance = 520;
    }

    const latest = travelData[travelData.length - 1];
    globe.pointOfView(
      {
        lat: latest.coords[0],
        lng: latest.coords[1],
        altitude: 1.8,
      },
      0
    );
  }, [travelData]);

  const runFocusSequence = useCallback(
    async (target: TravelPoint) => {
      const globe = globeRef.current;
      if (!globe) return;

      const token = animationTokenRef.current + 1;
      animationTokenRef.current = token;

      const isStillCurrent = () => animationTokenRef.current === token;

      setActiveDetail(null);

      const targetIndex = travelData.findIndex(t => t.id === target.id);
      const previous = targetIndex > 0 ? travelData[targetIndex - 1] : null;

      if (!previous) {
        globe.pointOfView(
          {
            lat: target.coords[0],
            lng: target.coords[1],
            altitude: 0.58,
          },
          1200
        );
        await sleep(1250);
        if (!isStillCurrent()) return;
        setActiveDetail(target);
        return;
      }

      const departure = previous.coords;
      const arrival = target.coords;
      const midAltitude = getDistanceBasedMidAltitude(departure, arrival);

      globe.pointOfView(
        {
          lat: departure[0],
          lng: departure[1],
          altitude: 0.58,
        },
        1000
      );
      await sleep(1050);
      if (!isStillCurrent()) return;

      globe.pointOfView(
        {
          lat: departure[0],
          lng: departure[1],
          altitude: midAltitude,
        },
        900
      );
      await sleep(950);
      if (!isStillCurrent()) return;

      const cameraPath = buildGreatCirclePath(departure, arrival, 72);
      const pathDuration = 1850;
      const perStep = Math.max(16, Math.floor(pathDuration / cameraPath.length));

      for (let i = 0; i < cameraPath.length; i += 1) {
        if (!isStillCurrent()) return;
        const node = cameraPath[i];
        globe.pointOfView(
          {
            lat: node.lat,
            lng: node.lng,
            altitude: midAltitude,
          },
          perStep + 10
        );
        await sleep(perStep);
      }

      if (!isStillCurrent()) return;

      globe.pointOfView(
        {
          lat: arrival[0],
          lng: arrival[1],
          altitude: 0.58,
        },
        1100
      );
      await sleep(1150);
      if (!isStillCurrent()) return;

      setActiveDetail(target);
    },
    [setActiveDetail, travelData]
  );

  const runPinFocus = useCallback(
    async (target: TravelPoint) => {
      const globe = globeRef.current;
      if (!globe) return;

      const token = animationTokenRef.current + 1;
      animationTokenRef.current = token;

      const isStillCurrent = () => animationTokenRef.current === token;

      setActiveDetail(null);

      globe.pointOfView(
        {
          lat: target.coords[0],
          lng: target.coords[1],
          altitude: 0.58,
        },
        1000
      );
      await sleep(1050);
      if (!isStillCurrent()) return;

      setActiveDetail(target);
    },
    [setActiveDetail]
  );

  useEffect(() => {
    if (!selection?.trip) return;
    runFocusSequence(selection.trip);
  }, [selection, runFocusSequence]);

  useEffect(() => {
    if (!travelData.length) setActiveDetail(null);
  }, [travelData, setActiveDetail]);

  if (!travelData.length) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: colors.globeBg,
          color: colors.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '15px',
        }}
      >
        No trips found for this date range.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: colors.globeBg }}>
      {!sidebarVisible ? (
        <button
          onClick={() => {
            const event = new CustomEvent('toggle-sidebar');
            window.dispatchEvent(event);
          }}
          style={{
            position: 'absolute',
            top: '18px',
            left: '18px',
            zIndex: 30,
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            border: `1px solid ${colors.detailBorder}`,
            background: colors.detailBg,
            color: colors.detailText,
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 800,
            backdropFilter: 'blur(10px)',
          }}
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          ☰
        </button>
      ) : null}

      <Globe
        ref={globeRef as never}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor={colors.globeBg}
        backgroundImageUrl={colors.backgroundImageUrl}
        globeImageUrl={colors.globeImageUrl}
        bumpImageUrl={colors.bumpImageUrl}
        showAtmosphere
        atmosphereColor={colors.atmosphere}
        atmosphereAltitude={0.18}
        animateIn
        waitForGlobeReady
        rendererConfig={{ antialias: true, alpha: true }}
        arcsData={arcsData}
        arcColor="color"
        arcStroke={0.62}
        arcAltitudeAutoScale={0.28}
        arcDashLength={0.85}
        arcDashGap={0.25}
        arcDashAnimateTime={1800}
        arcsTransitionDuration={600}
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={(d: object) => ((d as PointDatum).isLatest ? 0.18 : 0.13)}
        pointRadius={(d: object) => ((d as PointDatum).isLatest ? 0.28 : 0.2)}
        pointResolution={20}
        pointsMerge={false}
        pointsTransitionDuration={300}
        onPointClick={(datum: object) => {
          const point = datum as PointDatum;
          const trip = pointMap.get(point.id);
          if (trip) runPinFocus(trip);
        }}
        htmlElementsData={detailHtmlData}
        htmlLat={(d: object) => (d as HtmlDetailDatum).lat}
        htmlLng={(d: object) => (d as HtmlDetailDatum).lng}
        htmlElement={renderDetailHtml}
      />

      <div
        style={{
          position: 'absolute',
          right: '18px',
          top: '18px',
          padding: '10px 12px',
          borderRadius: '12px',
          background: colors.detailBg,
          color: colors.detailText,
          fontSize: '12px',
          lineHeight: 1.5,
          border: `1px solid ${colors.detailBorder}`,
          backdropFilter: 'blur(10px)',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: '4px' }}>Globe View</div>
        <div>Drag to rotate</div>
        <div>Scroll to zoom</div>
        <div>Sidebar: flight path animation</div>
        <div>Pin: direct zoom + details</div>
      </div>
    </div>
  );
}

export default function Map() {
  const [allTravelData, setAllTravelData] = useState<TravelPoint[]>([]);
  const [selection, setSelection] = useState<SelectionState>(null);
  const [activeDetail, setActiveDetail] = useState<TravelPoint | null>(null);
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const handleToggleSidebar = () => setSidebarVisible(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggleSidebar as EventListener);
    return () => window.removeEventListener('toggle-sidebar', handleToggleSidebar as EventListener);
  }, []);

  useEffect(() => {
    const loadMapData = async () => {
      try {
        const res = await fetch('/api/trips');
        if (!res.ok) throw new Error(`API returned status ${res.status}`);
        const data: TravelPoint[] = await res.json();
        setAllTravelData(data);
      } catch (apiError) {
        console.warn('API failed, attempting to load static fallback:', apiError);

        try {
          const res = await fetch('/api/trips.json');
          if (!res.ok) throw new Error(`Static JSON returned status ${res.status}`);
          const data: TravelPoint[] = await res.json();
          setAllTravelData(data);
        } catch (staticError) {
          console.error('Critical Error: Both API and Static JSON failed', staticError);
        }
      }
    };

    loadMapData();
  }, []);

  const filteredTravelData = useMemo(() => {
    if (!filterEnabled) return allTravelData;
    return allTravelData.filter(trip => tripOverlapsRange(trip, filterFrom, filterTo));
  }, [allTravelData, filterEnabled, filterFrom, filterTo]);

  useEffect(() => {
    if (!selection?.trip) return;
    const stillVisible = filteredTravelData.some(t => t.id === selection.trip.id);
    if (!stillVisible) {
      setSelection(null);
      setActiveDetail(null);
    }
  }, [filteredTravelData, selection]);

  const colors = getThemeColors(theme);

  if (!allTravelData.length) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: colors.pageBg,
          color: colors.text,
          fontSize: '15px',
        }}
      >
        Loading Mark Carney&apos;s travel globe…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', background: colors.pageBg }}>
      {sidebarVisible ? (
        <Sidebar
          travelData={filteredTravelData}
          theme={theme}
          setTheme={setTheme}
          filterEnabled={filterEnabled}
          setFilterEnabled={setFilterEnabled}
          filterFrom={filterFrom}
          setFilterFrom={setFilterFrom}
          filterTo={filterTo}
          setFilterTo={setFilterTo}
          activeId={selection?.trip.id ?? activeDetail?.id ?? null}
          isCollapsed={!sidebarVisible}
          onToggleCollapsed={() => setSidebarVisible(false)}
          onSelect={trip => {
            setSelection({
              trip,
              key: Date.now() + Math.random(),
            });
          }}
        />
      ) : null}

      <div style={{ flex: 1, position: 'relative' }}>
        <GlobeMap
          travelData={filteredTravelData}
          theme={theme}
          selection={selection}
          sidebarVisible={sidebarVisible}
          onSelect={trip => {
            setSelection({
              trip,
              key: Date.now() + Math.random(),
            });
          }}
          activeDetail={activeDetail}
          setActiveDetail={setActiveDetail}
        />
      </div>
    </div>
  );
}