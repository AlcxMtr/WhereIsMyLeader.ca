/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  buildGreatCirclePath,
  getDistanceBasedMidAltitude,
  getPastGradientColor,
  sleep,
} from './globeUtils';
import { getThemeColors } from './theme';
import { formatDateLabel, getCountryInfo } from './tripUtils';
import type {
  ArcDatum,
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
  sidebarVisible,
}: {
  travelData: TravelPoint[];
  theme: ThemeMode;
  selection: SelectionState;
  activeDetail: TravelPoint | null;
  setActiveDetail: (trip: TravelPoint | null) => void;
  sidebarVisible: boolean;
}) {
  const colors = getThemeColors(theme);
  const globeRef = useRef<GlobeHandle | null>(null);
  const animationTokenRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });

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

  const pointsData = useMemo<PointDatum[]>(() => {
    return travelData.map((loc, index) => ({
      id: loc.id,
      lat: loc.coords[0],
      lng: loc.coords[1],
      city: loc.city,
      desc: loc.desc,
      arrival: loc.arrival,
      departure: loc.departure,
      isLatest: index === travelData.length - 1,
      color: index === travelData.length - 1 ? colors.latestPoint : colors.point,
    }));
  }, [travelData, colors.latestPoint, colors.point]);

  const pointMap = useMemo(() => {
    const map: globalThis.Map<number, TravelPoint> = new globalThis.Map<number, TravelPoint>();
    travelData.forEach(trip => map.set(trip.id, trip));
    return map;
  }, [travelData]);

  const arcsData = useMemo<ArcDatum[]>(() => {
    const now = new Date();
    const pastSegments = travelData.slice(1).filter(tp => new Date(tp.arrival) <= now).length;
    let seenPast = 0;

    return travelData
      .map((loc, i) => {
        if (i === 0) return null;

        const prev = travelData[i - 1];
        const isFuture = new Date(loc.arrival) > now;

        let color = colors.futureArc;
        if (!isFuture) {
          color = getPastGradientColor(seenPast, Math.max(pastSegments, 1), theme);
          seenPast += 1;
        }

        return {
          startLat: prev.coords[0],
          startLng: prev.coords[1],
          endLat: loc.coords[0],
          endLng: loc.coords[1],
          color,
        };
      })
      .filter((arc): arc is ArcDatum => arc !== null);
  }, [travelData, colors.futureArc, theme]);

  const detailHtmlData = useMemo<HtmlDetailDatum[]>(() => {
    if (!activeDetail) return [];
    return [
      {
        lat: activeDetail.coords[0],
        lng: activeDetail.coords[1],
        trip: activeDetail,
      },
    ];
  }, [activeDetail]);

  const renderDetailHtml = useCallback(
    (datum: object) => {
      const item = datum as HtmlDetailDatum;
      const trip = item.trip;
      const { name: countryName, code: countryCode } = getCountryInfo(trip.city);
      const flagUrl = countryCode ? `https://flagcdn.com/w80/${countryCode}.png` : null;
      const arrivalLabel = formatDateLabel(trip.arrival);
      const departureLabel = formatDateLabel(trip.departure);
      const rangeLabel =
        arrivalLabel && departureLabel ? `${arrivalLabel} → ${departureLabel}` : arrivalLabel || departureLabel;

      const wrapper = document.createElement('div');
      wrapper.style.width = '280px';
      wrapper.style.pointerEvents = 'auto';
      wrapper.style.transform = 'translate(18px, -82%)';

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

      const closeButton = document.createElement('button');
      closeButton.innerText = '×';
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
        setActiveDetail(null);
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
      body.innerText = trip.desc;
      body.style.marginTop = '12px';
      body.style.fontSize = '13px';
      body.style.lineHeight = '1.6';
      body.style.color = colors.detailText;

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
      card.appendChild(stem);
      wrapper.appendChild(card);

      return wrapper;
    },
    [colors.detailBg, colors.detailBorder, colors.detailSub, colors.detailText, setActiveDetail, theme]
  );

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !travelData.length) return;

    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = false;
      controls.enablePan = false;
      controls.enableZoom = true;
      controls.minDistance = 90;
      controls.maxDistance = 520;
    }

    const latest = travelData[travelData.length - 1];
    globe.pointOfView(
      {
        lat: latest.coords[0],
        lng: latest.coords[1],
        altitude: 1.8,
      },
      0
    );
  }, [travelData]);

  const runFocusSequence = useCallback(
    async (target: TravelPoint) => {
      const globe = globeRef.current;
      if (!globe) return;

      const token = animationTokenRef.current + 1;
      animationTokenRef.current = token;

      const isStillCurrent = () => animationTokenRef.current === token;

      setActiveDetail(null);

      const targetIndex = travelData.findIndex(t => t.id === target.id);
      const previous = targetIndex > 0 ? travelData[targetIndex - 1] : null;

      if (!previous) {
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

      const departure = previous.coords;
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

  useEffect(() => {
    if (!selection?.trip) return;
    runFocusSequence(selection.trip);
  }, [selection, runFocusSequence]);

  useEffect(() => {
    if (!travelData.length) setActiveDetail(null);
  }, [travelData, setActiveDetail]);

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
    <div style={{ position: 'relative', width: '100%', height: '100%', background: colors.globeBg }}>
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
        pointAltitude={(d: object) => ((d as PointDatum).isLatest ? 0.18 : 0.13)}
        pointRadius={(d: object) => ((d as PointDatum).isLatest ? 0.28 : 0.2)}
        pointResolution={20}
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

      <div
        style={{
          position: 'absolute',
          right: '18px',
          top: '18px',
          padding: '10px 12px',
          borderRadius: '12px',
          background: colors.detailBg,
          color: colors.detailText,
          fontSize: '12px',
          lineHeight: 1.5,
          border: `1px solid ${colors.detailBorder}`,
          backdropFilter: 'blur(10px)',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: '4px' }}>Globe View</div>
        <div>Drag to rotate</div>
        <div>Scroll to zoom</div>
        <div>Sidebar: flight path animation</div>
        <div>Pin: direct zoom + details</div>
      </div>
    </div>
  );
}
