export type AccessTokenPayload = {
  sub: string;
  username: string;
  credentialVersion: number;
  iat?: number;
  exp?: number;
};
