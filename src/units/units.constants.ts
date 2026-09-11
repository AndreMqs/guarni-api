export const unitsPrimaryKeyConstraint = 'PK_units';

export const unitFieldLimits = {
  name: {
    minLength: 2,
    maxLength: 120,
  },
} as const;
