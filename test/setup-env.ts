process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.DATABASE_URL =
  'postgresql://guarni:guarni_local@localhost:5432/guarni_test';
process.env.JWT_ACCESS_SECRET =
  'test-access-secret-with-at-least-32-characters';
process.env.JWT_ACCESS_TTL_SECONDS = '900';
process.env.SETUP_OWNER_TOKEN =
  'test-setup-owner-token-with-at-least-32-characters';
