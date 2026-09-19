import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DataSource, type EntitySubscriberInterface } from 'typeorm';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/app.setup.js';
import { User } from '../src/users/entities/user.entity.js';
import { Unit } from '../src/units/entities/unit.entity.js';
import { Membership } from '../src/memberships/entities/membership.entity.js';
import { SETUP_LOCK_KEY } from '../src/setup/setup.constants.js';
import type { SetupOwnerDto } from '../src/setup/dto/setup-owner.dto.js';
import { resetOwnerPassword } from '../src/admin/reset-owner-password.js';
import { listUsers } from '../src/admin/list-users.js';

describe('POST /v1/setup/owner (PostgreSQL)', () => {
  let app: INestApplication<App>;
  let db: DataSource;
  let token: string;
  let verifiedTestDatabase = false;
  const dto = {
    name: ' Owner Test ',
    username: ' Owner.Test ',
    password: 'OwnerTestPassword123!',
    unitName: ' Guarni Test ',
  };
  const counts = () =>
    Promise.all([User, Unit, Membership].map((e) => db.manager.count(e)));
  const setup = (body: SetupOwnerDto = dto) =>
    request(app.getHttpServer())
      .post('/v1/setup/owner')
      .set('X-Setup-Token', token)
      .send(body);
  const clean = async () => {
    if (!verifiedTestDatabase) return;
    await db.manager.deleteAll(Membership);
    await db.manager.deleteAll(Unit);
    await db.manager.deleteAll(User);
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.useLogger(false);
    setupApp(app, app.get(ConfigService));
    await app.init();
    db = app.get(DataSource);
    const [{ name }] = await db.query('SELECT current_database() AS name');
    if (name !== 'guarni_test') throw new Error('E2E requires guarni_test');
    verifiedTestDatabase = true;
    token = app.get(ConfigService).getOrThrow<string>('SETUP_OWNER_TOKEN');
  });
  beforeEach(clean);
  afterEach(clean);
  afterAll(async () => {
    if (app) await app.close();
  });

  it('lists public identification and all memberships without exposing credentials', async () => {
    expect(await listUsers(db)).toEqual([]);
    const { body } = await setup().expect(201);
    const otherUnit = await db.manager.save(
      db.manager.create(Unit, { name: 'Other unit' }),
    );
    await db.manager.save(
      db.manager.create(Membership, {
        userId: body.user.id,
        unitId: otherUnit.id,
        role: 'MANAGER',
        isActive: false,
      }),
    );
    const unlinked = await db.manager.save(
      db.manager.create(User, {
        name: 'Unlinked User',
        username: 'unlinked.user',
        passwordHash: 'must-not-be-returned',
      }),
    );
    expect(await listUsers(db)).toEqual([
      {
        id: body.user.id,
        name: 'Owner Test',
        username: 'owner.test',
        canResetOwnerPassword: true,
        memberships: [
          {
            unitId: body.unit.id,
            unitName: 'Guarni Test',
            role: 'OWNER',
            isActive: true,
          },
          {
            unitId: otherUnit.id,
            unitName: 'Other unit',
            role: 'MANAGER',
            isActive: false,
          },
        ],
      },
      {
        id: unlinked.id,
        name: 'Unlinked User',
        username: 'unlinked.user',
        canResetOwnerPassword: false,
        memberships: [],
      },
    ]);
    await db.manager.update(
      Membership,
      { id: body.membership.id },
      { isActive: false },
    );
    expect((await listUsers(db))[0].canResetOwnerPassword).toBe(false);
  });

  it('recovers an owner password without changing the user identity or memberships', async () => {
    const { body } = await setup().expect(201);
    const membershipBefore = await db.manager.findOneByOrFail(Membership, {
      id: body.membership.id,
    });
    const unitBefore = await db.manager.findOneByOrFail(Unit, {
      id: body.unit.id,
    });
    const recovered = await resetOwnerPassword(db, body.user.id);
    expect(recovered.username).toBe('owner.test');
    expect(recovered.password).toHaveLength(32);
    expect(recovered.password).not.toBe(dto.password);
    const stored = await db.manager.findOneByOrFail(User, { id: body.user.id });
    expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
    expect(await argon2.verify(stored.passwordHash, recovered.password)).toBe(
      true,
    );
    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ username: recovered.username, password: dto.password })
      .expect(401);
    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ username: recovered.username, password: recovered.password })
      .expect(200);
    expect(
      await db.manager.findOneByOrFail(Membership, { id: membershipBefore.id }),
    ).toEqual(membershipBefore);
    expect(
      await db.manager.findOneByOrFail(Unit, { id: unitBefore.id }),
    ).toEqual(unitBefore);
    expect(await counts()).toEqual([1, 1, 1]);
  });

  it.each([
    { role: 'EMPLOYEE' as const, isActive: true },
    { role: 'MANAGER' as const, isActive: true },
    { role: 'OWNER' as const, isActive: false },
  ])(
    'does not reset an account without an active OWNER membership: %j',
    async (values) => {
      const { body } = await setup().expect(201);
      await db.manager.update(Membership, { id: body.membership.id }, values);
      const before = await db.manager.findOneByOrFail(User, {
        id: body.user.id,
      });
      await expect(resetOwnerPassword(db, before.id)).rejects.toThrow(
        'O usuário não possui vínculo OWNER ativo.',
      );
      expect(await db.manager.findOneByOrFail(User, { id: before.id })).toEqual(
        before,
      );
    },
  );

  it('does not create an account during recovery of an unknown user', async () => {
    await expect(
      resetOwnerPassword(db, '00000000-0000-4000-8000-000000000000'),
    ).rejects.toThrow('Usuário não encontrado.');
    expect(await counts()).toEqual([0, 0, 0]);
  });

  it.each([undefined, 'wrong-token'])(
    'rejects unauthorized setup (%s) without writing',
    async (supplied) => {
      const call = request(app.getHttpServer())
        .post('/v1/setup/owner')
        .send(dto);
      if (supplied !== undefined) call.set('X-Setup-Token', supplied);
      const response = await call.expect(401);
      expect(response.body.message).toBe('INVALID_SETUP_TOKEN');
      expect(await counts()).toEqual([0, 0, 0]);
    },
  );

  it.each([
    { ...dto, password: 'short' },
    { ...dto, unitName: '  ' },
    { ...dto, role: 'OWNER' },
    { ...dto, closingTime: '25:00' },
  ])('rejects invalid input without writing: %j', async (body) => {
    await setup(body).expect(400);
    expect(await counts()).toEqual([0, 0, 0]);
  });

  it('commits a normalized user, default unit and active OWNER, with a public response', async () => {
    const { body } = await setup().expect(201);
    expect(body).toEqual({
      user: {
        id: expect.any(String),
        name: 'Owner Test',
        username: 'owner.test',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
      unit: {
        id: expect.any(String),
        name: 'Guarni Test',
        timezone: 'America/Sao_Paulo',
        closingTime: '03:00:00',
      },
      membership: {
        id: expect.any(String),
        userId: body.user.id,
        unitId: body.unit.id,
        role: 'OWNER',
        isActive: true,
      },
    });
    expect(await counts()).toEqual([1, 1, 1]);
    const user = await db.manager.findOneByOrFail(User, { id: body.user.id });
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
    expect(await argon2.verify(user.passwordHash, dto.password)).toBe(true);
    expect(
      await db.manager.findOneByOrFail(Membership, { id: body.membership.id }),
    ).toMatchObject(body.membership);
    expect(
      await db.manager.findOneByOrFail(Unit, { id: body.unit.id }),
    ).toMatchObject(body.unit);
    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ username: dto.username, password: dto.password })
      .expect(200);
  });

  it('preserves explicitly supplied timezone and closing time', async () => {
    const { body } = await setup({
      ...dto,
      timezone: 'UTC',
      closingTime: '05:30',
    }).expect(201);
    expect(body.unit).toMatchObject({
      timezone: 'UTC',
      closingTime: '05:30:00',
    });
    expect(
      await db.manager.findOneByOrFail(Unit, { id: body.unit.id }),
    ).toMatchObject({ timezone: 'UTC', closingTime: '05:30:00' });
  });

  it('rejects another setup without changing the first owner', async () => {
    const first = await setup().expect(201);
    const second = await setup({ ...dto, username: 'second.owner' }).expect(
      409,
    );
    expect(second.body.message).toBe('SETUP_ALREADY_COMPLETED');
    expect(await counts()).toEqual([1, 1, 1]);
    expect(
      await db.manager.findOneByOrFail(User, { id: first.body.user.id }),
    ).toMatchObject({ username: 'owner.test' });
  });

  it('blocks bootstrap based on an existing unit even without an active owner', async () => {
    await db.manager.save(db.manager.create(Unit, { name: 'Existing unit' }));
    const { body } = await setup().expect(409);
    expect(body.message).toBe('SETUP_ALREADY_COMPLETED');
    expect(await counts()).toEqual([0, 1, 0]);
  });

  it('rolls back User and Unit when saving Membership fails, then allows retry', async () => {
    let rowsInsideTransaction: number[] | undefined;
    // Inject a failure at the last write while using real PostgreSQL for all writes.
    const subscriber: EntitySubscriberInterface<Membership> = {
      listenTo: () => Membership,
      async beforeInsert(event) {
        rowsInsideTransaction = await Promise.all(
          [User, Unit].map((e) => event.manager.count(e)),
        );
        throw new Error('Simulated membership write failure');
      },
    };
    db.subscribers.push(subscriber);
    try {
      await setup().expect(500);
      expect(rowsInsideTransaction).toEqual([1, 1]);
      expect(await counts()).toEqual([0, 0, 0]);
    } finally {
      db.subscribers.splice(db.subscribers.indexOf(subscriber), 1);
    }
    await setup().expect(201);
    expect(await counts()).toEqual([1, 1, 1]);
  });

  it('serializes two competing HTTP requests and commits only one owner', async () => {
    const blocker = db.createQueryRunner();
    let pending: Promise<request.Response[]> | undefined;
    try {
      await blocker.connect();
      await blocker.startTransaction();
      await blocker.query('SELECT pg_advisory_xact_lock($1)', [SETUP_LOCK_KEY]);
      // Hold the real lock until both requests are waiting in PostgreSQL.
      pending = Promise.all(
        ['first.owner', 'second.owner'].map((username) =>
          setup({ ...dto, username })
            .timeout(10000)
            .then((response) => response),
        ),
      );
      // Attach a rejection handler immediately, including on a failed wait assertion.
      void pending.catch(() => undefined);
      await vi.waitFor(
        async () => {
          const [row] = await blocker.query(
            `SELECT count(*)::int AS waiting FROM pg_locks
           WHERE locktype = 'advisory' AND NOT granted AND classid = 0
             AND objid = $1 AND objsubid = 1
             AND database = (SELECT oid FROM pg_database WHERE datname = current_database())`,
            [SETUP_LOCK_KEY],
          );
          expect(row.waiting).toBe(2);
        },
        { timeout: 5000, interval: 25 },
      );
      await blocker.commitTransaction();
      const results = await pending;
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(results.find((r) => r.status === 409)?.body.message).toBe(
        'SETUP_ALREADY_COMPLETED',
      );
      expect(await counts()).toEqual([1, 1, 1]);
    } finally {
      if (blocker.isTransactionActive) await blocker.rollbackTransaction();
      await blocker.release();
      if (pending) await Promise.allSettled([pending]);
    }
  }, 15000);
});
