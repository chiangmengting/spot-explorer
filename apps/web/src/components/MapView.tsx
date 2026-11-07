'use client';

import dynamic from 'next/dynamic';
import type { Spot } from '@/types/spot';

interface MapViewProps {
  spots: Spot[];
  center: {
    lat: number;
    lng: number;
  };
  radiusKm: number;
  selectedSpot: Spot | null;
  selectionId: number;
  onCenterChange: (lat: number, lng: number) => void;
}

const SpotMap = dynamic(() => import('./SpotMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-100">
      地図を読み込み中...
    </div>
  ),
});

export default function MapView(props: MapViewProps) {
  return <SpotMap {...props} />;
}
