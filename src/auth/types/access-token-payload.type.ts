export type AccessTokenPayload = {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
};
