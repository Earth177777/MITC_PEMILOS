import { Module, Global } from '@nestjs/common';
import { LoggingService } from './services/logging.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { WebSocketExceptionFilter } from './filters/websocket-exception.filter';

@Global()
@Module({
  providers: [
    LoggingService,
    GlobalExceptionFilter,
    WebSocketExceptionFilter,
  ],
  exports: [
    LoggingService,
    GlobalExceptionFilter,
    WebSocketExceptionFilter,
  ],
})
export class CommonModule {}