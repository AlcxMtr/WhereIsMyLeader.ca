import { useCallback, useEffect, useRef, useState } from 'react';

import { cityLabel, getCountryInfo } from './places';
import { formatTripDateRange } from './tripUtils';
import { haptic } from './globe/browser';
import styles from './MobileTripStrip.module.css';
import type { ThemeMode, TravelPoint } from './types';
import { cx } from './ui/cx';
import Chevron from './ui/Chevron';
import Flag from './ui/Flag';
import ThemeToggle from './ui/ThemeToggle';


function TripCard({
  trip,
  isActive,
  isNow,
  flash,
  landscape,
  cardRef,
  onSelect,
}: {
  trip: TravelPoint;
  isActive: boolean;
  isNow: boolean;
  flash: boolean;
  landscape: boolean;
  cardRef: (el: HTMLButtonElement | null) => void;
  onSelect: () => void;
}) {
  const { code } = getCountryInfo(trip.city);

  return (
    <button
      ref={cardRef}
      onClick={() => {
        haptic();
        onSelect();
      }}
      className={cx(
        styles.card,
        landscape && styles.cardFullWidth,
        isNow && styles.cardNow,
        isActive && styles.cardActive,
        flash && 'wiml-flashing'
      )}
    >
      <div className={styles.cardTop}>
        {code ? <Flag code={code} width={20} height={14} className={styles.flag} /> : null}
        <span className={styles.city}>{cityLabel(trip.city)}</span>
        {isNow ? <span className={styles.nowBadge}>NOW</span> : null}
      </div>
      <div className={styles.dates}>{formatTripDateRange(trip.arrival, trip.departure)}</div>
    </button>
  );
}

export default function MobileTripStrip({
  travelData,
  theme,
  onToggleTheme,
  activeId,
  onSelect,
  landscape = false,
  subjectName,
  flashLatest = false,
}: {
  travelData: TravelPoint[];
  theme: ThemeMode;
  onToggleTheme: () => void;
  activeId: number | null;
  onSelect: (trip: TravelPoint) => void;
  landscape?: boolean;
  subjectName: string;
  flashLatest?: boolean;
}) {
  const cardRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [open, setOpen] = useState(true);
  const latestId = travelData[travelData.length - 1]?.id ?? null;

  const scrollToCard = useCallback(
    (id: number) => {
      cardRefs.current[id]?.scrollIntoView({
        behavior: 'smooth',
        inline: landscape ? 'nearest' : 'center',
        block: landscape ? 'center' : 'nearest',
      });
    },
    [landscape]
  );

  useEffect(() => {
    const target = activeId ?? latestId;
    if (target != null) scrollToCard(target);
  }, [activeId, latestId, scrollToCard]);

  useEffect(() => {
    if (flashLatest && latestId != null) scrollToCard(latestId);
  }, [flashLatest, latestId, scrollToCard]);


  const cards =
    travelData.length === 0 ? (
      <div className={styles.empty}>No trips in this date range.</div>
    ) : (
      travelData.map(trip => (
        <TripCard
          key={trip.id}
          trip={trip}
          isActive={trip.id === activeId}
          isNow={trip.id === latestId}
          flash={trip.id === latestId && flashLatest}
          landscape={landscape}
          cardRef={el => {
            cardRefs.current[trip.id] = el;
          }}
          onSelect={() => onSelect(trip)}
        />
      ))
    );

  const title = (
    <div className={styles.title}>
      {subjectName} <span className={styles.titleSuffix}>· Travel Log</span>
    </div>
  );

  if (landscape) {
    return (
      <div data-theme={theme} className={cx(styles.side, !open && styles.sideClosed)}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Hide trips' : 'Show trips'}
          aria-expanded={open}
          className={styles.sideHandle}
        >
          <Chevron className={styles.chevron} rotation={open ? 90 : -90} />
        </button>
        <div className={styles.sideHeader}>
          {title}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <div className={cx('cyber-scrollbar', styles.sideList)} data-theme={theme}>
          {cards}
        </div>
      </div>
    );
  }

  return (
    <div data-theme={theme} className={styles.bottom}>
      <div className={styles.bottomHeader}>
        {title}
        <div className={styles.bottomControls}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Hide trips' : 'Show trips'}
            aria-expanded={open}
            className={styles.bottomToggle}
          >
            <Chevron className={styles.chevron} rotation={open ? 0 : 180} />
          </button>
        </div>
      </div>

      <div className={cx(styles.collapsible, open && styles.collapsibleOpen)}>
        <div className={styles.collapsibleInner}>
          <div className={cx('cyber-scrollbar', styles.strip)} data-theme={theme}>
            {cards}
          </div>
        </div>
      </div>
    </div>
  );
}
