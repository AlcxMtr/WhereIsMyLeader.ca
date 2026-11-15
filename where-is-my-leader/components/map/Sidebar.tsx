import { useEffect, useMemo, useRef } from 'react';

import { useExpandedStays } from './hooks/useExpandedStays';
import { useScrollActivity } from './hooks/useScrollActivity';
import styles from './Sidebar.module.css';
import StayCard from './StayCard';
import { groupTripsIntoStays } from './stays';
import type { ThemeMode, TravelPoint } from './types';
import Chevron from './ui/Chevron';
import ThemeToggle from './ui/ThemeToggle';

function getRegionNames(): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    return null;
  }
}

export default function Sidebar({
  subjectName,
  flashLatest = false,
  travelData,
  theme,
  onToggleTheme,
  onSelect,
  activeId,
  onToggleCollapsed,
}: {
  subjectName: string;
  flashLatest?: boolean;
  travelData: TravelPoint[];
  theme: ThemeMode;
  onToggleTheme: () => void;
  onSelect: (trip: TravelPoint) => void;
  activeId: number | null;
  onToggleCollapsed: () => void;
}) {
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const { isScrolling, onScroll } = useScrollActivity();

  const regionNames = useMemo(() => getRegionNames(), []);
  const stayGroups = useMemo(() => groupTripsIntoStays(travelData, regionNames), [regionNames, travelData]);

  const activeStayKey = useMemo(() => {
    if (activeId == null) return null;
    return stayGroups.find(group => group.trips.some(t => t.id === activeId))?.key ?? null;
  }, [activeId, stayGroups]);

  const stays = useExpandedStays(stayGroups, activeStayKey);

  useEffect(() => {
    if (activeId == null) return;
    rowRefs.current[activeId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeId]);

  const hasStays = stayGroups.length > 0;

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.name}>{subjectName}</div>
            <div className={styles.subtitle}>Travel Log</div>
          </div>
          <div className={styles.controls}>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button
              className={`cyber-icon-btn ${styles.hideButton}`}
              data-theme={theme}
              onClick={onToggleCollapsed}
              aria-label="Hide sidebar"
              title="Hide sidebar"
            >
              <Chevron rotation={90} />
            </button>
          </div>
        </div>

        <div className={styles.expandRow}>
          <button
            className={`cyber-expand-toggle ${styles.expandAll}`}
            data-theme={theme}
            onClick={() => stays.setAll(!stays.allExpanded)}
            disabled={!hasStays}
            title={stays.allExpanded ? 'Collapse all stays' : 'Expand all stays'}
          >
            {stays.allExpanded ? 'Collapse all stays' : 'Expand all stays'}
          </button>
        </div>
      </div>

      <div
        className={`cyber-scrollbar ${styles.list}`}
        data-theme={theme}
        data-scrolling={isScrolling ? 'true' : 'false'}
        onScroll={onScroll}
      >
        {hasStays ? (
          stayGroups.map((group, groupIndex) => (
            <StayCard
              key={group.key}
              group={group}
              theme={theme}
              isExpanded={stays.isExpanded(group.key)}
              isActive={activeStayKey === group.key}
              isLatest={groupIndex === 0}
              flash={groupIndex === 0 && flashLatest}
              activeId={activeId}
              onToggle={() => stays.toggle(group.key)}
              onSelect={onSelect}
              rowRef={(id, el) => {
                rowRefs.current[id] = el;
              }}
            />
          ))
        ) : (
          <div className={styles.empty}>No trips in this date range.</div>
        )}
      </div>
    </div>
  );
}
