import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class EvidenceService {
  upload(_unitId: string, _taskId: string): never {
    throw new NotImplementedException(
      'Upload multipart/storage é um checkpoint de aprendizado e ainda não foi implementado.',
    );
  }

  getMetadata(_unitId: string, _evidenceId: string): never {
    throw new NotImplementedException(
      'Leitura de evidência depende de autorização por unidade.',
    );
  }

  getContentUrl(_unitId: string, _evidenceId: string): never {
    throw new NotImplementedException(
      'URL assinada é um checkpoint de storage e ainda não foi implementada.',
    );
  }
}
