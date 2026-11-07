import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSpots1794014214817 implements MigrationInterface {
    name = 'CreateSpots1794014214817'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "spots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "location" geography(Point,4326) NOT NULL, CONSTRAINT "PK_cc8c0341ef60619746e42815cf4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_spots_location" ON "spots" USING gist ("location") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_spots_location"`);
        await queryRunner.query(`DROP TABLE "spots"`);
    }

}
