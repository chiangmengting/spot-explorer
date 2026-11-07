import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import type { Point } from 'geojson';

@Entity('spots')
export class Spot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  category!: string;

  @Column({ type: 'text' })
  address!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Index('idx_spots_location', { spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location!: Point;
}