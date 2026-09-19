import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;

  const databaseHealth = {
    database: {
      status: 'up' as const,
    },
  };

  const health = {
    status: 'ok' as const,
    info: databaseHealth,
    error: {},
    details: databaseHealth,
  };

  const healthCheckService = {
    check: vi.fn(async (indicators: Array<() => Promise<unknown>>) => {
      await Promise.all(indicators.map((indicator) => indicator()));

      return health;
    }),
  };

  const databaseHealthIndicator = {
    pingCheck: vi.fn(async (_key: string) => databaseHealth),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: healthCheckService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: databaseHealthIndicator,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns the application and database health status', async () => {
    await expect(controller.check()).resolves.toEqual(health);

    expect(healthCheckService.check).toHaveBeenCalledWith([
      expect.any(Function),
    ]);

    expect(databaseHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
  });
});
