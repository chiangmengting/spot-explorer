import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { GeocodingService } from './geocoding.service.js';

describe('GeocodingService', () => {
  let service: GeocodingService;

  const originalUserAgent = process.env.NOMINATIM_USER_AGENT;

  beforeEach(() => {
    service = new GeocodingService();

    process.env.NOMINATIM_USER_AGENT =
      'SpotExplorerTest/1.0 (test@example.com)';
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    if (originalUserAgent === undefined) {
      delete process.env.NOMINATIM_USER_AGENT;
    } else {
      process.env.NOMINATIM_USER_AGENT = originalUserAgent;
    }
  });

  it('should cache reverse geocoding results', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        display_name: '東京都千代田区丸の内',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const first = await service.reverse(
      35.681236,
      139.767125,
    );

    const second = await service.reverse(
      35.681236,
      139.767125,
    );

    expect(first.address).toBe('東京都千代田区丸の内');
    expect(second.address).toBe(first.address);

    // 同じ座標では外部 API を再呼び出ししない
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should deduplicate concurrent requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        display_name: '東京都千代田区丸の内',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const [first, second] = await Promise.all([
      service.reverse(35.681236, 139.767125),
      service.reverse(35.681236, 139.767125),
    ]);

    expect(first.address).toBe(second.address);

    // 同時リクエストも外部 API 呼び出しは1回
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should serialize requests and respect rate limit', async () => {
    vi.useFakeTimers();

    try {
      vi.setSystemTime(new Date('2026-11-07T00:00:00Z'));

      const requestTimes: number[] = [];
      let activeRequests = 0;
      let maxConcurrentRequests = 0;

      const fetchMock = vi.fn().mockImplementation(async () => {
        requestTimes.push(Date.now());

        activeRequests++;
        maxConcurrentRequests = Math.max(
          maxConcurrentRequests,
          activeRequests,
        );

        try {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, 100);
          });

          return {
            ok: true,
            json: async () => ({
              display_name: '東京都',
            }),
          };
        } finally {
          activeRequests--;
        }
      });

      vi.stubGlobal('fetch', fetchMock);

      const requests = Promise.all([
        service.reverse(35.681236, 139.767125),
        service.reverse(35.700000, 139.700000),
      ]);

      await vi.runAllTimersAsync();

      const results = await requests;

      expect(results).toHaveLength(2);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      // 外部リクエストが同時実行されない
      expect(maxConcurrentRequests).toBe(1);

      // リクエスト開始間隔が1100ms以上
      expect(requestTimes[1] - requestTimes[0]).toBeGreaterThanOrEqual(
        1100,
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
