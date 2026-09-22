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
