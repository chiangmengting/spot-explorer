'use client';

import type { Spot } from '@/types/spot';

interface SpotListProps {
  spots: Spot[];
  loading: boolean;
  onSelect: (spot: Spot) => void;
}

export default function SpotList({
  spots,
  loading,
  onSelect,
}: SpotListProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 p-5">
        <h2 className="text-base font-semibold text-slate-900">
          スポット一覧
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {loading
            ? '検索中...'
            : `${spots.length} 件のスポット`}
        </p>
      </div>

      {/* Spot List */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {!loading && spots.length === 0 && (
          <div className="flex h-full items-center justify-center p-6">
            <p className="text-center text-sm text-slate-500">
              この範囲にスポットがありません
            </p>
          </div>
        )}

        <ul className="space-y-2">
          {spots.map((spot) => (
            <li key={spot.id}>
              <button
                type="button"
                onClick={() => onSelect(spot)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">
                      {spot.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {spot.category}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    {spot.distanceMeters < 1000
                      ? `${Math.round(spot.distanceMeters)} m`
                      : `${(spot.distanceMeters / 1000).toFixed(2)} km`}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-600">
                  {spot.address}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
