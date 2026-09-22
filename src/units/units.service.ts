import {
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import type { UpdateUnitSettingsDto } from './dto/update-unit-settings.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Unit } from './entities/unit.entity.js';
import { Repository } from 'typeorm';
import { unitsErrorMessages } from './units.constants.js';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
  ) {}

  getContext(_unitId: string): never {
    throw new NotImplementedException(
      'Contexto da unidade depende do checkpoint de autorização e dia operacional.',
    );
  }

  async getSettings(unitId: string) {
    const unit = await this.unitRepository.findOneBy({ id: unitId });

    if (!unit) {
      throw new NotFoundException(unitsErrorMessages.unityNotFound);
    }

    return {
      id: unit.id,
      name: unit.name,
      timezone: unit.timezone,
      closingTime: unit.closingTime,
      version: unit.version,
    };
  }

  updateSettings(_unitId: string, _dto: UpdateUnitSettingsDto): never {
    throw new NotImplementedException(
      'Atualização de settings depende do checkpoint de versionamento otimista.',
    );
  }
}
