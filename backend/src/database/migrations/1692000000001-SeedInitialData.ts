import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialData1692000000001 implements MigrationInterface {
  name = 'SeedInitialData1692000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert initial candidates
    await queryRunner.query(`
      INSERT INTO candidates (candidateNumber, imageUrl, ketua, wakil, visi, misi, votes) VALUES
      (
        '01',
        '/images/candidate1.jpg',
        '{"name": "Sarah Johnson"}',
        '{"name": "Maria Garcia"}',
        '["Sustainable Development", "Social Equity", "Environmental Protection"]',
        '["Expand renewable energy initiatives", "Strengthen public healthcare system", "Improve education funding and accessibility", "Promote affordable housing programs", "Enhance public transportation infrastructure"]',
        0
      )
    `);
    
    await queryRunner.query(`
      INSERT INTO candidates (candidateNumber, imageUrl, ketua, wakil, visi, misi, votes) VALUES
      (
        '02',
        '/images/candidate2.jpg',
        '{"name": "David Rodriguez"}',
        '{"name": "Jennifer Kim"}',
        '["Economic Growth", "Environmental Protection", "Community Development"]',
        '["Support small business development", "Implement green building standards", "Create job training programs", "Establish community wellness centers", "Develop urban green spaces and parks"]',
        0
      )
    `);
    
    await queryRunner.query(`
      INSERT INTO candidates (candidateNumber, imageUrl, ketua, wakil, visi, misi, votes) VALUES
      (
        '03',
        '/images/candidate3.jpg',
        '{"name": "Michael Chen"}',
        '{"name": "Lisa Wang"}',
        '["Technology Innovation", "Digital Transformation", "Smart Governance"]',
        '["Modernize city infrastructure with smart technology", "Promote digital literacy and access", "Foster innovation hubs and startup ecosystems", "Implement data-driven governance solutions", "Enhance cybersecurity and digital privacy protection"]',
        0
      )
    `);

    // Insert initial audit log entry
    await queryRunner.query(`
      INSERT INTO audit_logs (action, details, timestamp) VALUES
      (
        'SYSTEM_INIT',
        'Electronic voting system initialized with initial candidate data',
        datetime('now')
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove initial data
    await queryRunner.query(`DELETE FROM audit_logs WHERE action = 'SYSTEM_INIT'`);
    await queryRunner.query(`DELETE FROM candidates WHERE candidateNumber IN ('01', '02', '03')`);
  }
}