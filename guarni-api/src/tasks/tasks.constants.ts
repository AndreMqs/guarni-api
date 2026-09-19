export const tasksPrimaryKeyConstraint = 'PK_tasks';
export const taskUnitForeignKeyConstraint = 'FK_tasks_unit';
export const taskAssigneeForeignKeyConstraint = 'FK_tasks_assignee_membership';
export const taskCreatorForeignKeyConstraint = 'FK_tasks_created_by_membership';
export const taskSourceForeignKeyConstraint = 'FK_tasks_source_task';
export const taskAssignmentTypeCheckConstraint = 'CK_tasks_assignment_type';
export const taskStatusCheckConstraint = 'CK_tasks_status';
export const taskAssignmentCheckConstraint = 'CK_tasks_assignment_consistency';

export const taskExecutionsPrimaryKeyConstraint = 'PK_task_executions';
export const taskExecutionTaskUniqueConstraint = 'UQ_task_executions_task';
export const taskExecutionTaskForeignKeyConstraint = 'FK_task_executions_task';
export const taskExecutionExecutorForeignKeyConstraint =
  'FK_task_executions_executor_membership';
export const taskExecutionResultCheckConstraint = 'CK_task_executions_result';
export const taskExecutionResolutionCheckConstraint =
  'CK_task_executions_resolution_type';

export const taskAssignmentTypes = {
  general: 'GENERAL',
  personal: 'PERSONAL',
} as const;
export type TaskAssignmentType =
  (typeof taskAssignmentTypes)[keyof typeof taskAssignmentTypes];

export const taskStatuses = {
  pending: 'PENDING',
  done: 'DONE',
  notDone: 'NOT_DONE',
} as const;
export type TaskStatus = (typeof taskStatuses)[keyof typeof taskStatuses];

export const taskResolutionTypes = {
  manual: 'MANUAL',
  autoClosed: 'AUTO_CLOSED',
} as const;
export type TaskResolutionType =
  (typeof taskResolutionTypes)[keyof typeof taskResolutionTypes];

export const taskFieldLimits = {
  title: { minLength: 1, maxLength: 120 },
  description: { maxLength: 2000 },
  comment: { maxLength: 1000 },
  reason: { minLength: 1, maxLength: 1000 },
} as const;
