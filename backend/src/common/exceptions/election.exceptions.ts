import { HttpException, HttpStatus } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

// HTTP Exceptions
export class ElectionClosedException extends HttpException {
  constructor(message = 'The election is closed') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class ElectionPausedException extends HttpException {
  constructor(message = 'The election is temporarily paused') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class RoomNotFoundException extends HttpException {
  constructor(roomId: string) {
    super(`Room with ID '${roomId}' not found`, HttpStatus.NOT_FOUND);
  }
}

export class RoomDisabledException extends HttpException {
  constructor(message = 'This voting booth has been disabled by an administrator') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class CandidateNotFoundException extends HttpException {
  constructor(candidateId: string) {
    super(`Candidate with ID '${candidateId}' not found`, HttpStatus.NOT_FOUND);
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor(message = 'Invalid credentials') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class RateLimitExceededException extends HttpException {
  constructor(message = 'Too many requests. Please try again later') {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class VotingNotAllowedException extends HttpException {
  constructor(message = 'Voting is not currently allowed for this room') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class DatabaseOperationException extends HttpException {
  constructor(operation: string, error?: string) {
    super(
      `Database operation failed: ${operation}${error ? ` - ${error}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

// WebSocket Exceptions
export class ElectionWsException extends WsException {
  constructor(error: string, message: string, details?: any) {
    super({
      error,
      message,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    });
  }
}

export class LoginWsException extends ElectionWsException {
  constructor(message: string, details?: any) {
    super('LoginError', message, details);
  }
}

export class VoteWsException extends ElectionWsException {
  constructor(message: string, details?: any) {
    super('VoteError', message, details);
  }
}

export class AdminWsException extends ElectionWsException {
  constructor(message: string, details?: any) {
    super('AdminError', message, details);
  }
}

export class RoomWsException extends ElectionWsException {
  constructor(message: string, details?: any) {
    super('RoomError', message, details);
  }
}