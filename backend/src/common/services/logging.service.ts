import { Injectable, Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface LogEntry {
  timestamp: string;
  level: string;
  context: string;
  message: string;
  data?: any;
  stack?: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
}

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);
  private readonly logDir: string;
  private readonly enableFileLogging: boolean;
  private readonly logLevels: LogLevel[];

  constructor(private configService: ConfigService) {
    this.logDir = this.configService.get<string>('LOG_DIR') || './logs';
    this.enableFileLogging = this.configService.get<boolean>('ENABLE_FILE_LOGGING') || false;
    this.logLevels = this.getLogLevels();
    
    if (this.enableFileLogging) {
      this.ensureLogDirectory();
    }
  }

  private getLogLevels(): LogLevel[] {
    const level = this.configService.get<string>('LOG_LEVEL') || 'log';
    const levels: { [key: string]: LogLevel[] } = {
      'error': ['error'],
      'warn': ['error', 'warn'],
      'log': ['error', 'warn', 'log'],
      'debug': ['error', 'warn', 'log', 'debug'],
      'verbose': ['error', 'warn', 'log', 'debug', 'verbose'],
    };
    return levels[level] || levels['log'];
  }

  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      this.logger.error('Failed to create log directory', error);
    }
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.enableFileLogging) return;

    try {
      const date = new Date().toISOString().split('T')[0];
      const filename = `${date}.log`;
      const filepath = path.join(this.logDir, filename);
      const logLine = JSON.stringify(entry) + '\n';
      
      await fs.promises.appendFile(filepath, logLine);
    } catch (error) {
      this.logger.error('Failed to write log to file', error);
    }
  }

  private createLogEntry(
    level: string,
    message: string,
    context: string,
    data?: any,
    stack?: string,
    metadata?: { userId?: string; sessionId?: string; ip?: string }
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      ...(data && { data }),
      ...(stack && { stack }),
      ...(metadata?.userId && { userId: metadata.userId }),
      ...(metadata?.sessionId && { sessionId: metadata.sessionId }),
      ...(metadata?.ip && { ip: metadata.ip }),
    };
  }

  async logError(
    message: string,
    error?: Error | any,
    context = 'Application',
    metadata?: { userId?: string; sessionId?: string; ip?: string }
  ): Promise<void> {
    const entry = this.createLogEntry(
      'error',
      message,
      context,
      error,
      error?.stack,
      metadata
    );
    
    this.logger.error(message, error?.stack, context);
    await this.writeToFile(entry);
  }

  async logWarn(
    message: string,
    context = 'Application',
    data?: any,
    metadata?: { userId?: string; sessionId?: string; ip?: string }
  ): Promise<void> {
    const entry = this.createLogEntry('warn', message, context, data, undefined, metadata);
    
    this.logger.warn(message, context);
    await this.writeToFile(entry);
  }

  async logInfo(
    message: string,
    context = 'Application',
    data?: any,
    metadata?: { userId?: string; sessionId?: string; ip?: string }
  ): Promise<void> {
    const entry = this.createLogEntry('log', message, context, data, undefined, metadata);
    
    this.logger.log(message, context);
    await this.writeToFile(entry);
  }

  async logDebug(
    message: string,
    context = 'Application',
    data?: any,
    metadata?: { userId?: string; sessionId?: string; ip?: string }
  ): Promise<void> {
    if (!this.logLevels.includes('debug')) return;
    
    const entry = this.createLogEntry('debug', message, context, data, undefined, metadata);
    
    this.logger.debug(message, context);
    await this.writeToFile(entry);
  }

  async logVerbose(
    message: string,
    context = 'Application',
    data?: any,
    metadata?: { userId?: string; sessionId?: string; ip?: string }
  ): Promise<void> {
    if (!this.logLevels.includes('verbose')) return;
    
    const entry = this.createLogEntry('verbose', message, context, data, undefined, metadata);
    
    this.logger.verbose(message, context);
    await this.writeToFile(entry);
  }

  // Security-specific logging methods
  async logSecurityEvent(
    event: string,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    metadata?: { userId?: string; sessionId?: string; ip?: string }
  ): Promise<void> {
    const message = `Security Event: ${event}`;
    const data = { ...details, severity };
    
    if (severity === 'critical' || severity === 'high') {
      await this.logError(message, data, 'Security', metadata);
    } else {
      await this.logWarn(message, 'Security', data, metadata);
    }
  }

  async logAuditEvent(
    action: string,
    resource: string,
    details: any,
    metadata?: { userId?: string; sessionId?: string; ip?: string }
  ): Promise<void> {
    const message = `Audit: ${action} on ${resource}`;
    await this.logInfo(message, 'Audit', details, metadata);
  }

  // Performance logging
  async logPerformance(
    operation: string,
    duration: number,
    context = 'Performance',
    metadata?: { userId?: string; sessionId?: string; ip?: string }
  ): Promise<void> {
    const message = `Performance: ${operation} took ${duration}ms`;
    const data = { operation, duration };
    
    if (duration > 5000) { // Log as warning if operation takes more than 5 seconds
      await this.logWarn(message, context, data, metadata);
    } else {
      await this.logDebug(message, context, data, metadata);
    }
  }
}