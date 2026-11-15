import { cityLabel } from './places';
import { formatTripDateRange } from './tripUtils';
import styles from './Sidebar.module.css';
import type { TravelPoint } from './types';
import { cx } from './ui/cx';

const MAX_LABEL_CHARS = 30;


function truncatedCityLabel(city: string) {
  const label = cityLabel(city);
  return label.length > MAX_LABEL_CHARS ? `${label.slice(0, MAX_LABEL_CHARS)}...` : label;
}

export default function TripRow({
  trip,
  isActive,
  isLatest,
  onSelect,
  rowRef,
}: {
  trip: TravelPoint;
  isActive: boolean;
  isLatest: boolean;
  onSelect: (trip: TravelPoint) => void;
  rowRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={rowRef}
      onClick={() => onSelect(trip)}
      className={cx(styles.row, isLatest && styles.rowLatest, isActive && styles.rowActive)}
    >
      <div className={styles.rowText}>
        <div className={styles.rowCity}>
          {truncatedCityLabel(trip.city)}
          {isLatest ? <span className={styles.nowBadge}>NOW</span> : null}
        </div>
        <div className={styles.rowDates}>{formatTripDateRange(trip.arrival, trip.departure)}</div>
      </div>
    </div>
  );
}
