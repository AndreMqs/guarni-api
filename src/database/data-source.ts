import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL não foi definida.');
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [User],
  synchronize: false,
  migrations: ['dist/**/database/migrations/*.js'],
});
