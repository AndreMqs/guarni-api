import { Injectable, NotImplementedException } from '@nestjs/common';
import type { HistoryDayQueryDto } from './dto/history-day-query.dto.js';
import type { ListHistoryDaysQueryDto } from './dto/list-history-days-query.dto.js';

@Injectable()
export class ManagementService {
  dashboard(_unitId: string): never { return this.pending('dashboard'); }
  currentDaySummary(_unitId: string): never { return this.pending('resumo do dia'); }
  history(_unitId: string, _query: ListHistoryDaysQueryDto): never { return this.pending('histórico mensal'); }
  historyDay(_unitId: string, _date: string, _query: HistoryDayQueryDto): never { return this.pending('histórico diário'); }

  private pending(feature: string): never {
    throw new NotImplementedException(
      `${feature} depende das regras de dia operacional, tarefas e agregações.`,
    );
  }
}
