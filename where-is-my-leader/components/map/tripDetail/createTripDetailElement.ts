import { cityLabel, getCountryInfo } from '../places';
import { formatTripDateRange } from '../tripUtils';
import { cx } from '../ui/cx';
import { flagUrl } from '../constants';
import type { ThemeMode, TravelPoint } from '../types';
import { button, el } from './dom';
import { markdownToHtml, withLinkedCitations } from './markdown';
import styles from './TripDetail.module.css';

export interface TripDetailOptions {
  trip: TravelPoint;
  theme: ThemeMode;
  isCurrentStay: boolean;
  isExpanded: boolean;
  isMobile: boolean;
  previousTrip: TravelPoint | null;
  nextTrip: TravelPoint | null;
  /** Draw attention to the "explore past/future" pill (used as a nudge on key trips). */
  pulsePast: boolean;
  pulseFuture: boolean;
  onToggleExpanded: (nextExpanded: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  onSeePast: () => void;
  onSeeFuture: () => void;
  onRecenter: () => void;
}


function createSeeTripPill(label: string, pulsing: boolean, onClick: () => void) {
  return button(cx(styles.pill, pulsing && styles.pulsing), label, onClick);
}

/**
 * The pin's detail bubble. globe.gl needs a real DOM node for HTML overlays, so this builds
 * one imperatively; all presentation lives in TripDetail.module.css (themed via CSS variables).
 */
export function createTripDetailElement(options: TripDetailOptions): HTMLElement {
  const {
    trip,
    theme,
    isCurrentStay,
    isExpanded,
    isMobile,
    previousTrip,
    nextTrip,
    onToggleExpanded,
    onPrevious,
    onNext,
    onClose,
    onRecenter,
  } = options;

  const { name: countryName, code: countryCode } = getCountryInfo(trip.city);
  const rangeLabel = formatTripDateRange(trip.arrival, trip.departure, ' -> ');
  const summaryText = trip.summary?.trim() || trip.desc?.trim() || '';
  const fullText = trip.desc?.trim() || summaryText;

  const wrapper = el('div', cx(styles.wrapper, isMobile && styles.touch));

  if (previousTrip || nextTrip) {
    wrapper.appendChild(
      el('div', styles.pillBar, [
        previousTrip && createSeeTripPill('← Explore past trips', options.pulsePast, options.onSeePast),
        nextTrip && createSeeTripPill('Explore future trips →', options.pulseFuture, options.onSeeFuture),
      ])
    );
  }

  const closeButton = button(styles.close, 'x', onClose);

  const header = el('div', styles.header);
  if (countryCode) {
    const flag = el('img', styles.flag);
    flag.src = flagUrl(countryCode, 80);
    flag.alt = countryName ?? '';
    header.appendChild(flag);
  }

  const title = el('div', styles.title);
  title.textContent = trip.city;
  const titleWrap = el('div', styles.titleWrap, [title]);
  if (rangeLabel) {
    const subtitle = el('div', styles.subtitle);
    subtitle.textContent = rangeLabel;
    titleWrap.appendChild(subtitle);
  }
  header.appendChild(titleWrap);

  const citations = Array.isArray(trip.citations) ? trip.citations.filter(Boolean) : [];
  const narrative = el('div');
  narrative.innerHTML = withLinkedCitations(
    markdownToHtml(isExpanded ? fullText : summaryText),
    citations,
    styles.citation
  );

  const body = el('div', cx('cyber-scrollbar', styles.body), [narrative]);
  body.setAttribute('data-detail-scroll', 'true');
  body.dataset.theme = theme;
  body.dataset.scrolling = 'false';
  body.addEventListener('wheel', e => e.stopPropagation(), { passive: true });

  const hasDetailToggle = summaryText !== fullText;
  const detailActions = hasDetailToggle
    ? el('div', styles.actions, [
        button(styles.ghostButton, isExpanded ? 'Show less' : 'Learn more', () => onToggleExpanded(!isExpanded)),
      ])
    : null;

  const previousButton = button(
    cx(styles.navButton, styles.navPrevious, !previousTrip && styles.hidden),
    previousTrip ? `← ${cityLabel(previousTrip.city)}` : '',
    onPrevious
  );
  const nextButton = button(
    cx(styles.navButton, styles.navNext, !nextTrip && styles.hidden),
    nextTrip ? `${cityLabel(nextTrip.city)} →` : '',
    onNext
  );

  const card = el('div', cx(styles.card, isCurrentStay && styles.current), [
    closeButton,
    header,
    body,
    detailActions,
    el('div', styles.nav, [previousButton, nextButton]),
    el('div', styles.stem),
  ]);
  card.addEventListener('click', e => {
    if ((e.target as Element).closest('button, a')) return;
    if (window.getSelection()?.toString()) return;
    onRecenter();
  });
  wrapper.appendChild(card);

  scheduleViewportClamp(wrapper);
  return wrapper;
}

/** Nudges the bubble vertically so it stays on screen and below the timeline. */
function clampToViewport(wrapper: HTMLElement) {
  const timelineGap = 16;
  const timelineRect = document.querySelector('[data-timeline-ui="true"]')?.getBoundingClientRect();
  const timelineSafeTop =
    timelineRect && timelineRect.width > 0 && timelineRect.height > 0
      ? Math.ceil(timelineRect.bottom + timelineGap)
      : 12;
  const safeTop = Math.max(12, timelineSafeTop);
  const safeBottom = 12;

  wrapper.style.setProperty('--detail-shift-y', '0px');

  const rect = wrapper.getBoundingClientRect();
  const minShift = safeTop - rect.top;
  const maxShift = window.innerHeight - safeBottom - rect.bottom;

  // If the card can't satisfy both bounds, prioritize staying below the timeline.
  const shiftY = minShift > maxShift ? minShift : Math.min(Math.max(0, minShift), maxShift);
  wrapper.style.setProperty('--detail-shift-y', `${Math.round(shiftY)}px`);
}

// Re-clamp after the initial paint and shortly after to catch late layout/overlay updates.
function scheduleViewportClamp(wrapper: HTMLElement) {
  const clamp = () => clampToViewport(wrapper);
  window.requestAnimationFrame(() => {
    clamp();
    window.requestAnimationFrame(clamp);
  });
  window.setTimeout(clamp, 80);
  window.setTimeout(clamp, 180);
}
