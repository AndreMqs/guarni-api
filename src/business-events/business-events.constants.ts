export const businessEventsPrimaryKeyConstraint = 'PK_business_events';
export const businessEventUnitForeignKeyConstraint = 'FK_business_events_unit';
export const businessEventActorForeignKeyConstraint =
  'FK_business_events_actor_membership';
export const businessEventTaskForeignKeyConstraint = 'FK_business_events_task';
export const businessEventExecutionForeignKeyConstraint =
  'FK_business_events_execution';
export const businessEventEvidenceForeignKeyConstraint =
  'FK_business_events_evidence';
export const businessEventCategoryCheckConstraint =
  'CK_business_events_category';
export const businessEventActorTypeCheckConstraint =
  'CK_business_events_actor_type';

export const businessEventCategories = {
  tasks: 'TASKS',
  users: 'USERS',
  media: 'MEDIA',
} as const;
export type BusinessEventCategory =
  (typeof businessEventCategories)[keyof typeof businessEventCategories];

export const businessEventActorTypes = {
  user: 'USER',
  system: 'SYSTEM',
} as const;
export type BusinessEventActorType =
  (typeof businessEventActorTypes)[keyof typeof businessEventActorTypes];

export const businessEventTypes = {
  membershipRoleChanged: 'MEMBERSHIP_ROLE_CHANGED',
} as const;

export const businessEventSubjectTypes = {
  membership: 'MEMBERSHIP',
} as const;
