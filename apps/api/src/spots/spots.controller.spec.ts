import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

import { SpotsController } from './spots.controller.js';
import { SpotsService } from './spots.service.js';

describe('SpotsController', () => {
  let controller: SpotsController;

  const mockSpotsService = {
    search: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpotsController],
      providers: [
        {
          provide: SpotsService,
          useValue: mockSpotsService,
        },
      ],
    }).compile();

    controller = module.get<SpotsController>(SpotsController);
  });

  it('should pass search parameters to SpotsService', async () => {
    const query = {
      lat: 35.681236,
      lng: 139.767125,
      radiusKm: 3,
    };

    const expected = [
      {
        id: 'spot-1',
        name: '東京駅',
        distanceMeters: 0,
      },
    ];

    mockSpotsService.search.mockResolvedValue(expected);

    const result = await controller.search(query);

    expect(mockSpotsService.search).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });
});
