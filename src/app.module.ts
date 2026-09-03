import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { HealthModule } from './health/health.module.js';
import { DatabaseModule } from './database/database.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .required(),
        PORT: Joi.number().port().required(),
        WEB_ORIGIN: Joi.string()
          .uri({ scheme: ['http', 'https'] })
          .required(),
        DATABASE_URL: Joi.string()
          .uri({ scheme: ['postgresql'] })
          .required(),
      }),
    }),
    HealthModule,
    DatabaseModule,
    UsersModule,
  ],
})
export class AppModule {}
