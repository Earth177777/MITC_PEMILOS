export interface Candidate {
  _id: string;
  candidateNumber: string;
  imageUrl: string;
  ketua: {
    name: string;
  };
  wakil: {
    name:string;
  };
  visi: string[];
  misi: string[];
  votes: number;
}

export type RoomStatus = 'OFFLINE' | 'WAITING' | 'VOTING_ALLOWED' | 'PAUSED' | 'DISABLED';

export interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  voteStartTime?: number;
}

export type ElectionStatus = 'RUNNING' | 'PAUSED' | 'CLOSED';

export interface AuditLogEntry {
  _id: string;
  timestamp: string;
  action: string;
  details: string;
}