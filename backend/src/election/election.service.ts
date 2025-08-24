import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Candidate } from '../entities/candidate.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { ElectionState, initialElectionState, Room } from './election.state';
import { ElectionStatus, RoomStatus } from '../types';
import { SecurityService } from '../security/security.service';
import { LoggingService } from '../common/services/logging.service';
import {
  ElectionClosedException,
  ElectionPausedException,
  RoomNotFoundException,
  RoomDisabledException,
  CandidateNotFoundException,
  InvalidCredentialsException,
  RateLimitExceededException,
  VotingNotAllowedException,
  DatabaseOperationException,
} from '../common/exceptions/election.exceptions';

@Injectable()
export class ElectionService implements OnModuleInit {
  private state: ElectionState = initialElectionState;
  private stateChangeCallback: (newState: any) => void;
  private readonly logger = new Logger(ElectionService.name);

  constructor(
    @InjectRepository(Candidate) private candidateRepository: Repository<Candidate>,
    @InjectRepository(AuditLog) private auditLogRepository: Repository<AuditLog>,
    private configService: ConfigService,
    private securityService: SecurityService,
    private loggingService: LoggingService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing ElectionService...');
    await this.loadInitialState();
  }

  private async loadInitialState() {
    try {
      const [candidates, auditLog] = await Promise.all([
        this.candidateRepository.find({ order: { candidateNumber: 'ASC' } }),
        this.auditLogRepository.find({ order: { timestamp: 'DESC' }, take: 100 }),
      ]);

      this.state.candidates = candidates;
      this.state.auditLog = auditLog.map(log => ({ ...log, _id: log.id.toString() }));

      this.logger.log('Initial state loaded from database.');
      await this.loggingService.logInfo('Initial election state loaded successfully', 'ElectionService', {
        candidatesCount: candidates.length,
        auditLogCount: auditLog.length,
      });
      this.notifyStateChange();
    } catch (error) {
      await this.loggingService.logError('Failed to load initial state', error, 'ElectionService');
      throw new DatabaseOperationException('load initial state', error.message);
    }
  }
  
  onStateChange(callback: (newState: any) => void) {
    this.stateChangeCallback = callback;
  }

  private async notifyStateChange() {
    if (this.stateChangeCallback) {
      const fullState = await this.getFullState();
      this.stateChangeCallback(fullState);
    }
  }
  
  async getFullState() {
      return {
        rooms: this.state.rooms,
        electionStatus: this.state.electionStatus,
        auditLog: this.state.auditLog,
        candidates: this.state.candidates,
      }
  }
  
  getRoomById(roomId: string): Room | undefined {
    return this.state.rooms.find(r => r.id === roomId);
  }

  handleDisconnect(socketId: string) {
      const room = this.state.rooms.find(r => r.socketId === socketId);
      if(room) {
          this.logger.log(`Room "${room.name}" disconnected.`);
          room.status = 'OFFLINE';
          delete room.socketId;
          this.notifyStateChange();
      }
  }

