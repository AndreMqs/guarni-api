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
        .post('/v1/users/register')
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
        .post('/v1/users/register')
        .send(validUserPayload)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/v1/users/register')
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
        .post('/v1/users/register')
        .send(payload)
        .expect(400);
    });

    it('finds a user by normalized username', async () => {
      await request(app.getHttpServer())
        .post('/v1/users/register')
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

    it('deletes a user by id', async () => {
      const createdUserResponse = await request(app.getHttpServer())
        .post('/v1/users/register')
        .send(validUserPayload)
        .expect(201);

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/v1/users/${createdUserResponse.body.id}`)
        .expect(204);

      expect(deleteResponse.text).toBe('');

      await request(app.getHttpServer())
        .get('/v1/users/andre.camara')
        .expect(404);
    });

    it('returns bad request for an invalid user id', async () => {
      await request(app.getHttpServer())
        .delete('/v1/users/not-a-uuid')
        .expect(400);
    });

    it('returns not found when deleting an unknown user', async () => {
      const response = await request(app.getHttpServer())
        .delete('/v1/users/00000000-0000-4000-8000-000000000000')
        .expect(404);

      expect(response.body.message).toBe('Usuário não encontrado.');
    });
  });

  describe('/v1/auth/login', () => {
    it('returns an access token for valid normalized credentials', async () => {
      await request(app.getHttpServer())
        .post('/v1/users/register')
        .send(validUserPayload)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          username: ' ANDRE.CAMARA ',
          password: validUserPayload.password,
        })
        .expect(200);

      expect(response.body).toEqual({
        accessToken: expect.any(String),
      });
    });

    it('returns unauthorized for an invalid password', async () => {
      await request(app.getHttpServer())
        .post('/v1/users/register')
        .send(validUserPayload)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          username: 'andre.camara',
          password: 'SenhaIncorreta123!',
        })
        .expect(401);

      expect(response.body.message).toBe('Nome de usuário ou senha inválidos.');
    });

    it('returns the same unauthorized response for an unknown user', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          username: 'missing.user',
          password: validUserPayload.password,
        })
        .expect(401);

      expect(response.body.message).toBe('Nome de usuário ou senha inválidos.');
    });

    it.each([
      [
        'an extra property',
        {
          username: 'andre.camara',
          password: validUserPayload.password,
          role: 'OWNER',
        },
      ],
      [
        'an invalid username',
        {
          username: 'usuário com espaços',
          password: validUserPayload.password,
        },
      ],
      [
        'a short password',
        {
          username: 'andre.camara',
          password: '123',
        },
      ],
    ])('rejects %s', async (_scenario, payload) => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send(payload)
        .expect(400);
    });
  });

  describe('/v1/auth/me', () => {
    it('returns the authenticated user for a valid access token', async () => {
      const createdUserResponse = await request(app.getHttpServer())
        .post('/v1/users/register')
        .send(validUserPayload)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          username: validUserPayload.username,
          password: validUserPayload.password,
        })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        id: createdUserResponse.body.id,
        username: 'andre.camara',
      });
    });

    it('returns unauthorized without an access token', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .expect(401);

      expect(response.body.message).toBe(
        'Token de acesso inválido ou expirado.',
      );
    });

    it('returns unauthorized for an invalid access token', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Authorization', 'Bearer invalid-access-token')
        .expect(401);

      expect(response.body.message).toBe(
        'Token de acesso inválido ou expirado.',
      );
    });
  });
});
