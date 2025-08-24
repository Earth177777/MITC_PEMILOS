import { ElectionStatus, RoomStatus } from "../types";

export interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  socketId?: string;
  voteStartTime?: number;
}

export interface ElectionState {
    electionStatus: ElectionStatus;
    rooms: Room[];
    users: any[];
    candidates: any[];
    auditLog: any[];
    masterAdminPassword: string;
}

export const initialElectionState: ElectionState = {
  electionStatus: 'RUNNING',
  rooms: [
    { id: 'room1', name: 'Voting Booth 1', status: 'OFFLINE' },
    { id: 'room2', name: 'Voting Booth 2', status: 'OFFLINE' },
    { id: 'room3', name: 'Voting Booth 3', status: 'OFFLINE' },
    { id: 'room4', name: 'Voting Booth 4', status: 'OFFLINE' },
    { id: 'room5', name: 'Voting Booth 5', status: 'OFFLINE' },
    { id: 'room6', name: 'Voting Booth 6', status: 'OFFLINE' },
  ],
  users: [
    { username: 'booth1', password: 'booth1MITC', roomId: 'room1' },
    { username: 'booth2', password: 'booth2MITC', roomId: 'room2' },
    { username: 'booth3', password: 'booth3MITC', roomId: 'room3' },
    { username: 'booth4', password: 'booth4MITC', roomId: 'room4' },
    { username: 'booth5', password: 'booth5MITC', roomId: 'room5' },
    { username: 'booth6', password: 'booth6MITC', roomId: 'room6' },
  ],
  candidates: [],
  auditLog: [],
  masterAdminPassword: 'masterkey2024',
};