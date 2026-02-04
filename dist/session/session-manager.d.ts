/**
 * Session Manager for MQTT broker
 */
import { EventEmitter } from 'events';
import { SessionManager as ISessionManager, Session, Message, QoSLevel } from '../types';
export declare class SessionManager extends EventEmitter implements ISessionManager {
    private sessions;
    private sessionExpiryInterval;
    private sessionExpiryTimeoutMs;
    constructor(sessionExpiryTimeoutMs?: number);
    /**
     * Create a new session or return existing persistent session
     */
    createSession(clientId: string, cleanSession: boolean): Session;
    /**
     * Restore session from storage
     */
    restoreSession(clientId: string, session: Session): void;
    /**
     * Get session by client ID
     */
    getSession(clientId: string): Session | null;
    /**
     * Update session data
     */
    updateSession(session: Session): void;
    /**
     * Remove session
     */
    removeSession(clientId: string): void;
    /**
     * Mark session as disconnected
     */
    disconnectSession(clientId: string): void;
    /**
     * Add subscription to session
     */
    addSubscription(clientId: string, topicFilter: string, qos: QoSLevel): void;
    /**
     * Remove subscription from session
     */
    removeSubscription(clientId: string, topicFilter: string): void;
    /**
     * Queue message for offline client
     */
    queueMessage(clientId: string, message: Message): void;
    /**
     * Get queued messages for client
     */
    getQueuedMessages(clientId: string): Message[];
    /**
     * Add inflight message for QoS 1 and 2
     */
    addInflightMessage(clientId: string, message: Message): number;
    /**
     * Remove inflight message
     */
    removeInflightMessage(clientId: string, packetId: number): Message | null;
    /**
     * Get inflight message
     */
    getInflightMessage(clientId: string, packetId: number): Message | null;
    /**
     * Get next packet ID for session
     */
    private getNextPacketId;
    /**
     * Expire old sessions
     */
    expireSessions(): void;
    /**
     * Start session expiry timer
     */
    private startSessionExpiryTimer;
    /**
     * Stop session expiry timer
     */
    stopExpiryTimer(): void;
    /**
     * Get all sessions
     */
    getAllSessions(): Session[];
    /**
     * Get session count
     */
    getSessionCount(): number;
    /**
     * Get connected session count
     */
    getConnectedSessionCount(): number;
    /**
     * Clear all sessions (for testing)
     */
    clearAllSessions(): void;
}
//# sourceMappingURL=session-manager.d.ts.map