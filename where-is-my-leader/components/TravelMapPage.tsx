'use client';

import dynamic from 'next/dynamic';

// The globe needs WebGL and the window, so it can only render in the browser.
const TravelMap = dynamic(() => import('./TravelMap'), {
  ssr: false,
  loading: () => <p className="text-center mt-20">Loading map...</p>,
});

/** Full-screen page shell around the map; pass `person` to show someone other than the default subject. */
export default function TravelMapPage({ person }: { person?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="w-full h-screen">
        <TravelMap person={person} />
      </div>
    </main>
  );
}
