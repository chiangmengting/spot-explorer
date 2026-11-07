import { Module } from '@nestjs/common';
import { GeocodingService } from './geocoding.service.js';
import { GeocodingController } from './geocoding.controller.js';

@Module({
  providers: [GeocodingService],
  controllers: [GeocodingController]
})
export class GeocodingModule {}
