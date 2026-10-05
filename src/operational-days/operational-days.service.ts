import { Injectable } from '@nestjs/common';
import { ClockService } from '../clock/clock.service.js';
import { DateTime } from 'luxon';
import { InjectRepository } from '@nestjs/typeorm';
import { OperationalDay } from './entities/operational-day.entity.js';
import { Repository } from 'typeorm';
import type { Unit } from '../units/entities/unit.entity.js';

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
  ) { }

  getCurrentDay(params: GetCurrentDayParams): CurrentOperationalDay {
    const { timezone, closingTime } = params;
    const [hour, minute] = closingTime.split(':').map(Number);

    const now = DateTime.fromJSDate(this.clockService.now(), {
      zone: timezone,
    });

    const todayCutoff = now.startOf('day').set({
      hour,
      minute,
    });

    const opensAt = now < todayCutoff ? todayCutoff.minus({ days: 1 }) : todayCutoff;
    const closesAt = opensAt.plus({ days: 1 });
    const date = opensAt.toFormat('yyyy-MM-dd');

    return {
      date,
      opensAt: opensAt.toJSDate(),
      closesAt: closesAt.toJSDate()
    }
  }

  async getOrCreateCurrentDay(
    unit: Unit
  ): Promise<OperationalDay> {
    const { timezone, closingTime, id: unitId } = unit;

    const currentDay = this.getCurrentDay({
      timezone,
      closingTime,
    });

    const existingDay = await this.operationalDayRepository.findOneBy({
      unitId,
      date: currentDay.date,
    });

    if (existingDay) {
      return existingDay;
    }

    const operationalDay = this.operationalDayRepository.create({
      unitId,
      date: currentDay.date,
      opensAt: currentDay.opensAt,
      closesAt: currentDay.closesAt,
      closedAt: null,
    });

    return this.operationalDayRepository.save(operationalDay);
  }
}
