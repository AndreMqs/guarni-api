import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class OperationalDaysService {
  getCurrentDay(): never {
    // LEARNING CHECKPOINT:
    // Implementar depois de estudar timezone IANA + ClockService injetável.
    throw new NotImplementedException(
      'Cálculo de dia operacional ainda não foi implementado.',
    );
  }
}