  async login(username: string, password: string, socketId: string) {
    try {
      // Rate limiting check
      const clientIdentifier = `login_${socketId}`;
      if (this.securityService.isRateLimited(clientIdentifier, 5, 900000)) {
        await this.logAction('LOGIN_RATE_LIMITED', `Rate limit exceeded for socket: ${socketId}`);
        await this.loggingService.logSecurityEvent(
          'Login rate limit exceeded',
          { socketId, clientIdentifier },
          'medium',
          { sessionId: socketId }
        );
        throw new RateLimitExceededException('Too many login attempts. Please try again later.');
      }

      // Input validation
      const usernameValidation = this.securityService.validateUsername(username);
      if (!usernameValidation.isValid) {
        await this.loggingService.logSecurityEvent(
          'Invalid username format in login attempt',
          { username, error: usernameValidation.error },
          'low',
          { sessionId: socketId }
        );
        throw new InvalidCredentialsException(usernameValidation.error);
      }

      // Sanitize inputs
      const sanitizedUsername = this.securityService.sanitizeInput(username);
      const sanitizedPassword = this.securityService.sanitizeInput(password);

      // Check election status
      if (this.state.electionStatus === 'CLOSED') {
        await this.loggingService.logSecurityEvent(
          'Login attempt during closed election',
          { username: sanitizedUsername },
          'medium',
          { sessionId: socketId }
        );
        throw new ElectionClosedException();
      }
      if (this.state.electionStatus === 'PAUSED') {
        await this.loggingService.logInfo(
          'Login attempt during paused election',
          'ElectionService',
          { username: sanitizedUsername },
          { sessionId: socketId }
        );
        throw new ElectionPausedException();
      }

      // Find user and verify password
      const user = this.state.users.find(u => u.username.toLowerCase() === sanitizedUsername.toLowerCase());
      if (!user) {
        await this.logAction('LOGIN_FAILED', `Failed login attempt for username: ${sanitizedUsername}`);
        await this.loggingService.logSecurityEvent(
          'Login attempt with non-existent username',
          { username: sanitizedUsername },
          'medium',
          { sessionId: socketId }
        );
        throw new InvalidCredentialsException();
      }

      // For backward compatibility, check if password is hashed or plain text
      let isValidPassword = false;
      if (user.password.startsWith('$2b$')) {
        // Password is hashed
        isValidPassword = await this.securityService.verifyPassword(sanitizedPassword, user.password);
      } else {
        // Legacy plain text password (should be migrated)
        isValidPassword = user.password === sanitizedPassword;
        await this.loggingService.logWarn(
          `User ${sanitizedUsername} is using plain text password. Consider migrating to hashed passwords.`,
          'ElectionService',
          { username: sanitizedUsername }
        );
      }

      if (!isValidPassword) {
        await this.logAction('LOGIN_FAILED', `Failed login attempt for username: ${sanitizedUsername}`);
        await this.loggingService.logSecurityEvent(
          'Login attempt with invalid password',
          { username: sanitizedUsername },
          'high',
          { sessionId: socketId }
        );
        throw new InvalidCredentialsException();
      }

      const room = this.state.rooms.find(r => r.id === user.roomId);
      if (!room) {
        await this.loggingService.logError(
          'Room configuration error during login',
          new Error(`Room ${user.roomId} not found for user ${sanitizedUsername}`),
          'ElectionService',
          { sessionId: socketId }
        );
        throw new RoomNotFoundException(user.roomId);
      }

      if (room.status === 'DISABLED') {
        await this.loggingService.logSecurityEvent(
          'Login attempt to disabled room',
          { username: sanitizedUsername, roomId: room.id, roomName: room.name },
          'medium',
          { sessionId: socketId }
        );
        throw new RoomDisabledException();
      }
      
      // Disconnect any existing session for this room
      if (room.socketId) {
        await this.loggingService.logWarn(
          `Room "${room.name}" already has an active session. Disconnecting old session.`,
          'ElectionService',
          { roomId: room.id, oldSocketId: room.socketId, newSocketId: socketId }
        );
        // Ideally, we would force disconnect the old socket here.
        // For now, we'll just overwrite it.
      }

      room.socketId = socketId;
      // Only set status to WAITING if the room is currently OFFLINE
      // This preserves the room's voting status during re-login
      if (room.status === 'OFFLINE') {
        room.status = 'WAITING';
      }
      await this.logAction('LOGIN_SUCCESS', `Room "${room.name}" logged in successfully`);
      await this.loggingService.logAuditEvent(
        'LOGIN_SUCCESS',
        'Room',
        { roomId: room.id, roomName: room.name, username: sanitizedUsername },
        { sessionId: socketId }
      );
      this.logger.log(`Room "${room.name}" logged in successfully.`);
      this.notifyStateChange();
      return { success: true, room: { id: room.id, name: room.name } };
    } catch (error) {
      if (error instanceof InvalidCredentialsException ||
          error instanceof RateLimitExceededException ||
          error instanceof ElectionClosedException ||
          error instanceof ElectionPausedException ||
          error instanceof RoomNotFoundException ||
          error instanceof RoomDisabledException) {
        return { success: false, message: error.message };
      }
      
      await this.loggingService.logError(
        'Unexpected error during login',
        error,
        'ElectionService',
        { sessionId: socketId }
      );
      return { success: false, message: 'An unexpected error occurred during login.' };
    }
  }
  
