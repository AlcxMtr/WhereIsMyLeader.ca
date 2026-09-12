'use client';

import { useEffect, useMemo, useState } from 'react';

import GlobeMap from './map/GlobeMap';
import Sidebar from './map/Sidebar';
import { getThemeColors } from './map/theme';
import { formatDateKey, parseDate, tripOverlapsRange } from './map/tripUtils';
import type { SelectionState, ThemeMode, TravelPoint } from './map/types';

export default function Map() {
  const [allTravelData, setAllTravelData] = useState<TravelPoint[]>([]);
  const [selection, setSelection] = useState<SelectionState>(null);
  const [activeDetail, setActiveDetail] = useState<TravelPoint | null>(null);
  const [activeSidebarId, setActiveSidebarId] = useState<number | null>(null);
  const [timelineFromDate, setTimelineFromDate] = useState('');
  const [timelineToDate, setTimelineToDate] = useState('');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

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
      }
    };

    loadMapData();
  }, []);

  const timelineBounds = useMemo(() => {
    if (!allTravelData.length) return null;

    let min: Date | null = null;
    let max: Date | null = null;

    allTravelData.forEach(trip => {
      const arrival = parseDate(trip.arrival);
      const departure = parseDate(trip.departure);
      const start = arrival ?? departure;
      const end = departure ?? arrival;

      if (start && (!min || start < min)) min = start;
      if (end && (!max || end > max)) max = end;
    });

    if (!min || !max) return null;

    return {
      minDate: formatDateKey(min),
      maxDate: formatDateKey(max),
    };
  }, [allTravelData]);

  const rawTimelineFromDate = timelineFromDate || timelineBounds?.minDate || '';
  const rawTimelineToDate = timelineToDate || timelineBounds?.maxDate || '';
  // Defensive normalization: the more recent date must always land on the "to" side.
  const timelineInverted = rawTimelineFromDate > rawTimelineToDate;
  const effectiveTimelineFromDate = timelineInverted ? rawTimelineToDate : rawTimelineFromDate;
  const effectiveTimelineToDate = timelineInverted ? rawTimelineFromDate : rawTimelineToDate;

  const filteredTravelData = useMemo(() => {
    if (!effectiveTimelineFromDate && !effectiveTimelineToDate) return allTravelData;
    return allTravelData.filter(trip => tripOverlapsRange(trip, effectiveTimelineFromDate, effectiveTimelineToDate));
  }, [allTravelData, effectiveTimelineFromDate, effectiveTimelineToDate]);

  const visibleSelection = useMemo(() => {
    if (!selection?.trip) return null;
    return filteredTravelData.some(t => t.id === selection.trip.id) ? selection : null;
  }, [filteredTravelData, selection]);

  const visibleActiveDetail = useMemo(() => {
    if (!activeDetail) return null;
    return filteredTravelData.some(t => t.id === activeDetail.id) ? activeDetail : null;
  }, [activeDetail, filteredTravelData]);

  const sidebarActiveId = useMemo(() => {
    if (visibleActiveDetail) return visibleActiveDetail.id;
    if (activeSidebarId == null) return null;
    return filteredTravelData.some(t => t.id === activeSidebarId) ? activeSidebarId : null;
  }, [activeSidebarId, filteredTravelData, visibleActiveDetail]);

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
        Loading Mark Carney&apos;s travel globe...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', background: colors.pageBg }}>
      {sidebarVisible && welcomeDismissed ? (
        <Sidebar
          travelData={filteredTravelData}
          theme={theme}
          setTheme={setTheme}
          activeId={sidebarActiveId}
          onToggleCollapsed={() => setSidebarVisible(false)}
          onSelect={trip => {
            setActiveSidebarId(trip.id);
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
          allTravelData={allTravelData}
          theme={theme}
          selection={visibleSelection}
          sidebarVisible={sidebarVisible}
          welcomeDismissed={welcomeDismissed}
          onDismissWelcome={() => setWelcomeDismissed(true)}
          activeDetail={visibleActiveDetail}
          setActiveDetail={setActiveDetail}
          onFlightNavigationStart={trip => setActiveSidebarId(trip.id)}
          timelineFromDate={effectiveTimelineFromDate}
          timelineToDate={effectiveTimelineToDate}
          timelineMinDate={timelineBounds?.minDate || ''}
          timelineMaxDate={timelineBounds?.maxDate || ''}
          onTimelineFromDateChange={setTimelineFromDate}
          onTimelineToDateChange={setTimelineToDate}
        />
      </div>
    </div>
  );
}
