import { useEffect, useRef, useState } from 'react';

import { ThemeToggle } from './MapControls';
import { haptic } from './globeUtils';
import { getThemeColors } from './theme';
import { formatTripDateRange, getCountryInfo } from './tripUtils';
import type { ThemeMode, TravelPoint } from './types';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

export default function MobileTripStrip({
  travelData,
  theme,
  setTheme,
  activeId,
  onSelect,
  landscape = false,
  subjectName = 'Mark Carney',
  flashLatest = false,
}: {
  travelData: TravelPoint[];
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  activeId: number | null;
  onSelect: (trip: TravelPoint) => void;
  landscape?: boolean;
  subjectName?: string;
  flashLatest?: boolean;
}) {
  const colors = getThemeColors(theme);
  const cardRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [open, setOpen] = useState(true);
  const trips = travelData;
  const latestId = trips[trips.length - 1]?.id ?? null;

  useEffect(() => {
    const target = activeId ?? latestId;
    if (target == null) return;
    cardRefs.current[target]?.scrollIntoView({
      behavior: 'smooth',
      inline: landscape ? 'nearest' : 'center',
      block: landscape ? 'center' : 'nearest',
    });
  }, [activeId, latestId, landscape]);

  useEffect(() => {
    if (!flashLatest || latestId == null) return;
    cardRefs.current[latestId]?.scrollIntoView({
      behavior: 'smooth',
      inline: landscape ? 'nearest' : 'center',
      block: landscape ? 'center' : 'nearest',
    });
  }, [flashLatest, latestId, landscape]);

  const chevron = (rotation: number) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      style={{ transition: `transform 0.35s ${EASE}`, transform: `rotate(${rotation}deg)` }}
    >
      <path d="M2.2 4.2L6 8l3.8-3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const cards = trips.length === 0 ? (
    <div style={{ color: colors.textSoft, fontSize: '13px', padding: '8px 0' }}>No trips in this date range.</div>
  ) : (
    trips.map(trip => {
      const info = getCountryInfo(trip.city);
      const isActive = trip.id === activeId;
      const isNow = trip.id === latestId;
      return (
        <button
          key={trip.id}
          ref={el => {
            cardRefs.current[trip.id] = el;
          }}
          onClick={() => {
            haptic();
            onSelect(trip);
          }}
          style={{
            flex: '0 0 auto',
            width: landscape ? '100%' : '150px',
            minHeight: '56px',
            textAlign: 'left',
            scrollSnapAlign: 'center',
            padding: '10px 12px',
            borderRadius: '14px',
            cursor: 'pointer',
            color: colors.detailText,
            border: `1px solid ${isActive ? colors.detailText : colors.detailBorder}`,
            background: isActive
              ? `linear-gradient(135deg, ${colors.panelSelected}, ${colors.panelSoft})`
              : isNow
                ? `linear-gradient(135deg, ${colors.panelNow}, ${colors.panelSoft})`
                : colors.panelSoft,
            ...(isNow && flashLatest ? { animation: 'wiml-flash 2.6s ease-in-out infinite' } : {}),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {info.code ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://flagcdn.com/w40/${info.code}.png`}
                alt=""
                width={20}
                height={14}
                style={{ borderRadius: '2px', flexShrink: 0 }}
              />
            ) : null}
            <span
              style={{
                fontWeight: 800,
                fontSize: '13px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {trip.city.split(',')[0]?.trim() || trip.city}
            </span>
            {isNow ? (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '5px',
                  background: '#4ca64c',
                  color: '#fff',
                }}
              >
                NOW
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: '11px', color: colors.detailSub, marginTop: '4px' }}>
            {formatTripDateRange(trip.arrival, trip.departure, ' - ')}
          </div>
        </button>
      );
    })
  );

  const title = (
    <div style={{ fontWeight: 800, fontSize: '13px', color: colors.text }}>
      {subjectName} <span style={{ fontWeight: 500, color: colors.textSoft }}>· Travel Log</span>
    </div>
  );

  if (landscape) {
    return (
      <div
        data-theme={theme}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: 'min(240px, 38vw)',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          background: colors.panelBg,
          borderRight: `1px solid ${colors.detailBorder}`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          paddingLeft: 'env(safe-area-inset-left)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: `transform 0.35s ${EASE}`,
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Hide trips' : 'Show trips'}
          aria-expanded={open}
          style={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            marginTop: '-28px',
            width: '30px',
            height: '56px',
            borderRadius: '0 12px 12px 0',
            border: `1px solid ${colors.detailBorder}`,
            borderLeft: 'none',
            background: colors.panelBg,
            color: colors.detailText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          {chevron(open ? 90 : -90)}
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '10px 12px 6px',
          }}
        >
          {title}
          <ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        </div>
        <div
          className="cyber-scrollbar"
          data-theme={theme}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '6px 10px calc(12px + env(safe-area-inset-bottom))',
          }}
        >
          {cards}
        </div>
      </div>
    );
  }

  return (
    <div
      data-theme={theme}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        background: colors.panelBg,
        borderTop: `1px solid ${colors.detailBorder}`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        touchAction: 'pan-x',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px 2px',
        }}
      >
        {title}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Hide trips' : 'Show trips'}
            aria-expanded={open}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              border: `1px solid ${colors.detailBorder}`,
              background: 'transparent',
              color: colors.detailText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {chevron(open ? 0 : 180)}
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          opacity: open ? 1 : 0,
          transition: `grid-template-rows 0.35s ${EASE}, opacity 0.25s ease`,
        }}
      >
        <div style={{ minHeight: 0, overflow: 'hidden' }}>
          <div
            className="cyber-scrollbar"
            data-theme={theme}
            style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              overflowY: 'hidden',
              padding: '8px 14px 12px',
              scrollSnapType: 'x proximity',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {cards}
          </div>
        </div>
      </div>
    </div>
  );
}
