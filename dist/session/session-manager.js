"use strict";
/**
 * Session Manager for MQTT broker
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const events_1 = require("events");
class SessionManager extends events_1.EventEmitter {
    constructor(sessionExpiryTimeoutMs = 24 * 60 * 60 * 1000) {
        super();
        this.sessions = new Map();
        this.sessionExpiryInterval = null;
        this.sessionExpiryTimeoutMs = sessionExpiryTimeoutMs;
        this.startSessionExpiryTimer();
    }
    /**
     * Create a new session or return existing persistent session
     */
    createSession(clientId, cleanSession) {
        const existingSession = this.sessions.get(clientId);
        if (existingSession && !cleanSession) {
            // Restore persistent session
            existingSession.connected = true;
            existingSession.lastActivity = Date.now();
            this.emit('sessionRestored', existingSession);
            return existingSession;
        }
        // Create new session or replace existing one for clean session
        const session = {
            clientId,
            cleanSession,
            subscriptions: new Map(),
            messageQueue: [],
            keepAlive: 60, // Default, will be updated
            connected: true,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            inflightMessages: new Map(),
            nextPacketId: 1
        };
        this.sessions.set(clientId, session);
        this.emit('sessionCreated', session);
        return session;
    }
    /**
     * Restore session from storage
     */
    restoreSession(clientId, session) {
        session.connected = true;
        session.lastActivity = Date.now();
        this.sessions.set(clientId, session);
        this.emit('sessionRestored', session);
    }
    /**
     * Get session by client ID
     */
    getSession(clientId) {
        return this.sessions.get(clientId) || null;
    }
    /**
     * Update session data
     */
    updateSession(session) {
        session.lastActivity = Date.now();
        this.sessions.set(session.clientId, session);
        this.emit('sessionUpdated', session);
    }
    /**
     * Remove session
     */
    removeSession(clientId) {
        const session = this.sessions.get(clientId);
        if (session) {
            this.sessions.delete(clientId);
            this.emit('sessionRemoved', session);
        }
    }
    /**
     * Mark session as disconnected
     */
    disconnectSession(clientId) {
        const session = this.sessions.get(clientId);
        if (session) {
            session.connected = false;
            session.lastActivity = Date.now();
            // Remove clean sessions immediately
            if (session.cleanSession) {
                this.removeSession(clientId);
            }
            else {
                this.updateSession(session);
            }
        }
    }
    /**
     * Add subscription to session
     */
    addSubscription(clientId, topicFilter, qos) {
        const session = this.getSession(clientId);
        if (session) {
            session.subscriptions.set(topicFilter, qos);
            this.updateSession(session);
            this.emit('subscriptionAdded', clientId, topicFilter, qos);
        }
    }
    /**
     * Remove subscription from session
     */
    removeSubscription(clientId, topicFilter) {
        const session = this.getSession(clientId);
        if (session) {
            session.subscriptions.delete(topicFilter);
            this.updateSession(session);
            this.emit('subscriptionRemoved', clientId, topicFilter);
        }
    }
    /**
     * Queue message for offline client
     */
    queueMessage(clientId, message) {
        const session = this.getSession(clientId);
        if (session && !session.cleanSession) {
            // Apply queue limit to prevent memory exhaustion
            const maxQueueSize = 1000; // Configurable limit
            if (session.messageQueue.length >= maxQueueSize) {
                // Remove oldest message
                session.messageQueue.shift();
            }
            session.messageQueue.push(message);
            this.updateSession(session);
            this.emit('messageQueued', clientId, message);
        }
    }
    /**
     * Get queued messages for client
     */
    getQueuedMessages(clientId) {
        const session = this.getSession(clientId);
        if (session) {
            const messages = [...session.messageQueue];
            session.messageQueue = []; // Clear queue after retrieval
            this.updateSession(session);
            return messages;
        }
        return [];
    }
    /**
     * Add inflight message for QoS 1 and 2
     */
    addInflightMessage(clientId, message) {
        const session = this.getSession(clientId);
        if (!session) {
            throw new Error(`Session not found for client ${clientId}`);
        }
        const packetId = this.getNextPacketId(session);
        message.packetId = packetId;
        session.inflightMessages.set(packetId, message);
        this.updateSession(session);
        return packetId;
    }
    /**
     * Remove inflight message
     */
    removeInflightMessage(clientId, packetId) {
        const session = this.getSession(clientId);
        if (session) {
            const message = session.inflightMessages.get(packetId);
            if (message) {
                session.inflightMessages.delete(packetId);
                this.updateSession(session);
                return message;
            }
        }
        return null;
    }
    /**
     * Get inflight message
     */
    getInflightMessage(clientId, packetId) {
        const session = this.getSession(clientId);
        if (session) {
            return session.inflightMessages.get(packetId) || null;
        }
        return null;
    }
    /**
     * Get next packet ID for session
     */
    getNextPacketId(session) {
        let packetId = session.nextPacketId;
        // Find next available packet ID (1-65535)
        while (session.inflightMessages.has(packetId)) {
            packetId = (packetId % 65535) + 1;
            // Prevent infinite loop
            if (packetId === session.nextPacketId) {
                throw new Error('No available packet IDs');
            }
        }
        session.nextPacketId = (packetId % 65535) + 1;
        return packetId;
    }
    /**
     * Expire old sessions
     */
    expireSessions() {
        const now = Date.now();
        const sessionsToRemove = [];
        for (const [clientId, session] of this.sessions) {
            // Only expire disconnected persistent sessions
            if (!session.connected && !session.cleanSession) {
                if (now - session.lastActivity > this.sessionExpiryTimeoutMs) {
                    sessionsToRemove.push(clientId);
                }
            }
        }
        for (const clientId of sessionsToRemove) {
            this.removeSession(clientId);
        }
        if (sessionsToRemove.length > 0) {
            this.emit('sessionsExpired', sessionsToRemove);
        }
    }
    /**
     * Start session expiry timer
     */
    startSessionExpiryTimer() {
        this.sessionExpiryInterval = setInterval(() => {
            this.expireSessions();
        }, 60000); // Check every minute
    }
    /**
     * Stop session expiry timer
     */
    stopExpiryTimer() {
        if (this.sessionExpiryInterval) {
            clearInterval(this.sessionExpiryInterval);
            this.sessionExpiryInterval = null;
        }
    }
    /**
     * Get all sessions
     */
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    /**
     * Get session count
     */
    getSessionCount() {
        return this.sessions.size;
    }
    /**
     * Get connected session count
     */
    getConnectedSessionCount() {
        return Array.from(this.sessions.values()).filter(s => s.connected).length;
    }
    /**
     * Clear all sessions (for testing)
     */
    clearAllSessions() {
        this.sessions.clear();
        this.emit('allSessionsCleared');
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=session-manager.js.map