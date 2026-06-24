import { useEffect, useRef } from 'react';

import { ThemeToggle } from './MapControls';
import { getThemeColors } from './theme';
import { formatDateLabel, getCountryInfo } from './tripUtils';
import type { ThemeMode, TravelPoint } from './types';

export default function Sidebar({
  travelData,
  theme,
  setTheme,
  onSelect,
  activeId,
  onToggleCollapsed,
}: {
  travelData: TravelPoint[];
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  onSelect: (loc: TravelPoint) => void;
  activeId: number | null;
  onToggleCollapsed: () => void;
}) {
  const colors = getThemeColors(theme);
  const sorted = [...travelData].reverse();
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const glassBorder = theme === 'dark' ? 'rgba(148,163,184,0.14)' : 'rgba(148,163,184,0.22)';
  const glassBg = theme === 'dark' ? 'rgba(2, 6, 23, 0.14)' : 'rgba(255, 255, 255, 0.24)';
  const cardBg = theme === 'dark' ? 'rgba(2, 6, 23, 0.14)' : 'rgba(255, 255, 255, 0.24)';
  const rowHoverBg = theme === 'dark' ? 'rgba(30, 64, 175, 0.16)' : 'rgba(59, 130, 246, 0.1)';
  const rowSelectedBg = theme === 'dark' ? 'rgba(30, 64, 175, 0.22)' : 'rgba(37, 99, 235, 0.16)';
  const rowNowBg = theme === 'dark' ? 'rgba(22, 101, 52, 0.32)' : 'rgba(34, 197, 94, 0.18)';

  useEffect(() => {
    if (activeId == null) return;
    const targetRow = rowRefs.current[activeId];
    if (!targetRow) return;

    targetRow.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [activeId]);

  return (
    <div
      style={{
        width: '300px',
        minWidth: '300px',
        height: '100vh',
        overflowY: 'auto',
        background: glassBg,
        borderRight: `1px solid ${glassBorder}`,
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
      }}
    >
      <div style={{ padding: '16px', borderBottom: `1px solid ${glassBorder}`, position: 'relative' }}>
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
            border: `1px solid ${theme === 'dark' ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.42)'}`,
            background: 'transparent',
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
            background: cardBg,
            border: `1px solid ${glassBorder}`,
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>Timeline</div>
          <div style={{ fontSize: '11px', color: colors.textSoft, marginTop: '2px' }}>
            Use the top range controls on the globe to drag both From and To dates
          </div>
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
                ref={el => {
                  rowRefs.current[loc.id] = el;
                }}
                onClick={() => onSelect(loc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  borderBottom: `1px solid ${glassBorder}`,
                  background: isActive ? rowSelectedBg : isLatest ? rowNowBg : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = rowHoverBg;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = isActive
                    ? rowSelectedBg
                    : isLatest
                      ? rowNowBg
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
