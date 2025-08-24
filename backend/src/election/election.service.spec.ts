import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ElectionService } from './election.service';
import { SecurityService } from '../security/security.service';
import { LoggingService } from '../common/services/logging.service';
import { Candidate } from '../entities/candidate.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { ElectionStatus, RoomStatus } from '../types';

describe('ElectionService', () => {
  let service: ElectionService;
  let candidateRepository: Repository<Candidate>;
  let auditLogRepository: Repository<AuditLog>;
  let securityService: SecurityService;
  let configService: ConfigService;

  const mockCandidates = [
    {
      id: 1,
      candidateNumber: '01',
      imageUrl: 'test-image-1.jpg',
      ketua: { name: 'Test Candidate 1' },
      wakil: { name: 'Test Vice 1' },
      visi: ['Vision 1'],
      misi: ['Mission 1'],
      votes: 0,
    },
    {
      id: 2,
      candidateNumber: '02',
      imageUrl: 'test-image-2.jpg',
      ketua: { name: 'Test Candidate 2' },
      wakil: { name: 'Test Vice 2' },
      visi: ['Vision 2'],
      misi: ['Mission 2'],
      votes: 0,
    },
  ];

  const mockAuditLogs = [
    {
      id: 1,
      timestamp: new Date(),
      action: 'TEST_ACTION',
      details: 'Test details',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectionService,
        {
          provide: getRepositoryToken(Candidate),
          useValue: {
            find: jest.fn().mockResolvedValue(mockCandidates),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            find: jest.fn().mockResolvedValue(mockAuditLogs),
            create: jest.fn().mockImplementation((data) => ({ ...data, id: 1 })),
            save: jest.fn().mockImplementation((data) => ({ ...data, id: 1 })),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: { [key: string]: any } = {
                ADMIN_PASSWORD_HASH: '$2b$12$test.hash.for.testing.purposes.only',
              };
              return config[key];
            }),
          },
        },
        {
          provide: SecurityService,
          useValue: {
            isRateLimited: jest.fn().mockReturnValue(false),
            validateUsername: jest.fn().mockReturnValue({ isValid: true }),
            sanitizeInput: jest.fn().mockImplementation((input) => input),
            verifyPassword: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: LoggingService,
          useValue: {
            logError: jest.fn(),
            logWarn: jest.fn(),
            logInfo: jest.fn(),
            logDebug: jest.fn(),
            logVerbose: jest.fn(),
            logSecurityEvent: jest.fn(),
            logAuditEvent: jest.fn(),
            logPerformance: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ElectionService>(ElectionService);
    candidateRepository = module.get<Repository<Candidate>>(getRepositoryToken(Candidate));
    auditLogRepository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
    securityService = module.get<SecurityService>(SecurityService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should load initial state from database', async () => {
      await service.onModuleInit();
      
      expect(candidateRepository.find).toHaveBeenCalledWith({
        order: { candidateNumber: 'ASC' },
      });
      expect(auditLogRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        take: 100,
      });
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await service.onModuleInit();
      // Ensure election is running
      service.setElectionStatus('RUNNING');
      // Reset security service mocks
      (securityService.isRateLimited as jest.Mock).mockReturnValue(false);
      (securityService.validateUsername as jest.Mock).mockReturnValue({ isValid: true });
      (securityService.sanitizeInput as jest.Mock).mockImplementation((input) => input);
      (securityService.verifyPassword as jest.Mock).mockResolvedValue(true);
    });

    it('should successfully login with valid credentials', async () => {
      const result = await service.login('booth1', 'password1', 'socket123');
      
      expect(result.success).toBe(true);
      expect(result.room).toBeDefined();
      expect(result.room.id).toBe('room1');
    });

    it('should reject login when election is closed', async () => {
      service.setElectionStatus('CLOSED');
      
      const result = await service.login('booth1', 'password1', 'socket123');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('The election is closed');
    });

    it('should reject login when election is paused', async () => {
      service.setElectionStatus('PAUSED');
      
      const result = await service.login('booth1', 'password1', 'socket123');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('The election is temporarily paused');
    });

    it('should reject login with invalid username', async () => {
      (securityService.validateUsername as jest.Mock).mockReturnValue({
        isValid: false,
        error: 'Invalid username format',
      });
      
      const result = await service.login('invalid@user', 'password1', 'socket123');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid username format');
    });

    it('should reject login with non-existent user', async () => {
      const result = await service.login('nonexistent', 'password', 'socket123');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
    });

    it('should reject login with wrong password', async () => {
      (securityService.verifyPassword as jest.Mock).mockResolvedValue(false);
      
      const result = await service.login('booth1', 'wrongpassword', 'socket123');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
    });

    it('should reject login when rate limited', async () => {
      (securityService.isRateLimited as jest.Mock).mockReturnValue(true);
      
      const result = await service.login('booth1', 'password1', 'socket123');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Too many login attempts. Please try again later.');
    });

    it('should reject login when room is disabled', async () => {
      // First login to set up the room
      await service.login('booth1', 'password1', 'socket123');
      
      // Disable the room
      service.setRoomStatus('room1', 'DISABLED');
      
      // Try to login again
      const result = await service.login('booth1', 'password1', 'socket456');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('This voting booth has been disabled by an administrator');
    });
  });

  describe('verifyAdminPassword', () => {
    it('should verify correct admin password', async () => {
      const result = await service.verifyAdminPassword('correctpassword', 'socket123');
      
      expect(result.success).toBe(true);
      expect(securityService.verifyPassword).toHaveBeenCalled();
    });

    it('should reject incorrect admin password', async () => {
      (securityService.verifyPassword as jest.Mock).mockResolvedValue(false);
      
      const result = await service.verifyAdminPassword('wrongpassword', 'socket123');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid admin password.');
    });

    it('should reject when rate limited', async () => {
      (securityService.isRateLimited as jest.Mock).mockReturnValue(true);
      
      const result = await service.verifyAdminPassword('password', 'socket123');
      
      expect(result.success).toBe(false);
        expect(result.message).toBe('Too many admin attempts. Please try again later.');
      });
  });

  describe('castVote', () => {
    beforeEach(async () => {
      await service.onModuleInit();
      // Set up a room in voting state
      await service.login('booth1', 'password1', 'socket123');
      service.setRoomStatus('room1', 'VOTING_ALLOWED');
    });

    it('should successfully cast a vote', async () => {
      const mockCandidate = { ...mockCandidates[0], votes: 0 };
      (candidateRepository.findOne as jest.Mock).mockResolvedValue(mockCandidate);
      (candidateRepository.save as jest.Mock).mockResolvedValue({ ...mockCandidate, votes: 1 });
      
      const result = await service.castVote('room1', '1', 'socket123');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Vote cast successfully!');
      expect(candidateRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(candidateRepository.save).toHaveBeenCalled();
    });

    it('should reject vote for non-existent candidate', async () => {
      (candidateRepository.findOne as jest.Mock).mockResolvedValue(null);
      
      const result = await service.castVote('room1', '999', 'socket123');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe("Candidate with ID '999' not found");
    });

    it('should reject vote from non-existent room', async () => {
      const result = await service.castVote('nonexistent-room', '1', 'socket123');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe("Room with ID 'nonexistent-room' not found");
    });

    it('should reject vote when room is not in voting state', async () => {
      service.setRoomStatus('room1', 'WAITING');
      
      const result = await service.castVote('room1', '1', 'socket123');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Room is not in voting mode. Current status: WAITING');
    });
  });

  describe('setElectionStatus', () => {
    it('should update election status', () => {
      service.setElectionStatus('PAUSED');
      
      const state = service.getFullState();
      expect(state).resolves.toMatchObject({
        electionStatus: 'PAUSED',
      });
    });
  });

  describe('setRoomStatus', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should update room status', () => {
      service.setRoomStatus('room1', 'DISABLED');
      
      const room = service.getRoomById('room1');
      expect(room.status).toBe('DISABLED');
    });

    it('should set vote start time when allowing vote', () => {
      const beforeTime = Date.now();
      service.setRoomStatus('room1', 'VOTING_ALLOWED');
      const afterTime = Date.now();
      
      const room = service.getRoomById('room1');
      expect(room.voteStartTime).toBeGreaterThanOrEqual(beforeTime);
      expect(room.voteStartTime).toBeLessThanOrEqual(afterTime);
    });

    it('should remove vote start time when not voting', () => {
      service.setRoomStatus('room1', 'VOTING_ALLOWED');
      service.setRoomStatus('room1', 'WAITING');
      
      const room = service.getRoomById('room1');
      expect(room.voteStartTime).toBeUndefined();
    });
  });

  describe('handleDisconnect', () => {
    beforeEach(async () => {
      await service.onModuleInit();
      await service.login('booth1', 'password1', 'socket123');
    });

    it('should handle socket disconnection', () => {
      service.handleDisconnect('socket123');
      
      const room = service.getRoomById('room1');
      expect(room.status).toBe('OFFLINE');
      expect(room.socketId).toBeUndefined();
    });

    it('should ignore disconnection of unknown socket', () => {
      const roomBefore = service.getRoomById('room1');
      
      service.handleDisconnect('unknown-socket');
      
      const roomAfter = service.getRoomById('room1');
      expect(roomAfter).toEqual(roomBefore);
    });
  });
});