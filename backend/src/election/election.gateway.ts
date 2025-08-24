import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ElectionService } from './election.service';
import { Logger } from '@nestjs/common';
import { LoggingService } from '../common/services/logging.service';
import { 
  InvalidCredentialsException, 
  RateLimitExceededException, 
  ElectionClosedException, 
  ElectionPausedException, 
  RoomNotFoundException, 
  RoomDisabledException,
  VotingNotAllowedException,
  CandidateNotFoundException
} from '../common/exceptions/election.exceptions';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
})
export class ElectionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ElectionGateway');

  constructor(
    private readonly electionService: ElectionService,
    private loggingService: LoggingService
  ) {
    this.electionService.onStateChange((newState) => {
      if (this.server) {
        this.server.emit('stateUpdate', newState);
      }
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.electionService.handleDisconnect(client.id);
  }

  @SubscribeMessage('requestInitialState')
  async handleRequestInitialState(@ConnectedSocket() client: Socket) {
    const state = await this.electionService.getFullState();
    client.emit('initialState', state);
  }

  @SubscribeMessage('login')
  async handleLogin(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.electionService.login(
      data.username,
      data.password,
      client.id,
    );
    if (result.success) {
      const state = await this.electionService.getFullState();
      return { success: true, initialState: { ...result, candidates: state.candidates } };
    }
    return result;
  }
  
  @SubscribeMessage('allowVote')
  handleAllowVote(@MessageBody() roomId: string) {
    const room = this.electionService.getRoomById(roomId);
    if (room && room.socketId) {
      this.server.to(room.socketId).emit('voteAllowed');
      this.electionService.setRoomStatus(roomId, 'VOTING_ALLOWED');
    }
  }

  @SubscribeMessage('castVote')
  async handleCastVote(
    @MessageBody() data: { candidateId: string, roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      return await this.electionService.castVote(data.roomId, data.candidateId, client.id);
    } catch (error) {
      await this.loggingService.logError(
        'Error in handleCastVote',
        error,
        'ElectionGateway',
        { sessionId: client.id }
      );
      return { success: false, message: 'An error occurred while processing your vote.' };
    }
  }

  @SubscribeMessage('verifyAdminPassword')
  async handleVerifyAdminPassword(
    @MessageBody() password: string,
    @ConnectedSocket() client: Socket,
  ) {
    return await this.electionService.verifyAdminPassword(password, client.id);
  }
  
  @SubscribeMessage('pauseElection')
  handlePauseElection() {
    this.electionService.setElectionStatus('PAUSED');
  }
  
  @SubscribeMessage('resumeElection')
  handleResumeElection() {
    this.electionService.setElectionStatus('RUNNING');
  }

  @SubscribeMessage('closeElection')
  handleCloseElection() {
    this.electionService.setElectionStatus('CLOSED');
  }

  @SubscribeMessage('disableRoom')
  handleDisableRoom(@MessageBody() roomId: string) {
    this.electionService.setRoomStatus(roomId, 'DISABLED');
  }

  @SubscribeMessage('enableRoom')
  handleEnableRoom(@MessageBody() roomId: string) {
    this.electionService.setRoomStatus(roomId, 'OFFLINE');
  }

}