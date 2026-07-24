import type { ThemeMode } from './types';
import type { ThemeColors } from './theme';

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: ThemeMode;
  onToggle: () => void;
}) {
  const isDark = theme === 'dark';
  const trackBg = isDark ? '#1b2338' : '#9fb4ef';
  const trackBorder = isDark ? '#2d3a5d' : '#8ea7e8';

  return (
    <button
      onClick={onToggle}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '999px',
        border: `1px solid ${trackBorder}`,
        background: trackBg,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 160ms linear, border-color 160ms linear',
        flexShrink: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '2px',
          left: '2px',
          width: '18px',
          height: '18px',
          borderRadius: '999px',
          background: '#ffffff',
          transform: isDark ? 'translate3d(20px, 0, 0)' : 'translate3d(0, 0, 0)',
          transition: 'transform 180ms cubic-bezier(0.22, 0.8, 0.26, 1)',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.28)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isDark ? '#223052' : '#5a6fb0',
        }}
      >
        {isDark ? (
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        )}
      </span>
    </button>
  );
}

export function FilterToggle({
  enabled,
  onToggle,
  colors,
}: {
  enabled: boolean;
  onToggle: () => void;
  colors: ThemeColors;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '999px',
        border: 'none',
        background: enabled ? colors.toggleOn : colors.toggleOff,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 160ms linear',
        flexShrink: 0,
        overflow: 'hidden',
      }}
      aria-label="Toggle date filter"
      title="Toggle date filter"
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: '3px',
          width: '18px',
          height: '18px',
          borderRadius: '999px',
          background: '#ffffff',
          transform: enabled ? 'translate3d(20px, 0, 0)' : 'translate3d(0, 0, 0)',
          transition: 'transform 180ms cubic-bezier(0.22, 0.8, 0.26, 1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
      />
    </button>
  );
}
