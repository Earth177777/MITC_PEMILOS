import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectionGateway } from './election.gateway';
import { ElectionService } from './election.service';
import { Candidate } from '../entities/candidate.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate, AuditLog]),
    SecurityModule,
  ],
  providers: [ElectionGateway, ElectionService],
})
export class ElectionModule {}