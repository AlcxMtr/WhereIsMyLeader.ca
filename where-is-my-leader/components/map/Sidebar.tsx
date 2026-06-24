import { FilterToggle, ThemeToggle } from './MapControls';
import { getThemeColors } from './theme';
import { formatDateLabel, getCountryInfo } from './tripUtils';
import type { ThemeMode, TravelPoint } from './types';

export default function Sidebar({
  travelData,
  theme,
  setTheme,
  filterEnabled,
  setFilterEnabled,
  filterFrom,
  setFilterFrom,
  filterTo,
  setFilterTo,
  onSelect,
  activeId,
  onToggleCollapsed,
}: {
  travelData: TravelPoint[];
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  filterEnabled: boolean;
  setFilterEnabled: (value: boolean) => void;
  filterFrom: string;
  setFilterFrom: (value: string) => void;
  filterTo: string;
  setFilterTo: (value: string) => void;
  onSelect: (loc: TravelPoint) => void;
  activeId: number | null;
  onToggleCollapsed: () => void;
}) {
  const colors = getThemeColors(theme);
  const sorted = [...travelData].reverse();

  return (
    <div
      style={{
        width: '300px',
        minWidth: '300px',
        height: '100vh',
        overflowY: 'auto',
        background: colors.panelBg,
        borderRight: `1px solid ${colors.panelBorder}`,
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
      }}
    >
      <div style={{ padding: '16px', borderBottom: `1px solid ${colors.panelBorder}`, position: 'relative' }}>
        <button
          onClick={onToggleCollapsed}
          aria-label="Hide sidebar"
          title="Hide sidebar"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            border: `1px solid ${colors.inputBorder}`,
            background: colors.buttonBg,
            color: colors.buttonText,
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', paddingRight: '48px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: colors.text }}>Mark Carney</div>
            <div style={{ fontSize: '12px', color: colors.textSoft, marginTop: '2px' }}>Travel Log</div>
          </div>
          <ThemeToggle
            theme={theme}
            onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            colors={colors}
          />
        </div>

        <div
          style={{
            marginTop: '14px',
            padding: '12px',
            borderRadius: '14px',
            background: colors.panelSoft,
            border: `1px solid ${colors.panelBorder}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>Date filter</div>
              <div style={{ fontSize: '11px', color: colors.textSoft, marginTop: '2px' }}>
                Show only trips in a selected range
              </div>
            </div>
            <FilterToggle
              enabled={filterEnabled}
              onToggle={() => setFilterEnabled(!filterEnabled)}
              colors={colors}
            />
          </div>

          {filterEnabled ? (
            <div style={{ marginTop: '12px', display: 'grid', gap: '10px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: colors.textSoft,
                    marginBottom: '4px',
                  }}
                >
                  From
                </label>
                <input
                  type="date"
                  value={filterFrom}
                  onChange={e => setFilterFrom(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    border: `1px solid ${colors.inputBorder}`,
                    background: colors.inputBg,
                    color: colors.text,
                    padding: '9px 10px',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: colors.textSoft,
                    marginBottom: '4px',
                  }}
                >
                  To
                </label>
                <input
                  type="date"
                  value={filterTo}
                  onChange={e => setFilterTo(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    border: `1px solid ${colors.inputBorder}`,
                    background: colors.inputBg,
                    color: colors.text,
                    padding: '9px 10px',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                onClick={() => {
                  setFilterFrom('');
                  setFilterTo('');
                }}
                style={{
                  marginTop: '2px',
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
                Clear dates
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '16px', color: colors.textSoft, fontSize: '13px' }}>No trips in this date range.</div>
        ) : (
          sorted.map((loc, i) => {
            const { code } = getCountryInfo(loc.city);
            const flagUrl = code ? `https://flagcdn.com/w40/${code}.png` : null;
            const isLatest = i === 0;
            const isActive = loc.id === activeId;
            const arrivalLabel = formatDateLabel(loc.arrival);
            const departureLabel = formatDateLabel(loc.departure);
            const rangeLabel =
              arrivalLabel && departureLabel ? `${arrivalLabel} – ${departureLabel}` : arrivalLabel || departureLabel;

            return (
              <div
                key={loc.id}
                onClick={() => onSelect(loc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  borderBottom: `1px solid ${colors.panelBorder}`,
                  background: isActive ? colors.panelSelected : isLatest ? colors.panelNow : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = colors.panelHover;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = isActive
                    ? colors.panelSelected
                    : isLatest
                      ? colors.panelNow
                      : 'transparent';
                }}
              >
                {flagUrl ? (
                  <img
                    src={flagUrl}
                    alt=""
                    loading="lazy"
                    width={28}
                    height={19}
                    style={{
                      width: '28px',
                      height: '19px',
                      objectFit: 'cover',
                      borderRadius: '3px',
                      boxShadow: '0 0 3px rgba(0,0,0,0.2)',
                      flexShrink: 0,
                      background: theme === 'dark' ? '#334155' : '#e2e8f0',
                    }}
                    onError={e => {
                      const img = e.currentTarget;
                      img.style.display = 'none';
                      const fallback = img.nextElementSibling as HTMLDivElement | null;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                ) : null}

                <div
                  style={{
                    width: '28px',
                    height: '19px',
                    background: theme === 'dark' ? '#334155' : '#e2e8f0',
                    borderRadius: '3px',
                    flexShrink: 0,
                    display: flagUrl ? 'none' : 'block',
                  }}
                />

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: colors.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {loc.city.split(',')[0]}
                    {isLatest ? (
                      <span
                        style={{
                          marginLeft: '6px',
                          fontSize: '10px',
                          background: theme === 'dark' ? '#16a34a' : '#22c55e',
                          color: '#fff',
                          borderRadius: '4px',
                          padding: '1px 5px',
                          verticalAlign: 'middle',
                        }}
                      >
                        NOW
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.textSoft, marginTop: '1px' }}>{rangeLabel}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
