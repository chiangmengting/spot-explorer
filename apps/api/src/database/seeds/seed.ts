
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import type { Point } from 'geojson';

import dataSource from '../data-source.js';
import { Spot } from '../../spots/spot.entity.js';

interface SpotCsvRow {
  name: string;
  category: string;
  lat: string;
  long: string;
  address: string;
}

async function main(): Promise<void> {
  const csvPath = resolve(
    process.cwd(),
    process.env.SEED_CSV_PATH ??
    '../../data/landit_coding_test_seed.csv',
  );

  const csvContent = await readFile(csvPath, 'utf-8');

  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
  }) as SpotCsvRow[];

  console.log(`Found ${rows.length} spots`);

  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Spot);

      // Seed を再実行してもデータが重複しないようにする
      const count = await repository.count();

      if (count > 0) {
        console.log('Spots already exist. Skipping seed.');
        return;
      }

      const spots = rows.map((row) => {
        const lat = Number(row.lat);
        const lng = Number(row.long);

        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180
        ) {
          throw new Error(`Invalid coordinates: ${row.name}`);
        }

        const location: Point = {
          type: 'Point',
          coordinates: [lng, lat],
        };

        return repository.create({
          name: row.name,
          category: row.category,
          address: row.address,
          description: null,
          location,
        });
      });

      await repository.save(spots);

      console.log(`Inserted ${spots.length} spots`);
    });
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
