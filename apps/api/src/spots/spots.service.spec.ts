import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { SpotsService } from './spots.service.js';
import { Spot } from './spot.entity.js';

describe('SpotsService', () => {
  let service: SpotsService;

  const queryBuilder = {
    addSelect: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    setParameters: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    getRawAndEntities: vi.fn(),
  };

  const repository = {
    createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        SpotsService,
        {
          provide: getRepositoryToken(Spot),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(SpotsService);
  });

  it('should convert radiusKm to meters', async () => {
    queryBuilder.getRawAndEntities.mockResolvedValue({
      entities: [],
      raw: [],
    });

    await service.search({
      lat: 35.681236,
      lng: 139.767125,
      radiusKm: 3,
    });

    expect(queryBuilder.setParameters).toHaveBeenCalledWith({
      lat: 35.681236,
      lng: 139.767125,
      radiusMeters: 3000,
    });
  });

  it('should return spots sorted by distance', async () => {
    queryBuilder.getRawAndEntities.mockResolvedValue({
      entities: [
        { id: '1', name: '東京駅' },
        { id: '2', name: '皇居' },
      ],
      raw: [
        { distance_meters: '0' },
        { distance_meters: '1368.5' },
      ],
    });

    const result = await service.search({
      lat: 35.681236,
      lng: 139.767125,
      radiusKm: 3,
    });

    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'distance_meters',
      'ASC',
    );

    expect(result).toEqual([
      { id: '1', name: '東京駅', distanceMeters: 0 },
      { id: '2', name: '皇居', distanceMeters: 1368.5 },
    ]);
  });
});
