'use client';

import { useEffect, useState } from 'react';

import MapView from './MapView';
import SpotList from './SpotList';
import type { Spot } from '@/types/spot';

const TOKYO_STATION = {
  lat: 35.681236,
  lng: 139.767125,
};

const RADIUS_OPTIONS = [1, 3, 5, 10] as const;
const SPOT_DEBOUNCE_MS = 300;
const GEOCODING_DEBOUNCE_MS = 1500;

interface ReverseGeocodingResponse {
  address: string;
  lat: number;
  lng: number;
}

export default function SpotExplorer() {
  const [center, setCenter] = useState(TOKYO_STATION);
  const [radiusKm, setRadiusKm] = useState(3);
  const [spots, setSpots] = useState<Spot[]>([]);

  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [selectionId, setSelectionId] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [address, setAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressError, setAddressError] = useState(false);

  // スポット検索
  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          lat: String(center.lat),
          lng: String(center.lng),
          radiusKm: String(radiusKm),
        });

        const response = await fetch(`/api/spots?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: Spot[] = await response.json();

        if (!controller.signal.aborted) {
          setSpots(data);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error ? err.message : '取得失敗',
        );
        setSpots([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, SPOT_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [center.lat, center.lng, radiusKm]);

  // 最新の検索結果に選択中スポットが存在するか確認
  const activeSelectedSpot =
    selectedSpot &&
    spots.some((spot) => spot.id === selectedSpot.id)
      ? selectedSpot
      : null;

  // 逆ジオコーディング
  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setAddressLoading(true);
        setAddressError(false);

        const params = new URLSearchParams({
          lat: String(center.lat),
          lng: String(center.lng),
        });

        const response = await fetch(
          `/api/geocoding/reverse?${params}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data =
          (await response.json()) as ReverseGeocodingResponse;

        if (!controller.signal.aborted) {
          setAddress(data.address);
        }
      } catch {
        if (controller.signal.aborted) return;

        setAddressError(true);
        setAddress(null);
      } finally {
        if (!controller.signal.aborted) {
          setAddressLoading(false);
        }
      }
    }, GEOCODING_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [center.lat, center.lng]);

  const handleCenterChange = (lat: number, lng: number) => {
    setCenter({ lat, lng });
  };

  const handleSpotSelect = (spot: Spot) => {
    setSelectedSpot(spot);
    setSelectionId((prev) => prev + 1);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 p-4 lg:min-h-0 lg:flex-row">
      {/* Map */}
      <section className="h-[55vh] min-h-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100vh-120px)] lg:min-w-0 lg:flex-[65]">
        <MapView
          spots={spots}
          center={center}
          radiusKm={radiusKm}
          selectedSpot={activeSelectedSpot}
          selectionId={selectionId}
          onCenterChange={handleCenterChange}
        />
      </section>

      {/* Sidebar */}
      <aside className="flex min-h-[360px] flex-col gap-4 lg:h-[calc(100vh-120px)] lg:min-w-0 lg:flex-[35]">
        {/* Search Settings */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            検索条件
          </h2>

          <label
            htmlFor="search-radius"
            className="mt-4 block text-sm font-medium text-slate-700"
          >
            検索半径
          </label>

          <select
            id="search-radius"
            value={radiusKm}
            onChange={(event) => {
              setRadiusKm(Number(event.target.value));
            }}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {RADIUS_OPTIONS.map((radius) => (
              <option key={radius} value={radius}>
                {radius} km
              </option>
            ))}
          </select>

          <p className="mt-3 text-xs text-slate-500">
            地図を移動すると自動的に再検索します。
          </p>
        </section>

        {/* Center Address */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            現在の中心地点
          </h2>

          <p
            aria-live="polite"
            className="mt-2 text-sm leading-relaxed text-slate-700"
          >
            {addressLoading
              ? '住所を取得中...'
              : addressError
                ? '住所を取得できませんでした'
                : address ?? '住所が見つかりません'}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Address data © OpenStreetMap contributors
          </p>
        </section>

        {/* Spot List */}
        <section className="flex min-h-[240px] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {error ? (
            <div role="alert" className="p-5 text-sm text-red-600">
              スポットの取得に失敗しました：{error}
            </div>
          ) : (
            <SpotList
              spots={spots}
              loading={loading}
              onSelect={handleSpotSelect}
            />
          )}
        </section>
      </aside>
    </div>
  );
}
