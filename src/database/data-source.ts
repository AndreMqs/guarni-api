import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { Unit } from '../units/entities/unit.entity.js';
import { Membership } from '../memberships/entities/membership.entity.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL não foi definida.');
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [User, Unit, Membership],
  synchronize: false,
  migrations: ['dist/**/database/migrations/*.js'],
});
