import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import TimelineRange from './TimelineRange';
import WelcomeBubble from './WelcomeBubble';
import {
  buildDetailHtmlData,
  buildPointMap,
  buildPointsData,
  buildArcsData,
} from './globeData';
import { buildGreatCirclePath, findNearestByCoords, getDistanceBasedMidAltitude, haptic, sleep } from './globeUtils';
import { getThemeColors } from './theme';
import { createTripDetailHtmlElement } from './tripDetailHtml';
import {
  findFirstUsTripIndex,
  findMostRecentTripIndex,
  formatDateKey,
  getCountryInfo,
  parseDate,
} from './tripUtils';
import { flagPrimaryColors } from './flagColors';
import type {
  CountryPolygonDatum,
  GlobeHandle,
  HtmlDetailDatum,
  PointDatum,
  SelectionState,
  ThemeMode,
  TravelPoint,
} from './types';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

// Colour helpers — module-scoped so references are always stable
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${alpha})`;
}
function hexBrightRgba(hex: string, boost: number, alpha: number): string {
  const h = hex.replace('#', '');
  const c = (s: number) => Math.min(255, Math.round(parseInt(h.slice(s, s + 2), 16) * boost));
  return `rgba(${c(0)}, ${c(2)}, ${c(4)}, ${alpha})`;
}
const SIDE_TRANSPARENT = () => 'rgba(0,0,0,0)';



// Natural Earth 110m has ISO_A2="-99" for a handful of countries; fall back to ADM0_A3 mapping.
const ADM0_A3_FALLBACK: Record<string, string> = {
  FRA: 'fr',
  NOR: 'no',
  CYN: 'cy',
};

export default function GlobeMap({
  isMobile = false,
  travelData,
  allTravelData,
  theme,
  selection,
  activeDetail,
  setActiveDetail,
  onFlightNavigationStart,
  sidebarVisible,
  welcomeDismissed,
  onDismissWelcome,
  timelineFromDate,
  timelineToDate,
  timelineMinDate,
  timelineMaxDate,
  onTimelineFromDateChange,
  onTimelineToDateChange,
}: {
  isMobile?: boolean;
  travelData: TravelPoint[];
  allTravelData: TravelPoint[];
  theme: ThemeMode;
  selection: SelectionState;
  activeDetail: TravelPoint | null;
  setActiveDetail: (trip: TravelPoint | null) => void;
  onFlightNavigationStart: (trip: TravelPoint) => void;
  sidebarVisible: boolean;
  welcomeDismissed: boolean;
  onDismissWelcome: () => void;
  timelineFromDate: string;
  timelineToDate: string;
  timelineMinDate: string;
  timelineMaxDate: string;
  onTimelineFromDateChange: (value: string) => void;
  onTimelineToDateChange: (value: string) => void;
}) {
  const colors = getThemeColors(theme);
  const globeRef = useRef<GlobeHandle | null>(null);
  const animationTokenRef = useRef(0);
  const autoPlayTokenRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });
  const [expandedDetailTripId, setExpandedDetailTripId] = useState<number | null>(null);
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const [autoPlayActive, setAutoPlayActive] = useState(false);
  const [showRecenterHint, setShowRecenterHint] = useState(false);

  // One-time tip the first time a trip bubble opens.
  useEffect(() => {
    if (!activeDetail) return undefined;
    try {
      if (window.localStorage.getItem('wiml-recenter-hint')) return undefined;
      window.localStorage.setItem('wiml-recenter-hint', '1');
    } catch {
      return undefined;
    }
    const show = window.setTimeout(() => setShowRecenterHint(true), 600);
    window.setTimeout(() => setShowRecenterHint(false), 4600);
    return () => window.clearTimeout(show);
  }, [activeDetail]);

  // ------------------------------------------------------------------
  // Country overlay — single 110m world GeoJSON fetch (once on mount)
  // ------------------------------------------------------------------
  type RawFeature = { properties: Record<string, unknown>; geometry: object };
  const [rawWorldFeatures, setRawWorldFeatures] = useState<RawFeature[]>([]);

  useEffect(() => {
    fetch('/geojson/world-110m.geojson')
      .then(r => r.json())
      .then((d: { features: RawFeature[] }) => setRawWorldFeatures(d.features ?? []))
      .catch(() => {});
  }, []);

  const visitedCodes = useMemo(() => {
    const s = new Set<string>();
    travelData.forEach(t => { const { code } = getCountryInfo(t.city); if (code) s.add(code); });
    return s;
  }, [travelData]);

  // glowingCountryCode is set immediately when navigation starts (not after animation)
  // so the overlay brightens as soon as the user initiates a trip.
  const [glowingCountryCode, setGlowingCountryCode] = useState<string | null>(null);

  const [hoveredCountryCode, setHoveredCountryCode] = useState<string | null>(null);
  const handlePolygonHover = useCallback((datum: object | null) => {
    setHoveredCountryCode((datum as CountryPolygonDatum | null)?.countryCode ?? null);
  }, []);

  // Stable polygon data — only rebuilt when world data or visited countries change.
  // Active/hovered state lives in accessor functions so globe.gl updates only
  // materials for changed polygons (no full mesh teardown = no flicker).
  const countryPolygons = useMemo<CountryPolygonDatum[]>(() => {
    const resolveCode = (f: RawFeature): string | undefined => {
      const raw = f.properties.ISO_A2 as string | undefined;
      if (raw && raw !== '-99') return raw.toLowerCase();
      return ADM0_A3_FALLBACK[f.properties.ADM0_A3 as string ?? ''];
    };
    return rawWorldFeatures
      .filter(f => { const code = resolveCode(f); return code && visitedCodes.has(code); })
      .map(f => ({
        type: 'Feature' as const,
        countryCode: resolveCode(f)!,
        geometry: f.geometry,
        properties: f.properties,
      }));
  }, [rawWorldFeatures, visitedCodes]);

  const capColorFn = useCallback((d: object) => {
    const { countryCode } = d as CountryPolygonDatum;
    const hex = flagPrimaryColors[countryCode] ?? '#ffffff';
    const isGlowing = countryCode === glowingCountryCode;
    const isHovered = countryCode === hoveredCountryCode;
    if (isGlowing && isHovered) return hexBrightRgba(hex, 1.55, 0.65);
    if (isGlowing)              return hexBrightRgba(hex, 1.4,  0.52);
    if (isHovered)              return hexBrightRgba(hex, 1.2,  0.36);
    return hexToRgba(hex, 0.24);
  }, [glowingCountryCode, hoveredCountryCode]);

  const strokeColorFn = useCallback((d: object) => {
    const { countryCode } = d as CountryPolygonDatum;
    const hex = flagPrimaryColors[countryCode] ?? '#ffffff';
    const isGlowing = countryCode === glowingCountryCode;
    const isHovered = countryCode === hoveredCountryCode;
    if (isGlowing || isHovered) return hexBrightRgba(hex, 1.6, 0.85);
    return hexBrightRgba(hex, 1.35, 0.55);
  }, [glowingCountryCode, hoveredCountryCode]);

  const altitudeFn = useCallback((d: object) => {
    const { countryCode } = d as CountryPolygonDatum;
    if (countryCode === hoveredCountryCode) return 0.022;
    if (countryCode === glowingCountryCode) return 0.012;
    return 0.008;
  }, [glowingCountryCode, hoveredCountryCode]);

  const startupTarget = useMemo(() => {
    if (!travelData.length) return null;

    const now = new Date();
    const currentTrip = travelData.find(trip => {
      const arrival = new Date(`${trip.arrival}T00:00:00`);
      const departure = new Date(`${trip.departure || trip.arrival}T00:00:00`);
      if (Number.isNaN(arrival.getTime()) || Number.isNaN(departure.getTime())) return false;
      departure.setHours(23, 59, 59, 999);
      return arrival <= now && now <= departure;
    });

    return currentTrip ?? travelData[travelData.length - 1];
  }, [travelData]);

  useEffect(() => {
    const updateSize = () => {
      const sidebarWidth = !isMobile && sidebarVisible && welcomeDismissed ? 300 : 0;
      setDimensions({
        width: Math.max(window.innerWidth - sidebarWidth, 200),
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [sidebarVisible, welcomeDismissed, isMobile]);

  const pointsData = useMemo(
    () => buildPointsData(travelData, colors.latestPoint, theme, colors.futureArc),
    [travelData, colors.latestPoint, theme, colors.futureArc]
  );

  const pointMap = useMemo(() => buildPointMap(travelData), [travelData]);

  const arcsData = useMemo(
    () => buildArcsData(travelData, colors.futureArc, theme),
    [travelData, colors.futureArc, theme]
  );

  const detailHtmlData = useMemo(() => buildDetailHtmlData(activeDetail), [activeDetail]);
  const currentStayTripId = allTravelData.length ? allTravelData[allTravelData.length - 1].id : null;
  const mostRecentTripIndex = useMemo(() => findMostRecentTripIndex(allTravelData), [allTravelData]);
  const firstUsTripIndex = useMemo(() => findFirstUsTripIndex(allTravelData), [allTravelData]);

  useEffect(() => {
    if (!startupTarget) return;

    const startupAltitude = 1.35; // 25% closer than the previous 1.8 default

    const applyStartupView = () => {
      const globe = globeRef.current;
      if (!globe) return false;

      const controls = globe.controls();
      if (controls) {
        controls.autoRotate = false;
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.minDistance = 90;
        controls.maxDistance = 520;
      }

      globe.pointOfView(
        {
          lat: startupTarget.coords[0],
          lng: startupTarget.coords[1],
          altitude: startupAltitude,
        },
        0
      );

      return true;
    };

    if (applyStartupView()) return;

    // Globe ref can be late on first mount; retry briefly so startup POV is always applied.
    let retries = 0;
    const maxRetries = 40;
    const timer = window.setInterval(() => {
      retries += 1;
      if (applyStartupView() || retries >= maxRetries) {
        window.clearInterval(timer);
      }
    }, 50);

    return () => window.clearInterval(timer);
  }, [startupTarget]);

  const runFocusSequence = useCallback(
    async (target: TravelPoint, originOverride?: TravelPoint | null, options?: { revealDetail?: boolean }) => {
      const globe = globeRef.current;
      if (!globe) return;

      const revealDetail = options?.revealDetail ?? true;
      const token = animationTokenRef.current + 1;
      animationTokenRef.current = token;

      const isStillCurrent = () => animationTokenRef.current === token;

      setActiveDetail(null);
      setGlowingCountryCode(getCountryInfo(target.city).code ?? null);

      let departureTrip = originOverride ?? null;
      if (!departureTrip) {
        const targetIndex = allTravelData.findIndex(t => t.id === target.id);
        departureTrip = targetIndex > 0 ? allTravelData[targetIndex - 1] : null;
      }

      if (!departureTrip) {
        globe.pointOfView(
          {
            lat: target.coords[0],
            lng: target.coords[1],
            altitude: 0.58,
          },
          1200
        );
        await sleep(1250);
        if (!isStillCurrent()) return;
        if (revealDetail) setActiveDetail(target);
        return;
      }

      const departure = departureTrip.coords;
      const arrival = target.coords;
      const midAltitude = getDistanceBasedMidAltitude(departure, arrival);

      globe.pointOfView(
        {
          lat: departure[0],
          lng: departure[1],
          altitude: 0.58,
        },
        1000
      );
      await sleep(1050);
      if (!isStillCurrent()) return;

      globe.pointOfView(
        {
          lat: departure[0],
          lng: departure[1],
          altitude: midAltitude,
        },
        900
      );
      await sleep(950);
      if (!isStillCurrent()) return;

      const cameraPath = buildGreatCirclePath(departure, arrival, 72);
      const pathDuration = 1850;
      const perStep = Math.max(16, Math.floor(pathDuration / cameraPath.length));

      for (let i = 0; i < cameraPath.length; i += 1) {
        if (!isStillCurrent()) return;
        const node = cameraPath[i];
        globe.pointOfView(
          {
            lat: node.lat,
            lng: node.lng,
            altitude: midAltitude,
          },
          perStep + 10
        );
        await sleep(perStep);
      }

      if (!isStillCurrent()) return;

      globe.pointOfView(
        {
          lat: arrival[0],
          lng: arrival[1],
          altitude: 0.58,
        },
        1100
      );
      await sleep(1150);
      if (!isStillCurrent()) return;

      if (revealDetail) setActiveDetail(target);
    },
    [setActiveDetail, setGlowingCountryCode, allTravelData]
  );

  const runPinFocus = useCallback(
    async (target: TravelPoint) => {
      const globe = globeRef.current;
      if (!globe) return;

      const token = animationTokenRef.current + 1;
      animationTokenRef.current = token;

      const isStillCurrent = () => animationTokenRef.current === token;

      setActiveDetail(null);
      setGlowingCountryCode(getCountryInfo(target.city).code ?? null);

      globe.pointOfView(
        {
          lat: target.coords[0],
          lng: target.coords[1],
          altitude: 0.58,
        },
        1000
      );
      await sleep(1050);
      if (!isStillCurrent()) return;

      setActiveDetail(target);
    },
    [setActiveDetail, setGlowingCountryCode]
  );

  // Idle "screensaver" tour: chronologically walks past international trips (no popups) from a random
  // starting point, until the welcome bubble is dismissed.
  useEffect(() => {
    if (welcomeDismissed) return undefined;

    const now = new Date();
    const demoTrips = allTravelData.filter(trip => {
      const arrival = parseDate(trip.arrival);
      if (!arrival || arrival > now) return false;
      return getCountryInfo(trip.city).code !== 'ca';
    });

    if (!demoTrips.length) return undefined;

    let cancelled = false;

    const runDemoLoop = async () => {
      let index = Math.floor(Math.random() * demoTrips.length);
      let current = demoTrips[index];
      while (!cancelled) {
        index = (index + 1) % demoTrips.length;
        const next = demoTrips[index];
        await runFocusSequence(next, current, { revealDetail: false });
        if (cancelled) return;
        current = next;
        await sleep(1400);
      }
    };

    runDemoLoop();

    // Note: no need to bump animationTokenRef here — any real navigation (runPinFocus/
    // runFocusSequence) already bumps it itself, which naturally stops this loop's in-flight hop.
    return () => {
      cancelled = true;
    };
  }, [welcomeDismissed, allTravelData, runFocusSequence]);

  const stopAutoPlay = useCallback(() => {
    autoPlayTokenRef.current += 1;
    setAutoPlayActive(false);
  }, []);

  // Any user interaction during auto-play cancels it (and any in-flight camera hop).
  useEffect(() => {
    if (!autoPlayActive) return;

    const cancel = () => {
      animationTokenRef.current += 1;
      stopAutoPlay();
    };

    window.addEventListener('pointerdown', cancel);
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('keydown', cancel);
    window.addEventListener('touchstart', cancel, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', cancel);
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('keydown', cancel);
      window.removeEventListener('touchstart', cancel);
    };
  }, [autoPlayActive, stopAutoPlay]);

  const startAutoPlay = useCallback(
    async (direction: 'past' | 'future', fromTrip: TravelPoint) => {
      const token = autoPlayTokenRef.current + 1;
      autoPlayTokenRef.current = token;
      const isStillPlaying = () => autoPlayTokenRef.current === token;

      setAutoPlayActive(true);

      let currentTrip = fromTrip;

      while (isStillPlaying()) {
        const currentIndex = allTravelData.findIndex(t => t.id === currentTrip.id);
        const nextIndex = direction === 'past' ? currentIndex - 1 : currentIndex + 1;
        const nextTrip = allTravelData[nextIndex];
        if (!nextTrip) break;

        onFlightNavigationStart(nextTrip);

        // Update timeline boundary as navigation starts so the destination is already
        // visible in the dataset when the camera lands and reveals trip details on zoom-in.
        if (direction === 'past') {
          onTimelineFromDateChange(nextTrip.arrival);
        } else {
          onTimelineToDateChange(nextTrip.departure || nextTrip.arrival);
        }

        await runFocusSequence(nextTrip, currentTrip);

        if (!isStillPlaying()) return;

        currentTrip = nextTrip;
        await sleep(3000);
      }

      if (isStillPlaying()) setAutoPlayActive(false);
    },
    [
      allTravelData,
      onFlightNavigationStart,
      onTimelineFromDateChange,
      onTimelineToDateChange,
      runFocusSequence,
    ]
  );

  const renderDetailHtml = useCallback(
    (datum: object) => {
      const item = datum as HtmlDetailDatum;
      const detailIsExpanded = expandedDetailTripId === item.trip.id && isDetailExpanded;
      const isCurrentStay = currentStayTripId != null && item.trip.id === currentStayTripId;
      const currentIndexAll = allTravelData.findIndex(trip => trip.id === item.trip.id);
      const previousTrip = currentIndexAll > 0 ? allTravelData[currentIndexAll - 1] : null;
      const nextTrip =
        currentIndexAll >= 0 && currentIndexAll < allTravelData.length - 1
          ? allTravelData[currentIndexAll + 1]
          : null;

      return createTripDetailHtmlElement({
        trip: item.trip,
        theme,
        colors,
        isCurrentStay,
        isExpanded: detailIsExpanded,
        onToggleExpanded: (nextExpanded: boolean) => {
          setExpandedDetailTripId(item.trip.id);
          setIsDetailExpanded(nextExpanded);
        },
        previousTrip,
        nextTrip,
        onPrevious: () => {
          if (!previousTrip) return;
          onFlightNavigationStart(previousTrip);
          if (timelineFromDate && previousTrip.arrival < timelineFromDate) {
            onTimelineFromDateChange(previousTrip.arrival);
          }
          if (timelineToDate && previousTrip.arrival > timelineToDate) {
            onTimelineToDateChange(previousTrip.departure || previousTrip.arrival);
          }
          runFocusSequence(previousTrip, item.trip);
        },
        onNext: () => {
          if (!nextTrip) return;
          onFlightNavigationStart(nextTrip);
          const nextEnd = nextTrip.departure || nextTrip.arrival;
          if (timelineToDate && nextEnd > timelineToDate) {
            onTimelineToDateChange(nextEnd);
          }
          if (timelineFromDate && nextTrip.arrival < timelineFromDate) {
            onTimelineFromDateChange(nextTrip.arrival);
          }
          runFocusSequence(nextTrip, item.trip);
        },
        onClose: () => {
          setActiveDetail(null);
          setGlowingCountryCode(null);
          setExpandedDetailTripId(null);
          setIsDetailExpanded(false);
        },
        hasPastTrips: currentIndexAll > 0,
        hasFutureTrips: currentIndexAll >= 0 && currentIndexAll < allTravelData.length - 1,
        isMostRecentTrip: currentIndexAll === mostRecentTripIndex,
        isFirstUsTrip: currentIndexAll === firstUsTripIndex,
        isMobile,
        onSeePast: () => startAutoPlay('past', item.trip),
        onSeeFuture: () => startAutoPlay('future', item.trip),
        onRecenter: () => {
          haptic();
          globeRef.current?.pointOfView(
            { lat: item.trip.coords[0], lng: item.trip.coords[1], altitude: 0.58 },
            700
          );
        },
      });
    },
    [
      allTravelData,
      colors,
      currentStayTripId,
      expandedDetailTripId,
      firstUsTripIndex,
      isDetailExpanded,
      isMobile,
      mostRecentTripIndex,
      onFlightNavigationStart,
      onTimelineFromDateChange,
      onTimelineToDateChange,
      runFocusSequence,
      setActiveDetail,
      setGlowingCountryCode,
      startAutoPlay,
      theme,
      timelineFromDate,
      timelineToDate,
    ]
  );

  useEffect(() => {
    if (!selection?.trip) return;
    runPinFocus(selection.trip);
  }, [selection, runPinFocus]);

  useEffect(() => {
    if (!travelData.length) {
      const t = setTimeout(() => { setActiveDetail(null); setGlowingCountryCode(null); }, 0);
      return () => clearTimeout(t);
    }
  }, [travelData, setActiveDetail, setGlowingCountryCode]);

  const handleSelectToday = useCallback(() => {
    onDismissWelcome();
    const target = allTravelData[mostRecentTripIndex];
    if (!target) return;

    const today = new Date();
    const min = parseDate(timelineMinDate);
    const max = parseDate(timelineMaxDate);
    const arrival = parseDate(target.arrival);
    let clamped = min && today < min ? min : max && today > max ? max : today;
    if (arrival && clamped < arrival) clamped = arrival;

    onTimelineFromDateChange(target.arrival);
    onTimelineToDateChange(formatDateKey(clamped));
    onFlightNavigationStart(target);
    runPinFocus(target);
  }, [
    allTravelData,
    mostRecentTripIndex,
    onDismissWelcome,
    onFlightNavigationStart,
    onTimelineFromDateChange,
    onTimelineToDateChange,
    runPinFocus,
    timelineMaxDate,
    timelineMinDate,
  ]);

  const handleSelectFirst = useCallback(() => {
    onDismissWelcome();
    const target = allTravelData[firstUsTripIndex];
    if (!target) return;

    const arrival = parseDate(target.arrival);
    const departure = parseDate(target.departure);
    const safeTo = departure && arrival && departure >= arrival ? target.departure : target.arrival;

    onTimelineFromDateChange(target.arrival);
    onTimelineToDateChange(safeTo);
    onFlightNavigationStart(target);
    runPinFocus(target);
  }, [
    allTravelData,
    firstUsTripIndex,
    onDismissWelcome,
    onFlightNavigationStart,
    onTimelineFromDateChange,
    onTimelineToDateChange,
    runPinFocus,
  ]);

  const handleSelectAll = useCallback(() => {
    onDismissWelcome();
  }, [onDismissWelcome]);

  // Zoom only via pinch: touch pinch, or trackpad pinch (reported as ctrl+wheel). Plain wheel scroll does nothing.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const isExcluded = (target: EventTarget | null) => {
      const node = target as Element | null;
      return !!node?.closest?.('[data-timeline-ui="true"], [data-detail-scroll="true"]');
    };

    const zoomBy = (factor: number, baseAltitude?: number) => {
      const globe = globeRef.current;
      if (!globe) return;
      const pov = globe.pointOfView() || {};
      const current = baseAltitude ?? (typeof pov.altitude === 'number' ? pov.altitude : 1.8);
      const next = Math.max(0.35, Math.min(5.5, current * factor));
      globe.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: next }, 0);
    };

    const onWheel = (event: globalThis.WheelEvent) => {
      if (!welcomeDismissed || isExcluded(event.target)) return;
      event.preventDefault();
      if (!event.ctrlKey) return;
      zoomBy(Math.exp(event.deltaY * 0.01));
    };

    let pinchStartDistance = 0;
    let pinchStartAltitude = 1.8;
    const touchDistance = (e: TouchEvent) =>
      Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (!welcomeDismissed || e.touches.length !== 2 || isExcluded(e.target)) {
        pinchStartDistance = 0;
        return;
      }
      const pov = globeRef.current?.pointOfView() || {};
      pinchStartDistance = touchDistance(e);
      pinchStartAltitude = typeof pov.altitude === 'number' ? pov.altitude : 1.8;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pinchStartDistance || e.touches.length !== 2) return;
      e.preventDefault();
      const distance = touchDistance(e);
      if (distance > 0) zoomBy(pinchStartDistance / distance, pinchStartAltitude);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchStartDistance = 0;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [welcomeDismissed, travelData.length]);

  // Touch taps are imprecise, so snap to the nearest pin within a zoom-scaled radius.
  const handleTapNearestPin = useCallback(
    (...args: unknown[]) => {
      if (!isMobile || !welcomeDismissed) return;
      const coords = args[args.length - 1] as { lat?: number; lng?: number } | undefined;
      if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;
      const altitude = globeRef.current?.pointOfView()?.altitude ?? 1.8;
      const trip = findNearestByCoords(travelData, coords.lat, coords.lng, 3 + altitude * 4);
      if (trip) {
        haptic();
        runPinFocus(trip);
      }
    },
    [isMobile, welcomeDismissed, travelData, runPinFocus]
  );

  if (!travelData.length) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: colors.globeBg,
          color: colors.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '15px',
        }}
      >
        No trips found for this date range.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%', background: colors.globeBg, touchAction: 'none', overflow: 'hidden' }}
    >
      {!sidebarVisible && !isMobile ? (
        <button
          onClick={() => {
            const event = new CustomEvent('toggle-sidebar');
            window.dispatchEvent(event);
          }}
          style={{
            position: 'absolute',
            top: isMobile ? '62px' : '18px',
            left: isMobile ? '10px' : '18px',
            zIndex: 30,
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            border: `1px solid ${colors.detailBorder}`,
            background: colors.detailBg,
            color: colors.detailText,
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 800,
            backdropFilter: 'blur(10px)',
          }}
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          ☰
        </button>
      ) : null}

      <WelcomeBubble
        theme={theme}
        colors={colors}
        visible={!welcomeDismissed}
        onSelectToday={handleSelectToday}
        onSelectFirst={handleSelectFirst}
        onSelectAll={handleSelectAll}
      />

      <Globe
        ref={globeRef as never}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor={colors.globeBg}
        backgroundImageUrl={colors.backgroundImageUrl}
        globeImageUrl={colors.globeImageUrl}
        bumpImageUrl={colors.bumpImageUrl}
        showAtmosphere
        atmosphereColor={colors.atmosphere}
        atmosphereAltitude={0.18}
        animateIn
        waitForGlobeReady
        rendererConfig={{ antialias: true, alpha: true }}
        arcsData={arcsData}
        arcColor="color"
        arcStroke={0.62}
        arcAltitudeAutoScale={0.28}
        arcDashLength={0.85}
        arcDashGap={0.25}
        arcDashAnimateTime={1800}
        arcsTransitionDuration={600}
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={(d: object) => ((d as PointDatum).isLatest ? 0.2 : 0.15)}
        pointRadius={(d: object) => ((d as PointDatum).isLatest ? 0.38 : 0.3) * (isMobile ? 1.5 : 1)}
        pointResolution={24}
        pointsMerge={false}
        pointsTransitionDuration={300}
        onPointClick={(datum: object) => {
          if (!welcomeDismissed) return;
          const point = datum as PointDatum;
          const trip = pointMap.get(point.id);
          if (trip) {
            haptic();
            runPinFocus(trip);
          }
        }}
        htmlElementsData={detailHtmlData}
        htmlLat={(d: object) => (d as HtmlDetailDatum).lat}
        htmlLng={(d: object) => (d as HtmlDetailDatum).lng}
        htmlElement={renderDetailHtml}
        polygonsData={countryPolygons}
        polygonAltitude={altitudeFn}
        polygonCapColor={capColorFn}
        polygonStrokeColor={strokeColorFn}
        polygonSideColor={SIDE_TRANSPARENT}
        polygonsTransitionDuration={300}
        onPolygonHover={handlePolygonHover}
        onGlobeClick={handleTapNearestPin}
        onPolygonClick={handleTapNearestPin}
      />

      {showRecenterHint ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: isMobile ? 'calc(150px + env(safe-area-inset-bottom))' : '28px',
            zIndex: 35,
            padding: '8px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            color: colors.detailText,
            background: colors.detailBg,
            border: `1px solid ${colors.detailBorder}`,
            backdropFilter: 'blur(10px)',
          }}
        >
          Tip: tap the card to re-centre it
        </div>
      ) : null}

      {welcomeDismissed ? (
        <TimelineRange
          compact={isMobile}
          theme={theme}
          colors={colors}
          timelineFromDate={timelineFromDate}
          timelineToDate={timelineToDate}
          timelineMinDate={timelineMinDate}
          timelineMaxDate={timelineMaxDate}
          onTimelineFromDateChange={onTimelineFromDateChange}
          onTimelineToDateChange={onTimelineToDateChange}
        />
      ) : null}
    </div>
  );
}
