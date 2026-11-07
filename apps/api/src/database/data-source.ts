import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Spot } from '../spots/spot.entity.js';

config({ path: '../../.env' });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: 5432,
  username: 'spot_user',
  password: process.env.POSTGRES_PASSWORD,
  database: 'spot_explorer',
  entities: [Spot],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
