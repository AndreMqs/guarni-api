import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BusinessEventsModule } from './business-events/business-events.module.js';
import { DatabaseModule } from './database/database.module.js';
import { EvidenceModule } from './evidence/evidence.module.js';
import { HealthModule } from './health/health.module.js';
import { ManagementModule } from './management/management.module.js';
import { MembershipsModule } from './memberships/memberships.module.js';
import { OperationalDaysModule } from './operational-days/operational-days.module.js';
import { SetupModule } from './setup/setup.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { UnitsModule } from './units/units.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
        PORT: Joi.number().port().required(),
        WEB_ORIGIN: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
        DATABASE_URL: Joi.string().uri({ scheme: ['postgresql'] }).required(),
        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_TTL_SECONDS: Joi.number().integer().positive().required(),
        // SETUP_OWNER_TOKEN será tornado obrigatório quando o checkpoint de setup for implementado.
        SETUP_OWNER_TOKEN: Joi.string().min(32).optional(),
      }),
    }),
    HealthModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    SetupModule,
    MembershipsModule,
    UnitsModule,
    OperationalDaysModule,
    BusinessEventsModule,
    TasksModule,
    EvidenceModule,
    ManagementModule,
    AuditModule,
  ],
})
export class AppModule {}
