import { useEffect, useMemo, useRef, useState } from 'react';

import { ThemeToggle } from './MapControls';
import { getThemeColors } from './theme';
import { formatTripDateRange, getCountryInfo } from './tripUtils';
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
  const EXPANDED_COUNTRIES_STORAGE_KEY = 'wiml-sidebar-expanded-countries';
  const colors = getThemeColors(theme);
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [hoveredTripId, setHoveredTripId] = useState<number | null>(null);
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});
  const glassBorder = colors.detailBorder;
  const glassBg = colors.panelBg;
  const rowHoverBg = colors.panelHover;
  const rowSelectedBg = colors.panelSelected;
  const rowNowBg = colors.panelNow;

  const regionDisplayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' });
    } catch {
      return null;
    }
  }, []);

  const countryGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        countryName: string;
        code: string | null;
        firstIndex: number;
        lastIndex: number;
        trips: TravelPoint[];
      }
    >();

    travelData.forEach((trip, index) => {
      const info = getCountryInfo(trip.city);
      const fallbackName = info.name || trip.city.split(',')[0] || 'Unknown';
      const countryName = info.code
        ? regionDisplayNames?.of(info.code.toUpperCase()) || fallbackName
        : fallbackName;
      const key = info.code ? `code:${info.code}` : `name:${countryName.toLowerCase()}`;
      const existing = groups.get(key);

      if (existing) {
        existing.trips.push(trip);
        existing.lastIndex = index;
      } else {
        groups.set(key, {
          key,
          countryName,
          code: info.code,
          firstIndex: index,
          lastIndex: index,
          trips: [trip],
        });
      }
    });

    return [...groups.values()].sort((a, b) => b.lastIndex - a.lastIndex);
  }, [regionDisplayNames, travelData]);

  const activeCountryKey = useMemo(() => {
    if (activeId == null) return null;
    const activeTrip = travelData.find(t => t.id === activeId);
    if (!activeTrip) return null;
    const info = getCountryInfo(activeTrip.city);
    const fallbackName = info.name || activeTrip.city.split(',')[0] || 'Unknown';
    const countryName = info.code
      ? regionDisplayNames?.of(info.code.toUpperCase()) || fallbackName
      : fallbackName;
    return info.code ? `code:${info.code}` : `name:${countryName.toLowerCase()}`;
  }, [activeId, regionDisplayNames, travelData]);

  useEffect(() => {
    if (activeId == null) return;
    const targetRow = rowRefs.current[activeId];
    if (!targetRow) return;

    targetRow.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [activeId]);

  useEffect(() => {
    return () => {
      if (scrollIdleTimerRef.current) {
        clearTimeout(scrollIdleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeCountryKey) return;
    setExpandedCountries(prev => (prev[activeCountryKey] ? prev : { ...prev, [activeCountryKey]: true }));
  }, [activeCountryKey]);

  const handleScrollActivity = () => {
    if (!isScrolling) setIsScrolling(true);
    if (scrollIdleTimerRef.current) {
      clearTimeout(scrollIdleTimerRef.current);
    }
    scrollIdleTimerRef.current = setTimeout(() => {
      setIsScrolling(false);
      scrollIdleTimerRef.current = null;
    }, 150);
  };

  const cityLabel = (city: string) => city.split(',')[0]?.trim() || city;

  const toggleCountry = (countryKey: string) => {
    setExpandedCountries(prev => ({ ...prev, [countryKey]: !prev[countryKey] }));
  };

  const allCountriesExpanded =
    countryGroups.length > 0 && countryGroups.every(group => !!expandedCountries[group.key]);

  const setAllCountriesExpanded = (expanded: boolean) => {
    const nextState: Record<string, boolean> = {};
    countryGroups.forEach(group => {
      nextState[group.key] = expanded;
    });
    setExpandedCountries(nextState);
  };

  const parseDateSafe = (value: string): Date | null => {
    if (!value) return null;
    const safeValue = value.includes('T') ? value : `${value}T00:00:00`;
    const d = new Date(safeValue);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const getTripDurationDays = (trip: TravelPoint): number => {
    const start = parseDateSafe(trip.arrival || trip.departure);
    const end = parseDateSafe(trip.departure || trip.arrival);
    if (!start || !end) return 1;
    const dayMs = 24 * 60 * 60 * 1000;
    const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const days = Math.floor((endUtc - startUtc) / dayMs) + 1;
    return Math.max(1, days);
  };

  useEffect(() => {
    try {
      const storedExpanded = window.localStorage.getItem(EXPANDED_COUNTRIES_STORAGE_KEY);
      if (storedExpanded) {
        const parsed = JSON.parse(storedExpanded) as Record<string, boolean>;
        if (parsed && typeof parsed === 'object') {
          setExpandedCountries(parsed);
        }
      }
    } catch {
      // Ignore storage parse failures and continue with defaults.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(EXPANDED_COUNTRIES_STORAGE_KEY, JSON.stringify(expandedCountries));
    } catch {
      // Ignore storage write failures.
    }
  }, [expandedCountries]);

  return (
    <div
      className="cyber-scrollbar"
      data-theme={theme}
      data-scrolling={isScrolling ? 'true' : 'false'}
      onScroll={handleScrollActivity}
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
          className="cyber-icon-btn"
          data-theme={theme}
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
            color: colors.buttonText,
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M7.8 2.2L4 6l3.8 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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

        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="cyber-expand-toggle"
            data-theme={theme}
            onClick={() => setAllCountriesExpanded(!allCountriesExpanded)}
            disabled={countryGroups.length === 0}
            title={allCountriesExpanded ? 'Collapse all country groups' : 'Expand all country groups'}
            style={{
              cursor: countryGroups.length === 0 ? 'not-allowed' : 'pointer',
              opacity: countryGroups.length === 0 ? 0.45 : 0.95,
            }}
          >
            {allCountriesExpanded ? 'Collapse all countries' : 'Expand all countries'}
          </button>
        </div>
      </div>

      <div
        className="cyber-scrollbar"
        data-theme={theme}
        data-scrolling={isScrolling ? 'true' : 'false'}
        onScroll={handleScrollActivity}
        style={{ flex: 1, overflowY: 'auto' }}
      >
        {countryGroups.length === 0 ? (
          <div style={{ padding: '16px', color: colors.textSoft, fontSize: '13px' }}>No trips in this date range.</div>
        ) : (
          countryGroups.map((group, groupIndex) => {
            const isExpanded = !!expandedCountries[group.key];
            const firstTrip = group.trips[0];
            const lastTrip = group.trips[group.trips.length - 1];
            const latestTrip = group.trips[group.trips.length - 1];
            const arrivalCity = cityLabel(firstTrip.city);
            const departureCity = cityLabel(lastTrip.city);
            const endpointSummary = `Arrive ${arrivalCity} • Depart ${departureCity}`;
            const rangeLabel = formatTripDateRange(firstTrip.arrival, lastTrip.departure, ' - ');
            const totalDays = group.trips.reduce((sum, trip) => sum + getTripDurationDays(trip), 0);
            const flagUrl = group.code ? `https://flagcdn.com/w40/${group.code}.png` : null;
            const isCountryActive = activeCountryKey === group.key;
            const isLatestCountry = groupIndex === 0;
            const countryCardBg = isCountryActive
              ? `linear-gradient(135deg, ${rowSelectedBg}, ${colors.panelSoft})`
              : isLatestCountry
                ? `linear-gradient(135deg, ${rowNowBg}, ${colors.panelSoft})`
                : `linear-gradient(135deg, ${colors.panelBg}, ${colors.panelSoft})`;

            return (
              <div key={group.key} style={{ padding: '8px 10px' }}>
                <div
                  style={{
                    borderRadius: '14px',
                    border: `1px solid ${glassBorder}`,
                    background: countryCardBg,
                    boxShadow: theme === 'dark' ? '0 8px 20px rgba(2,6,23,0.26)' : '0 8px 18px rgba(15,23,42,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: isExpanded ? '12px 12px 12px 16px' : '11px 12px 2px 16px',
                      borderBottom: isExpanded ? `1px solid ${glassBorder}` : 'none',
                      position: 'relative',
                    }}
                  >
                    <button
                      className="cyber-subtle-btn"
                      data-theme={theme}
                      onClick={() => {
                        if (isExpanded) {
                          toggleCountry(group.key);
                          return;
                        }
                        toggleCountry(group.key);
                        onSelect(firstTrip);
                      }}
                      aria-label={`Go to arrival location for ${group.countryName}`}
                      title={`Go to arrival location for ${group.countryName}`}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        background: 'transparent',
                        color: colors.text,
                        textAlign: 'left',
                        cursor: 'pointer',
                        padding: 0,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          minWidth: 0,
                          flex: 1,
                          paddingTop: isExpanded ? '2px' : '1px',
                          paddingBottom: isExpanded ? '2px' : '0px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              minWidth: 0,
                              maxWidth: 'calc(100% - 86px)',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '14px',
                                fontWeight: 800,
                                color: colors.text,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {group.countryName}
                            </span>
                          </div>
                          {flagUrl ? (
                            <img
                              src={flagUrl}
                              alt=""
                              loading="lazy"
                              width={16}
                              height={12}
                              style={{
                                width: '16px',
                                height: '12px',
                                marginLeft: '8px',
                                objectFit: 'cover',
                                borderRadius: '2px',
                                boxShadow: '0 0 4px rgba(0,0,0,0.22)',
                                flexShrink: 0,
                                background: theme === 'dark' ? '#334155' : '#e2e8f0',
                              }}
                            />
                          ) : null}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: colors.textSoft,
                            marginTop: '3px',
                            opacity: 0.9,
                            whiteSpace: 'normal',
                            overflowWrap: 'break-word',
                            lineHeight: 1.25,
                          }}
                        >
                          {endpointSummary}
                        </div>
                        <div style={{ fontSize: '11px', color: colors.textSoft, marginTop: '3px' }}>
                          {rangeLabel} - {totalDays} {totalDays === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                    </button>

                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          color: colors.text,
                          background: theme === 'dark' ? 'rgba(15,23,42,0.58)' : 'rgba(255,255,255,0.78)',
                          border: `1px solid ${glassBorder}`,
                          borderRadius: '999px',
                          padding: '2px 7px',
                          lineHeight: 1.1,
                          flexShrink: 0,
                        }}
                      >
                        {group.trips.length}
                      </span>
                      <button
                        className="cyber-icon-btn"
                        data-theme={theme}
                        onClick={event => {
                          event.stopPropagation();
                          toggleCountry(group.key);
                        }}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? `Collapse ${group.countryName}` : `Expand ${group.countryName}`}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          color: colors.textSoft,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 0.22s ease, background 0.2s ease',
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M2.4 4.2L6 7.8l3.6-3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      margin: 0,
                      border: 'none',
                      borderRadius: 0,
                      background: 'transparent',
                      overflow: 'hidden',
                      display: 'grid',
                      gridTemplateRows: isExpanded ? '1fr' : '0fr',
                      opacity: isExpanded ? 1 : 0,
                      transform: isExpanded ? 'translateY(0)' : 'translateY(-2px)',
                      transition: 'grid-template-rows 0.24s ease, opacity 0.2s ease, transform 0.2s ease',
                      pointerEvents: isExpanded ? 'auto' : 'none',
                    }}
                    aria-hidden={!isExpanded}
                  >
                    <div style={{ minHeight: 0, padding: '8px 8px 10px 8px' }}>
                      {[...group.trips].reverse().map((loc, i) => {
                        const isActive = loc.id === activeId;
                        const isLatest = groupIndex === 0 && i === 0;
                        const tripRangeLabel = formatTripDateRange(loc.arrival, loc.departure, ' - ');

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
                              padding: '10px 12px 10px 18px',
                              marginTop: i === 0 ? 0 : '8px',
                              border: `1px solid ${glassBorder}`,
                              borderRadius: '10px',
                              background: isActive
                                ? `linear-gradient(135deg, ${rowSelectedBg}, ${colors.panelSoft})`
                                : hoveredTripId === loc.id
                                  ? `linear-gradient(135deg, ${rowHoverBg}, ${colors.panelSoft})`
                                  : theme === 'dark'
                                    ? 'rgba(7,14,33,0.5)'
                                    : 'rgba(241,245,249,0.62)',
                              cursor: 'pointer',
                              transition: 'background 0.15s, transform 0.15s ease',
                            }}
                              onMouseEnter={() => {
                                if (!isActive) setHoveredTripId(loc.id);
                              }}
                              onMouseLeave={() => {
                                setHoveredTripId(prev => (prev === loc.id ? null : prev));
                              }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  color: colors.text,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {cityLabel(loc.city)}
                                {isLatest ? (
                                  <span
                                    style={{
                                      marginLeft: '6px',
                                      fontSize: '9px',
                                      background: theme === 'dark' ? '#16a34a' : '#22c55e',
                                      color: '#fff',
                                      borderRadius: '4px',
                                      padding: '1px 4px',
                                      verticalAlign: 'middle',
                                    }}
                                  >
                                    NOW
                                  </span>
                                ) : null}
                              </div>
                              <div style={{ fontSize: '11px', color: colors.textSoft, marginTop: '1px' }}>{tripRangeLabel}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
