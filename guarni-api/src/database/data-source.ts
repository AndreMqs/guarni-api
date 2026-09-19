import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { BusinessEvent } from '../business-events/entities/business-event.entity.js';
import { TaskEvidence } from '../evidence/entities/task-evidence.entity.js';
import { Membership } from '../memberships/entities/membership.entity.js';
import { OperationalDay } from '../operational-days/entities/operational-day.entity.js';
import { TaskExecution } from '../tasks/entities/task-execution.entity.js';
import { Task } from '../tasks/entities/task.entity.js';
import { Unit } from '../units/entities/unit.entity.js';
import { User } from '../users/entities/user.entity.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL não foi definida.');
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [
    User,
    Unit,
    Membership,
    OperationalDay,
    Task,
    TaskExecution,
    TaskEvidence,
    BusinessEvent,
  ],
  synchronize: false,
  migrations: ['dist/**/database/migrations/*.js'],
});
