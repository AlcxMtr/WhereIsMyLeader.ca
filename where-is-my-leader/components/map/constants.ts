export const DEFAULT_SUBJECT_NAME = 'Mark Carney';

/** Width of the desktop trip sidebar; also used to size the globe canvas. */
export const SIDEBAR_WIDTH = 300;

export const MOBILE_MEDIA_QUERY = '(max-width: 768px), (max-height: 500px) and (pointer: coarse)';

export const FLASH_NUDGE_DELAY_MS = 5000;

export const STORAGE_KEYS = {
  expandedStays: 'wiml-sidebar-expanded-stays',
  recenterHint: 'wiml-recenter-hint',
} as const;

export function flagUrl(code: string, width: 40 | 80): string {
  return `https://flagcdn.com/w${width}/${code}.png`;
}
