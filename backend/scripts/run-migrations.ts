#!/usr/bin/env ts-node

import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Candidate } from '../src/entities/candidate.entity';
import { AuditLog } from '../src/entities/audit-log.entity';
import { InitialMigration1692000000000 } from '../src/database/migrations/1692000000000-InitialMigration';
import { SeedInitialData1692000000001 } from '../src/database/migrations/1692000000001-SeedInitialData';

/**
 * Standalone migration runner for production deployments
 * Usage: npm run migrate
 */
async function runMigrations() {
  const configService = new ConfigService();
  
  const dataSource = new DataSource({
    type: 'sqlite',
    database: configService.get<string>('DATABASE_PATH') || 'db/electronic_voting_system.sqlite',
    entities: [Candidate, AuditLog],
    migrations: [InitialMigration1692000000000, SeedInitialData1692000000001],
    synchronize: false, // Never use synchronize in production
    logging: true,
  });

  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();
    
    console.log('Running pending migrations...');
    const migrations = await dataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('No pending migrations found.');
    } else {
      console.log(`Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach(migration => {
        console.log(`  - ${migration.name}`);
      });
    }
    
    console.log('Migration process completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  runMigrations();
}

export { runMigrations };