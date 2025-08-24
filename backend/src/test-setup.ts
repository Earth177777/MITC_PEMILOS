import { ConfigService } from '@nestjs/config';

// Mock ConfigService for tests
jest.mock('@nestjs/config');

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: { [key: string]: any } = {
      PORT: 3001,
      DATABASE_PATH: ':memory:',
      JWT_SECRET: 'test-jwt-secret',
      ADMIN_PASSWORD_HASH: '$2b$12$test.hash.for.testing.purposes.only',
      ENCRYPTION_KEY: 'test-encryption-key-32-characters',
      ALLOWED_ORIGINS: 'http://localhost:5173,http://localhost:3000',
      LOG_LEVEL: 'error', // Reduce log noise in tests
    };
    return config[key];
  }),
};

(ConfigService as jest.Mock).mockImplementation(() => mockConfigService);

// Global test timeout
jest.setTimeout(30000);