  async castVote(roomId: string, candidateId: string, socketId: string) {
    try {
      // Rate limiting check
      const clientIdentifier = `vote_${socketId}`;
      if (this.securityService.isRateLimited(clientIdentifier, 3, 300000)) {
        await this.logAction('VOTE_RATE_LIMITED', `Rate limit exceeded for room: ${roomId}`);
        await this.loggingService.logSecurityEvent(
          'Vote rate limit exceeded',
          { roomId, socketId, clientIdentifier },
          'medium',
          { sessionId: socketId }
        );
        throw new RateLimitExceededException('Too many vote attempts. Please wait before trying again.');
      }

      const room = this.state.rooms.find(r => r.id === roomId);
      if (!room) {
        await this.loggingService.logError(
          'Vote attempt for non-existent room',
          new Error(`Room ${roomId} not found`),
          'ElectionService',
          { sessionId: socketId }
        );
        throw new RoomNotFoundException(roomId);
      }

      if (room.socketId !== socketId) {
        await this.loggingService.logSecurityEvent(
          'Unauthorized vote attempt',
          { roomId, expectedSocketId: room.socketId, actualSocketId: socketId },
          'high',
          { sessionId: socketId }
        );
        throw new VotingNotAllowedException('Unauthorized vote attempt.');
      }

      if (room.status !== 'VOTING_ALLOWED') {
        await this.loggingService.logWarn(
          'Vote attempt when room not in voting mode',
          'ElectionService',
          { roomId, roomStatus: room.status },
          { sessionId: socketId }
        );
        throw new VotingNotAllowedException(`Room is not in voting mode. Current status: ${room.status}`);
      }

      const candidate = this.state.candidates.find(c => c.id.toString() === candidateId);
      if (!candidate) {
        await this.loggingService.logError(
          'Vote attempt for invalid candidate',
          new Error(`Candidate ${candidateId} not found`),
          'ElectionService',
          { sessionId: socketId }
        );
        throw new CandidateNotFoundException(candidateId);
      }

      // Cast the vote
      candidate.votes += 1;
      room.status = 'WAITING';

      // Update database
      const dbCandidate = await this.candidateRepository.findOne({ where: { id: parseInt(candidateId) } });
      if (dbCandidate) {
        dbCandidate.votes += 1;
        await this.candidateRepository.save(dbCandidate);
      }

      await this.logAction('VOTE_CAST', `Room "${room.name}" voted for candidate: ${candidate.name}`);
      await this.loggingService.logAuditEvent(
        'VOTE_CAST',
        'Vote',
        { 
          roomId: room.id, 
          roomName: room.name, 
          candidateId: candidate.id, 
          candidateName: candidate.name
        },
        { sessionId: socketId }
      );
      this.logger.log(`Room "${room.name}" voted for candidate: ${candidate.name}`);
      this.notifyStateChange();
      return { success: true, message: 'Vote cast successfully!' };
    } catch (error) {
      if (error instanceof RateLimitExceededException ||
          error instanceof RoomNotFoundException ||
          error instanceof VotingNotAllowedException ||
          error instanceof CandidateNotFoundException) {
        return { success: false, message: error.message };
      }
      
      await this.loggingService.logError(
        'Unexpected error during vote casting',
        error,
        'ElectionService',
        { sessionId: socketId }
      );
      return { success: false, message: 'An unexpected error occurred while casting the vote.' };
    }
  }
  
  async verifyAdminPassword(password: string, socketId?: string) {
      // Rate limiting for admin attempts
      const clientIdentifier = `admin_${socketId || 'unknown'}`;
      if (this.securityService.isRateLimited(clientIdentifier, 3, 900000)) {
        await this.logAction('ADMIN_RATE_LIMITED', `Admin rate limit exceeded for socket: ${socketId}`);
        return { success: false, message: 'Too many admin attempts. Please try again later.' };
      }

      const sanitizedPassword = this.securityService.sanitizeInput(password);
      
      // Get admin password from environment or use hashed version
      const adminPasswordHash = this.configService.get<string>('ADMIN_PASSWORD_HASH');
      let isValidPassword = false;

      if (adminPasswordHash && adminPasswordHash.startsWith('$2b$')) {
        // Use hashed password from environment
        isValidPassword = await this.securityService.verifyPassword(sanitizedPassword, adminPasswordHash);
      } else {
        // Fallback to legacy plain text (should be migrated)
        isValidPassword = sanitizedPassword === this.state.masterAdminPassword;
        this.logger.warn('Admin is using plain text password. Consider migrating to hashed password in environment variables.');
      }

      if (isValidPassword) {
        await this.logAction('ADMIN_LOGIN_SUCCESS', `Admin authentication successful`);
        return { success: true };
      } else {
        await this.logAction('ADMIN_LOGIN_FAILED', `Failed admin authentication attempt`);
        return { success: false, message: 'Invalid admin password.' };
      }
  }
  
  private async logAction(action: string, details: string) {
      const newLog = this.auditLogRepository.create({ action, details });
      const savedLog = await this.auditLogRepository.save(newLog);
      this.state.auditLog.unshift({ ...savedLog, _id: savedLog.id.toString()});
       if (this.state.auditLog.length > 100) {
        this.state.auditLog.pop();
    }
  }
  
  async setRoomStatus(roomId: string, status: RoomStatus) {
      const room = this.state.rooms.find(r => r.id === roomId);
      if (!room) return;
      
      const oldStatus = room.status;
      room.status = status;
      
      if(status === 'VOTING_ALLOWED') room.voteStartTime = Date.now();
      else delete room.voteStartTime;
      
      if(status === 'WAITING' && oldStatus === 'VOTING_ALLOWED') {
          // This is a post-vote reset, no need to log
      } else if (status === 'DISABLED') {
          await this.logAction('BOOTH DISABLED', `Voting Booth "${room.name}" was disabled.`);
      } else if (status === 'OFFLINE' && oldStatus === 'DISABLED') {
          await this.logAction('BOOTH ENABLED', `Voting Booth "${room.name}" was enabled.`);
      }
      
      this.notifyStateChange();
  }

  async setElectionStatus(status: ElectionStatus) {
    if (this.state.electionStatus === status) return;
    
    this.state.electionStatus = status;

    if (status === 'PAUSED') {
      await this.logAction('ELECTION PAUSED', 'The election was globally paused.');
    } else if (status === 'RUNNING') {
       await this.logAction('ELECTION RESUMED', 'The election was globally resumed.');
    } else if (status === 'CLOSED') {
      await this.logAction('ELECTION CLOSED', 'The election was permanently closed. No further voting is possible.');
    }

    this.notifyStateChange();
  }
}