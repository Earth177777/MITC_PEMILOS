import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialMigration1692000000000 implements MigrationInterface {
  name = 'InitialMigration1692000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create candidates table
    await queryRunner.createTable(
      new Table({
        name: 'candidates',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'candidateNumber',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'imageUrl',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'ketua',
            type: 'text',
          },
          {
            name: 'wakil',
            type: 'text',
          },
          {
            name: 'visi',
            type: 'text',
          },
          {
            name: 'misi',
            type: 'text',
          },
          {
            name: 'votes',
            type: 'integer',
            default: 0,
          },
        ],
      }),
      true,
    );

    // Create audit_logs table
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'details',
            type: 'text',
          },
          {
            name: 'timestamp',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for better performance
    await queryRunner.createIndex(
      'candidates',
      new TableIndex({
        name: 'IDX_CANDIDATE_NUMBER',
        columnNames: ['candidateNumber'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_TIMESTAMP',
        columnNames: ['timestamp'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_ACTION',
        columnNames: ['action'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
    await queryRunner.dropTable('candidates');
  }
}