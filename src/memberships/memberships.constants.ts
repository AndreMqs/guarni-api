export const membershipsPrimaryKeyConstraint = 'PK_memberships';
export const membershipUnitUserUniqueConstraint = 'UQ_memberships_unit_user';
export const membershipUserForeignKeyConstraint = 'FK_memberships_user';
export const membershipUnitForeignKeyConstraint = 'FK_memberships_unit';
export const membershipRoleCheckConstraint = 'CK_memberships_role';

export const membershipRoles = {
  owner: 'OWNER',
  manager: 'MANAGER',
  employee: 'EMPLOYEE',
} as const;

export type MembershipRole =
  (typeof membershipRoles)[keyof typeof membershipRoles];

export const unitMembershipErrorMessages = {
  invalidUuid: 'unitId deve ser um UUID válido.',
  accessDenied: 'Sem acesso a esta unidade.',
};

export const membershipManagementErrorMessages = {
  accessDenied: 'Sem permissão para gerenciar membros desta unidade.',
  unitNotFound: 'Unidade não encontrada.',
  membershipNotFound: 'Vínculo não encontrado nesta unidade.',
  lastActiveOwner: 'A unidade deve manter pelo menos um proprietário ativo.',
  versionConflict:
    'Este vínculo foi alterado. Atualize os dados e tente novamente.',
};
