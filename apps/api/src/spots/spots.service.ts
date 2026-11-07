import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Spot } from './spot.entity.js';
import { SearchSpotsDto } from './dto/search-spots.dto.js';

@Injectable()
export class SpotsService {
  constructor(
    @InjectRepository(Spot)
    private readonly spotRepository: Repository<Spot>,
  ) {}

  async search(query: SearchSpotsDto) {
    const { lat, lng, radiusKm } = query;

    const centerPoint =
      'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography';

    const distanceExpression =
      `ST_Distance(spot.location, ${centerPoint})`;

    const spots = await this.spotRepository
      .createQueryBuilder('spot')
      .addSelect(distanceExpression, 'distance_meters')
      .where(
        `ST_DWithin(
          spot.location,
          ${centerPoint},
          :radiusMeters
        )`,
      )
      .setParameters({
        lat,
        lng,
        radiusMeters: radiusKm * 1000,
      })
      .orderBy('distance_meters', 'ASC')
      .getRawAndEntities();

    return spots.entities.map((spot, index) => ({
      ...spot,
      distanceMeters: Number(spots.raw[index].distance_meters),
    }));
  }
}
