import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;
  const health = {
    status: 'ok' as const,
    info: {},
    error: {},
    details: {},
  };
  const healthCheckService = {
    check: vi.fn().mockResolvedValue(health),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns the application health status', async () => {
    await expect(controller.check()).resolves.toEqual(health);
    expect(healthCheckService.check).toHaveBeenCalledWith([]);
  });
});
