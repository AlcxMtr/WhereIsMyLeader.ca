'use client';

import { useState } from 'react';

import { resolveSubject } from '@/lib/subjects';

import GlobeMap from './map/GlobeMap';
import { useSeeAllNudge } from './map/hooks/useSeeAllNudge';
import { useTimelineFilter } from './map/hooks/useTimelineFilter';
import { useTrips } from './map/hooks/useTrips';
import { useTripSelection } from './map/hooks/useTripSelection';
import { useViewport } from './map/hooks/useViewport';
import MobileTripStrip from './map/MobileTripStrip';
import Sidebar from './map/Sidebar';
import { getThemeColors, themeCssVars } from './map/theme';
import type { ThemeMode } from './map/types';
import styles from './TravelMap.module.css';

/** The whole experience for one person: loads their trips and wires the globe, sidebar and timeline together. */
export default function TravelMap({ person }: { person?: string | null }) {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  const subject = resolveSubject(person);
  const { trips: allTrips, status } = useTrips(subject.id);
  const { filteredTrips, timeline } = useTimelineFilter(allTrips);
  const selection = useTripSelection(filteredTrips);
  const { isMobile, isLandscape } = useViewport();
  const nudge = useSeeAllNudge(selection.listActiveId != null || selection.activeDetail != null);

  const name = subject.name;
  const themeVars = themeCssVars(getThemeColors(theme));
  const toggleTheme = () => setTheme(current => (current === 'dark' ? 'light' : 'dark'));

  if (status !== 'ready' || !allTrips.length) {
    const message =
      status === 'loading'
        ? `Loading ${name}'s travel globe...`
        : status === 'error'
          ? `Couldn't load ${name}'s travel data.`
          : `No trips found for ${name}.`;
    return (
      <div className={`${styles.root} ${styles.status}`} style={themeVars}>
        {message}
      </div>
    );
  }

  return (
    <div className={styles.root} style={themeVars}>
      {isMobile && welcomeDismissed ? (
        <MobileTripStrip
          landscape={isLandscape}
          flashLatest={nudge.flashLatest}
          subjectName={name}
          travelData={filteredTrips}
          theme={theme}
          onToggleTheme={toggleTheme}
          activeId={selection.listActiveId}
          onSelect={selection.selectFromList}
        />
      ) : null}
      {!isMobile && sidebarVisible && welcomeDismissed ? (
        <Sidebar
          subjectName={name}
          flashLatest={nudge.flashLatest}
          travelData={filteredTrips}
          theme={theme}
          onToggleTheme={toggleTheme}
          activeId={selection.listActiveId}
          onToggleCollapsed={() => setSidebarVisible(false)}
          onSelect={selection.selectFromList}
        />
      ) : null}

      <div className={styles.globePane}>
        <GlobeMap
          isMobile={isMobile}
          subject={subject}
          travelData={filteredTrips}
          allTravelData={allTrips}
          theme={theme}
          selection={selection.selection}
          activeDetail={selection.activeDetail}
          setActiveDetail={selection.setActiveDetail}
          onNavigateStart={selection.markNavigatingTo}
          sidebarVisible={sidebarVisible}
          onShowSidebar={() => setSidebarVisible(true)}
          welcomeDismissed={welcomeDismissed}
          onDismissWelcome={() => setWelcomeDismissed(true)}
          onSeeAllTrips={nudge.arm}
          timeline={timeline}
        />
      </div>
    </div>
  );
}
