import type { ExecutionContext } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { Membership } from '../entities/membership.entity.js';
import { UnitMembershipGuard } from './unit-membership.guard.js';

describe('UnitMembershipGuard', () => {
  const unitId = 'c5de4a17-7dc3-4d25-bb53-dc38754d6d6b';
  const findOneBy = vi.fn();
  const guard = new UnitMembershipGuard({
    findOneBy,
  } as unknown as Repository<Membership>);
  const makeContext = (id: unknown = unitId) => {
    const request = {
      params: { unitId: id },
      user: { sub: 'authenticated-user' },
      membership: undefined,
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { context, request };
  };
  beforeEach(() => vi.resetAllMocks());

  it.each([undefined, '', 'invalid', ['not', 'a', 'string']])(
    'rejects an invalid parameter without consulting the repository (%j)',
    async (id) => {
      const { context, request } = makeContext();
      request.params.unitId = id;
      await expect(guard.canActivate(context)).rejects.toMatchObject({
        status: 400,
      });
      expect(findOneBy).not.toHaveBeenCalled();
      expect(request.membership).toBeUndefined();
    },
  );

  it('attaches only the active membership returned for the authenticated user and requested unit', async () => {
    const membership = {
      id: 'membership-id',
      userId: 'authenticated-user',
      unitId,
      isActive: true,
    };
    findOneBy.mockResolvedValue(membership);
    const { context, request } = makeContext();
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(findOneBy).toHaveBeenCalledWith({
      userId: 'authenticated-user',
      unitId,
      isActive: true,
    });
    expect(request.membership).toBe(membership);
  });

  it('rejects absent membership without attaching a context', async () => {
    findOneBy.mockResolvedValue(null);
    const { context, request } = makeContext();
    await expect(guard.canActivate(context)).rejects.toMatchObject({
      status: 403,
    });
    expect(request.membership).toBeUndefined();
  });

  it('propagates database failures without granting access', async () => {
    const failure = new Error('Database unavailable');
    findOneBy.mockRejectedValue(failure);
    const { context, request } = makeContext();
    await expect(guard.canActivate(context)).rejects.toBe(failure);
    expect(request.membership).toBeUndefined();
  });
});
