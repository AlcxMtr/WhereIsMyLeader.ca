'use client';

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
  subjectName,
  isDefaultSubject,
}: {
  visible: boolean;
  onSelectToday: () => void;
  onSelectFirst: () => void;
  onSelectAll: () => void;
  subjectName: string;
  isDefaultSubject: boolean;
}) {
  if (!visible) return null;

  const firstName = subjectName.split(' ')[0];
  const shortName = isDefaultSubject ? subjectName : firstName;

  return (
    <div className={styles.positioner}>
      <div className={styles.card}>
        <div className={styles.title}>{subjectName}&apos;s Travels</div>
        <div className={styles.intro}>
          {isDefaultSubject
            ? 'Pick a starting point to see the PM\u2019s travels.'
            : `Pick a starting point to explore ${firstName}\u2019s travels.`}
        </div>

        <div className={styles.options}>
          <WelcomeOption
            label={`Where is ${shortName} today?`}
            description={isDefaultSubject ? "Jump to the PM's current stop" : 'Jump to their current stop'}
            onClick={onSelectToday}
          />
          <WelcomeOption
            label={`${shortName}'s first trip`}
            description={
              isDefaultSubject
                ? "Start from the PM's first foreign visit following the 2025 Canadian federal election"
                : 'Start from their earliest logged trip'
            }
            onClick={onSelectFirst}
          />
          <WelcomeOption
            label="See all trips"
            description={
              isDefaultSubject
                ? "Show the PM's full travel history simultaneously"
                : 'Show their full travel history simultaneously'
            }
            onClick={onSelectAll}
          />
        </div>
      </div>
    </div>
  );
}
