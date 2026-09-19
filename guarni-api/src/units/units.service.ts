import { Injectable, NotImplementedException } from '@nestjs/common';
import type { UpdateUnitSettingsDto } from './dto/update-unit-settings.dto.js';

@Injectable()
export class UnitsService {
  getContext(_unitId: string): never {
    throw new NotImplementedException(
      'Contexto da unidade depende do checkpoint de autorização e dia operacional.',
    );
  }

  getSettings(_unitId: string): never {
    throw new NotImplementedException(
      'Leitura de settings será liberada após autorização por membership.',
    );
  }

  updateSettings(_unitId: string, _dto: UpdateUnitSettingsDto): never {
    throw new NotImplementedException(
      'Atualização de settings depende do checkpoint de versionamento otimista.',
    );
  }
}
