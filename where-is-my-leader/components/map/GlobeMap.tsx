import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import styles from './GlobeMap.module.css';
import { buildArcsData, buildDetailHtmlData, buildPointsData } from './globe/globeData';
import { haptic } from './globe/browser';
import { useCountryOverlay } from './hooks/useCountryOverlay';
import { useGlobeCamera, useStartupView } from './hooks/useGlobeCamera';
import { useGlobeSize } from './hooks/useGlobeSize';
import { useNearestPinTap, useZoomGestures } from './hooks/useGlobeInteractions';
import { useRecenterHint } from './hooks/useRecenterHint';
import { useTripDetailBubble } from './hooks/useTripDetailBubble';
import { useAutoPlay, useDemoTour } from './hooks/useTripPlayback';
import { useWelcomeActions } from './hooks/useWelcomeActions';
import { getThemeColors } from './theme';
import TimelineRange from './TimelineRange';
import { findCurrentTripIndex, findFirstTripIndex, findMostRecentTripIndex } from './tripUtils';
import type { GlobeHandle, HtmlDetailDatum, PointDatum, SelectionState, Subject, ThemeMode, TimelineState, TravelPoint } from './types';
import WelcomeBubble from './WelcomeBubble';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

const SIDE_TRANSPARENT = () => 'rgba(0,0,0,0)';

const GLOBE_STATIC_PROPS = {
  showAtmosphere: true,
  atmosphereAltitude: 0.18,
  animateIn: true,
  waitForGlobeReady: true,
  rendererConfig: { antialias: true, alpha: true },
  arcColor: 'color',
  arcStroke: 0.62,
  arcAltitudeAutoScale: 0.28,
  arcDashLength: 0.85,
  arcDashGap: 0.25,
  arcDashAnimateTime: 1800,
  arcsTransitionDuration: 600,
  pointLat: 'lat',
  pointLng: 'lng',
  pointColor: 'color',
  pointResolution: 24,
  pointsMerge: false,
  pointsTransitionDuration: 300,
  polygonSideColor: SIDE_TRANSPARENT,
  polygonsTransitionDuration: 300,
} as const;

