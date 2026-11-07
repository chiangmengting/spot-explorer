import { Controller, Get, Query } from '@nestjs/common';
import { SpotsService } from './spots.service.js';
import { SearchSpotsDto } from './dto/search-spots.dto.js';

@Controller('spots')
export class SpotsController {
  constructor(
    private readonly spotsService: SpotsService,
  ) {}

  @Get()
  async search(@Query() query: SearchSpotsDto) {
    return this.spotsService.search(query);
  }
}
