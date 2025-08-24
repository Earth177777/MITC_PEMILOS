import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ElectionGateway } from './election.gateway';
import { ElectionService } from './election.service';
import { SecurityService } from '../security/security.service';
import { LoggingService } from '../common/services/logging.service';
import { Candidate } from '../entities/candidate.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { Socket } from 'socket.io';

describe('ElectionGateway', () => {
  let gateway: ElectionGateway;
  let electionService: ElectionService;
  let mockSocket: Partial<Socket>;

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
  ];

  beforeEach(async () => {
    mockSocket = {
      id: 'test-socket-id',
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      disconnect: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectionGateway,
        {
          provide: ElectionService,
          useValue: {
            onModuleInit: jest.fn(),
            onStateChange: jest.fn(),
            login: jest.fn(),
            castVote: jest.fn(),
            verifyAdminPassword: jest.fn(),
            setRoomStatus: jest.fn(),
            setElectionStatus: jest.fn(),
            getFullState: jest.fn().mockResolvedValue({
              electionStatus: 'RUNNING',
              candidates: mockCandidates,
              rooms: [{ id: 'room1', name: 'Room 1', status: 'WAITING' }],
              auditLog: []
            }),
            getRoomById: jest.fn(),
            handleDisconnect: jest.fn(),
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

    gateway = module.get<ElectionGateway>(ElectionGateway);
    electionService = module.get<ElectionService>(ElectionService);
    
    // Mock the server property
    gateway.server = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    } as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should handle client connection', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log').mockImplementation();
      
      gateway.handleConnection(mockSocket as Socket);
      
      expect(loggerSpy).toHaveBeenCalledWith('Client connected: test-socket-id');
      
      loggerSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnection', () => {
      gateway.handleDisconnect(mockSocket as Socket);
      
      expect(electionService.handleDisconnect).toHaveBeenCalledWith('test-socket-id');
    });
  });

  describe('handleLogin', () => {
    it('should handle successful login', async () => {
      const loginData = { username: 'testuser', password: 'testpass' };
      const mockLoginResult = { success: true, room: { id: 'room1', name: 'Room 1' } };
      
      (electionService.login as jest.Mock).mockResolvedValue(mockLoginResult);
      
      const result = await gateway.handleLogin(loginData, mockSocket as Socket);
      
      expect(electionService.login).toHaveBeenCalledWith(
        'testuser',
        'testpass',
        'test-socket-id'
      );
      expect(electionService.getFullState).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        success: true,
        initialState: expect.objectContaining({
          room: mockLoginResult.room,
          candidates: expect.any(Array)
        })
      }));
    });

    it('should handle failed login', async () => {
      const loginData = { username: 'testuser', password: 'wrongpass' };
      const mockLoginResult = { success: false, message: 'Invalid credentials.' };
      
      (electionService.login as jest.Mock).mockResolvedValue(mockLoginResult);
      
      const result = await gateway.handleLogin(loginData, mockSocket as Socket);
      
      expect(result).toEqual(mockLoginResult);
    });
  });

  describe('handleCastVote', () => {
    it('should handle successful vote casting', async () => {
      const voteData = { candidateId: '1', roomId: 'room1' };
      const mockVoteResult = {
        success: true,
        message: 'Vote cast successfully!',
      };
      
      jest.spyOn(electionService, 'castVote').mockResolvedValue(mockVoteResult);
      
      const result = await gateway.handleCastVote(voteData, mockSocket as Socket);
      
      expect(result).toEqual(mockVoteResult);
      expect(electionService.castVote).toHaveBeenCalledWith('room1', '1', 'test-socket-id');
    });

    it('should handle failed vote casting', async () => {
      const voteData = { candidateId: '999', roomId: 'room1' };
      const mockVoteResult = {
        success: false,
        message: 'Candidate not found.',
      };
      
      jest.spyOn(electionService, 'castVote').mockResolvedValue(mockVoteResult);
      
      const result = await gateway.handleCastVote(voteData, mockSocket as Socket);
      
      expect(result).toEqual(mockVoteResult);
    });
  });

  describe('handleVerifyAdminPassword', () => {
    it('should handle successful admin verification', async () => {
      const password = 'correctpassword';
      const mockVerifyResult = {
        success: true,
      };
      
      jest.spyOn(electionService, 'verifyAdminPassword').mockResolvedValue(mockVerifyResult);
      
      await gateway.handleVerifyAdminPassword(password, mockSocket as Socket);
      
      expect(electionService.verifyAdminPassword).toHaveBeenCalledWith(
        'correctpassword',
        'test-socket-id'
      );
    });

    it('should handle failed admin verification', async () => {
      const password = 'wrongpassword';
      const mockVerifyResult = {
        success: false,
        message: 'Invalid admin password.',
      };
      
      jest.spyOn(electionService, 'verifyAdminPassword').mockResolvedValue(mockVerifyResult);
      
      await gateway.handleVerifyAdminPassword(password, mockSocket as Socket);
    });
  });

  describe('handleAllowVote', () => {
    it('should handle allow vote when room exists with socket', () => {
      const roomId = 'room1';
      const mockRoom = { id: 'room1', name: 'Room 1', status: 'WAITING', socketId: 'socket123' };
      
      (electionService.getRoomById as jest.Mock).mockReturnValue(mockRoom);
      (electionService.setRoomStatus as jest.Mock).mockResolvedValue(undefined);
      
      gateway.handleAllowVote(roomId);
      
      expect(electionService.getRoomById).toHaveBeenCalledWith('room1');
      expect(electionService.setRoomStatus).toHaveBeenCalledWith('room1', 'VOTING_ALLOWED');
      expect(gateway.server.to).toHaveBeenCalledWith('socket123');
    });

    it('should not set room status when room does not exist', () => {
      const roomId = 'nonexistent';
      
      (electionService.getRoomById as jest.Mock).mockReturnValue(null);
      
      gateway.handleAllowVote(roomId);
      
      expect(electionService.getRoomById).toHaveBeenCalledWith('nonexistent');
      expect(electionService.setRoomStatus).not.toHaveBeenCalled();
    });
  });

  describe('handlePauseElection', () => {
    it('should handle election pause', () => {
      jest.spyOn(electionService, 'setElectionStatus').mockResolvedValue(undefined);
      
      gateway.handlePauseElection();
      
      expect(electionService.setElectionStatus).toHaveBeenCalledWith('PAUSED');
    });
  });

  describe('handleRequestInitialState', () => {
    it('should handle initial state request', async () => {
      const mockState = {
        electionStatus: 'RUNNING' as const,
        candidates: mockCandidates,
        rooms: [],
        auditLog: [],
      };
      
      jest.spyOn(electionService, 'getFullState').mockResolvedValue(mockState);
      
      await gateway.handleRequestInitialState(mockSocket as Socket);
      
      expect(electionService.getFullState).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('initialState', mockState);
    });
  });
});