export default function GlobeMap({
  isMobile,
  subject,
  travelData,
  allTravelData,
  theme,
  selection,
  activeDetail,
  setActiveDetail,
  onNavigateStart,
  sidebarVisible,
  onShowSidebar,
  welcomeDismissed,
  onDismissWelcome,
  onSeeAllTrips,
  timeline,
}: {
  isMobile: boolean;
  subject: Subject;
  /** Trips inside the selected date range. */
  travelData: TravelPoint[];
  /** Every trip, regardless of the date range (navigation steps through these). */
  allTravelData: TravelPoint[];
  theme: ThemeMode;
  selection: SelectionState;
  activeDetail: TravelPoint | null;
  setActiveDetail: (trip: TravelPoint | null) => void;
  onNavigateStart: (trip: TravelPoint) => void;
  sidebarVisible: boolean;
  onShowSidebar: () => void;
  welcomeDismissed: boolean;
  onDismissWelcome: () => void;
  onSeeAllTrips: () => void;
  timeline: TimelineState;
}) {
  const colors = getThemeColors(theme);
  const globeRef = useRef<GlobeHandle | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const overlay = useCountryOverlay(travelData);
  const { setGlowingCountryCode } = overlay;
  const { flyToTrip, focusPin, lookAt, cancel: cancelCamera } = useGlobeCamera({
    globeRef,
    allTravelData,
    setActiveDetail,
    setGlowingCountryCode,
  });

  const startupTarget = useMemo(() => {
    if (!travelData.length) return null;
    return travelData[findCurrentTripIndex(travelData)] ?? travelData[travelData.length - 1];
  }, [travelData]);
  useStartupView(globeRef, startupTarget);

  const size = useGlobeSize(!isMobile && sidebarVisible && welcomeDismissed);

  const mostRecentTripIndex = useMemo(() => findMostRecentTripIndex(allTravelData), [allTravelData]);
  const firstTripIndex = useMemo(
    () => findFirstTripIndex(allTravelData, subject.firstTripStrategy),
    [allTravelData, subject.firstTripStrategy]
  );

  const { startAutoPlay } = useAutoPlay({ allTravelData, flyToTrip, cancelCamera, onNavigateStart, timeline });
  useDemoTour(!welcomeDismissed, allTravelData, flyToTrip);

  const closeDetail = useCallback(() => {
    setActiveDetail(null);
    setGlowingCountryCode(null);
  }, [setActiveDetail, setGlowingCountryCode]);

  const renderDetailHtml = useTripDetailBubble({
    allTravelData,
    theme,
    isMobile,
    mostRecentTripIndex,
    firstTripIndex,
    timeline,
    globeRef,
    flyToTrip,
    startAutoPlay,
    onNavigateStart,
    closeDetail,
  });

  const welcome = useWelcomeActions({
    allTravelData,
    mostRecentTripIndex,
    firstTripIndex,
    timeline,
    onDismissWelcome,
    onSeeAllTrips,
    onNavigateStart,
    focusPin,
    lookAt,
    cancelCamera,
    clearDetail: () => setActiveDetail(null),
  });

  const showRecenterHint = useRecenterHint(activeDetail);
  useZoomGestures(containerRef, globeRef, { isMobile, welcomeDismissed, hasTrips: travelData.length > 0 });
  const handleTap = useNearestPinTap(globeRef, { isMobile, welcomeDismissed, travelData, onPick: focusPin });

  useEffect(() => {
    if (selection?.trip) focusPin(selection.trip);
  }, [selection, focusPin]);

  useEffect(() => {
    if (travelData.length) return undefined;
    const timer = setTimeout(closeDetail, 0);
    return () => clearTimeout(timer);
  }, [travelData, closeDetail]);

  const tripsById = useMemo(() => new Map(travelData.map(trip => [trip.id, trip])), [travelData]);
  const pointsData = useMemo(
    () => buildPointsData(travelData, colors.latestPoint, theme, colors.futureArc),
    [travelData, colors.latestPoint, theme, colors.futureArc]
  );
  const arcsData = useMemo(
    () => buildArcsData(travelData, colors.futureArc, theme),
    [travelData, colors.futureArc, theme]
  );
  const detailHtmlData = useMemo(() => buildDetailHtmlData(activeDetail), [activeDetail]);

  if (!travelData.length) {
    return <div className={styles.empty}>No trips found for this date range.</div>;
  }

  return (
    <div ref={containerRef} className={styles.container}>
      {!sidebarVisible && !isMobile ? (
        <button onClick={onShowSidebar} className={styles.showSidebar} aria-label="Show sidebar" title="Show sidebar">
          ☰
        </button>
      ) : null}

      <WelcomeBubble
        visible={!welcomeDismissed}
        onSelectToday={welcome.showToday}
        onSelectFirst={welcome.showFirst}
        onSelectAll={welcome.showAll}
        subject={subject}
      />

      <Globe
        {...GLOBE_STATIC_PROPS}
        ref={globeRef as never}
        width={size.width}
        height={size.height}
        backgroundColor={colors.globeBg}
        backgroundImageUrl={colors.backgroundImageUrl}
        globeImageUrl={colors.globeImageUrl}
        bumpImageUrl={colors.bumpImageUrl}
        atmosphereColor={colors.atmosphere}
        arcsData={arcsData}
        pointsData={pointsData}
        pointAltitude={(d: object) => ((d as PointDatum).isLatest ? 0.2 : 0.15)}
        pointRadius={(d: object) => ((d as PointDatum).isLatest ? 0.38 : 0.3) * (isMobile ? 1.5 : 1)}
        onPointClick={(datum: object) => {
          if (!welcomeDismissed) return;
          const trip = tripsById.get((datum as PointDatum).id);
          if (trip) {
            haptic();
            focusPin(trip);
          }
        }}
        htmlElementsData={detailHtmlData}
        htmlLat={(d: object) => (d as HtmlDetailDatum).lat}
        htmlLng={(d: object) => (d as HtmlDetailDatum).lng}
        htmlElement={renderDetailHtml}
        polygonsData={overlay.polygons}
        polygonAltitude={overlay.altitude}
        polygonCapColor={overlay.capColor}
        polygonStrokeColor={overlay.strokeColor}
        onPolygonHover={overlay.onHover}
        onGlobeClick={handleTap}
        onPolygonClick={handleTap}
      />

      {showRecenterHint ? (
        <div className={`${styles.hint} ${isMobile ? styles.hintMobile : ''}`}>Tip: tap the card to re-centre it</div>
      ) : null}

      {welcomeDismissed ? <TimelineRange compact={isMobile} theme={theme} timeline={timeline} /> : null}
    </div>
  );
}
