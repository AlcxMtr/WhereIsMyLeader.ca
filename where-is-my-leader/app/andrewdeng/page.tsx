'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Map component, turning OFF SSR
// Adjust the import path based on exactly where this page sits relative to your components folder
const DynamicMap = dynamic(() => import('../../components/Map'), {
    ssr: false,
    loading: () => <p className="text-center mt-20">Loading map...</p>
});

export default function AndrewDengPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between">
            <div className="w-full h-screen">
                {/* Pass the parameter directly into the component */}
                <DynamicMap person="andrewdeng" />
            </div>
        </main>
    );
}