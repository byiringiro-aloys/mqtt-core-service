/**
 * Session Manager for MQTT broker
 */

import { EventEmitter } from 'events';
import { SessionManager as ISessionManager, Session, Message, QoSLevel } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class SessionManager extends EventEmitter implements ISessionManager {
  private sessions: Map<string, Session> = new Map();
  private sessionExpiryInterval: NodeJS.Timeout | null = null;
  private sessionExpiryTimeoutMs: number;

  constructor(sessionExpiryTimeoutMs: number = 24 * 60 * 60 * 1000) { // 24 hours default
    super();
    this.sessionExpiryTimeoutMs = sessionExpiryTimeoutMs;
    this.startSessionExpiryTimer();
  }

  /**
   * Create a new session or return existing persistent session
   */
  createSession(clientId: string, cleanSession: boolean): Session {
    const existingSession = this.sessions.get(clientId);

    if (existingSession && !cleanSession) {
      // Restore persistent session
      existingSession.connected = true;
      existingSession.lastActivity = Date.now();
      this.emit('sessionRestored', existingSession);
      return existingSession;
    }

    // Create new session or replace existing one for clean session
    const session: Session = {
      clientId,
      cleanSession,
      subscriptions: new Map<string, QoSLevel>(),
      messageQueue: [],
      keepAlive: 60, // Default, will be updated
      connected: true,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      inflightMessages: new Map<number, Message>(),
      nextPacketId: 1
    };

    this.sessions.set(clientId, session);
    this.emit('sessionCreated', session);
    
    return session;
  }

  /**
   * Restore session from storage
   */
  restoreSession(clientId: string, session: Session): void {
    session.connected = true;
    session.lastActivity = Date.now();
    this.sessions.set(clientId, session);
    this.emit('sessionRestored', session);
  }

  /**
   * Get session by client ID
   */
  getSession(clientId: string): Session | null {
    return this.sessions.get(clientId) || null;
  }

  /**
   * Update session data
   */
  updateSession(session: Session): void {
    session.lastActivity = Date.now();
    this.sessions.set(session.clientId, session);
    this.emit('sessionUpdated', session);
  }

  /**
   * Remove session
   */
  removeSession(clientId: string): void {
    const session = this.sessions.get(clientId);
    if (session) {
      this.sessions.delete(clientId);
      this.emit('sessionRemoved', session);
    }
  }

  /**
   * Mark session as disconnected
   */
  disconnectSession(clientId: string): void {
    const session = this.sessions.get(clientId);
    if (session) {
      session.connected = false;
      session.lastActivity = Date.now();
      
      // Remove clean sessions immediately
      if (session.cleanSession) {
        this.removeSession(clientId);
      } else {
        this.updateSession(session);
      }
    }
  }

  /**
   * Add subscription to session
   */
  addSubscription(clientId: string, topicFilter: string, qos: QoSLevel): void {
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
  removeSubscription(clientId: string, topicFilter: string): void {
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
  queueMessage(clientId: string, message: Message): void {
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
  getQueuedMessages(clientId: string): Message[] {
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
  addInflightMessage(clientId: string, message: Message): number {
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
  removeInflightMessage(clientId: string, packetId: number): Message | null {
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
  getInflightMessage(clientId: string, packetId: number): Message | null {
    const session = this.getSession(clientId);
    if (session) {
      return session.inflightMessages.get(packetId) || null;
    }
    return null;
  }

  /**
   * Get next packet ID for session
   */
  private getNextPacketId(session: Session): number {
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
  expireSessions(): void {
    const now = Date.now();
    const sessionsToRemove: string[] = [];

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
  private startSessionExpiryTimer(): void {
    this.sessionExpiryInterval = setInterval(() => {
      this.expireSessions();
    }, 60000); // Check every minute
  }

  /**
   * Stop session expiry timer
   */
  stopExpiryTimer(): void {
    if (this.sessionExpiryInterval) {
      clearInterval(this.sessionExpiryInterval);
      this.sessionExpiryInterval = null;
    }
  }

  /**
   * Get all sessions
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get connected session count
   */
  getConnectedSessionCount(): number {
    return Array.from(this.sessions.values()).filter(s => s.connected).length;
  }

  /**
   * Clear all sessions (for testing)
   */
  clearAllSessions(): void {
    this.sessions.clear();
    this.emit('allSessionsCleared');
  }
}