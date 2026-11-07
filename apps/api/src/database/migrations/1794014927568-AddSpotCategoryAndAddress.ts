import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSpotCategoryAndAddress1794014927568 implements MigrationInterface {
    name = 'AddSpotCategoryAndAddress1794014927568'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "spots" ADD "category" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "spots" ADD "address" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "spots" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "spots" DROP COLUMN "category"`);
    }

}
