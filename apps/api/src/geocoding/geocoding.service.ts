import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

interface NominatimResponse {
  display_name?: string;
  error?: string;
}

interface CacheEntry {
  address: string;
  expiresAt: number;
}

export interface ReverseGeocodingResult {
  address: string;
  lat: number;
  lng: number;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly MIN_REQUEST_INTERVAL_MS = 1100;
  private readonly REQUEST_TIMEOUT_MS = 8000;

  private readonly cache = new Map<string, CacheEntry>();

  private readonly inFlight = new Map<
    string,
    Promise<string>
  >();

  // 外部 API リクエストを直列化するキュー
  private queue: Promise<void> = Promise.resolve();
  private lastRequestAt = 0;

  private getCacheKey(lat: number, lng: number): string {
    return `${lat.toFixed(3)},${lng.toFixed(3)}`;
  }

  private getCachedAddress(key: string): string | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }

    // LRU: 最近使用したエントリを末尾へ移動
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.address;
  }

  private saveCache(key: string, address: string): void {
    this.cache.delete(key);

    this.cache.set(key, {
      address,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    while (this.cache.size > this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;

      if (oldestKey === undefined) break;

      this.cache.delete(oldestKey);
    }
  }

  // 前のリクエストが完了してから次を開始する
  private async enqueueRequest<T>(
    task: () => Promise<T>,
  ): Promise<T> {
    const previous = this.queue;

    let release!: () => void;

    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;

    try {
      const waitMs = Math.max(
        0,
        this.lastRequestAt +
          this.MIN_REQUEST_INTERVAL_MS -
          Date.now(),
      );

      if (waitMs > 0) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, waitMs);
        });
      }

      this.lastRequestAt = Date.now();

      // task が完了するまでキューを占有する
      return await task();
    } finally {
      release();
    }
  }

  private async fetchAddress(
    lat: number,
    lng: number,
  ): Promise<string> {
    const userAgent = process.env.NOMINATIM_USER_AGENT;

    if (!userAgent) {
      throw new Error('NOMINATIM_USER_AGENT is not configured');
    }

    const url = new URL(
      'https://nominatim.openstreetmap.org/reverse',
    );

    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('accept-language', 'ja');
    url.searchParams.set('layer', 'address');

    return this.enqueueRequest(async () => {
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(this.REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`Nominatim HTTP ${response.status}`);
      }

      const data =
        (await response.json()) as NominatimResponse;

      if (data.error) {
        throw new Error(data.error);
      }

      return data.display_name ?? '住所が見つかりません';
    });
  }

  async reverse(
    lat: number,
    lng: number,
  ): Promise<ReverseGeocodingResult> {
    const key = this.getCacheKey(lat, lng);

    // 1. キャッシュ確認
    const cachedAddress = this.getCachedAddress(key);

    if (cachedAddress !== null) {
      return { address: cachedAddress, lat, lng };
    }

    // 2. 同一地点の同時リクエストを統合
    let pending = this.inFlight.get(key);

    if (!pending) {
      pending = this.fetchAddress(lat, lng)
        .then((address) => {
          this.saveCache(key, address);
          return address;
        })
        .finally(() => {
          this.inFlight.delete(key);
        });

      this.inFlight.set(key, pending);
    }

    // 3. 結果を返す
    try {
      const address = await pending;

      return { address, lat, lng };
    } catch (error) {
      this.logger.error(
        'Reverse geocoding failed',
        error instanceof Error ? error.stack : String(error),
      );

      throw new ServiceUnavailableException(
        '住所の取得に失敗しました',
      );
    }
  }
}
