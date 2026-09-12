'use client';

import { useState } from 'react';

import type { ThemeColors } from './theme';
import type { ThemeMode } from './types';

function WelcomeOption({
  label,
  description,
  colors,
  onClick,
}: {
  label: string;
  description: string;
  colors: ThemeColors;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        border: `1px solid ${hovered ? colors.detailText : colors.detailBorder}`,
        background: hovered ? colors.panelHover : 'transparent',
        color: colors.detailText,
        borderRadius: '10px',
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}
    >
      <div style={{ fontWeight: 800, fontSize: '13px' }}>{label}</div>
      <div style={{ fontWeight: 500, fontSize: '11px', color: colors.detailSub, marginTop: '2px' }}>
        {description}
      </div>
    </button>
  );
}

export default function WelcomeBubble({
  theme,
  colors,
  visible,
  onSelectToday,
  onSelectFirst,
  onSelectAll,
}: {
  theme: ThemeMode;
  colors: ThemeColors;
  visible: boolean;
  onSelectToday: () => void;
  onSelectFirst: () => void;
  onSelectAll: () => void;
}) {
  if (!visible) return null;

  const gradientTopLeft = theme === 'dark' ? 'rgba(8, 145, 178, 0.4)' : 'rgba(37, 99, 235, 0.26)';
  const gradientBottomRight = theme === 'dark' ? 'rgba(9, 18, 42, 0.94)' : 'rgba(228, 236, 250, 0.96)';

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 40,
        width: 'min(340px, calc(100vw - 32px))',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${gradientTopLeft} 0%, ${gradientBottomRight} 72%)`,
          color: colors.detailText,
          border: `1px solid ${colors.detailBorder}`,
          borderRadius: '14px',
          padding: '18px',
          boxShadow: theme === 'dark' ? '0 14px 32px rgba(0,0,0,0.42)' : '0 14px 32px rgba(15,23,42,0.14)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '4px' }}>Mark Carney&apos;s Travels</div>
        <div style={{ fontSize: '12px', color: colors.detailSub, marginBottom: '14px' }}>
          Pick a starting point to see the PM&apos;s travels.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <WelcomeOption
            label="Where is Mark Carney today?"
            description="Jump to the PM's current stop"
            colors={colors}
            onClick={onSelectToday}
          />
          <WelcomeOption
            label="Mark Carney's first trip"
            description="Start from the PM's first foreign visit following the 2025 Canadian federal election"
            colors={colors}
            onClick={onSelectFirst}
          />
          <WelcomeOption
            label="See all trips"
            description="Show the PM's full travel history simultaneously"
            colors={colors}
            onClick={onSelectAll}
          />
        </div>
      </div>
    </div>
  );
}
