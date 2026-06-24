'use client';

import { useEffect, useMemo, useState } from 'react';

import GlobeMap from './map/GlobeMap';
import Sidebar from './map/Sidebar';
import { getThemeColors } from './map/theme';
import { tripOverlapsRange } from './map/tripUtils';
import type { SelectionState, ThemeMode, TravelPoint } from './map/types';

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
          filterEnabled={filterEnabled}
          setFilterEnabled={setFilterEnabled}
          filterFrom={filterFrom}
          setFilterFrom={setFilterFrom}
          filterTo={filterTo}
          setFilterTo={setFilterTo}
          activeId={selection?.trip.id ?? activeDetail?.id ?? null}
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
        />
      </div>
    </div>
  );
}
