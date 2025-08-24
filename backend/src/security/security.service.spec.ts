import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SecurityService } from './security.service';
import * as bcrypt from 'bcrypt';

describe('SecurityService', () => {
  let service: SecurityService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: { [key: string]: any } = {
                ENCRYPTION_KEY: 'test-encryption-key-32-characters',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SecurityService>(SecurityService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await service.hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.startsWith('$2b$')).toBe(true);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123!';
      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await service.hashPassword(password);
      const isValid = await service.verifyPassword(password, hashedPassword);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123!';
      const wrongPassword = 'wrongPassword123!';
      const hashedPassword = await service.hashPassword(password);
      const isValid = await service.verifyPassword(wrongPassword, hashedPassword);
      
      expect(isValid).toBe(false);
    });

    it('should handle invalid hash gracefully', async () => {
      const password = 'testPassword123!';
      const invalidHash = 'invalid-hash';
      const isValid = await service.verifyPassword(password, invalidHash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const strongPassword = 'StrongPass123!';
      const result = service.validatePasswordStrength(strongPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'short',
        'nouppercase123!',
        'NOLOWERCASE123!',
        'NoNumbers!',
        'NoSpecialChars123',
      ];

      weakPasswords.forEach(password => {
        const result = service.validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML characters', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = service.sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    it('should handle non-string input', () => {
      const nonStringInput = 123 as any;
      const sanitized = service.sanitizeInput(nonStringInput);
      
      expect(sanitized).toBe('');
    });

    it('should trim whitespace', () => {
      const inputWithSpaces = '  test input  ';
      const sanitized = service.sanitizeInput(inputWithSpaces);
      
      expect(sanitized).toBe('test input');
    });
  });

  describe('validateUsername', () => {
    it('should accept valid username', () => {
      const validUsername = 'validUser123';
      const result = service.validateUsername(validUsername);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        '', // empty
        'ab', // too short
        'a'.repeat(21), // too long
        'user@domain.com', // invalid characters
        'user space', // spaces
      ];

      invalidUsernames.forEach(username => {
        const result = service.validateUsername(username);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should handle null/undefined input', () => {
      const result1 = service.validateUsername(null as any);
      const result2 = service.validateUsername(undefined as any);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token of specified length', () => {
      const token = service.generateSecureToken(16);
      
      expect(token).toBeDefined();
      expect(token.length).toBe(32); // hex encoding doubles the length
    });

    it('should generate different tokens', () => {
      const token1 = service.generateSecureToken();
      const token2 = service.generateSecureToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('rate limiting', () => {
    it('should allow requests within limit', () => {
      const identifier = 'test-user';
      
      for (let i = 0; i < 5; i++) {
        const isLimited = service.isRateLimited(identifier, 5, 900000);
        expect(isLimited).toBe(false);
      }
    });

    it('should block requests exceeding limit', () => {
      const identifier = 'test-user-2';
      
      // Make 5 requests (should all pass)
      for (let i = 0; i < 5; i++) {
        service.isRateLimited(identifier, 5, 900000);
      }
      
      // 6th request should be blocked
      const isLimited = service.isRateLimited(identifier, 5, 900000);
      expect(isLimited).toBe(true);
    });

    it('should reset after time window', () => {
      const identifier = 'test-user-3';
      
      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        service.isRateLimited(identifier, 5, 1); // 1ms window
      }
      
      // Wait for window to expire
      return new Promise(resolve => {
        setTimeout(() => {
          const isLimited = service.isRateLimited(identifier, 5, 900000);
          expect(isLimited).toBe(false);
          resolve(void 0);
        }, 10);
      });
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('should remove expired records', () => {
      const identifier = 'test-cleanup';
      
      // Create a record with short expiry
      service.isRateLimited(identifier, 5, 1);
      
      // Wait for expiry and cleanup
      return new Promise(resolve => {
        setTimeout(() => {
          service.cleanupRateLimitStore();
          
          // Should be able to make requests again without hitting limit
          for (let i = 0; i < 5; i++) {
            const isLimited = service.isRateLimited(identifier, 5, 900000);
            expect(isLimited).toBe(false);
          }
          resolve(void 0);
        }, 10);
      });
    });
  });
});