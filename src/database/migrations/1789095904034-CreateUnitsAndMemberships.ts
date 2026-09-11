import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUnitsAndMemberships1789095904034 implements MigrationInterface {
  name = 'CreateUnitsAndMemberships1789095904034';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "units" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_units" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "unitId" uuid NOT NULL, "userId" uuid NOT NULL, "role" character varying(20) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_memberships_unit_user" UNIQUE ("unitId", "userId"), CONSTRAINT "CK_memberships_role" CHECK ("role" IN ('OWNER', 'MANAGER', 'EMPLOYEE')), CONSTRAINT "PK_memberships" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_unit" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_unit"`,
    );
    await queryRunner.query(`DROP TABLE "memberships"`);
    await queryRunner.query(`DROP TABLE "units"`);
  }
}
