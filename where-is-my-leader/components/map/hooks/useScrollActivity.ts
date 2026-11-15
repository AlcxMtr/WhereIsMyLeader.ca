import { useCallback, useEffect, useRef, useState } from 'react';

const SCROLL_IDLE_MS = 150;

/** Reports whether the user is actively scrolling (drives the glowing scrollbar styling). */
export function useScrollActivity() {
  const [isScrolling, setIsScrolling] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    },
    []
  );

  const onScroll = useCallback(() => {
    setIsScrolling(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsScrolling(false);
      idleTimerRef.current = null;
    }, SCROLL_IDLE_MS);
  }, []);

  return { isScrolling, onScroll };
}
