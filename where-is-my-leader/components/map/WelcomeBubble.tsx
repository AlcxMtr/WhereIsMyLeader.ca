'use client';

import type { Subject } from './types';
import styles from './WelcomeBubble.module.css';

function WelcomeOption({ label, description, onClick }: { label: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={styles.option}>
      <div className={styles.optionLabel}>{label}</div>
      <div className={styles.optionDescription}>{description}</div>
    </button>
  );
}

export default function WelcomeBubble({
  visible,
  onSelectToday,
  onSelectFirst,
  onSelectAll,
  subject,
}: {
  visible: boolean;
  onSelectToday: () => void;
  onSelectFirst: () => void;
  onSelectAll: () => void;
  subject: Subject;
}) {
  if (!visible) return null;

  return (
    <div className={styles.positioner}>
      <div className={styles.card}>
        <div className={styles.title}>{subject.name}&apos;s Travels</div>
        <div className={styles.intro}>{subject.welcome.intro}</div>

        <div className={styles.options}>
          <WelcomeOption
            label={`Where is ${subject.shortName} today?`}
            description={subject.welcome.todayDescription}
            onClick={onSelectToday}
          />
          <WelcomeOption
            label={`${subject.shortName}'s first trip`}
            description={subject.welcome.firstTripDescription}
            onClick={onSelectFirst}
          />
          <WelcomeOption
            label="See all trips"
            description={subject.welcome.allTripsDescription}
            onClick={onSelectAll}
          />
        </div>
      </div>
    </div>
  );
}
