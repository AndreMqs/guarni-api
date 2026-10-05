import { ConfigService } from '@nestjs/config';
import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { DataSource, type Repository } from 'typeorm';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { setupApp } from './../src/app.setup.js';
import { AppModule } from './../src/app.module.js';
import { Membership } from './../src/memberships/entities/membership.entity.js';
import {
  membershipRoles,
  type MembershipRole,
} from './../src/memberships/memberships.constants.js';
import { OperationalDay } from './../src/operational-days/entities/operational-day.entity.js';
import { Unit } from './../src/units/entities/unit.entity.js';
import { User } from './../src/users/entities/user.entity.js';
import { UsersService } from './../src/users/users.service.js';

const validUserPayload = {
  name: ' André Câmara ',
  username: ' Andre.Camara ',
  password: 'MinhaSenhaDeTeste123!',
};

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let usersRepository: Repository<User>;
  let unitsRepository: Repository<Unit>;
  let membershipsRepository: Repository<Membership>;
  let operationalDaysRepository: Repository<OperationalDay>;

  beforeAll(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = testingModule.createNestApplication();
    setupApp(app, app.get(ConfigService));
    await app.init();

    const dataSource = app.get(DataSource);
    const [{ name }] = await dataSource.query(
      'SELECT current_database() AS name',
    );
    if (name !== 'guarni_test') throw new Error('E2E requires guarni_test');
    usersRepository = dataSource.getRepository(User);
    unitsRepository = dataSource.getRepository(Unit);
    membershipsRepository = dataSource.getRepository(Membership);
    operationalDaysRepository = dataSource.getRepository(OperationalDay);
  });

  const clean = async () => {
    await operationalDaysRepository.deleteAll();
    await membershipsRepository.deleteAll();
    await unitsRepository.deleteAll();
    await usersRepository.deleteAll();
  };

  beforeEach(clean);
  afterEach(clean);

  const createActiveMembershipForUser = async (
    userId: string,
    role: MembershipRole = membershipRoles.owner,
  ) => {
    const unit = await unitsRepository.save(
      unitsRepository.create({ name: 'Guarni Teste' }),
    );
    await membershipsRepository.save(
      membershipsRepository.create({
        unitId: unit.id,
        userId,
        role,
        isActive: true,
      }),
    );
    return unit;
  };

  const login = async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        username: validUserPayload.username,
        password: validUserPayload.password,
      })
      .expect(200);

    return response.body.accessToken as string;
  };

  afterAll(async () => {
    if (app) await app.close();
  });

  it('/v1/health (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/health')
      .expect(200);

    expect(response.body.status).toBe('ok');
  });

  describe('removed public user routes', () => {
    it('does not expose registration, lookup or physical deletion', async () => {
      await request(app.getHttpServer())
        .post('/v1/users/register')
        .send(validUserPayload)
        .expect(404);
      await request(app.getHttpServer())
        .get('/v1/users/andre.camara')
        .expect(404);
      await request(app.getHttpServer())
        .delete('/v1/users/00000000-0000-4000-8000-000000000000')
        .expect(404);
    });
  });

  describe('/v1/auth/login', () => {
    it('returns an access token for valid normalized credentials', async () => {
      const createdUserResponse = {
        body: await app.get(UsersService).create(validUserPayload),
      };

      await createActiveMembershipForUser(createdUserResponse.body.id);

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
      await app.get(UsersService).create(validUserPayload);

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
      const createdUserResponse = {
        body: await app.get(UsersService).create(validUserPayload),
      };

      const unit = await createActiveMembershipForUser(
        createdUserResponse.body.id,
      );

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
        user: {
          id: createdUserResponse.body.id,
          name: 'André Câmara',
          username: 'andre.camara',
        },
        memberships: [
          {
            id: expect.any(String),
            role: 'OWNER',
            unit: { id: unit.id, name: 'Guarni Teste' },
          },
        ],
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

  describe('/v1/units/:unitId/context', () => {
    it.each([
      [
        membershipRoles.owner,
        {
          canManageTasks: true,
          canManageUsers: true,
          canManageOwnersAndManagers: true,
          canManageSettings: true,
          canViewAudit: true,
          canCorrectAnyExecution: true,
        },
      ],
      [
        membershipRoles.manager,
        {
          canManageTasks: true,
          canManageUsers: true,
          canManageOwnersAndManagers: false,
          canManageSettings: true,
          canViewAudit: false,
          canCorrectAnyExecution: true,
        },
      ],
      [
        membershipRoles.employee,
        {
          canManageTasks: false,
          canManageUsers: false,
          canManageOwnersAndManagers: false,
          canManageSettings: false,
          canViewAudit: false,
          canCorrectAnyExecution: false,
        },
      ],
    ])('returns operational context and permissions for %s', async (role, permissions) => {
      const user = await app.get(UsersService).create(validUserPayload);
      const unit = await createActiveMembershipForUser(user.id, role);
      const accessToken = await login();

      const firstResponse = await request(app.getHttpServer())
        .get(`/v1/units/${unit.id}/context`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const secondResponse = await request(app.getHttpServer())
        .get(`/v1/units/${unit.id}/context`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(firstResponse.body.unit).toMatchObject({
        id: unit.id,
        name: 'Guarni Teste',
        timezone: 'America/Sao_Paulo',
      });
      expect(firstResponse.body.unit.closingTime).toMatch(/^03:00(?::00)?$/);
      expect(firstResponse.body.membership).toEqual({
        id: expect.any(String),
        role,
      });
      expect(firstResponse.body.permissions).toEqual(permissions);
      expect(firstResponse.body.operationalDay).toEqual(
        secondResponse.body.operationalDay,
      );
      expect(firstResponse.body.operationalDay.date).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      );
      expect(firstResponse.body.operationalDay.isClosed).toBe(false);

      const opensAt = new Date(firstResponse.body.operationalDay.opensAt);
      const closesAt = new Date(firstResponse.body.operationalDay.closesAt);
      const serverTime = new Date(firstResponse.body.serverTime);

      expect(serverTime.getTime()).toBeGreaterThanOrEqual(opensAt.getTime());
      expect(serverTime.getTime()).toBeLessThan(closesAt.getTime());
      expect(
        await operationalDaysRepository.countBy({ unitId: unit.id }),
      ).toBe(1);
    });
  });
});
