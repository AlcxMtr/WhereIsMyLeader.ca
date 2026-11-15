import { useMemo, useState, type CSSProperties } from 'react';

import { formatTimelineLabel } from '@/lib/dates';

import { useTimelineDrag } from './hooks/useTimelineDrag';
import { buildTimelineModel } from './timeline';
import styles from './TimelineRange.module.css';
import type { ThemeMode, TimelineState } from './types';
import { cx } from './ui/cx';
import { EyeIcon, ResetIcon } from './ui/TimelineIcons';


/** Shifts a label so it stays inside the track when its anchor is near either end. */
function labelShift(ratio: number, edge: number): CSSProperties['transform'] {
  if (ratio < edge) return 'translateX(0)';
  if (ratio > 1 - edge) return 'translateX(-100%)';
  return 'translateX(-50%)';
}

export default function TimelineRange({
  theme,
  timeline,
  compact = false,
}: {
  theme: ThemeMode;
  timeline: TimelineState;
  compact?: boolean;
}) {
  const { from, to, min, max, onFromChange, onToChange } = timeline;
  const [hidden, setHidden] = useState(compact);

  const model = useMemo(() => buildTimelineModel(from, to, min, max), [from, to, min, max]);
  const { trackRef, onTrackPointerDown, onHandlePointerDown } = useTimelineDrag(model, onFromChange, onToChange);

  if (!model) return null;

  const fromRatio = model.fromDays / model.totalDays;
  const toRatio = model.toDays / model.totalDays;
  const midRatio = (fromRatio + toRatio) / 2;
  const labelsTooClose = toRatio - fromRatio < 0.12;
  const fromLabel = formatTimelineLabel(from);
  const toLabel = formatTimelineLabel(to);
  // When handles are close, show one merged label so the two never collide or appear swapped.
  const mergedLabel = fromLabel === toLabel ? fromLabel : `${fromLabel} \u2013 ${toLabel}`;

  const toggleHidden = () => setHidden(value => !value);
  const reset = () => {
    onFromChange(min);
    onToChange(max);
  };

  return (
    <div
      data-timeline-ui="true"
      className={cx(styles.root, compact && styles.compact, hidden && styles.collapsed)}
    >
      {hidden ? (
        <button
          className={cx('cyber-icon-btn', styles.iconButton, styles.showButton)}
          data-theme={theme}
          onClick={toggleHidden}
          aria-label="Show timeline"
          title="Show timeline"
        >
          <EyeIcon closed />
        </button>
      ) : (
        <>
          <div className={styles.header}>
            {compact ? <div className={styles.compactLabel}>{mergedLabel}</div> : null}
            <div className={styles.actions}>
              <button
                className={cx('cyber-icon-btn', styles.iconButton, styles.actionButton)}
                data-theme={theme}
                onClick={reset}
                aria-label="Reset timeline range"
                title="Reset timeline range"
              >
                <ResetIcon />
              </button>
              <button
                className={cx('cyber-icon-btn', styles.iconButton, styles.actionButton)}
                data-theme={theme}
                onClick={toggleHidden}
                aria-label="Hide timeline"
                title="Hide timeline"
              >
                <EyeIcon closed={false} />
              </button>
            </div>
          </div>

          <div className={styles.trackArea}>
            <div ref={trackRef} onPointerDown={onTrackPointerDown} className={styles.track}>
              <div className={styles.bar}>
                <div className={styles.ticks} />
              </div>

              <div
                className={styles.selection}
                style={{ left: `${fromRatio * 100}%`, width: `${(toRatio - fromRatio) * 100}%` }}
              />

              {(['from', 'to'] as const).map(handle => {
                const ratio = handle === 'from' ? fromRatio : toRatio;
                return (
                  <div key={handle} className={styles.handleAnchor} style={{ left: `${ratio * 100}%` }}>
                    <div
                      className={cx(styles.label, (compact || labelsTooClose) && styles.labelHidden)}
                      style={{ transform: labelShift(ratio, 0.06) }}
                    >
                      {handle === 'from' ? fromLabel : toLabel}
                    </div>
                    <div
                      className={styles.handle}
                      onPointerDown={onHandlePointerDown(handle)}
                      aria-label={handle === 'from' ? 'Drag from date handle' : 'Drag to date handle'}
                    >
                      <div className={styles.grip} />
                    </div>
                  </div>
                );
              })}

              {labelsTooClose && !compact ? (
                <div
                  className={cx(styles.label, styles.mergedLabel)}
                  style={{ left: `${midRatio * 100}%`, transform: labelShift(midRatio, 0.12) }}
                >
                  {mergedLabel}
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
