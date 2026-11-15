import { useEffect, useState } from 'react';

import { SIDEBAR_WIDTH } from '../constants';

/** Globe canvas size: the window minus the desktop sidebar when it is showing. */
export function useGlobeSize(sidebarShowing: boolean) {
  const [size, setSize] = useState({ width: 1000, height: 800 });

  useEffect(() => {
    const update = () => {
      setSize({
        width: Math.max(window.innerWidth - (sidebarShowing ? SIDEBAR_WIDTH : 0), 200),
        height: window.innerHeight,
      });
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [sidebarShowing]);

  return size;
}
