export const usersPrimaryKeyConstraint = 'PK_users';
export const usernameUniqueConstraint = 'UQ_users_username';

export const userErrorMessages = {
  usernameAlreadyInUse: 'Nome de usuário já está em uso.',
  userNotFound: 'Usuário não encontrado.',
} as const;
