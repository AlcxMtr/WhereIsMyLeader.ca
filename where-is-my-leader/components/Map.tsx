'use client';

import { useEffect, useMemo, useState } from 'react';

import GlobeMap from './map/GlobeMap';
import Sidebar from './map/Sidebar';
import { getThemeColors } from './map/theme';
import { parseDate, tripOverlapsRange } from './map/tripUtils';
import type { SelectionState, ThemeMode, TravelPoint } from './map/types';

export default function Map() {
  const [allTravelData, setAllTravelData] = useState<TravelPoint[]>([]);
  const [selection, setSelection] = useState<SelectionState>(null);
  const [activeDetail, setActiveDetail] = useState<TravelPoint | null>(null);
  const [timelineFromDate, setTimelineFromDate] = useState('');
  const [timelineToDate, setTimelineToDate] = useState('');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [sidebarVisible, setSidebarVisible] = useState(true);

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

    const format = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    return {
      minDate: format(min),
      maxDate: format(max),
    };
  }, [allTravelData]);

  useEffect(() => {
    if (!timelineBounds) return;
    if (!timelineFromDate) setTimelineFromDate(timelineBounds.minDate);
    if (!timelineToDate) setTimelineToDate(timelineBounds.maxDate);
  }, [timelineBounds, timelineFromDate, timelineToDate]);

  const filteredTravelData = useMemo(() => {
    if (!timelineFromDate && !timelineToDate) return allTravelData;
    return allTravelData.filter(trip => tripOverlapsRange(trip, timelineFromDate, timelineToDate));
  }, [allTravelData, timelineFromDate, timelineToDate]);

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
        Loading Mark Carney&apos;s travel globe...
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
          activeId={activeDetail?.id ?? selection?.trip.id ?? null}
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
          activeDetail={activeDetail}
          setActiveDetail={setActiveDetail}
          timelineFromDate={timelineFromDate || timelineBounds?.minDate || ''}
          timelineToDate={timelineToDate || timelineBounds?.maxDate || ''}
          timelineMinDate={timelineBounds?.minDate || ''}
          timelineMaxDate={timelineBounds?.maxDate || ''}
          onTimelineFromDateChange={setTimelineFromDate}
          onTimelineToDateChange={setTimelineToDate}
        />
      </div>
    </div>
  );
}
