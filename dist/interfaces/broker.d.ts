/**
 * Core broker interfaces and contracts
 * Defines the main interfaces for broker components
 */
import { Socket } from 'net';
import { WebSocket } from 'ws';
import { Message, Session, ClientConnection, Subscription, MQTTPacket, QoSLevel } from '../types/mqtt';
/**
 * Connection manager interface for handling client connections
 */
export interface ConnectionManager {
    /**
     * Accept a new client connection
     */
    acceptConnection(socket: Socket | WebSocket): Promise<ClientConnection>;
    /**
     * Close a client connection
     */
    closeConnection(connectionId: string): Promise<void>;
    /**
     * Send data to a client connection
     */
    sendData(connectionId: string, data: Buffer): Promise<void>;
    /**
     * Get current connection count
     */
    getConnectionCount(): number;
    /**
     * Get connection by ID
     */
    getConnection(connectionId: string): ClientConnection | null;
    /**
     * Get all active connections
     */
    getAllConnections(): ClientConnection[];
}
/**
 * Protocol handler interface for MQTT packet processing
 */
export interface ProtocolHandler {
    /**
     * Parse MQTT packet from buffer
     */
    parsePacket(data: Buffer): MQTTPacket | null;
    /**
     * Serialize MQTT packet to buffer
     */
    serializePacket(packet: MQTTPacket): Buffer;
    /**
     * Validate MQTT packet structure
     */
    validatePacket(packet: MQTTPacket): boolean;
}
/**
 * Session manager interface for client session handling
 */
export interface SessionManager {
    /**
     * Create a new session
     */
    createSession(clientId: string, cleanSession: boolean): Session;
    /**
     * Get existing session
     */
    getSession(clientId: string): Session | null;
    /**
     * Update session state
     */
    updateSession(session: Session): Promise<void>;
    /**
     * Delete session
     */
    deleteSession(clientId: string): Promise<void>;
    /**
     * Expire old sessions
     */
    expireSessions(): Promise<void>;
    /**
     * Get all active sessions
     */
    getAllSessions(): Session[];
}
/**
 * Topic trie interface for efficient topic matching
 */
export interface TopicTrie {
    /**
     * Add subscription to the trie
     */
    addSubscription(topicFilter: string, clientId: string, qos: QoSLevel): void;
    /**
     * Remove subscription from the trie
     */
    removeSubscription(topicFilter: string, clientId: string): void;
    /**
     * Find all subscribers matching a topic
     */
    findSubscribers(topic: string): Subscription[];
    /**
     * Get all subscriptions for a client
     */
    getClientSubscriptions(clientId: string): Subscription[];
    /**
     * Clear all subscriptions
     */
    clear(): void;
}
/**
 * Message router interface for routing messages to subscribers
 */
export interface MessageRouter {
    /**
     * Route a message to matching subscribers
     */
    routeMessage(message: Message): Promise<void>;
    /**
     * Add subscription
     */
    addSubscription(subscription: Subscription): void;
    /**
     * Remove subscription
     */
    removeSubscription(topicFilter: string, clientId: string): void;
    /**
     * Get subscribers for a topic
     */
    getSubscribers(topic: string): Subscription[];
}
/**
 * QoS handler interface for Quality of Service management
 */
export interface QoSHandler {
    /**
     * Publish message with QoS 0 (at most once)
     */
    publishQoS0(message: Message, subscribers: Subscription[]): Promise<void>;
    /**
     * Publish message with QoS 1 (at least once)
     */
    publishQoS1(message: Message, subscribers: Subscription[]): Promise<void>;
    /**
     * Publish message with QoS 2 (exactly once)
     */
    publishQoS2(message: Message, subscribers: Subscription[]): Promise<void>;
    /**
     * Handle acknowledgment for QoS 1 and 2 messages
     */
    handleAcknowledgment(packetId: number, clientId: string): Promise<void>;
    /**
     * Handle retransmission of unacknowledged messages
     */
    handleRetransmission(): Promise<void>;
}
/**
 * Persistent storage interface for data persistence
 */
export interface PersistentStore {
    /**
     * Store retained message
     */
    storeRetainedMessage(topic: string, message: Message): Promise<void>;
    /**
     * Get retained message for topic
     */
    getRetainedMessage(topic: string): Promise<Message | null>;
    /**
     * Delete retained message
     */
    deleteRetainedMessage(topic: string): Promise<void>;
    /**
     * Store session state
     */
    storeSession(session: Session): Promise<void>;
    /**
     * Load session state
     */
    loadSession(clientId: string): Promise<Session | null>;
    /**
     * Delete session
     */
    deleteSession(clientId: string): Promise<void>;
    /**
     * Store queued message for offline client
     */
    storeQueuedMessage(clientId: string, message: Message): Promise<void>;
    /**
     * Get queued messages for client
     */
    getQueuedMessages(clientId: string): Promise<Message[]>;
    /**
     * Clear queued messages for client
     */
    clearQueuedMessages(clientId: string): Promise<void>;
    /**
     * Initialize storage
     */
    initialize(): Promise<void>;
    /**
     * Close storage
     */
    close(): Promise<void>;
}
/**
 * Authentication interface for client authentication
 */
export interface Authenticator {
    /**
     * Authenticate client with username and password
     */
    authenticate(username: string, password: string): Promise<boolean>;
    /**
     * Authenticate client with certificate
     */
    authenticateCertificate(certificate: Buffer): Promise<boolean>;
    /**
     * Check if client is authorized for topic
     */
    authorize(clientId: string, topic: string, operation: 'read' | 'write'): Promise<boolean>;
}
/**
 * Metrics collector interface for monitoring
 */
export interface MetricsCollector {
    /**
     * Increment counter metric
     */
    incrementCounter(name: string, labels?: Record<string, string>): void;
    /**
     * Set gauge metric
     */
    setGauge(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Record histogram metric
     */
    recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Get all metrics
     */
    getMetrics(): Record<string, any>;
}
/**
 * Event emitter interface for broker events
 */
export interface BrokerEventEmitter {
    /**
     * Emit broker event
     */
    emit(event: string, ...args: any[]): void;
    /**
     * Listen for broker event
     */
    on(event: string, listener: (...args: any[]) => void): void;
    /**
     * Remove event listener
     */
    off(event: string, listener: (...args: any[]) => void): void;
}
/**
 * Main broker interface
 */
export interface MQTTBroker {
    /**
     * Start the broker
     */
    start(): Promise<void>;
    /**
     * Stop the broker
     */
    stop(): Promise<void>;
    /**
     * Get broker status
     */
    getStatus(): {
        running: boolean;
        connections: number;
        sessions: number;
        uptime: number;
    };
    /**
     * Handle client connection
     */
    handleConnection(connection: ClientConnection): Promise<void>;
    /**
     * Handle client disconnection
     */
    handleDisconnection(connectionId: string): Promise<void>;
    /**
     * Process MQTT packet
     */
    processPacket(connectionId: string, packet: MQTTPacket): Promise<void>;
}
//# sourceMappingURL=broker.d.ts.map