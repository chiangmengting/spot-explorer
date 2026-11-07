import { Type } from 'class-transformer';
import { IsNumber, Min, Max } from 'class-validator';

export class SearchSpotsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radiusKm!: number;
}
