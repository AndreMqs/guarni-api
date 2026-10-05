import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { QueryFailedError, type Repository } from 'typeorm';
import { ClockService } from '../clock/clock.service.js';
import { postgresErrorCodes } from '../database/database.constants.js';
import type { Unit } from '../units/entities/unit.entity.js';
import { OperationalDay } from './entities/operational-day.entity.js';
import { operationalDayUnitDateUniqueConstraint } from './operational-days.constants.js';

type GetCurrentDayParams = {
  timezone: string;
  closingTime: string;
};

type CurrentOperationalDay = {
  date: string;
  opensAt: Date;
  closesAt: Date;
};

@Injectable()
export class OperationalDaysService {
  constructor(
    @InjectRepository(OperationalDay)
    private readonly operationalDayRepository: Repository<OperationalDay>,
    private readonly clockService: ClockService,
  ) {}

  getCurrentDay(
    params: GetCurrentDayParams,
    currentTime = this.clockService.now(),
  ): CurrentOperationalDay {
    const { timezone, closingTime } = params;
    const [hour, minute] = closingTime.split(':').map(Number);

    const now = DateTime.fromJSDate(currentTime, {
      zone: timezone,
    });

    const todayCutoff = now.startOf('day').set({
      hour,
      minute,
    });

    const opensAt =
      now < todayCutoff ? todayCutoff.minus({ days: 1 }) : todayCutoff;
    const closesAt = opensAt.plus({ days: 1 });
    const date = opensAt.toFormat('yyyy-MM-dd');

    return {
      date,
      opensAt: opensAt.toJSDate(),
      closesAt: closesAt.toJSDate(),
    };
  }

  async getOrCreateCurrentDay(
    unit: Unit,
    currentTime = this.clockService.now(),
  ): Promise<OperationalDay> {
    const { timezone, closingTime, id: unitId } = unit;
    const currentDay = this.getCurrentDay(
      {
        timezone,
        closingTime,
      },
      currentTime,
    );
    const lookup = {
      unitId,
      date: currentDay.date,
    };

    const existingDay = await this.operationalDayRepository.findOneBy(lookup);

    if (existingDay) {
      return existingDay;
    }

    try {
      await this.operationalDayRepository.insert({
        ...lookup,
        opensAt: currentDay.opensAt,
        closesAt: currentDay.closesAt,
        closedAt: null,
      });
    } catch (error) {
      if (!this.isConcurrentDayCreation(error)) {
        throw error;
      }
    }

    return this.operationalDayRepository.findOneByOrFail(lookup);
  }

  private isConcurrentDayCreation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const databaseError = error.driverError as {
      code?: string;
      constraint?: string;
    };

    return (
      databaseError.code === postgresErrorCodes.uniqueViolation &&
      databaseError.constraint === operationalDayUnitDateUniqueConstraint
    );
  }
}
