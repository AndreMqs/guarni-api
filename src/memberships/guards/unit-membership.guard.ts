import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';

@Injectable()
export class UnitMembershipGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // LEARNING CHECKPOINT:
    // Este guard precisa consultar a membership ativa da unidade, anexá-la ao
    // contexto da request e negar acesso cruzado entre unidades.
    // Não retornar true temporariamente: isso criaria uma falha de autorização.
    throw new NotImplementedException(
      'Autorização por membership ainda não foi implementada.',
    );
  }
}
