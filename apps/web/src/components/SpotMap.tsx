'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Marker as LeafletMarker } from 'leaflet';

import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';

import MapEvents from './MapEvents';
import type { Spot } from '@/types/spot';

interface SpotMapProps {
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

interface SelectedSpotControllerProps {
  selectedSpot: Spot | null;
  selectionId: number;
  markerRefs: React.RefObject<Map<string, LeafletMarker>>;
}

// 東京駅の初期座標
const TOKYO_STATION: [number, number] = [
  35.681236,
  139.767125,
];

// Leaflet Marker Icon
const markerIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  iconRetinaUrl: '/images/marker-icon-2x.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// スポット一覧で選択された場合のみ地図を移動する
function SelectedSpotController({
  selectedSpot,
  selectionId,
  markerRefs,
}: SelectedSpotControllerProps) {
  const map = useMap();

  // 最後に処理した選択イベントを記録
  const lastHandledSelectionId = useRef(0);

  useEffect(() => {
    if (!selectedSpot || selectionId === 0) {
      return;
    }

    // 同じ選択イベントでは再度 flyTo しない
    if (lastHandledSelectionId.current === selectionId) {
      return;
    }

    lastHandledSelectionId.current = selectionId;

    const [lng, lat] = selectedSpot.location.coordinates;

    const target = L.latLng(lat, lng);
    const targetZoom = Math.max(map.getZoom(), 14);

    const openPopup = () => {
      const marker = markerRefs.current.get(selectedSpot.id);

      if (marker) {
        marker.openPopup();
      }
    };

    const alreadyAtTarget =
      map.getCenter().distanceTo(target) < 1 &&
      map.getZoom() === targetZoom;

    // すでに対象地点にいる場合は移動しない
    if (alreadyAtTarget) {
      openPopup();
      return;
    }

    // 地図移動完了後に Popup を開く
    map.once('moveend', openPopup);

    map.flyTo(target, targetZoom, {
      duration: 0.8,
    });

    return () => {
      map.off('moveend', openPopup);
    };
  }, [map, selectedSpot, selectionId, markerRefs]);

  return null;
}

export default function SpotMap({
  spots,
  center,
  radiusKm,
  selectedSpot,
  selectionId,
  onCenterChange,
}: SpotMapProps) {
  // Marker のインスタンスを保持
  const markerRefs = useRef(new Map<string, LeafletMarker>());

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={TOKYO_STATION}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full"
      >
        {/* OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 地図の中心座標変更を監視 */}
        <MapEvents onCenterChange={onCenterChange} />

        {/* 検索範囲 */}
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 2,
          }}
        />

        {/* 選択されたスポットへの移動 */}
        <SelectedSpotController
          selectedSpot={selectedSpot}
          selectionId={selectionId}
          markerRefs={markerRefs}
        />

        {/* スポットマーカー */}
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            icon={markerIcon}
            position={[
              spot.location.coordinates[1],
              spot.location.coordinates[0],
            ]}
            ref={(marker) => {
              if (marker) {
                markerRefs.current.set(spot.id, marker);
              } else {
                markerRefs.current.delete(spot.id);
              }
            }}
          >
            <Popup autoPan={false}>
              <div>
                <h3 className="font-bold">{spot.name}</h3>

                <p>{spot.category}</p>

                <p>{spot.address}</p>

                <p>
                  距離：{Math.round(spot.distanceMeters)} m
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
