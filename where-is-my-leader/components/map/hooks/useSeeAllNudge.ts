import { useCallback, useEffect, useState } from 'react';

import { FLASH_NUDGE_DELAY_MS } from '../constants';

/**
 * After "See all trips" is chosen (`arm`), nudge the latest entry if the user still hasn't
 * picked anything once the delay elapses.
 */
export function useSeeAllNudge(userHasPickedTrip: boolean) {
  const [armed, setArmed] = useState(false);
  const [delayElapsed, setDelayElapsed] = useState(false);

  useEffect(() => {
    if (!armed) return undefined;
    const timer = setTimeout(() => setDelayElapsed(true), FLASH_NUDGE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  const arm = useCallback(() => setArmed(true), []);

  return { flashLatest: armed && delayElapsed && !userHasPickedTrip, arm };
}
