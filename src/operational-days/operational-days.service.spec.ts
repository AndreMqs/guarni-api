import { describe, expect, it, vi } from 'vitest';
import { QueryFailedError, type Repository } from 'typeorm';
import type { ClockService } from '../clock/clock.service.js';
import { postgresErrorCodes } from '../database/database.constants.js';
import type { Unit } from '../units/entities/unit.entity.js';
import { OperationalDay } from './entities/operational-day.entity.js';
import { operationalDayUnitDateUniqueConstraint } from './operational-days.constants.js';
import { OperationalDaysService } from './operational-days.service.js';

describe('OperationalDaysService', () => {
  const createService = (
    now: string,
    repository = {} as Repository<OperationalDay>,
  ) => {
    const clock: ClockService = {
      now: () => new Date(now),
    };

    return new OperationalDaysService(repository, clock);
  };

  const createRepository = () => {
    const findOneBy = vi.fn();
    const insert = vi.fn();
    const findOneByOrFail = vi.fn();

    return {
      repository: {
        findOneBy,
        insert,
        findOneByOrFail,
      } as unknown as Repository<OperationalDay>,
      findOneBy,
      insert,
      findOneByOrFail,
    };
  };

  const unit = {
    id: '00000000-0000-4000-8000-000000000001',
    timezone: 'America/Sao_Paulo',
    closingTime: '03:00',
  } as Unit;

  it('keeps the previous operational day before the cutoff', () => {
    const service = createService('2026-09-19T02:59:00-03:00');

    const result = service.getCurrentDay({
      timezone: 'America/Sao_Paulo',
      closingTime: '03:00',
    });

    expect(result.date).toBe('2026-09-18');
    expect(result.opensAt.toISOString()).toBe('2026-09-18T06:00:00.000Z');
    expect(result.closesAt.toISOString()).toBe('2026-09-19T06:00:00.000Z');
  });

  it('starts the new operational day exactly at the cutoff', () => {
    const service = createService('2026-09-19T03:00:00-03:00');

    const result = service.getCurrentDay({
      timezone: 'America/Sao_Paulo',
      closingTime: '03:00',
    });

    expect(result.date).toBe('2026-09-19');
    expect(result.opensAt.toISOString()).toBe('2026-09-19T06:00:00.000Z');
    expect(result.closesAt.toISOString()).toBe('2026-09-20T06:00:00.000Z');
  });

  it('keeps the current operational day after the cutoff', () => {
    const service = createService('2026-09-19T03:01:00-03:00');

    const result = service.getCurrentDay({
      timezone: 'America/Sao_Paulo',
      closingTime: '03:00',
    });

    expect(result.date).toBe('2026-09-19');
    expect(result.opensAt.toISOString()).toBe('2026-09-19T06:00:00.000Z');
    expect(result.closesAt.toISOString()).toBe('2026-09-20T06:00:00.000Z');
  });

  it('keeps the same operational day late at night', () => {
    const service = createService('2026-09-19T23:59:00-03:00');

    const result = service.getCurrentDay({
      timezone: 'America/Sao_Paulo',
      closingTime: '03:00',
    });

    expect(result.date).toBe('2026-09-19');
    expect(result.opensAt.toISOString()).toBe('2026-09-19T06:00:00.000Z');
    expect(result.closesAt.toISOString()).toBe('2026-09-20T06:00:00.000Z');
  });

  it('keeps the previous operational day after midnight but before the cutoff', () => {
    const service = createService('2026-09-20T00:30:00-03:00');

    const result = service.getCurrentDay({
      timezone: 'America/Sao_Paulo',
      closingTime: '03:00',
    });

    expect(result.date).toBe('2026-09-19');
    expect(result.opensAt.toISOString()).toBe('2026-09-19T06:00:00.000Z');
    expect(result.closesAt.toISOString()).toBe('2026-09-20T06:00:00.000Z');
  });

  it('uses the unit timezone instead of the server timezone', () => {
    const service = createService('2026-09-19T05:30:00.000Z');

    const result = service.getCurrentDay({
      timezone: 'America/Sao_Paulo',
      closingTime: '03:00',
    });

    expect(result.date).toBe('2026-09-18');
    expect(result.opensAt.toISOString()).toBe('2026-09-18T06:00:00.000Z');
    expect(result.closesAt.toISOString()).toBe('2026-09-19T06:00:00.000Z');
  });

  it('returns the persisted day without creating another record', async () => {
    const { repository, findOneBy, insert } = createRepository();
    const persistedDay = {
      id: '00000000-0000-4000-8000-000000000010',
      unitId: unit.id,
      date: '2026-09-19',
      opensAt: new Date('2026-09-19T06:00:00.000Z'),
      closesAt: new Date('2026-09-20T06:00:00.000Z'),
      closedAt: null,
    } as OperationalDay;
    findOneBy.mockResolvedValue(persistedDay);
    const service = createService(
      '2026-09-19T12:00:00-03:00',
      repository,
    );

    await expect(service.getOrCreateCurrentDay(unit)).resolves.toBe(
      persistedDay,
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it('creates and reloads the current operational day when it does not exist', async () => {
    const { repository, findOneBy, insert, findOneByOrFail } =
      createRepository();
    const persistedDay = {
      id: '00000000-0000-4000-8000-000000000011',
      unitId: unit.id,
      date: '2026-09-19',
      opensAt: new Date('2026-09-19T06:00:00.000Z'),
      closesAt: new Date('2026-09-20T06:00:00.000Z'),
      closedAt: null,
    } as OperationalDay;
    findOneBy.mockResolvedValue(null);
    insert.mockResolvedValue(undefined);
    findOneByOrFail.mockResolvedValue(persistedDay);
    const service = createService(
      '2026-09-19T12:00:00-03:00',
      repository,
    );

    await expect(service.getOrCreateCurrentDay(unit)).resolves.toBe(
      persistedDay,
    );
    expect(insert).toHaveBeenCalledWith({
      unitId: unit.id,
      date: '2026-09-19',
      opensAt: new Date('2026-09-19T06:00:00.000Z'),
      closesAt: new Date('2026-09-20T06:00:00.000Z'),
      closedAt: null,
    });
  });

  it('recovers when another request creates the same operational day first', async () => {
    const { repository, findOneBy, insert, findOneByOrFail } =
      createRepository();
    const persistedDay = {
      id: '00000000-0000-4000-8000-000000000012',
      unitId: unit.id,
      date: '2026-09-19',
      opensAt: new Date('2026-09-19T06:00:00.000Z'),
      closesAt: new Date('2026-09-20T06:00:00.000Z'),
      closedAt: null,
    } as OperationalDay;
    const driverError = Object.assign(new Error('duplicate key'), {
      code: postgresErrorCodes.uniqueViolation,
      constraint: operationalDayUnitDateUniqueConstraint,
    });
    findOneBy.mockResolvedValue(null);
    insert.mockRejectedValue(
      new QueryFailedError('INSERT operational_days', [], driverError),
    );
    findOneByOrFail.mockResolvedValue(persistedDay);
    const service = createService(
      '2026-09-19T12:00:00-03:00',
      repository,
    );

    await expect(service.getOrCreateCurrentDay(unit)).resolves.toBe(
      persistedDay,
    );
    expect(findOneByOrFail).toHaveBeenCalledWith({
      unitId: unit.id,
      date: '2026-09-19',
    });
  });
});
