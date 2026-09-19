import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrepareMvpDomain1790000000000 implements MigrationInterface {
  name = 'PrepareMvpDomain1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "credentialVersion" integer NOT NULL DEFAULT 1`,
    );

    await queryRunner.query(
      `ALTER TABLE "units" ADD "timezone" character varying(100) NOT NULL DEFAULT 'America/Sao_Paulo'`,
    );
    await queryRunner.query(
      `ALTER TABLE "units" ADD "closingTime" TIME NOT NULL DEFAULT '03:00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "units" ADD "version" integer NOT NULL DEFAULT 1`,
    );

    await queryRunner.query(
      `ALTER TABLE "memberships" ADD "isActive" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD "deactivatedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD "version" integer NOT NULL DEFAULT 1`,
    );

    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_unit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_unit" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "operational_days" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "unitId" uuid NOT NULL, "date" date NOT NULL, "opensAt" TIMESTAMP WITH TIME ZONE NOT NULL, "closesAt" TIMESTAMP WITH TIME ZONE NOT NULL, "closedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_operational_days_unit_date" UNIQUE ("unitId", "date"), CONSTRAINT "PK_operational_days" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "operational_days" ADD CONSTRAINT "FK_operational_days_unit" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "unitId" uuid NOT NULL, "executionDate" date NOT NULL, "title" character varying(120) NOT NULL, "description" text, "assignmentType" character varying(20) NOT NULL, "assigneeMembershipId" uuid, "dueTime" TIME NOT NULL, "dueAt" TIMESTAMP WITH TIME ZONE NOT NULL, "isEvidenceRequired" boolean NOT NULL, "isCommentEnabled" boolean NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'PENDING', "createdByMembershipId" uuid NOT NULL, "sourceTaskId" uuid, "version" integer NOT NULL DEFAULT 1, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_tasks_assignment_type" CHECK ("assignmentType" IN ('GENERAL', 'PERSONAL')), CONSTRAINT "CK_tasks_status" CHECK ("status" IN ('PENDING', 'DONE', 'NOT_DONE')), CONSTRAINT "CK_tasks_assignment_consistency" CHECK (("assignmentType" = 'GENERAL' AND "assigneeMembershipId" IS NULL) OR ("assignmentType" = 'PERSONAL' AND "assigneeMembershipId" IS NOT NULL)), CONSTRAINT "PK_tasks" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_unit" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_assignee_membership" FOREIGN KEY ("assigneeMembershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_created_by_membership" FOREIGN KEY ("createdByMembershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_source_task" FOREIGN KEY ("sourceTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tasks_unit_execution_date" ON "tasks" ("unitId", "executionDate")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tasks_unit_status_execution_date" ON "tasks" ("unitId", "status", "executionDate")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tasks_unit_assignee_execution_date" ON "tasks" ("unitId", "assigneeMembershipId", "executionDate")`,
    );

    await queryRunner.query(
      `CREATE TABLE "task_executions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "taskId" uuid NOT NULL, "executorMembershipId" uuid, "result" character varying(20) NOT NULL, "resolutionType" character varying(20) NOT NULL, "completedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "comment" text, "reason" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_task_executions_task" UNIQUE ("taskId"), CONSTRAINT "CK_task_executions_result" CHECK ("result" IN ('DONE', 'NOT_DONE')), CONSTRAINT "CK_task_executions_resolution_type" CHECK ("resolutionType" IN ('MANUAL', 'AUTO_CLOSED')), CONSTRAINT "PK_task_executions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_executions" ADD CONSTRAINT "FK_task_executions_task" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_executions" ADD CONSTRAINT "FK_task_executions_executor_membership" FOREIGN KEY ("executorMembershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "task_evidence" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "unitId" uuid NOT NULL, "taskId" uuid NOT NULL, "executionId" uuid, "uploadedByMembershipId" uuid NOT NULL, "originalName" character varying(255) NOT NULL, "storageKey" text NOT NULL, "mimeType" character varying(100) NOT NULL, "sizeBytes" bigint NOT NULL, "width" integer NOT NULL, "height" integer NOT NULL, "uploadedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "attachedAt" TIMESTAMP WITH TIME ZONE, "deletedAt" TIMESTAMP WITH TIME ZONE, "isCurrent" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_task_evidence" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_evidence" ADD CONSTRAINT "FK_task_evidence_unit" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_evidence" ADD CONSTRAINT "FK_task_evidence_task" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_evidence" ADD CONSTRAINT "FK_task_evidence_execution" FOREIGN KEY ("executionId") REFERENCES "task_executions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_evidence" ADD CONSTRAINT "FK_task_evidence_uploaded_by_membership" FOREIGN KEY ("uploadedByMembershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_task_evidence_expires_at" ON "task_evidence" ("expiresAt")`,
    );

    await queryRunner.query(
      `CREATE TABLE "business_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "unitId" uuid NOT NULL, "category" character varying(20) NOT NULL, "eventType" character varying(60) NOT NULL, "actorType" character varying(20) NOT NULL, "actorMembershipId" uuid, "actorNameSnapshot" character varying(120), "actorRoleSnapshot" character varying(20), "subjectType" character varying(30) NOT NULL, "subjectId" uuid NOT NULL, "subjectTitleSnapshot" character varying(200) NOT NULL, "taskId" uuid, "executionId" uuid, "evidenceId" uuid, "reason" text, "before" jsonb, "after" jsonb, "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "CK_business_events_category" CHECK ("category" IN ('TASKS', 'USERS', 'MEDIA')), CONSTRAINT "CK_business_events_actor_type" CHECK ("actorType" IN ('USER', 'SYSTEM')), CONSTRAINT "PK_business_events" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_events" ADD CONSTRAINT "FK_business_events_unit" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_events" ADD CONSTRAINT "FK_business_events_actor_membership" FOREIGN KEY ("actorMembershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_events" ADD CONSTRAINT "FK_business_events_task" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_events" ADD CONSTRAINT "FK_business_events_execution" FOREIGN KEY ("executionId") REFERENCES "task_executions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_events" ADD CONSTRAINT "FK_business_events_evidence" FOREIGN KEY ("evidenceId") REFERENCES "task_evidence"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_business_events_unit_occurred_at_id" ON "business_events" ("unitId", "occurredAt" DESC, "id" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_business_events_task_occurred_at_id" ON "business_events" ("taskId", "occurredAt" ASC, "id" ASC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_business_events_task_occurred_at_id"`);
    await queryRunner.query(`DROP INDEX "IDX_business_events_unit_occurred_at_id"`);
    await queryRunner.query(`ALTER TABLE "business_events" DROP CONSTRAINT "FK_business_events_evidence"`);
    await queryRunner.query(`ALTER TABLE "business_events" DROP CONSTRAINT "FK_business_events_execution"`);
    await queryRunner.query(`ALTER TABLE "business_events" DROP CONSTRAINT "FK_business_events_task"`);
    await queryRunner.query(`ALTER TABLE "business_events" DROP CONSTRAINT "FK_business_events_actor_membership"`);
    await queryRunner.query(`ALTER TABLE "business_events" DROP CONSTRAINT "FK_business_events_unit"`);
    await queryRunner.query(`DROP TABLE "business_events"`);

    await queryRunner.query(`DROP INDEX "IDX_task_evidence_expires_at"`);
    await queryRunner.query(`ALTER TABLE "task_evidence" DROP CONSTRAINT "FK_task_evidence_uploaded_by_membership"`);
    await queryRunner.query(`ALTER TABLE "task_evidence" DROP CONSTRAINT "FK_task_evidence_execution"`);
    await queryRunner.query(`ALTER TABLE "task_evidence" DROP CONSTRAINT "FK_task_evidence_task"`);
    await queryRunner.query(`ALTER TABLE "task_evidence" DROP CONSTRAINT "FK_task_evidence_unit"`);
    await queryRunner.query(`DROP TABLE "task_evidence"`);

    await queryRunner.query(`ALTER TABLE "task_executions" DROP CONSTRAINT "FK_task_executions_executor_membership"`);
    await queryRunner.query(`ALTER TABLE "task_executions" DROP CONSTRAINT "FK_task_executions_task"`);
    await queryRunner.query(`DROP TABLE "task_executions"`);

    await queryRunner.query(`DROP INDEX "IDX_tasks_unit_assignee_execution_date"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_unit_status_execution_date"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_unit_execution_date"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_source_task"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_created_by_membership"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_assignee_membership"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_unit"`);
    await queryRunner.query(`DROP TABLE "tasks"`);

    await queryRunner.query(`ALTER TABLE "operational_days" DROP CONSTRAINT "FK_operational_days_unit"`);
    await queryRunner.query(`DROP TABLE "operational_days"`);

    await queryRunner.query(`ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_user"`);
    await queryRunner.query(`ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_unit"`);
    await queryRunner.query(`ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_unit" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "memberships" DROP COLUMN "version"`);
    await queryRunner.query(`ALTER TABLE "memberships" DROP COLUMN "deactivatedAt"`);
    await queryRunner.query(`ALTER TABLE "memberships" DROP COLUMN "isActive"`);

    await queryRunner.query(`ALTER TABLE "units" DROP COLUMN "version"`);
    await queryRunner.query(`ALTER TABLE "units" DROP COLUMN "closingTime"`);
    await queryRunner.query(`ALTER TABLE "units" DROP COLUMN "timezone"`);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "credentialVersion"`);
  }
}
