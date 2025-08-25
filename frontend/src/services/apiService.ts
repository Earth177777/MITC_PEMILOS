import { io, Socket } from 'socket.io-client';
import type { Candidate, Room, ElectionStatus, AuditLogEntry } from '../types';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private socket: Socket;

  constructor() {
    this.socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('connect_error', (err) => {
        console.error('Connection Error:', err.message);
    });
  }

  // --- Emitters (Client -> Server) ---

  login(username: string, password: string): Promise<{ success: boolean; message?: string; initialState?: any }> {
    return new Promise((resolve) => {
      this.socket.emit('login', { username, password }, (response: { success: boolean; message?: string; initialState?: any }) => {
        resolve(response);
      });
    });
  }
  
  requestInitialState() {
      this.socket.emit('requestInitialState');
  }

  allowVote(roomId: string) {
    this.socket.emit('allowVote', roomId);
  }

  castVote(candidateId: string, roomId: string): Promise<Candidate | null> {
    return new Promise((resolve) => {
      this.socket.emit('castVote', { candidateId, roomId }, (response: Candidate | null) => {
        resolve(response);
      });
    });
  }
  
  verifyAdminPassword(password: string): Promise<{ success: boolean }> {
      return new Promise(resolve => {
          this.socket.emit('verifyAdminPassword', password, (response: { success: boolean }) => {
              resolve(response);
          });
      });
  }

  pauseElection() {
    this.socket.emit('pauseElection');
  }

  resumeElection() {
    this.socket.emit('resumeElection');
  }

  closeElection() {
    this.socket.emit('closeElection');
  }

  disableRoom(roomId: string) {
    this.socket.emit('disableRoom', roomId);
  }

  enableRoom(roomId: string) {
    this.socket.emit('enableRoom', roomId);
  }


  // --- Listeners (Server -> Client) ---

  onStateUpdate(callback: (state: { rooms: Room[]; electionStatus: ElectionStatus; auditLog: AuditLogEntry[]; candidates: Candidate[] }) => void) {
    this.socket.on('stateUpdate', callback);
  }

  onVoteAllowed(callback: () => void) {
    this.socket.on('voteAllowed', callback);
  }
  
  onInitialState(callback: (state: { rooms: Room[]; electionStatus: ElectionStatus; auditLog: AuditLogEntry[]; candidates: Candidate[] }) => void) {
    this.socket.on('initialState', callback);
  }

  cleanup() {
    this.socket.off('stateUpdate');
    this.socket.off('voteAllowed');
    this.socket.off('initialState');
  }
}

export const apiService = new ApiService();