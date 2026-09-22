export const unitsPrimaryKeyConstraint = 'PK_units';

export const unitFieldLimits = {
  name: {
    minLength: 2,
    maxLength: 120,
  },
} as const;

export const unitDefaults = {
  timezone: 'America/Sao_Paulo',
  closingTime: '03:00',
} as const;

export const unitsErrorMessages = {
  unityNotFound: 'Unidade não encontrada.',
};
