import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ThemeColors } from './theme';
import { formatTimelineLabel } from './tripUtils';
import type { ThemeMode } from './types';

type DragHandle = 'from' | 'to' | null;

export default function TimelineRange({
  theme,
  colors,
  timelineFromDate,
  timelineToDate,
  timelineMinDate,
  timelineMaxDate,
  onTimelineFromDateChange,
  onTimelineToDateChange,
}: {
  theme: ThemeMode;
  colors: ThemeColors;
  timelineFromDate: string;
  timelineToDate: string;
  timelineMinDate: string;
  timelineMaxDate: string;
  onTimelineFromDateChange: (value: string) => void;
  onTimelineToDateChange: (value: string) => void;
}) {
  const timelineTrackRef = useRef<HTMLDivElement | null>(null);
  const [dragHandle, setDragHandle] = useState<DragHandle>(null);
  const [timelineHidden, setTimelineHidden] = useState(false);

  const timelineModel = useMemo(() => {
    const min = new Date(`${timelineMinDate}T00:00:00`);
    const max = new Date(`${timelineMaxDate}T00:00:00`);
    const from = new Date(`${timelineFromDate}T00:00:00`);
    const to = new Date(`${timelineToDate}T00:00:00`);

    if (
      Number.isNaN(min.getTime()) ||
      Number.isNaN(max.getTime()) ||
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime())
    ) {
      return null;
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.round((max.getTime() - min.getTime()) / dayMs));
    const fromDays = Math.max(0, Math.min(totalDays, Math.round((from.getTime() - min.getTime()) / dayMs)));
    const toDays = Math.max(0, Math.min(totalDays, Math.round((to.getTime() - min.getTime()) / dayMs)));

    return {
      min,
      totalDays,
      fromDays,
      toDays,
      dayMs,
    };
  }, [timelineFromDate, timelineMaxDate, timelineMinDate, timelineToDate]);

  const formatDateInput = useCallback((date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const updateFromByOffset = useCallback(
    (offset: number) => {
      if (!timelineModel) return;
      const clamped = Math.max(0, Math.min(offset, timelineModel.toDays));
      const next = new Date(timelineModel.min.getTime() + clamped * timelineModel.dayMs);
      onTimelineFromDateChange(formatDateInput(next));
    },
    [formatDateInput, onTimelineFromDateChange, timelineModel]
  );

  const updateToByOffset = useCallback(
    (offset: number) => {
      if (!timelineModel) return;
      const clamped = Math.min(timelineModel.totalDays, Math.max(offset, timelineModel.fromDays));
      const next = new Date(timelineModel.min.getTime() + clamped * timelineModel.dayMs);
      onTimelineToDateChange(formatDateInput(next));
    },
    [formatDateInput, onTimelineToDateChange, timelineModel]
  );

  const clientXToOffset = useCallback(
    (clientX: number) => {
      if (!timelineModel || !timelineTrackRef.current) return null;
      const rect = timelineTrackRef.current.getBoundingClientRect();
      if (!rect.width) return null;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(ratio * timelineModel.totalDays);
    },
    [timelineModel]
  );

  useEffect(() => {
    if (!dragHandle) return;

    const handleMove = (event: PointerEvent) => {
      const offset = clientXToOffset(event.clientX);
      if (offset === null) return;
      if (dragHandle === 'from') updateFromByOffset(offset);
      if (dragHandle === 'to') updateToByOffset(offset);
    };

    const handleUp = () => setDragHandle(null);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [clientXToOffset, dragHandle, updateFromByOffset, updateToByOffset]);

  if (!timelineModel) return null;

  return (
    <div
      data-timeline-ui="true"
      style={{
        position: 'absolute',
        top: '18px',
        left: timelineHidden ? 'auto' : '50%',
        right: timelineHidden ? '18px' : 'auto',
        transform: timelineHidden ? 'none' : 'translateX(-50%)',
        width: timelineHidden ? 'auto' : 'min(900px, calc(100% - 36px))',
        padding: timelineHidden ? '4px 8px' : '6px 10px',
        borderRadius: '10px',
        background: theme === 'dark' ? 'rgba(2, 6, 23, 0.14)' : 'rgba(255, 255, 255, 0.24)',
        color: colors.detailText,
        border: `1px solid ${theme === 'dark' ? 'rgba(148,163,184,0.14)' : 'rgba(148,163,184,0.22)'}`,
        backdropFilter: 'blur(4px)',
        zIndex: 25,
      }}
    >
      {timelineHidden ? (
        <button
          onClick={() => setTimelineHidden(false)}
          style={{
            border: `1px solid ${theme === 'dark' ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.42)'}`,
            background: 'transparent',
            color: colors.detailText,
            borderRadius: '7px',
            padding: '2px 8px',
            fontSize: '10px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          aria-label="Show timeline"
          title="Show timeline"
        >
          Timeline
        </button>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.01em' }}>Timeline</div>
            <button
              onClick={() => setTimelineHidden(true)}
              style={{
                border: 'none',
                background: 'transparent',
                color: colors.detailSub,
                fontSize: '10px',
                fontWeight: 600,
                padding: 0,
                cursor: 'pointer',
              }}
              aria-label="Hide timeline"
              title="Hide timeline"
            >
              Hide
            </button>
          </div>

          <div style={{ position: 'relative', padding: '2px 0 16px 0' }}>
            <div>
              <div
                ref={timelineTrackRef}
                onPointerDown={event => {
                  const offset = clientXToOffset(event.clientX);
                  if (offset === null) return;
                  const fromDistance = Math.abs(offset - timelineModel.fromDays);
                  const toDistance = Math.abs(offset - timelineModel.toDays);
                  const handle = fromDistance <= toDistance ? 'from' : 'to';
                  setDragHandle(handle);
                  if (handle === 'from') updateFromByOffset(offset);
                  if (handle === 'to') updateToByOffset(offset);
                }}
                style={{
                  position: 'relative',
                  height: '22px',
                  cursor: 'ew-resize',
                  touchAction: 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '9px',
                    height: '4px',
                    borderRadius: '999px',
                    background: theme === 'dark' ? 'rgba(51, 65, 85, 0.45)' : 'rgba(148, 163, 184, 0.26)',
                    border: `1px solid ${theme === 'dark' ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.28)'}`,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'repeating-linear-gradient(to right, transparent 0, transparent 10px, rgba(148, 163, 184, 0.22) 10px, rgba(148, 163, 184, 0.22) 11px)',
                    }}
                  />
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: '9px',
                    left: `${(timelineModel.fromDays / timelineModel.totalDays) * 100}%`,
                    width: `${((timelineModel.toDays - timelineModel.fromDays) / timelineModel.totalDays) * 100}%`,
                    height: '4px',
                    borderRadius: '999px',
                    background: theme === 'dark' ? 'rgba(96, 165, 250, 0.45)' : 'rgba(37, 99, 235, 0.36)',
                    border: `1px solid ${theme === 'dark' ? 'rgba(147, 197, 253, 0.48)' : 'rgba(59, 130, 246, 0.46)'}`,
                  }}
                />

                {(['from', 'to'] as const).map(handle => {
                  const offset = handle === 'from' ? timelineModel.fromDays : timelineModel.toDays;
                  const left = `${(offset / timelineModel.totalDays) * 100}%`;
                  const label = handle === 'from' ? formatTimelineLabel(timelineFromDate) : formatTimelineLabel(timelineToDate);
                  const ratio = offset / timelineModel.totalDays;
                  const labelTransform = ratio < 0.06 ? 'translateX(0)' : ratio > 0.94 ? 'translateX(-100%)' : 'translateX(-50%)';

                  return (
                    <div key={handle} style={{ position: 'absolute', left }}>
                      <div
                        onPointerDown={event => {
                          event.stopPropagation();
                          setDragHandle(handle);
                        }}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '3px',
                          width: '16px',
                          height: '16px',
                          transform: 'translateX(-50%)',
                          borderRadius: '999px',
                          background: theme === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255,255,255,0.92)',
                          border: `1px solid ${theme === 'dark' ? 'rgba(148,163,184,0.55)' : 'rgba(148,163,184,0.58)'}`,
                          boxShadow: theme === 'dark' ? '0 1px 5px rgba(0,0,0,0.34)' : '0 1px 5px rgba(15,23,42,0.11)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'ew-resize',
                          touchAction: 'none',
                        }}
                        aria-label={handle === 'from' ? 'Drag from date handle' : 'Drag to date handle'}
                      >
                        <div
                          style={{
                            width: '6px',
                            height: '8px',
                            borderLeft: `1px solid ${colors.textSoft}`,
                            borderRight: `1px solid ${colors.textSoft}`,
                            opacity: 0.85,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          top: '24px',
                          left: 0,
                          transform: labelTransform,
                          fontSize: '10px',
                          color: colors.detailText,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
            <button
              onClick={() => {
                onTimelineFromDateChange(timelineMinDate);
                onTimelineToDateChange(timelineMaxDate);
              }}
              style={{
                border: `1px solid ${theme === 'dark' ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.42)'}`,
                background: theme === 'dark' ? 'rgba(30, 41, 59, 0.44)' : 'rgba(255,255,255,0.5)',
                color: colors.buttonText,
                borderRadius: '7px',
                padding: '2px 7px',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset range
            </button>
          </div>
        </>
      )}
    </div>
  );
}
