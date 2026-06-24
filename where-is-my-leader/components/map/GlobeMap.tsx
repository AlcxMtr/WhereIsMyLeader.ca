import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WheelEvent } from 'react';

import TimelineRange from './TimelineRange';
import {
  buildDetailHtmlData,
  buildPointMap,
  buildPointsData,
  buildArcsData,
} from './globeData';
import { buildGreatCirclePath, getDistanceBasedMidAltitude, sleep } from './globeUtils';
import { getThemeColors } from './theme';
import { createTripDetailHtmlElement } from './tripDetailHtml';
import type {
  GlobeHandle,
  HtmlDetailDatum,
  PointDatum,
  SelectionState,
  ThemeMode,
  TravelPoint,
} from './types';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

export default function GlobeMap({
  travelData,
  theme,
  selection,
  activeDetail,
  setActiveDetail,
  onFlightNavigationStart,
  sidebarVisible,
  timelineFromDate,
  timelineToDate,
  timelineMinDate,
  timelineMaxDate,
  onTimelineFromDateChange,
  onTimelineToDateChange,
}: {
  travelData: TravelPoint[];
  theme: ThemeMode;
  selection: SelectionState;
  activeDetail: TravelPoint | null;
  setActiveDetail: (trip: TravelPoint | null) => void;
  onFlightNavigationStart: (trip: TravelPoint) => void;
  sidebarVisible: boolean;
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
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });

  const startupTarget = useMemo(() => {
    if (!travelData.length) return null;

    const now = new Date();
    const currentTrip = travelData.find(trip => {
      const arrival = new Date(trip.arrival);
      const departure = new Date(trip.departure || trip.arrival);
      if (Number.isNaN(arrival.getTime()) || Number.isNaN(departure.getTime())) return false;
      departure.setHours(23, 59, 59, 999);
      return arrival <= now && now <= departure;
    });

    return currentTrip ?? travelData[travelData.length - 1];
  }, [travelData]);

  useEffect(() => {
    const updateSize = () => {
      const sidebarWidth = sidebarVisible ? 300 : 0;
      setDimensions({
        width: Math.max(window.innerWidth - sidebarWidth, 320),
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [sidebarVisible]);

  const pointsData = useMemo(
    () => buildPointsData(travelData, colors.latestPoint, colors.point),
    [travelData, colors.latestPoint, colors.point]
  );

  const pointMap = useMemo(() => buildPointMap(travelData), [travelData]);

  const arcsData = useMemo(
    () => buildArcsData(travelData, colors.futureArc, theme),
    [travelData, colors.futureArc, theme]
  );

  const detailHtmlData = useMemo(() => buildDetailHtmlData(activeDetail), [activeDetail]);

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
    async (target: TravelPoint, originOverride?: TravelPoint | null) => {
      const globe = globeRef.current;
      if (!globe) return;

      const token = animationTokenRef.current + 1;
      animationTokenRef.current = token;

      const isStillCurrent = () => animationTokenRef.current === token;

      setActiveDetail(null);

      let departureTrip = originOverride ?? null;
      if (!departureTrip) {
        const targetIndex = travelData.findIndex(t => t.id === target.id);
        departureTrip = targetIndex > 0 ? travelData[targetIndex - 1] : null;
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
        setActiveDetail(target);
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

      setActiveDetail(target);
    },
    [setActiveDetail, travelData]
  );

  const runPinFocus = useCallback(
    async (target: TravelPoint) => {
      const globe = globeRef.current;
      if (!globe) return;

      const token = animationTokenRef.current + 1;
      animationTokenRef.current = token;

      const isStillCurrent = () => animationTokenRef.current === token;

      setActiveDetail(null);

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
    [setActiveDetail]
  );

  const renderDetailHtml = useCallback(
    (datum: object) => {
      const item = datum as HtmlDetailDatum;
      const currentIndex = travelData.findIndex(trip => trip.id === item.trip.id);
      const previousTrip = currentIndex > 0 ? travelData[currentIndex - 1] : null;
      const nextTrip =
        currentIndex >= 0 && currentIndex < travelData.length - 1 ? travelData[currentIndex + 1] : null;

      return createTripDetailHtmlElement({
        trip: item.trip,
        theme,
        colors,
        previousTrip,
        nextTrip,
        onPrevious: () => {
          if (!previousTrip) return;
          onFlightNavigationStart(previousTrip);
          runFocusSequence(previousTrip, item.trip);
        },
        onNext: () => {
          if (!nextTrip) return;
          onFlightNavigationStart(nextTrip);
          runFocusSequence(nextTrip, item.trip);
        },
        onClose: () => setActiveDetail(null),
      });
    },
    [colors, onFlightNavigationStart, runFocusSequence, setActiveDetail, theme, travelData]
  );

  useEffect(() => {
    if (!selection?.trip) return;
    runPinFocus(selection.trip);
  }, [selection, runPinFocus]);

  useEffect(() => {
    if (!travelData.length) setActiveDetail(null);
  }, [travelData, setActiveDetail]);

  const handleManualWheelZoom = useCallback((event: WheelEvent<HTMLDivElement>) => {
    const globe = globeRef.current;
    if (!globe) return;

    const target = event.target as Element | null;
    if (target?.closest('[data-timeline-ui="true"]')) return;
    if (target?.closest('[data-detail-scroll="true"]')) return;

    event.preventDefault();
    event.stopPropagation();

    const pov = globe.pointOfView() || {};
    const currentAltitude = typeof pov.altitude === 'number' ? pov.altitude : 1.8;

    const zoomFactor = Math.exp(event.deltaY * 0.0045);
    const nextAltitude = Math.max(0.35, Math.min(5.5, currentAltitude * zoomFactor));

    globe.pointOfView(
      {
        lat: pov.lat,
        lng: pov.lng,
        altitude: nextAltitude,
      },
      0
    );
  }, []);

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
      style={{ position: 'relative', width: '100%', height: '100%', background: colors.globeBg }}
      onWheel={handleManualWheelZoom}
    >
      {!sidebarVisible ? (
        <button
          onClick={() => {
            const event = new CustomEvent('toggle-sidebar');
            window.dispatchEvent(event);
          }}
          style={{
            position: 'absolute',
            top: '18px',
            left: '18px',
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
        pointRadius={(d: object) => ((d as PointDatum).isLatest ? 0.38 : 0.3)}
        pointResolution={24}
        pointsMerge={false}
        pointsTransitionDuration={300}
        onPointClick={(datum: object) => {
          const point = datum as PointDatum;
          const trip = pointMap.get(point.id);
          if (trip) runPinFocus(trip);
        }}
        htmlElementsData={detailHtmlData}
        htmlLat={(d: object) => (d as HtmlDetailDatum).lat}
        htmlLng={(d: object) => (d as HtmlDetailDatum).lng}
        htmlElement={renderDetailHtml}
      />

      <TimelineRange
        theme={theme}
        colors={colors}
        timelineFromDate={timelineFromDate}
        timelineToDate={timelineToDate}
        timelineMinDate={timelineMinDate}
        timelineMaxDate={timelineMaxDate}
        onTimelineFromDateChange={onTimelineFromDateChange}
        onTimelineToDateChange={onTimelineToDateChange}
      />
    </div>
  );
}
