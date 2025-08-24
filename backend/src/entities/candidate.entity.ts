import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  candidateNumber: string;

  @Column()
  imageUrl: string;

  @Column('simple-json')
  ketua: {
    name: string;
  };

  @Column('simple-json')
  wakil: {
    name: string;
  };

  @Column('simple-json')
  visi: string[];

  @Column('simple-json')
  misi: string[];

  @Column({ default: 0 })
  votes: number;
}