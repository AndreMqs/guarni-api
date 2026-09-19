export const usersPrimaryKeyConstraint = 'PK_users';
export const usernameUniqueConstraint = 'UQ_users_username';

export const userFieldLimits = {
  name: {
    minLength: 1,
    maxLength: 120,
  },
  username: {
    minLength: 1,
    maxLength: 60,
  },
  password: {
    minLength: 12,
    maxLength: 128,
  },
} as const;

export const usernameAllowedCharactersPattern = /^[a-z0-9._-]+$/;

export const userValidationMessages = {
  invalidUsernameCharacters:
    'username deve conter apenas letras sem acento, números, ponto, hífen ou sublinhado',
} as const;

export const userErrorMessages = {
  usernameAlreadyInUse: 'Nome de usuário já está em uso.',
  userNotFound: 'Usuário não encontrado.',
} as const;
