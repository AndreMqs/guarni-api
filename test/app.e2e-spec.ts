import { ConfigService } from '@nestjs/config';
import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { DataSource, type Repository } from 'typeorm';
import request from 'supertest';
import type { App } from 'supertest/types';
import { setupApp } from './../src/app.setup.js';
import { AppModule } from './../src/app.module.js';
import { User } from './../src/users/entities/user.entity.js';

const validUserPayload = {
  name: ' André Câmara ',
  username: ' Andre.Camara ',
  password: 'MinhaSenhaDeTeste123!',
};

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let usersRepository: Repository<User>;

  beforeAll(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = testingModule.createNestApplication();
    setupApp(app, app.get(ConfigService));
    await app.init();

    const dataSource = app.get(DataSource);
    usersRepository = dataSource.getRepository(User);
  });

  beforeEach(async () => {
    await usersRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/v1/health (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/health')
      .expect(200);

    expect(response.body.status).toBe('ok');
  });

  describe('/v1/users', () => {
    it('creates a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/users')
        .send(validUserPayload)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: 'André Câmara',
        username: 'andre.camara',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('returns conflict for a duplicated username', async () => {
      await request(app.getHttpServer())
        .post('/v1/users')
        .send(validUserPayload)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/v1/users')
        .send({
          ...validUserPayload,
          username: ' ANDRE.CAMARA ',
        })
        .expect(409);

      expect(response.body.message).toBe('Nome de usuário já está em uso.');
    });

    it.each([
      ['an extra property', { ...validUserPayload, role: 'OWNER' }],
      ['a short password', { ...validUserPayload, password: '123' }],
      ['a blank name', { ...validUserPayload, name: '   ' }],
      [
        'an invalid username',
        { ...validUserPayload, username: 'Usuário com espaços' },
      ],
    ])('rejects %s', async (_scenario, payload) => {
      await request(app.getHttpServer())
        .post('/v1/users')
        .send(payload)
        .expect(400);
    });

    it('finds a user by normalized username', async () => {
      await request(app.getHttpServer())
        .post('/v1/users')
        .send(validUserPayload)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/v1/users/ANDRE.CAMARA')
        .expect(200);

      expect(response.body).toMatchObject({
        name: 'André Câmara',
        username: 'andre.camara',
      });
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('returns not found for an unknown username', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/missing.user')
        .expect(404);

      expect(response.body.message).toBe('Usuário não encontrado.');
    });
  });
});
