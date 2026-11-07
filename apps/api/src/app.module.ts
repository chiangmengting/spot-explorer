import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SpotsModule } from './spots/spots.module.js';
import { GeocodingModule } from './geocoding/geocoding.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: 5432,
        username: 'spot_user',
        password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
        database: 'spot_explorer',
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    SpotsModule,
    GeocodingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
