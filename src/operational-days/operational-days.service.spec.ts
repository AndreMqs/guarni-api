import { describe, expect, it } from 'vitest';
import type { ClockService } from '../clock/clock.service.js';
import { OperationalDaysService } from './operational-days.service.js';
import type { Repository } from 'typeorm';
import { OperationalDay } from './entities/operational-day.entity.js';

describe('OperationalDaysService', () => {
  const createService = (now: string) => {
    const clock: ClockService = {
      now: () => new Date(now),
    };

    const repository = {} as Repository<OperationalDay>;

    return new OperationalDaysService(repository, clock);
  };

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
});