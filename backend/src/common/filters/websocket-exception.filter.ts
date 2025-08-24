import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WebSocketExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WebSocketExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    
    let error: string;
    let message: string;
    let details: any;

    if (exception instanceof WsException) {
      const errorObject = exception.getError();
      if (typeof errorObject === 'string') {
        message = errorObject;
        error = 'WebSocketError';
      } else {
        message = (errorObject as any).message || 'WebSocket error occurred';
        error = (errorObject as any).error || 'WebSocketError';
        details = (errorObject as any).details;
      }
    } else if (exception instanceof Error) {
      message = process.env.NODE_ENV === 'production' 
        ? 'An error occurred' 
        : exception.message;
      error = exception.name;
    } else {
      message = 'Unknown error occurred';
      error = 'UnknownError';
    }

    // Log the error
    this.logger.error(
      `WebSocket error for client ${client.id}: ${message}`,
      exception instanceof Error ? exception.stack : exception,
    );

    // Send error to client
    client.emit('error', {
      error,
      message,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
      ...(process.env.NODE_ENV !== 'production' && exception instanceof Error && {
        stack: exception.stack,
      }),
    });
  }
}