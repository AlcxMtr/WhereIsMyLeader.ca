import type { ThemeMode } from './types';
import type { ThemeColors } from './theme';

export function ThemeToggle({
  theme,
  onToggle,
  colors,
}: {
  theme: ThemeMode;
  onToggle: () => void;
  colors: ThemeColors;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        border: `1px solid ${colors.inputBorder}`,
        background: colors.buttonBg,
        color: colors.buttonText,
        borderRadius: '10px',
        padding: '8px 10px',
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
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
        transition: 'background 0.2s ease',
        flexShrink: 0,
      }}
      aria-label="Toggle date filter"
      title="Toggle date filter"
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: enabled ? '23px' : '3px',
          width: '18px',
          height: '18px',
          borderRadius: '999px',
          background: '#ffffff',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        }}
      />
    </button>
  );
}
