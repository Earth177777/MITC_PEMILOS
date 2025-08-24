import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from '../entities/candidate.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { InitialMigration1692000000000 } from './migrations/1692000000000-InitialMigration';
import { SeedInitialData1692000000001 } from './migrations/1692000000001-SeedInitialData';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const isTest = configService.get<string>('NODE_ENV') === 'test';
        
        return {
          type: 'sqlite' as const,
          database: configService.get<string>('DATABASE_PATH') || 
            (isTest ? ':memory:' : 'db/electronic_voting_system.sqlite'),
          entities: [Candidate, AuditLog],
          
          // Migration configuration
          migrations: [InitialMigration1692000000000, SeedInitialData1692000000001],
          migrationsRun: true, // Auto-run migrations on startup
          synchronize: !isProduction, // Only sync in development/test
          
          // Performance and logging
          maxQueryExecutionTime: 1000, // Log slow queries
          logging: configService.get<boolean>('DATABASE_LOGGING') || false,
          logger: 'advanced-console' as const,
          
          // Error handling
          retryAttempts: 3,
          retryDelay: 3000,
        };
      },
    }),
  ],
})
export class DatabaseModule {}