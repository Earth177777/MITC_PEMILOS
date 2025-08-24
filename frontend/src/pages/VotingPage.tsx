import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Candidate, Room, ElectionStatus, AuditLogEntry } from '../types';
import { apiService } from '../services/apiService';
import CandidateCard from '../components/CandidateCard';
import Spinner from '../components/Spinner';
import SuccessOverlay from '../components/SuccessOverlay';
import ConfirmVoteModal from '../components/ConfirmVoteModal';


type AppState = 'LOGIN' | 'WAITING' | 'VOTING' | 'SUCCESS' | 'ADMIN_PANEL' | 'LIVE_COUNT' | 'MASTER_CONTROL_PANEL' | 'VOTING_TIMEOUT';

// --- Generalized UI Components ---

function Card({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
    return (
        <div className={`bg-base-100 rounded-lg shadow-2xl w-full border border-base-300 overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

function CardHeader({ title, description }: { title: string; description: string; }) {
    return (
        <div className="text-center p-6 border-b border-base-300">
            <h1 className="text-3xl md:text-4xl font-extrabold text-dark-100 tracking-tight mb-2">{title}</h1>
            <p className="text-md text-dark-200">{description}</p>
        </div>
    );
}

function CardContent({ children }: React.PropsWithChildren<{}>) {
    return <div className="p-6">{children}</div>;
}

function ConfirmationModal({ title, message, confirmText, onConfirm, onCancel }: { title: string; message: string; confirmText: string; onConfirm: () => void; onCancel: () => void; }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
            <Card className="max-w-md">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-dark-100 mb-4">{title}</h2>
                    <p className="text-dark-200 mb-6">{message}</p>
                    <div className="flex justify-end gap-4">
                        <button onClick={onCancel} className="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
                        <button onClick={onConfirm} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors">{confirmText}</button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function PasswordConfirmationModal({ title, onConfirm, onCancel }: { title: string; onConfirm: (password: string) => Promise<boolean>; onCancel: () => void; }) {
    const [password, setPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setError(null);
        const success = await onConfirm(password);
        if (!success) {
            setError('Incorrect password. Please try again.');
        }
        setIsVerifying(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
            <Card className="max-w-md">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-2xl font-bold text-dark-100 mb-4">{title}</h2>
                    <p className="text-dark-200 mb-6">Masukin Keynya mas.</p>
                    <input
                        type="password"
                        placeholder="Master Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-base-200 text-dark-100 placeholder-dark-300 p-3 rounded mb-4 border border-base-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        autoFocus
                        required
                    />
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onCancel} className="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors" disabled={isVerifying}>Cancel</button>
                        <button type="submit" className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-primary-hover transition-colors" disabled={isVerifying}>
                            {isVerifying ? 'Verifying...' : 'Confirm'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

// --- Sub-components for different states ---

function LoginPage({onLogin, error}: {onLogin: (u:string, p:string) => Promise<boolean>, error: string | null}) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [shake, setShake] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        const success = await onLogin(username.trim(), password.trim());
        setIsLoggingIn(false);
        if (!success) {
            setShake(true);
            setTimeout(() => setShake(false), 500); // Reset shake after animation
        }
    }
    
    return (
        <Card className={`max-w-md ${shake ? 'animate-shake' : ''}`}>
            <CardHeader title="Device Login" description="Enter credentials to activate this voting booth." />
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <input type="text" placeholder="Username (e.g., booth1)" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} className="w-full bg-base-200 text-dark-100 placeholder-dark-300 p-3 rounded mb-4 border border-base-300 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                    <div className="relative mb-6">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Password (e.g., password1)" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full bg-base-200 text-dark-100 placeholder-dark-300 p-3 rounded border border-base-300 focus:outline-none focus:ring-2 focus:ring-brand-primary pr-10" 
                        required 
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-dark-300 hover:text-dark-100"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.742L2.303 6.546A10.048 10.048 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.673-.124 2.454-.35z" />
                        </svg>
                        ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        )}
                    </button>
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button type="submit" disabled={isLoggingIn} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg text-lg hover:bg-brand-primary-hover transition-colors duration-300 disabled:bg-gray-400">
                        {isLoggingIn ? 'Logging In...' : 'LOGIN'}
                    </button>
                </form>
            </CardContent>
        </Card>
    );
}

function WaitingPage({room, electionStatus}: {room: Pick<Room, 'id' | 'name'>, electionStatus: ElectionStatus}) {
    return (
        <Card className="text-center max-w-2xl text-dark-100">
            <div className="p-6">
                <Spinner />
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-6">
                    {electionStatus === 'PAUSED' ? 'ELECTION PAUSED' : `${room.name} is Ready`}
                </h1>
                <p className="text-xl text-dark-200 mt-4 max-w-md mx-auto">
                    {electionStatus === 'PAUSED' 
                        ? 'The election has been temporarily paused by an administrator. Please wait for instructions.'
                        : 'Please wait for the election official to start your voting session.'
                    }
                </p>
            </div>
        </Card>
    );
}

function VotingTimeoutPage() {
    return (
        <Card className="text-center max-w-2xl text-dark-100">
            <div className="p-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 1.5l21 21" />
                </svg>
                <h1 className="text-3xl md:text-4xl font-extrabold text-red-600 tracking-tight mt-6">
                    Waktu Habis
                </h1>
                <p className="text-xl text-dark-200 mt-4 max-w-md mx-auto">
                    Waktu Telah Habis, Di Mohon Untuk Tidak Golput, Segera Lapor Panitia.
                </p>
            </div>
        </Card>
    );
}

function getStatusIndicator(status: Room['status']) {
    const baseClasses = "font-bold py-1 px-3 rounded-md text-xs";
    switch(status) {
        case 'OFFLINE': return <span className={`${baseClasses} bg-gray-200 text-gray-700`}>OFFLINE</span>;
        case 'WAITING': return <span className={`${baseClasses} bg-yellow-400 text-yellow-900`}>READY</span>;
        case 'VOTING_ALLOWED': return <span className={`${baseClasses} bg-brand-primary text-white`}>ACTIVE</span>;
        case 'PAUSED': return <span className={`${baseClasses} bg-orange-400 text-orange-900`}>PAUSED</span>;
        case 'DISABLED': return <span className={`${baseClasses} bg-red-600 text-red-100`}>DISABLED</span>;
        default: return null;
    }
}

function AdminPanel({ rooms }: { rooms: Room[] }) {
    const INACTIVITY_THRESHOLD_MS = 60 * 1000;
    const audioAlert = useRef<HTMLAudioElement | null>(null);
    const alertActive = useRef(false);

    useEffect(() => {
        if (typeof Audio !== 'undefined' && !audioAlert.current) {
            audioAlert.current = new Audio('data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAASAAADbWF2ZcQAAAAEAAAAAAAAAAAA//+8DEYAAAAAcsIAAAAAAApMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYIAAAAAB1wIAAAAAAAAxITExMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYMAAAAAC3YIAAAAAAAAxMTExMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYQAAAAAENYIAAAAAAAAxMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYSAAAAADfWIAAAAAAADIxMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYUAAAAAHzYIAAAAAAAAyMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYYAAAAAM7YIAAAAAAAAyMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYcAAAAASnZIAAAAAAAAyMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYgAAAAAWCZIAAAAAAAAyMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYkAAAAAZ+ZIAAAAAAAAyMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYoAAAAAjAZIAAAAAAABRUDh8b/////////////////////////////////////////////////+8DEYqAAAAAkeZIAAAAAAABFp+9/f//////////////////////////////////////////////////+8DEYsAAAAAm+ZIAAAAAAAAE5v/f///////////////////////////////////////////////////+8DEYwAAAAApmZIAAAAAAAAEp39////////////////////////////////////////////////////+8DEY0AAAAAq+ZIAAAAAAAAEpb/f//////////////////////////////////////////////////+8DEY4AAAAAsGZIAAAAAAAAEp39////////////////////////////////////////////////////+8DEY8AAAAAuxZIAAAAAAAAEp39////////////////////////////////////////////////////+8DEZAAAAA0wZIAAAAAAAAEp39////////////////////////////////////////////////////+8DEZDAAAAADbZIAAAAAAAAEp39////////////////////////////////////////////////////+8DEZIAAAAAAExZIAAAAAAAA');
        }
    }, []);

    const inactiveBooths = rooms.filter(
        room => room.status === 'VOTING_ALLOWED' && room.voteStartTime && (Date.now() - room.voteStartTime > INACTIVITY_THRESHOLD_MS)
    );

    useEffect(() => {
        if (inactiveBooths.length > 0 && !alertActive.current) {
            alertActive.current = true;
            audioAlert.current?.play().catch(e => console.error("Audio play failed:", e));
        } else if (inactiveBooths.length === 0 && alertActive.current) {
            alertActive.current = false;
        }
    }, [inactiveBooths]);

    const handleAllow = (roomId: string) => {
        apiService.allowVote(roomId);
    };

    if(!rooms.length) return <Spinner />;

    return (
        <div className="w-full max-w-7xl">
        {inactiveBooths.length > 0 && (
            <div className="bg-red-600 text-white p-3 rounded-lg mb-4 shadow-lg animate-pulse w-full">
                <h3 className="font-bold text-lg">INACTIVITY ALERT</h3>
                <p className="text-sm">Booths active over 1 min: {inactiveBooths.map(b => b.name).join(', ')}</p>
            </div>
        )}
        <Card>
            <CardHeader title="ADMINISTRATION PANEL" description="Authorize voting sessions for each booth." />
            <CardContent>
                <div className="flex flex-row justify-center gap-6">
                    {rooms.map(room => (
                        <div key={room.id} className="bg-base-200 p-4 rounded-lg flex flex-col items-center text-center shadow-md flex-1 min-w-0 max-w-56">
                            <h2 className="text-lg font-bold text-dark-100 mb-2 truncate w-full">{room.name}</h2>
                            <div className="mb-3">{getStatusIndicator(room.status)}</div>
                            <button 
                                onClick={() => handleAllow(room.id)}
                                disabled={room.status !== 'WAITING'}
                                className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg text-base hover:bg-brand-primary-hover transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                VERIFY VOTE
                            </button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
        </div>
    );
}

function MasterControlPanel({ rooms, electionStatus, auditLog }: { rooms: Room[], electionStatus: ElectionStatus, auditLog: AuditLogEntry[] }) {
    const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState<{ action: () => void, title: string } | null>(null);
    const INACTIVITY_THRESHOLD_MS = 60 * 1000;
    const audioAlert = useRef<HTMLAudioElement | null>(null);
    const alertActive = useRef(false);

    useEffect(() => {
        if (typeof Audio !== 'undefined' && !audioAlert.current) {
            audioAlert.current = new Audio('data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAASAAADbWF2ZcQAAAAEAAAAAAAAAAAA//+8DEYAAAAAcsIAAAAAAApMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYIAAAAAB1wIAAAAAAAAxITExMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYMAAAAAC3YIAAAAAAAAxMTExMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYQAAAAAENYIAAAAAAAAxMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYSAAAAADfWIAAAAAAADIxMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYUAAAAAHzYIAAAAAAAAyMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYYAAAAAM7YIAAAAAAAAyMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYcAAAAASnZIAAAAAAAAyMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYgAAAAAWCZIAAAAAAAAyMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYkAAAAAZ+ZIAAAAAAAAyMTEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMP/+8DEYoAAAAAjAZIAAAAAAABRUDh8b/////////////////////////////////////////////////+8DEYqAAAAAkeZIAAAAAAABFp+9/f//////////////////////////////////////////////////+8DEYsAAAAAm+ZIAAAAAAAAE5v/f///////////////////////////////////////////////////+8DEYwAAAAApmZIAAAAAAAAEp39////////////////////////////////////////////////////+8DEY0AAAAAq+ZIAAAAAAAAEpb/f//////////////////////////////////////////////////+8DEY4AAAAAsGZIAAAAAAAAEp39////////////////////////////////////////////////////+8DEY8AAAAAuxZIAAAAAAAAEp39////////////////////////////////////////////////////+8DEZAAAAA0wZIAAAAAAAAEp39////////////////////////////////////////////////////+8DEZDAAAAADbZIAAAAAAAAEp39////////////////////////////////////////////////////+8DEZIAAAAAAExZIAAAAAAAA');
        }
    }, []);
    
    const inactiveBooths = rooms.filter(
        room => room.status === 'VOTING_ALLOWED' && room.voteStartTime && (Date.now() - room.voteStartTime > INACTIVITY_THRESHOLD_MS)
    );
    
    useEffect(() => {
        if (inactiveBooths.length > 0 && !alertActive.current) {
            alertActive.current = true;
            audioAlert.current?.play().catch(e => console.error("Audio play failed:", e));
        } else if (inactiveBooths.length === 0 && alertActive.current) {
            alertActive.current = false;
        }
    }, [inactiveBooths]);

    // Action handlers that will be wrapped by password confirmation
    const handlePause = () => apiService.pauseElection();
    const handleResume = () => apiService.resumeElection();
    const handleClose = () => { apiService.closeElection(); setShowCloseConfirmModal(false); };
    const handleDisable = (roomId: string) => apiService.disableRoom(roomId);
    const handleEnable = (roomId: string) => apiService.enableRoom(roomId);
    
    // Setup for confirmation modals
    const confirmAction = (action: () => void, title: string) => {
        setActionToConfirm({ action, title });
    };

    const handleCloseClick = () => {
        // This action opens the *next* modal after password is confirmed
        const action = () => setShowCloseConfirmModal(true);
        confirmAction(action, 'Confirm Close Election');
    };

    const handleConfirmPassword = async (password: string): Promise<boolean> => {
        const { success } = await apiService.verifyAdminPassword(password);
        if (success && actionToConfirm) {
            actionToConfirm.action();
            setActionToConfirm(null); // Close password modal
        }
        return success;
    };

    if (!electionStatus) return <Spinner />;

    return (
        <div className="w-full max-w-7xl">
            {inactiveBooths.length > 0 && (
                <div className="bg-red-600 text-white p-3 rounded-lg mb-4 shadow-lg animate-pulse w-full">
                    <h3 className="font-bold text-lg">INACTIVITY ALERT</h3>
                    <p className="text-sm">Booths active over 1 min: {inactiveBooths.map(b => b.name).join(', ')}</p>
                </div>
            )}
            <Card>
                <CardHeader title="MASTER CONTROL PANEL" description="Manage global election status and individual booth operations." />
                <CardContent>
                    {/* Global Controls */}
                    <div className="bg-base-200 p-4 rounded-lg mb-6">
                        <h3 className="text-lg font-bold text-dark-100 mb-3 text-center">Global Election Control</h3>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            {electionStatus === 'RUNNING' && <button onClick={() => confirmAction(handlePause, 'Confirm Pause Election')} className="bg-yellow-400 text-yellow-900 font-bold py-2 px-5 rounded-lg hover:bg-yellow-500 transition-colors">PAUSE ELECTION</button>}
                            {electionStatus === 'PAUSED' && <button onClick={() => confirmAction(handleResume, 'Confirm Resume Election')} className="bg-green-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-green-600 transition-colors">RESUME ELECTION</button>}
                            {electionStatus !== 'CLOSED' ? 
                                <button onClick={handleCloseClick} className="bg-red-700 text-white font-bold py-2 px-5 rounded-lg hover:bg-red-800 transition-colors">CLOSE ELECTION</button> :
                                <div className="text-red-500 font-bold text-xl">ELECTION CLOSED</div>
                            }
                        </div>
                    </div>

                    {/* Booth Controls */}
                    <div>
                        <h3 className="text-lg font-bold text-dark-100 mb-3 text-center">Voting Booth Management</h3>
                        <div className="flex flex-row justify-center gap-6">
                            {rooms.map(room => (
                                <div key={room.id} className="bg-base-200 p-4 rounded-lg flex flex-col items-center text-center shadow-md flex-1 min-w-0 max-w-56">
                                    <h2 className="text-lg font-bold text-dark-100 mb-2 truncate w-full">{room.name}</h2>
                                    <div className="mb-3">{getStatusIndicator(room.status)}</div>
                                    {room.status !== 'DISABLED' ? 
                                        <button onClick={() => confirmAction(() => handleDisable(room.id), `Confirm Disable ${room.name}`)} disabled={electionStatus === 'CLOSED'} className="w-full text-base bg-red-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-red-700 transition-colors duration-300 disabled:bg-gray-500">DISABLE</button> :
                                        <button onClick={() => confirmAction(() => handleEnable(room.id), `Confirm Enable ${room.name}`)} disabled={electionStatus === 'CLOSED'} className="w-full text-base bg-green-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-600 transition-colors duration-300 disabled:bg-gray-500">ENABLE</button>
                                    }
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Audit Log Section */}
                    <div className="mt-6 border-t border-base-300 pt-4">
                        <h3 className="text-lg font-bold text-dark-100 mb-3 text-center">Administrator Audit Log</h3>
                        <div className="bg-base-200 p-3 rounded-lg max-h-48 overflow-y-auto text-left text-sm">
                            {auditLog.length > 0 ? (
                                <ul>
                                    {auditLog.map((log) => (
                                        <li key={log._id} className="border-b border-base-300 last:border-b-0 py-1.5">
                                            <span className="font-semibold text-brand-primary mr-2">[{new Date(log.timestamp).toLocaleTimeString('en-GB')}]</span>
                                            <span className="font-bold mr-1">{log.action}:</span>
                                            <span className="text-dark-200">{log.details}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-dark-300">No administrative actions have been logged yet.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            {showCloseConfirmModal && <ConfirmationModal title="Confirm Close Election" message="This action is irreversible and will permanently end all voting. Are you sure?" confirmText="Yes, Close Election" onConfirm={handleClose} onCancel={() => setShowCloseConfirmModal(false)} />}
            {actionToConfirm && <PasswordConfirmationModal title={actionToConfirm.title} onConfirm={handleConfirmPassword} onCancel={() => setActionToConfirm(null)} />}
        </div>
    );
}

function LiveCountPage({ candidates: initialCandidates }: { candidates: Candidate[] }) {
    const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates.sort((a,b) => b.votes - a.votes));
    const [totalVotes, setTotalVotes] = useState(0);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
    const [nextUpdate, setNextUpdate] = useState<Date | null>(null);
    
    useEffect(() => {
        const sorted = [...initialCandidates].sort((a,b) => b.votes - a.votes);
        setCandidates(sorted);
        setTotalVotes(initialCandidates.reduce((sum, c) => sum + c.votes, 0));
        setLastUpdated(new Date());
        setNextUpdate(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes from now
    }, [initialCandidates]);
    
    // Auto-refresh every 10 minutes for voter privacy
    useEffect(() => {
        const interval = setInterval(() => {
            window.location.reload();
        }, 10 * 60 * 1000); // 10 minutes
        
        return () => clearInterval(interval);
    }, []);

    if (!candidates.length) return <Spinner />;

    // Calculate additional statistics
    const leadingCandidate = candidates[0];
    const averageVotes = totalVotes > 0 ? totalVotes / candidates.length : 0;
    const votingTurnout = totalVotes; // Assuming this represents turnout

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-4 sm:py-6 lg:py-8">
            <Card className="w-full max-w-[95vw] mx-auto shadow-2xl bg-white/95 backdrop-blur-sm border border-white/20">
                <CardHeader 
                    title="LIVE ELECTION RESULTS" 
                    description="Real-time vote monitoring and statistics"
                />
                <div className="text-center bg-base-100 py-1 border-b border-base-300">
                    <p className="text-xs text-dark-300 tracking-wider font-medium">
                        OFFICIAL DATA PROVIDED BY SMA Maitreyawira & Mitc Club
                    </p>
                </div>
                <CardContent>
                    <div className="py-4 px-4 sm:px-6 lg:px-8">
                    {/* Enhanced Statistics Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 animate-fade-in">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-xl text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-blue-400/20 animate-slide-up" style={{animationDelay: '0.1s'}}>
                        <div className="mb-2">
                            <svg className="w-8 h-8 mx-auto mb-2 opacity-90" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <p className="text-sm font-semibold uppercase tracking-wider opacity-90 mb-2">Total Votes Cast</p>
                        <p className="text-3xl font-extrabold mb-1">{totalVotes.toLocaleString()}</p>
                        <p className="text-sm opacity-80">Ballots Counted</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-600 to-green-700 text-white p-6 rounded-xl text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-emerald-400/20 animate-slide-up" style={{animationDelay: '0.2s'}}>
                        <div className="mb-2">
                            <svg className="w-8 h-8 mx-auto mb-2 opacity-90" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 8a1 1 0 01-1-1V8a1 1 0 10-2 0v4a1 1 0 01-1 1H6V5h8v8z" clipRule="evenodd"/>
                            </svg>
                        </div>
                        <p className="text-sm font-semibold uppercase tracking-wider opacity-90 mb-2">Leading Candidate</p>
                        <p className="text-lg font-bold mb-1 truncate">{leadingCandidate?.ketua.name || 'N/A'}</p>
                        <p className="text-sm opacity-80">{leadingCandidate ? `${((leadingCandidate.votes / totalVotes) * 100).toFixed(1)}% of votes` : 'No votes yet'}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-6 rounded-xl text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-purple-400/20 animate-slide-up" style={{animationDelay: '0.3s'}}>
                        <div className="mb-2">
                            <svg className="w-8 h-8 mx-auto mb-2 opacity-90" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                            </svg>
                        </div>
                        <p className="text-sm font-semibold uppercase tracking-wider opacity-90 mb-2">Average Votes</p>
                        <p className="text-3xl font-extrabold mb-1">{Math.round(averageVotes).toLocaleString()}</p>
                        <p className="text-sm opacity-80">Per Candidate</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-600 to-red-600 text-white p-6 rounded-xl text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-orange-400/20 animate-slide-up" style={{animationDelay: '0.4s'}}>
                        <div className="mb-2">
                            <div className="relative flex h-8 w-8 mx-auto mb-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-30"></span>
                                <span className="relative inline-flex rounded-full h-8 w-8 bg-white/20 items-center justify-center">
                                    <span className="h-3 w-3 bg-white rounded-full"></span>
                                </span>
                            </div>
                        </div>
                        <p className="text-sm font-semibold uppercase tracking-wider opacity-90 mb-2">System Status</p>
                        <p className="text-lg font-bold mb-1">LIVE</p>
                        <p className="text-xs opacity-80">Updated: {lastUpdated ? lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                        <p className="text-xs opacity-80">Next: {nextUpdate ? nextUpdate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                    </div>
                </div>

                    {/* Candidate Results - Enhanced Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                        {candidates.map((candidate, index) => {
                            const percentage = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0;
                            const isLeading = index === 0 && totalVotes > 0;
                            const position = index + 1;
                            
                            return (
                                <div key={candidate._id} className={`relative rounded-2xl p-6 shadow-xl border-2 transition-all duration-500 hover:shadow-2xl hover:scale-105 animate-slide-up ${
                                isLeading ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 ring-4 ring-yellow-300/50 shadow-yellow-200/50' : 'bg-white/90 backdrop-blur-sm border-gray-200/50 hover:border-blue-400/60 hover:bg-white/95'
                            }`} style={{animationDelay: `${0.5 + index * 0.1}s`}}>
                                {/* Position Badge */}
                                <div className={`absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                                    position === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                                    position === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                                    'bg-gradient-to-br from-orange-400 to-orange-500'
                                }`}>
                                    #{position}
                                </div>
                                
                                {/* Leading Indicator */}
                                {isLeading && (
                                    <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                        Leading
                                    </div>
                                )}
                                
                                {/* Candidate Number */}
                                <div className="flex justify-center mb-2">
                                    <div className="bg-brand-primary text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                                        {candidate.candidateNumber}
                                    </div>
                                </div>
                                
                                {/* Candidate Image */}
                                <div className="flex justify-center mb-4">
                                    <div className="relative w-48 h-56">
                                        <img 
                                            src={candidate.imageUrl} 
                                            alt={candidate.ketua.name} 
                                            className="w-full h-full object-cover rounded-xl shadow-lg border-4 border-white transition-all duration-300 hover:scale-105 hover:shadow-xl" 
                                        />
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/25 to-transparent"></div>
                                    </div>
                                </div>
                                
                                {/* Candidate Names */}
                                <div className="text-center mb-2">
                                    <h3 className="text-base font-bold text-gray-800 mb-1">{candidate.ketua.name}</h3>
                                    <p className="text-sm text-gray-600 font-medium">{candidate.wakil.name}</p>
                                </div>
                                
                                {/* Vote Count - Large Display */}
                                <div className="text-center mb-4">
                                    <div className={`text-4xl font-extrabold mb-2 ${
                                        isLeading ? 'text-yellow-600' : 'text-brand-primary'
                                    }`}>
                                        {candidate.votes.toLocaleString()}
                                    </div>
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Votes Received</p>
                                </div>
                                
                                {/* Percentage Display with Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-600">Vote Share</span>
                                        <span className={`text-xl font-bold ${
                                            isLeading ? 'text-yellow-600' : 'text-gray-700'
                                        }`}>
                                            {percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                                isLeading ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 animate-pulse' : 'bg-gradient-to-r from-blue-400 to-blue-500'
                                            }`}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                {/* Additional Statistics */}
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-3 border border-gray-200">
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-sm font-medium text-gray-700 flex items-center">
                                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                                            </svg>
                                            vs Average
                                        </span>
                                        <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                                            candidate.votes > averageVotes ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                                        }`}>
                                            {candidate.votes > averageVotes ? '+' : ''}{(candidate.votes - averageVotes).toFixed(0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-sm font-medium text-gray-700 flex items-center">
                                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 8a1 1 0 01-1-1V8a1 1 0 10-2 0v4a1 1 0 01-1 1H6V5h8v8z" clipRule="evenodd"/>
                                            </svg>
                                            Position
                                        </span>
                                        <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                                            position === 1 ? 'text-yellow-700 bg-yellow-100' : 
                                            position === 2 ? 'text-gray-700 bg-gray-100' : 'text-orange-700 bg-orange-100'
                                        }`}>
                                            {position === 1 ? '1st Place' : position === 2 ? '2nd Place' : '3rd Place'}
                                        </span>
                                    </div>
                                    {totalVotes > 0 && (
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-sm font-medium text-gray-700 flex items-center">
                                                <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                                                </svg>
                                                Gap to Leader
                                            </span>
                                            <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                                                position === 1 ? 'text-green-700 bg-green-100' : 'text-blue-700 bg-blue-100'
                                            }`}>
                                                {position === 1 ? 'Leading' : `-${(leadingCandidate.votes - candidate.votes).toLocaleString()}`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                    </div>
                
                    {/* Election Summary */}
                    <div className="mt-8 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-2xl p-6 border border-blue-300/50 shadow-xl backdrop-blur-sm animate-slide-up" style={{animationDelay: '0.8s'}}>
                        <div className="flex items-center justify-center mb-6">
                            <svg className="w-6 h-6 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2.5 6a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd"/>
                            </svg>
                            <h3 className="text-xl font-bold text-gray-800">Election Summary</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                            <div className="text-center bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-200/50 hover:shadow-lg transition-all duration-300 hover:bg-white hover:scale-105 animate-slide-up" style={{animationDelay: '0.9s'}}>
                                <div className="flex items-center justify-center mb-3">
                                    <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                                    </svg>
                                    <p className="text-3xl font-bold text-green-600">{candidates.length}</p>
                                </div>
                                <p className="text-sm text-gray-700 font-semibold">Total Candidates</p>
                            </div>
                            <div className="text-center bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-200/50 hover:shadow-lg transition-all duration-300 hover:bg-white hover:scale-105 animate-slide-up" style={{animationDelay: '1.0s'}}>
                                <div className="flex items-center justify-center mb-3">
                                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                    </svg>
                                    <p className="text-3xl font-bold text-blue-600">{totalVotes.toLocaleString()}</p>
                                </div>
                                <p className="text-sm text-gray-700 font-semibold">Votes Counted</p>
                            </div>
                            <div className="text-center bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-200/50 hover:shadow-lg transition-all duration-300 hover:bg-white hover:scale-105 animate-slide-up" style={{animationDelay: '1.1s'}}>
                                <div className="flex items-center justify-center mb-3">
                                    <svg className="w-5 h-5 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                    </svg>
                                    <p className="text-3xl font-bold text-yellow-600">
                                        {totalVotes > 0 ? `${((leadingCandidate.votes / totalVotes) * 100).toFixed(1)}%` : '0%'}
                                    </p>
                                </div>
                                <p className="text-sm text-gray-700 font-semibold">Leading Margin</p>
                            </div>
                        </div>
                        {leadingCandidate && totalVotes > 0 && (
                            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-l-4 border-yellow-400">
                                <div className="flex items-center justify-center">
                                    <svg className="w-5 h-5 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                    </svg>
                                    <p className="text-base text-gray-700 text-center">
                                         <span className="font-bold text-yellow-800 text-lg">{leadingCandidate.ketua.name}</span> is currently leading
                                     </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function VotingPage() {
  const [appState, setAppState] = useState<AppState>('LOGIN');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [electionStatus, setElectionStatus] = useState<ElectionStatus>('RUNNING');
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [loggedInRoom, setLoggedInRoom] = useState<Pick<Room, 'id' | 'name'> | null>(null);
  const [forceVoteUsed, setForceVoteUsed] = useState<boolean>(false);
  const [countdown, setCountdown] = useState(60);
  const countdownInterval = useRef<number | null>(null);

  const [keySequence, setKeySequence] = useState<string>('');
  const keySequenceTimeout = useRef<number | null>(null);

  const [candidateToConfirm, setCandidateToConfirm] = useState<Candidate | null>(null);

  const stopCountdown = useCallback(() => {
    if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
      stopCountdown();
      setCountdown(60);
      countdownInterval.current = window.setInterval(() => {
          setCountdown(prev => {
              if (prev <= 1) {
                  stopCountdown();
                  setAppState('VOTING_TIMEOUT');
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
  }, [stopCountdown]);
  
  // WebSocket Listeners
  useEffect(() => {
    const handleStateUpdate = (state: { rooms: Room[], electionStatus: ElectionStatus, auditLog: AuditLogEntry[], candidates: Candidate[] }) => {
        setRooms(state.rooms);
        setElectionStatus(state.electionStatus);
        setAuditLog(state.auditLog);
        setCandidates(state.candidates);
        setLoading(false);
    };

    const handleVoteAllowed = () => {
        if (appState === 'WAITING') {
            setAppState('VOTING');
        }
    };
    
    const handleInitialState = (state: { rooms: Room[], electionStatus: ElectionStatus, auditLog: AuditLogEntry[], candidates: Candidate[] }) => {
      handleStateUpdate(state);
      // If we're an admin panel, stay there. If we have a logged-in room, preserve the current state.
      // Otherwise, default to login.
      if (appState !== 'ADMIN_PANEL' && appState !== 'MASTER_CONTROL_PANEL' && appState !== 'LIVE_COUNT' && !loggedInRoom) {
          setAppState('LOGIN');
      }
    };

    apiService.onStateUpdate(handleStateUpdate);
    apiService.onVoteAllowed(handleVoteAllowed);
    apiService.onInitialState(handleInitialState);
    
    // Request initial state on mount or reconnect
    apiService.requestInitialState();

    return () => {
        apiService.cleanup();
    };
  }, [appState]);


  useEffect(() => {
    if (appState === 'VOTING') {
        startCountdown();
    } else {
        stopCountdown();
    }
    return stopCountdown;
  }, [appState, startCountdown, stopCountdown]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.shiftKey && (event.key === 'V' || event.key === 'v')) {
            event.preventDefault();
            setAppState(prevState => prevState === 'ADMIN_PANEL' ? 'LOGIN' : 'ADMIN_PANEL');
            setLoggedInRoom(null);
            setForceVoteUsed(false); // Reset force vote flag
        }
        if (event.shiftKey && (event.key === 'W' || event.key === 'w')) {
            event.preventDefault();
            setAppState(prevState => prevState === 'LIVE_COUNT' ? 'LOGIN' : 'LIVE_COUNT');
            setLoggedInRoom(null);
            setForceVoteUsed(false); // Reset force vote flag
        }
        if (event.shiftKey && (event.key === 'P' || event.key === 'p')) {
            if (!forceVoteUsed) {
                event.preventDefault();
                setLoggedInRoom(null); // Ensure no room is logged in
                setAppState('VOTING');
            }
        }
        // Master control panel sequence: Shift+2, then A
        if (event.shiftKey && event.key === '@') { // Shift+2 on many US keyboards
            event.preventDefault();
            setKeySequence('2');
            if (keySequenceTimeout.current) clearTimeout(keySequenceTimeout.current);
            keySequenceTimeout.current = window.setTimeout(() => setKeySequence(''), 2000); // Reset after 2s
        } else if (keySequence === '2' && (event.key.toLowerCase() === 'a')) {
            event.preventDefault();
            setAppState('MASTER_CONTROL_PANEL');
            setKeySequence(''); // Reset sequence
            if (keySequenceTimeout.current) clearTimeout(keySequenceTimeout.current);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (keySequenceTimeout.current) clearTimeout(keySequenceTimeout.current);
    };
  }, [forceVoteUsed, keySequence]);

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    const response = await apiService.login(username, password);
    if (response.success && response.initialState) {
        setLoggedInRoom({ id: response.initialState.room.id, name: response.initialState.room.name });
        setAppState('WAITING');
        setError(null);
        return true;
    } else {
        setError(response.message || 'Login failed.');
        return false;
    }
  };

  const handleVoteClick = (candidate: Candidate) => {
    setCandidateToConfirm(candidate);
  };

  const executeVote = async (candidate: Candidate) => {
    const isForceVote = !loggedInRoom;
    const voteRoomId = isForceVote ? 'FORCE_VOTE_SESSION' : loggedInRoom!.id;
    
    stopCountdown();

    if (isForceVote) {
        setForceVoteUsed(true);
    }

    await apiService.castVote(candidate._id, voteRoomId);
    setCandidateToConfirm(null);
    setAppState('SUCCESS');
  };
  
  const handleFinish = () => {
    // Reset force vote flag when finishing a session
    setForceVoteUsed(false);
    
    // If we came from a regular vote, go to WAITING.
    // If we came from a force vote, go back to the main LOGIN screen.
    if (loggedInRoom && appState !== 'VOTING_TIMEOUT') {
      setAppState('WAITING');
    } else {
      setAppState('LOGIN');
    }
  };

  const renderContent = () => {
    if (loading && appState === 'LOGIN') {
        return <Spinner />;
    }
    
    switch(appState) {
        case 'LOGIN':
            return <LoginPage onLogin={handleLogin} error={error} />;
        case 'WAITING':
            return loggedInRoom ? <WaitingPage room={loggedInRoom} electionStatus={electionStatus} /> : <LoginPage onLogin={handleLogin} error="Session error, please log in again." />;
        case 'VOTING':
            if (!candidates.length) return <Spinner />;
            return (
              <>
                  <div className={`fixed top-[6.5rem] left-0 right-0 p-3 text-center text-white font-bold text-xl z-20 transition-colors duration-500 ${countdown <= 10 ? 'bg-red-600 animate-pulse' : 'bg-brand-primary'}`}>
                      TIME REMAINING: {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
                  </div>
                  <div className="text-center pt-16">
                      <h1 className="text-4xl font-extrabold text-dark-100 tracking-tight mb-1">
                          CAST YOUR VOTE
                      </h1>
                      <p className="text-md text-dark-200 mb-2 max-w-3xl mx-auto">
                          Review the candidates below and make your selection. Your vote is crucial.
                      </p>
                      <p className="text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-md p-2 mb-4 max-w-3xl mx-auto text-xs">
                          <b>MANDATORY VOTING POLICY:</b> All participants are required to cast a vote. Abstaining is not an option in this election.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                          {candidates.map((candidate) => (
                              <CandidateCard
                              key={candidate._id}
                              candidate={candidate}
                              onVote={handleVoteClick}
                              />
                          ))}
                      </div>
                  </div>
              </>
            );
        case 'SUCCESS':
            return <SuccessOverlay onFinish={handleFinish} />;
        case 'VOTING_TIMEOUT':
            return <VotingTimeoutPage />;
        case 'ADMIN_PANEL':
            return <AdminPanel rooms={rooms} />;
        case 'LIVE_COUNT':
            return <LiveCountPage candidates={candidates} />;
        case 'MASTER_CONTROL_PANEL':
            return <MasterControlPanel rooms={rooms} electionStatus={electionStatus} auditLog={auditLog} />;
        default:
            return <Spinner />;
    }
  }
  
  return (
    <div className="w-full mx-auto text-center animate-fade-in flex items-center justify-center">
      {renderContent()}
      {candidateToConfirm && (
        <ConfirmVoteModal
          candidate={candidateToConfirm}
          onConfirm={() => executeVote(candidateToConfirm)}
          onCancel={() => setCandidateToConfirm(null)}
        />
      )}
    </div>
  );
}

export default VotingPage;