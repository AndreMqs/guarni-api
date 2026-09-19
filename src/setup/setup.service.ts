import { Injectable, NotImplementedException } from '@nestjs/common';
import type { SetupOwnerDto } from './dto/setup-owner.dto.js';
import { setupErrorMessages } from './setup.constants.js';

@Injectable()
export class SetupService {
  async createOwner(_dto: SetupOwnerDto): Promise<never> {
    // LEARNING CHECKPOINT:
    // Implementar manualmente com TypeORM transaction + PostgreSQL advisory lock.
    // O fluxo completo está em LEARNING_NEXT_STEPS.md.
    throw new NotImplementedException(setupErrorMessages.notImplemented);
  }
}
