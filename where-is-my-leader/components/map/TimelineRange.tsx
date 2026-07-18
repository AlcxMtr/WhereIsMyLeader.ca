import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ThemeColors } from './theme';
import { formatTimelineLabel } from './tripUtils';
import type { ThemeMode } from './types';

type DragHandle = 'from' | 'to' | null;

function EyeIcon({ closed, color }: { closed: boolean; color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M2 12C3.8 8 7.2 5.5 12 5.5C16.8 5.5 20.2 8 22 12C20.2 16 16.8 18.5 12 18.5C7.2 18.5 3.8 16 2 12Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth="1.7" />
      {closed ? <path d="M4 20L20 4" stroke={color} strokeWidth="1.9" strokeLinecap="round" /> : null}
    </svg>
  );
}

function ResetIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M20 12A8 8 0 1 1 17.7 6.3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 4V9H15" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

  const fromRatio = timelineModel.fromDays / timelineModel.totalDays;
  const toRatio = timelineModel.toDays / timelineModel.totalDays;
  const labelsTooClose = toRatio - fromRatio < 0.12;

  return (
    <div
      data-timeline-ui="true"
      style={{
        position: 'absolute',
        top: '10px',
        left: timelineHidden ? 'auto' : '50%',
        right: timelineHidden ? '18px' : 'auto',
        transform: timelineHidden ? 'none' : 'translateX(-50%)',
        width: timelineHidden ? 'auto' : 'min(860px, calc(100% - 48px))',
        padding: timelineHidden ? '4px 8px' : '5px 10px 7px 10px',
        borderRadius: '10px',
        background: colors.panelBg,
        color: colors.detailText,
        border: `1px solid ${colors.detailBorder}`,
        backdropFilter: 'blur(4px)',
        zIndex: 25,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {timelineHidden ? (
        <button
          className="cyber-icon-btn"
          data-theme={theme}
          onClick={() => setTimelineHidden(hidden => !hidden)}
          style={{
            border: `1px solid ${colors.inputBorder}`,
            background: 'transparent',
            color: colors.buttonText,
            borderRadius: '999px',
            width: '26px',
            height: '26px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            cursor: 'pointer',
          }}
          aria-label="Show timeline"
          title="Show timeline"
        >
          <EyeIcon closed color={colors.buttonText} />
        </button>
      ) : (
        <>
          <div
            style={{
              position: 'absolute',
              top: '6px',
              right: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 2,
            }}
          >
            <button
              className="cyber-icon-btn"
              data-theme={theme}
              onClick={() => {
                onTimelineFromDateChange(timelineMinDate);
                onTimelineToDateChange(timelineMaxDate);
              }}
              style={{
                border: `1px solid ${colors.inputBorder}`,
                background: colors.buttonBg,
                color: colors.buttonText,
                borderRadius: '999px',
                width: '24px',
                height: '24px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                cursor: 'pointer',
              }}
              aria-label="Reset timeline range"
              title="Reset timeline range"
            >
              <ResetIcon color={colors.buttonText} />
            </button>
            <button
              className="cyber-icon-btn"
              data-theme={theme}
              onClick={() => setTimelineHidden(hidden => !hidden)}
              style={{
                border: `1px solid ${colors.inputBorder}`,
                background: colors.buttonBg,
                color: colors.buttonText,
                borderRadius: '999px',
                width: '24px',
                height: '24px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                cursor: 'pointer',
              }}
              aria-label="Hide timeline"
              title="Hide timeline"
            >
              <EyeIcon closed={false} color={colors.buttonText} />
            </button>
          </div>

          <div style={{ position: 'relative', padding: '2px 64px 20px 0' }}>
            <div>
              <div
                ref={timelineTrackRef}
                onPointerDown={event => {
                  event.preventDefault();
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
                  height: '18px',
                  cursor: 'ew-resize',
                  touchAction: 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '7px',
                    height: '4px',
                    borderRadius: '999px',
                    background: colors.panelSoft,
                    border: `1px solid ${colors.detailBorder}`,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'repeating-linear-gradient(to right, transparent 0, transparent 10px, rgba(56, 189, 248, 0.18) 10px, rgba(56, 189, 248, 0.18) 11px)',
                    }}
                  />
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: '7px',
                    left: `${(timelineModel.fromDays / timelineModel.totalDays) * 100}%`,
                    width: `${((timelineModel.toDays - timelineModel.fromDays) / timelineModel.totalDays) * 100}%`,
                    height: '4px',
                    borderRadius: '999px',
                    background: colors.toggleOn,
                    border: `1px solid ${colors.atmosphere}`,
                    opacity: 0.45,
                  }}
                />

                {(['from', 'to'] as const).map(handle => {
                  const offset = handle === 'from' ? timelineModel.fromDays : timelineModel.toDays;
                  const left = `${(offset / timelineModel.totalDays) * 100}%`;
                  const ratio = offset / timelineModel.totalDays;
                  const label = handle === 'from' ? formatTimelineLabel(timelineFromDate) : formatTimelineLabel(timelineToDate);
                  const labelTransform = labelsTooClose
                    ? handle === 'from'
                      ? 'translateX(0)'
                      : 'translateX(-100%)'
                    : ratio < 0.06
                      ? 'translateX(0)'
                      : ratio > 0.94
                        ? 'translateX(-100%)'
                        : 'translateX(-50%)';

                  return (
                    <div key={handle} style={{ position: 'absolute', left }}>
                      <div
                        style={{
                          position: 'absolute',
                          top: '20px',
                          left: 0,
                          transform: labelTransform,
                          fontSize: '9px',
                          lineHeight: 1,
                          fontWeight: 600,
                          color: colors.detailText,
                          background: colors.panelBg,
                          border: `1px solid ${colors.detailBorder}`,
                          borderRadius: '999px',
                          padding: '1px 5px',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          boxShadow: 'none',
                          opacity: 0.96,
                          transition: 'left 70ms linear, transform 70ms linear',
                          willChange: 'left, transform',
                        }}
                      >
                        {label}
                      </div>
                      <div
                        onPointerDown={event => {
                          event.preventDefault();
                          event.stopPropagation();
                          setDragHandle(handle);
                        }}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '1px',
                          width: '14px',
                          height: '14px',
                          transform: 'translateX(-50%)',
                          borderRadius: '999px',
                          background: colors.panelBg,
                          border: `1px solid ${colors.inputBorder}`,
                          boxShadow: theme === 'dark' ? '0 1px 7px rgba(2,6,23,0.44)' : '0 1px 7px rgba(15,23,42,0.12)',
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
