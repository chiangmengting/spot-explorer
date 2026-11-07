import { Controller, Get, Query } from '@nestjs/common';

import {
  GeocodingService,
  type ReverseGeocodingResult,
} from './geocoding.service.js';

import { ReverseGeocodingDto } from './dto/reverse-geocoding.dto.js';

@Controller('geocoding')
export class GeocodingController {
  constructor(
    private readonly geocodingService: GeocodingService,
  ) {}

  @Get('reverse')
  reverse(
    @Query() query: ReverseGeocodingDto,
  ): Promise<ReverseGeocodingResult> {
    return this.geocodingService.reverse(
      query.lat,
      query.lng,
    );
  }
}
