import type { ThemeColors } from './theme';
import { formatDateLabel, getCountryInfo } from './tripUtils';
import type { TravelPoint, ThemeMode } from './types';

export function createTripDetailHtmlElement({
  trip,
  theme,
  colors,
  previousTrip,
  nextTrip,
  onPrevious,
  onNext,
  onClose,
}: {
  trip: TravelPoint;
  theme: ThemeMode;
  colors: ThemeColors;
  previousTrip: TravelPoint | null;
  nextTrip: TravelPoint | null;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const { name: countryName, code: countryCode } = getCountryInfo(trip.city);
  const flagUrl = countryCode ? `https://flagcdn.com/w80/${countryCode}.png` : null;
  const arrivalLabel = formatDateLabel(trip.arrival);
  const departureLabel = formatDateLabel(trip.departure);
  const rangeLabel =
    arrivalLabel && departureLabel ? `${arrivalLabel} -> ${departureLabel}` : arrivalLabel || departureLabel;

  const wrapper = document.createElement('div');
  wrapper.style.width = 'min(360px, calc(100vw - 28px))';
  wrapper.style.maxWidth = '360px';
  wrapper.style.pointerEvents = 'auto';
  wrapper.style.transform = 'translate(18px, calc(-56% + 14px + var(--detail-shift-y, 0px)))';

  const card = document.createElement('div');
  card.style.background = colors.detailBg;
  card.style.color = colors.detailText;
  card.style.border = `1px solid ${colors.detailBorder}`;
  card.style.borderRadius = '14px';
  card.style.padding = '14px';
  card.style.boxShadow =
    theme === 'dark' ? '0 14px 32px rgba(0,0,0,0.42)' : '0 14px 32px rgba(15,23,42,0.14)';
  card.style.backdropFilter = 'blur(12px)';
  card.style.position = 'relative';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.maxHeight = 'min(64vh, 520px)';
  card.style.overflow = 'hidden';

  const closeButton = document.createElement('button');
  closeButton.innerText = 'x';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '8px';
  closeButton.style.right = '10px';
  closeButton.style.border = 'none';
  closeButton.style.background = 'transparent';
  closeButton.style.color = colors.detailSub;
  closeButton.style.fontSize = '18px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.lineHeight = '1';
  closeButton.onclick = e => {
    e.stopPropagation();
    onClose();
  };

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = '10px';
  header.style.paddingRight = '22px';

  if (flagUrl) {
    const flag = document.createElement('img');
    flag.src = flagUrl;
    flag.alt = countryName ?? '';
    flag.style.width = '30px';
    flag.style.height = '20px';
    flag.style.borderRadius = '4px';
    flag.style.objectFit = 'cover';
    flag.style.boxShadow = '0 0 4px rgba(0,0,0,0.2)';
    header.appendChild(flag);
  }

  const titleWrap = document.createElement('div');
  titleWrap.style.minWidth = '0';

  const title = document.createElement('div');
  title.innerText = trip.city;
  title.style.fontWeight = '800';
  title.style.fontSize = '14px';
  title.style.lineHeight = '1.35';
  title.style.color = colors.detailText;

  titleWrap.appendChild(title);

  if (rangeLabel) {
    const subtitle = document.createElement('div');
    subtitle.innerText = rangeLabel;
    subtitle.style.fontSize = '12px';
    subtitle.style.marginTop = '2px';
    subtitle.style.color = colors.detailSub;
    titleWrap.appendChild(subtitle);
  }

  header.appendChild(titleWrap);

  const body = document.createElement('div');
  body.setAttribute('data-detail-scroll', 'true');
  body.innerText = trip.desc;
  body.style.marginTop = '12px';
  body.style.fontSize = '13px';
  body.style.lineHeight = '1.6';
  body.style.color = colors.detailText;
  body.style.overflowY = 'auto';
  body.style.paddingRight = '4px';
  body.style.wordBreak = 'break-word';
  body.style.flex = '1';

  body.addEventListener(
    'wheel',
    e => {
      e.stopPropagation();
    },
    { passive: true }
  );

  const navWrap = document.createElement('div');
  navWrap.style.marginTop = '12px';
  navWrap.style.display = 'flex';
  navWrap.style.alignItems = 'center';
  navWrap.style.justifyContent = 'space-between';
  navWrap.style.gap = '10px';
  navWrap.style.flexShrink = '0';

  const navButtonBase = {
    border: `1px solid ${colors.detailBorder}`,
    background: 'transparent',
    color: colors.detailSub,
    borderRadius: '8px',
    padding: '5px 8px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    maxWidth: '48%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as const;

  const previousBtn = document.createElement('button');
  previousBtn.type = 'button';
  previousBtn.style.border = navButtonBase.border;
  previousBtn.style.background = navButtonBase.background;
  previousBtn.style.color = navButtonBase.color;
  previousBtn.style.borderRadius = navButtonBase.borderRadius;
  previousBtn.style.padding = navButtonBase.padding;
  previousBtn.style.fontSize = navButtonBase.fontSize;
  previousBtn.style.fontWeight = navButtonBase.fontWeight;
  previousBtn.style.cursor = navButtonBase.cursor;
  previousBtn.style.maxWidth = navButtonBase.maxWidth;
  previousBtn.style.overflow = navButtonBase.overflow;
  previousBtn.style.textOverflow = navButtonBase.textOverflow;
  previousBtn.style.whiteSpace = navButtonBase.whiteSpace;
  previousBtn.style.textAlign = 'left';
  previousBtn.style.visibility = previousTrip ? 'visible' : 'hidden';
  previousBtn.innerText = previousTrip ? `← ${previousTrip.city.split(',')[0]}` : '';
  previousBtn.onclick = e => {
    e.stopPropagation();
    if (!previousTrip) return;
    onPrevious();
  };

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.style.border = navButtonBase.border;
  nextBtn.style.background = navButtonBase.background;
  nextBtn.style.color = navButtonBase.color;
  nextBtn.style.borderRadius = navButtonBase.borderRadius;
  nextBtn.style.padding = navButtonBase.padding;
  nextBtn.style.fontSize = navButtonBase.fontSize;
  nextBtn.style.fontWeight = navButtonBase.fontWeight;
  nextBtn.style.cursor = navButtonBase.cursor;
  nextBtn.style.maxWidth = navButtonBase.maxWidth;
  nextBtn.style.overflow = navButtonBase.overflow;
  nextBtn.style.textOverflow = navButtonBase.textOverflow;
  nextBtn.style.whiteSpace = navButtonBase.whiteSpace;
  nextBtn.style.textAlign = 'right';
  nextBtn.style.marginLeft = 'auto';
  nextBtn.style.visibility = nextTrip ? 'visible' : 'hidden';
  nextBtn.innerText = nextTrip ? `${nextTrip.city.split(',')[0]} →` : '';
  nextBtn.onclick = e => {
    e.stopPropagation();
    if (!nextTrip) return;
    onNext();
  };

  navWrap.appendChild(previousBtn);
  navWrap.appendChild(nextBtn);

  const stem = document.createElement('div');
  stem.style.position = 'absolute';
  stem.style.left = '18px';
  stem.style.bottom = '-10px';
  stem.style.width = '18px';
  stem.style.height = '18px';
  stem.style.background = colors.detailBg;
  stem.style.borderRight = `1px solid ${colors.detailBorder}`;
  stem.style.borderBottom = `1px solid ${colors.detailBorder}`;
  stem.style.transform = 'rotate(45deg)';

  card.appendChild(closeButton);
  card.appendChild(header);
  card.appendChild(body);
  card.appendChild(navWrap);
  card.appendChild(stem);
  wrapper.appendChild(card);

  const clampToViewport = () => {
    const safeTop = 12;
    const safeBottom = 12;

    wrapper.style.setProperty('--detail-shift-y', '0px');

    const rect = wrapper.getBoundingClientRect();
    let shiftY = 0;

    if (rect.top < safeTop) {
      shiftY += safeTop - rect.top;
    }

    if (rect.bottom > window.innerHeight - safeBottom) {
      shiftY -= rect.bottom - (window.innerHeight - safeBottom);
    }

    wrapper.style.setProperty('--detail-shift-y', `${Math.round(shiftY)}px`);
  };

  window.requestAnimationFrame(clampToViewport);

  return wrapper;
}
