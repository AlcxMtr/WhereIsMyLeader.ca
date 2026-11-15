import { useEffect, useRef, useState } from 'react';

import { STORAGE_KEYS } from '../constants';
import type { TravelPoint } from '../types';

const SHOW_DELAY_MS = 600;
const VISIBLE_MS = 4000;

/** One-time tip shown the first time a trip bubble opens. */
export function useRecenterHint(activeDetail: TravelPoint | null): boolean {
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(hideTimerRef.current), []);

  useEffect(() => {
    if (!activeDetail) return undefined;
    try {
      if (window.localStorage.getItem(STORAGE_KEYS.recenterHint)) return undefined;
      window.localStorage.setItem(STORAGE_KEYS.recenterHint, '1');
    } catch {
      return undefined;
    }

    const showTimer = window.setTimeout(() => {
      setVisible(true);
      hideTimerRef.current = window.setTimeout(() => setVisible(false), VISIBLE_MS);
    }, SHOW_DELAY_MS);

    return () => window.clearTimeout(showTimer);
  }, [activeDetail]);

  return visible;
}
