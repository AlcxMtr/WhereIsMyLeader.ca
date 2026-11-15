import { useCallback, useEffect, useState } from 'react';

import { STORAGE_KEYS } from '../constants';
import type { StayGroup } from '../stays';

function loadExpandedStays(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.expandedStays);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as Record<string, boolean>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Which stay cards are expanded, persisted across visits. A stay the user hasn't touched
 * follows `activeStayKey` (the one containing the selected trip).
 */
export function useExpandedStays(stayGroups: StayGroup[], activeStayKey: string | null) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(loadExpandedStays);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.expandedStays, JSON.stringify(expanded));
    } catch {
      // Ignore storage write failures.
    }
  }, [expanded]);

  const isExpanded = useCallback(
    (key: string) => expanded[key] ?? activeStayKey === key,
    [activeStayKey, expanded]
  );

  const toggle = useCallback(
    (key: string) => {
      setExpanded(prev => ({ ...prev, [key]: !(prev[key] ?? activeStayKey === key) }));
    },
    [activeStayKey]
  );

  const allExpanded = stayGroups.length > 0 && stayGroups.every(group => isExpanded(group.key));

  const setAll = useCallback(
    (value: boolean) => {
      setExpanded(Object.fromEntries(stayGroups.map(group => [group.key, value])));
    },
    [stayGroups]
  );

  return { isExpanded, toggle, allExpanded, setAll };
}
