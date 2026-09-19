import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { SetupService } from './setup.service.js';

vi.mock('argon2', () => ({ hash: vi.fn() }));

describe('SetupService token validation', () => {
  const token = 'test-setup-token-with-at-least-32-characters';
  const dto = {
    name: 'Owner',
    username: 'owner',
    password: 'OwnerPassword123!',
    unitName: 'Guarni',
  };
  const transaction = vi.fn();
  let service: SetupService;
  let config: ConfigService;

  beforeEach(async () => {
    vi.resetAllMocks();
    config = new ConfigService({ SETUP_OWNER_TOKEN: token });
    const module = await Test.createTestingModule({
      providers: [
        SetupService,
        { provide: ConfigService, useValue: config },
        { provide: DataSource, useValue: { transaction } },
      ],
    }).compile();
    service = module.get(SetupService);
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['shorter', 'short'],
    ['longer', token + 'extra'],
    ['same byte length', 'X' + token.slice(1)],
    ['multibyte characters', 'é'.repeat(token.length)],
  ])(
    'rejects a %s token before hashing or accessing the database',
    async (_, supplied) => {
      await expect(service.createOwner(dto, supplied)).rejects.toMatchObject({
        status: 401,
        message: 'INVALID_SETUP_TOKEN',
      });
      expect(argon2.hash).not.toHaveBeenCalled();
      expect(transaction).not.toHaveBeenCalled();
    },
  );

  it('fails closed when the server token is missing', async () => {
    vi.spyOn(config, 'get').mockReturnValue(undefined);
    await expect(service.createOwner(dto, token)).rejects.toMatchObject({
      status: 401,
      message: 'INVALID_SETUP_TOKEN',
    });
    expect(transaction).not.toHaveBeenCalled();
    expect(argon2.hash).not.toHaveBeenCalled();
  });

  it('allows the exact token through and propagates transaction errors', async () => {
    const failure = new Error('Database unavailable');
    vi.mocked(argon2.hash).mockResolvedValue('password-hash');
    transaction.mockRejectedValue(failure);
    await expect(service.createOwner(dto, token)).rejects.toBe(failure);
    expect(argon2.hash).toHaveBeenCalledWith(dto.password);
    expect(transaction).toHaveBeenCalledOnce();
  });
});
