import { useEffect, useState } from 'react';

import { MOBILE_MEDIA_QUERY } from '../constants';

interface Viewport {
  isMobile: boolean;
  isLandscape: boolean;
}

/** Tracks the phone-sized layout breakpoint and, within it, landscape orientation. */
export function useViewport(): Viewport {
  const [viewport, setViewport] = useState<Viewport>({ isMobile: false, isLandscape: false });

  useEffect(() => {
    const mobileMq = window.matchMedia(MOBILE_MEDIA_QUERY);
    const landscapeMq = window.matchMedia('(orientation: landscape)');
    const apply = () => {
      setViewport({
        isMobile: mobileMq.matches,
        isLandscape: mobileMq.matches && landscapeMq.matches && window.innerWidth > window.innerHeight,
      });
    };
    apply();
    mobileMq.addEventListener('change', apply);
    landscapeMq.addEventListener('change', apply);
    return () => {
      mobileMq.removeEventListener('change', apply);
      landscapeMq.removeEventListener('change', apply);
    };
  }, []);

  return viewport;
}
