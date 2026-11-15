import { cityLabel } from './places';
import { formatTripDateRange } from './tripUtils';
import { getStayDurationDays, type StayGroup } from './stays';
import styles from './Sidebar.module.css';
import TripRow from './TripRow';
import type { ThemeMode, TravelPoint } from './types';
import { cx } from './ui/cx';
import Chevron from './ui/Chevron';
import Flag from './ui/Flag';


/** A collapsible card for one stay (a run of consecutive trips within a country). */
export default function StayCard({
  group,
  theme,
  isExpanded,
  isActive,
  isLatest,
  flash,
  activeId,
  onToggle,
  onSelect,
  rowRef,
}: {
  group: StayGroup;
  theme: ThemeMode;
  isExpanded: boolean;
  isActive: boolean;
  isLatest: boolean;
  flash: boolean;
  activeId: number | null;
  onToggle: () => void;
  onSelect: (trip: TravelPoint) => void;
  rowRef: (id: number, el: HTMLDivElement | null) => void;
}) {
  const firstTrip = group.trips[0];
  const lastTrip = group.trips[group.trips.length - 1];
  const endpointSummary = `Arrive ${cityLabel(firstTrip.city)} • Depart ${cityLabel(lastTrip.city)}`;
  const rangeLabel = formatTripDateRange(firstTrip.arrival, lastTrip.departure);
  const totalDays = getStayDurationDays(group.trips);

  // Collapsing just folds the card; expanding also flies to where the stay began.
  const handleHeadClick = () => {
    onToggle();
    if (!isExpanded) onSelect(firstTrip);
  };

  return (
    <div className={styles.stayWrap}>
      <div
        className={cx(
          styles.stay,
          isLatest && styles.stayLatest,
          isActive && styles.stayActive,
          flash && 'wiml-flashing'
        )}
      >
        <div className={cx(styles.stayHead, isExpanded && styles.stayHeadExpanded)}>
          <button
            className={`cyber-subtle-btn ${styles.stayMain}`}
            data-theme={theme}
            onClick={handleHeadClick}
            aria-label={`Go to arrival location for ${group.countryName}`}
            title={`Go to arrival location for ${group.countryName}`}
          >
            <div className={cx(styles.stayText, isExpanded && styles.stayTextExpanded)}>
              <div className={styles.countryRow}>
                <span className={styles.countryName}>{group.countryName}</span>
                {group.code ? <Flag code={group.code} width={16} height={12} className={styles.flag} /> : null}
              </div>
              <div className={styles.endpoints}>{endpointSummary}</div>
              <div className={styles.dates}>
                {rangeLabel} - {totalDays} {totalDays === 1 ? 'day' : 'days'}
              </div>
            </div>
          </button>

          <div className={styles.chevronWrap}>
            <button
              className={cx('cyber-icon-btn', styles.chevron, isExpanded && styles.chevronOpen)}
              data-theme={theme}
              onClick={event => {
                event.stopPropagation();
                onToggle();
              }}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? `Collapse ${group.countryName} stay` : `Expand ${group.countryName} stay`}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <Chevron size={12} />
            </button>
          </div>
        </div>

        <div className={cx(styles.trips, isExpanded && styles.tripsExpanded)} aria-hidden={!isExpanded}>
          <div className={styles.tripsInner}>
            {[...group.trips].reverse().map((trip, i) => (
              <TripRow
                key={trip.id}
                trip={trip}
                isActive={trip.id === activeId}
                isLatest={isLatest && i === 0}
                onSelect={onSelect}
                rowRef={el => rowRef(trip.id, el)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
