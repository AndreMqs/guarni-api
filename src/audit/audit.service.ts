import { Injectable, NotImplementedException } from '@nestjs/common';
import type { ListAuditEventsQueryDto } from './dto/list-audit-events-query.dto.js';
import type { ListMediaQueryDto } from './dto/list-media-query.dto.js';

@Injectable()
export class AuditService {
  listEvents(_unitId: string, _query: ListAuditEventsQueryDto): never {
    throw new NotImplementedException(
      'Auditoria depende da autorização OWNER e da gravação transacional de business events.',
    );
  }

  getEvent(_unitId: string, _eventId: string): never {
    throw new NotImplementedException('Detalhe de auditoria ainda não implementado.');
  }

  listMedia(_unitId: string, _query: ListMediaQueryDto): never {
    throw new NotImplementedException(
      'Catálogo de mídias depende do domínio de evidências.',
    );
  }
}
