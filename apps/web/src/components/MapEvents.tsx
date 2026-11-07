'use client';

import { useMapEvents } from 'react-leaflet';

interface MapEventsProps {
  onCenterChange: (lat: number, lng: number) => void;
}

export default function MapEvents({
  onCenterChange,
}: MapEventsProps) {
  useMapEvents({
    moveend(event) {
      const center = event.target.getCenter();

      onCenterChange(center.lat, center.lng);
    },
  });

  return null;
}
