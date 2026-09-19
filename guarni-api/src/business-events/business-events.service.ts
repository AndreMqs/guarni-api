import { Injectable } from '@nestjs/common';

@Injectable()
export class BusinessEventsService {
  // Intencionalmente vazio por enquanto.
  // A gravação append-only precisa ser introduzida junto com as primeiras
  // transações de negócio, para você aprender como manter evento e estado atual
  // no mesmo commit.
}
