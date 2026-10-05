import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource, type EntitySubscriberInterface } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/app.setup.js';
import { BusinessEvent } from '../src/business-events/entities/business-event.entity.js';
import { Membership } from '../src/memberships/entities/membership.entity.js';
import {
  membershipManagementErrorMessages,
  type MembershipRole,
} from '../src/memberships/memberships.constants.js';
import { MembershipsService } from '../src/memberships/memberships.service.js';
import { Unit } from '../src/units/entities/unit.entity.js';
import { User } from '../src/users/entities/user.entity.js';

describe('Membership reads and role changes (PostgreSQL)', () => {
  let app: INestApplication<App>;
  let db: DataSource;
  let unit: Unit;
  let owner: Membership;
  let verifiedTestDatabase = false;

  const clean = async () => {
    if (!verifiedTestDatabase) return;
    await db.manager.deleteAll(BusinessEvent);
    await db.manager.deleteAll(Membership);
    await db.manager.deleteAll(Unit);
    await db.manager.deleteAll(User);
  };

  const createMember = async (role: MembershipRole, unitId = unit.id) => {
    const user = await db.manager.save(User, {
      name: `Test ${role}`,
      username: randomUUID(),
      passwordHash: 'test-only-unused-hash',
    });
    return db.manager.save(Membership, { userId: user.id, unitId, role });
  };

  const changeRole = async (params: {
    actor?: Membership;
    target: Membership;
    role: MembershipRole;
    expectedVersion?: number;
  }) => {
    const actor = params.actor ?? owner;
    const accessToken = await app.get(JwtService).signAsync({
      sub: actor.userId,
      credentialVersion: 1,
    });
    return request(app.getHttpServer())
      .patch(`/v1/units/${unit.id}/memberships/${params.target.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        role: params.role,
        expectedVersion: params.expectedVersion ?? 1,
      });
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
  });

  beforeEach(async () => {
    await clean();
    unit = await db.manager.save(Unit, { name: 'Role tests' });
    owner = await createMember('OWNER');
  });
  afterEach(clean);
  afterAll(async () => {
    if (app) await app.close();
  });

  describe('team list and detail', () => {
    const readTeam = async (
      params: {
        actor?: Membership;
        membershipId?: string;
        query?: Record<string, string>;
        unitId?: string;
      } = {},
    ) => {
      const actor = params.actor ?? owner;
      const accessToken = await app.get(JwtService).signAsync({
        sub: actor.userId,
        credentialVersion: 1,
      });
      const path =
        '/v1/units/' +
        (params.unitId ?? unit.id) +
        '/memberships' +
        (params.membershipId ? '/' + params.membershipId : '');
      return request(app.getHttpServer())
        .get(path)
        .set('Authorization', 'Bearer ' + accessToken)
        .query(params.query ?? {});
    };

    it('returns only safe identification fields, including inactive members', async () => {
      const employee = await createMember('EMPLOYEE');
      await db.manager.update(Membership, employee.id, { isActive: false });
      const response = await readTeam();
      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(2);
      expect(
        response.body.items.find((item: Membership) => item.id === employee.id),
      ).toEqual({
        id: employee.id,
        role: 'EMPLOYEE',
        isActive: false,
        version: 1,
        user: {
          id: employee.userId,
          name: 'Test EMPLOYEE',
          username: expect.any(String),
        },
      });
      expect(JSON.stringify(response.body)).not.toMatch(
        /password|credentialVersion|createdAt|unitId/,
      );
      const detail = await readTeam({ membershipId: employee.id });
      expect(detail.status).toBe(200);
      expect(detail.body).toEqual(
        response.body.items.find((item: Membership) => item.id === employee.id),
      );
    });

    it('combines role, active status and case-insensitive name/username filters', async () => {
      const employee = await createMember('EMPLOYEE');
      await db.manager.update(User, employee.userId, {
        name: 'Alice Silva',
        username: 'alice.silva',
      });
      const inactive = await createMember('EMPLOYEE');
      await db.manager.update(Membership, inactive.id, { isActive: false });
      const filtered = await readTeam({
        query: { role: 'EMPLOYEE', isActive: 'true', search: '  ALICE  ' },
      });
      expect(filtered.status).toBe(200);
      expect(filtered.body.items.map((item: Membership) => item.id)).toEqual([
        employee.id,
      ]);
      expect(
        (await readTeam({ query: { search: 'ICE.SIL' } })).body.items,
      ).toHaveLength(1);
      expect(
        (await readTeam({ query: { isActive: 'false' } })).body.items.map(
          (item: Membership) => item.id,
        ),
      ).toEqual([inactive.id]);
      expect(
        (await readTeam({ query: { search: '   ' } })).body.items,
      ).toHaveLength(3);
      expect(
        (await readTeam({ query: { search: 'missing person' } })).body,
      ).toEqual({ items: [] });
    });

    it.each(['%', '_', "' OR 1=1 --"])(
      'treats search %s as literal text',
      async (search) => {
        const response = await readTeam({ query: { search } });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ items: [] });
      },
    );

    it('orders equal names by username for stable results', async () => {
      const first = await createMember('EMPLOYEE');
      const second = await createMember('EMPLOYEE');
      await db.manager.update(User, first.userId, {
        name: 'Alice',
        username: 'b.alice',
      });
      await db.manager.update(User, second.userId, {
        name: 'alice',
        username: 'a.alice',
      });
      const response = await readTeam({ query: { search: 'alice' } });
      expect(response.body.items.map((item: Membership) => item.id)).toEqual([
        second.id,
        first.id,
      ]);
    });

    it('allows managers to list all roles but read details only for employees', async () => {
      const manager = await createMember('MANAGER');
      const employee = await createMember('EMPLOYEE');
      expect((await readTeam({ actor: manager })).body.items).toHaveLength(3);
      expect(
        (await readTeam({ actor: manager, membershipId: employee.id })).status,
      ).toBe(200);
      expect(
        (await readTeam({ actor: manager, membershipId: owner.id })).status,
      ).toBe(403);
      expect(
        (await readTeam({ actor: manager, membershipId: manager.id })).status,
      ).toBe(403);
    });

    it('denies employees and inactive members', async () => {
      const employee = await createMember('EMPLOYEE');
      expect((await readTeam({ actor: employee })).status).toBe(403);
      expect(
        (await readTeam({ actor: employee, membershipId: employee.id })).status,
      ).toBe(403);
      await db.manager.update(Membership, owner.id, { isActive: false });
      expect((await readTeam()).status).toBe(403);
      expect((await readTeam({ membershipId: employee.id })).status).toBe(403);
    });

    it('isolates units and returns the same error for foreign and missing targets', async () => {
      const otherUnit = await db.manager.save(Unit, { name: 'Other team' });
      const foreign = await createMember('OWNER', otherUnit.id);
      expect(
        (await readTeam()).body.items.map((item: Membership) => item.id),
      ).toEqual([owner.id]);
      const denied = await readTeam({ membershipId: foreign.id });
      const missing = await readTeam({ membershipId: randomUUID() });
      expect(denied.status).toBe(404);
      expect(missing.status).toBe(404);
      expect(denied.body).toEqual(missing.body);
      expect((await readTeam({ unitId: otherUnit.id })).status).toBe(403);
    });

    it('validates filters and UUIDs and requires authentication', async () => {
      const invalidFilters: Record<string, string>[] = [
        { role: 'ADMIN' },
        { isActive: 'invalid' },
        { extra: 'unexpected' },
      ];
      for (const query of invalidFilters) {
        expect((await readTeam({ query })).status).toBe(400);
      }
      expect((await readTeam({ membershipId: 'invalid' })).status).toBe(400);
      expect((await readTeam({ unitId: 'invalid' })).status).toBe(400);
      await request(app.getHttpServer())
        .get('/v1/units/' + unit.id + '/memberships')
        .expect(401);
      await request(app.getHttpServer())
        .get('/v1/units/' + unit.id + '/memberships/' + owner.id)
        .expect(401);
    });
  });

  it('updates role/version and records only safe snapshots in the same operation', async () => {
    const target = await createMember('EMPLOYEE');
    const response = await changeRole({ target, role: 'MANAGER' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: target.id,
      role: 'MANAGER',
      version: 2,
    });
    expect(
      await db.manager.findOneByOrFail(Membership, { id: target.id }),
    ).toMatchObject({ role: 'MANAGER', version: 2 });
    const events = await db.manager.find(BusinessEvent);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      unitId: unit.id,
      category: 'USERS',
      eventType: 'MEMBERSHIP_ROLE_CHANGED',
      actorType: 'USER',
      actorMembershipId: owner.id,
      actorNameSnapshot: 'Test OWNER',
      actorRoleSnapshot: 'OWNER',
      subjectType: 'MEMBERSHIP',
      subjectId: target.id,
      subjectTitleSnapshot: 'Test EMPLOYEE',
      before: { role: 'EMPLOYEE', version: 1 },
      after: { role: 'MANAGER', version: 2 },
    });
    expect(JSON.stringify(events)).not.toMatch(
      /passwordHash|credentialVersion|test-only-unused-hash/,
    );
  });

  it.each([
    {
      actorRole: 'EMPLOYEE',
      targetRole: 'EMPLOYEE',
      newRole: 'MANAGER',
      status: 403,
    },
    {
      actorRole: 'MANAGER',
      targetRole: 'OWNER',
      newRole: 'EMPLOYEE',
      status: 403,
    },
    {
      actorRole: 'MANAGER',
      targetRole: 'MANAGER',
      newRole: 'EMPLOYEE',
      status: 403,
    },
    {
      actorRole: 'MANAGER',
      targetRole: 'EMPLOYEE',
      newRole: 'OWNER',
      status: 403,
    },
    {
      actorRole: 'MANAGER',
      targetRole: 'EMPLOYEE',
      newRole: 'MANAGER',
      status: 403,
    },
    {
      actorRole: 'MANAGER',
      targetRole: 'EMPLOYEE',
      newRole: 'EMPLOYEE',
      status: 200,
    },
    {
      actorRole: 'OWNER',
      targetRole: 'OWNER',
      newRole: 'EMPLOYEE',
      status: 200,
    },
  ] as const)(
    'enforces hierarchy $actorRole / $targetRole -> $newRole ($status)',
    async (scenario) => {
      const { actorRole, targetRole, newRole, status } = scenario;
      const actor = await createMember(actorRole);
      const target = await createMember(targetRole);
      const response = await changeRole({ actor, target, role: newRole });
      expect(response.status).toBe(status);
      expect(await db.manager.count(BusinessEvent)).toBe(
        status === 200 ? 1 : 0,
      );
      expect(
        await db.manager.findOneByOrFail(Membership, { id: target.id }),
      ).toMatchObject({
        role: status === 200 ? newRole : targetRole,
        version: status === 200 ? 2 : 1,
      });
    },
  );

  it('rejects targets from another unit', async () => {
    const otherUnit = await db.manager.save(Unit, { name: 'Other unit' });
    const target = await createMember('EMPLOYEE', otherUnit.id);
    expect((await changeRole({ target, role: 'MANAGER' })).status).toBe(404);
    expect(await db.manager.count(BusinessEvent)).toBe(0);
  });

  it('rejects stale versions without changing role or writing an event', async () => {
    const target = await createMember('EMPLOYEE');
    const response = await changeRole({
      target,
      role: 'MANAGER',
      expectedVersion: 2,
    });
    expect(response.status).toBe(409);
    expect(response.body.message).toBe(
      membershipManagementErrorMessages.versionConflict,
    );
    expect(
      await db.manager.findOneByOrFail(Membership, { id: target.id }),
    ).toMatchObject({ role: 'EMPLOYEE', version: 1 });
    expect(await db.manager.count(BusinessEvent)).toBe(0);
  });

  it('does not count inactive owners when protecting the last active owner', async () => {
    const inactive = await createMember('OWNER');
    await db.manager.update(Membership, inactive.id, { isActive: false });
    const response = await changeRole({ target: owner, role: 'EMPLOYEE' });
    expect(response.status).toBe(409);
    expect(response.body.message).toBe(
      membershipManagementErrorMessages.lastActiveOwner,
    );
    expect(await db.manager.count(BusinessEvent)).toBe(0);
  });

  it('allows the last owner to retain its role', async () => {
    expect((await changeRole({ target: owner, role: 'OWNER' })).status).toBe(
      200,
    );
  });

  it('rolls back role/version when event insertion fails', async () => {
    const target = await createMember('EMPLOYEE');
    const subscriber: EntitySubscriberInterface<BusinessEvent> = {
      listenTo: () => BusinessEvent,
      beforeInsert: () => {
        throw new Error('Simulated event failure');
      },
    };
    db.subscribers.push(subscriber);
    try {
      expect((await changeRole({ target, role: 'MANAGER' })).status).toBe(500);
    } finally {
      db.subscribers.splice(db.subscribers.indexOf(subscriber), 1);
    }
    expect(
      await db.manager.findOneByOrFail(Membership, { id: target.id }),
    ).toMatchObject({ role: 'EMPLOYEE', version: 1 });
    expect(await db.manager.count(BusinessEvent)).toBe(0);
  });

  it('permits only one concurrent update with the same expected version', async () => {
    const target = await createMember('EMPLOYEE');
    const responses = await Promise.all([
      changeRole({ target, role: 'MANAGER' }),
      changeRole({ target, role: 'OWNER' }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 409,
    ]);
    expect(await db.manager.count(BusinessEvent)).toBe(1);
  });

  it('keeps one owner when both owners concurrently demote themselves', async () => {
    const otherOwner = await createMember('OWNER');
    const responses = await Promise.all([
      changeRole({ target: owner, role: 'EMPLOYEE' }),
      changeRole({ actor: otherOwner, target: otherOwner, role: 'EMPLOYEE' }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 409,
    ]);
    expect(
      await db.manager.countBy(Membership, {
        unitId: unit.id,
        role: 'OWNER',
        isActive: true,
      }),
    ).toBe(1);
    expect(await db.manager.count(BusinessEvent)).toBe(1);
  });

  it('allows only one owner to demote the other in simultaneous requests', async () => {
    const otherOwner = await createMember('OWNER');
    const responses = await Promise.all([
      changeRole({ target: otherOwner, role: 'EMPLOYEE' }),
      changeRole({ actor: otherOwner, target: owner, role: 'EMPLOYEE' }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 403,
    ]);
    expect(
      await db.manager.countBy(Membership, {
        unitId: unit.id,
        role: 'OWNER',
        isActive: true,
      }),
    ).toBe(1);
    expect(await db.manager.count(BusinessEvent)).toBe(1);
  });

  it('revalidates a previously authorized actor after another owner demotes it', async () => {
    const otherOwner = await createMember('OWNER');
    expect(
      (await changeRole({ target: otherOwner, role: 'EMPLOYEE' })).status,
    ).toBe(200);
    // Simulates the membership snapshot obtained by the guard before demotion.
    await expect(
      app.get(MembershipsService).updateRole({
        requestingMembership: otherOwner,
        unitId: unit.id,
        membershipToUpdateId: owner.id,
        roleUpdateData: { role: 'EMPLOYEE', expectedVersion: 1 },
      }),
    ).rejects.toThrow(membershipManagementErrorMessages.accessDenied);
    expect(
      await db.manager.countBy(Membership, {
        unitId: unit.id,
        role: 'OWNER',
        isActive: true,
      }),
    ).toBe(1);
    expect(await db.manager.count(BusinessEvent)).toBe(1);
  });
});
