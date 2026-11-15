import { useCallback, useEffect, useRef, useState } from 'react';

import {
  clampFromOffset,
  clampToOffset,
  offsetToDateKey,
  resolveHandleForOffset,
  type DragHandle,
  type TimelineModel,
} from '../timeline';

/** Pointer-drag behaviour for the timeline's two handles over a track element. */
export function useTimelineDrag(
  model: TimelineModel | null,
  onFromChange: (value: string) => void,
  onToChange: (value: string) => void
) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragHandle, setDragHandle] = useState<DragHandle | null>(null);

  const clientXToOffset = useCallback(
    (clientX: number) => {
      if (!model || !trackRef.current) return null;
      const rect = trackRef.current.getBoundingClientRect();
      if (!rect.width) return null;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(ratio * model.totalDays);
    },
    [model]
  );

  const moveHandle = useCallback(
    (handle: DragHandle, offset: number) => {
      if (!model) return;
      if (handle === 'from') onFromChange(offsetToDateKey(model, clampFromOffset(model, offset)));
      else onToChange(offsetToDateKey(model, clampToOffset(model, offset)));
    },
    [model, onFromChange, onToChange]
  );

  useEffect(() => {
    if (!dragHandle) return undefined;

    const handleMove = (event: PointerEvent) => {
      const offset = clientXToOffset(event.clientX);
      if (offset !== null) moveHandle(dragHandle, offset);
    };
    const handleUp = () => setDragHandle(null);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [clientXToOffset, dragHandle, moveHandle]);

  /** Pressing anywhere on the track grabs whichever handle is the natural one to move there. */
  const onTrackPointerDown = (event: React.PointerEvent) => {
    event.preventDefault();
    const offset = clientXToOffset(event.clientX);
    if (offset === null || !model) return;

    const handle = resolveHandleForOffset(model, offset);
    setDragHandle(handle);
    moveHandle(handle, offset);
  };

  const onHandlePointerDown = (handle: DragHandle) => (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // When both handles sit at the same collapsed spot, whichever nub is on top would otherwise
    // always win — resolve by intended drag direction instead.
    const offset = clientXToOffset(event.clientX);
    const collapsed = model !== null && model.fromDays === model.toDays;
    setDragHandle(offset !== null && model && collapsed ? resolveHandleForOffset(model, offset) : handle);
  };

  return { trackRef, onTrackPointerDown, onHandlePointerDown };
}
