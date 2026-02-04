/**
 * MongoDB Storage Implementation for MQTT Broker
 * Provides persistent storage for messages, sessions, and retained messages
 */
import { Message, Session, QoSLevel } from '../types';
import { EventEmitter } from 'events';
export interface StoredMessage {
    _id?: string;
    topic: string;
    payload: Buffer;
    qos: QoSLevel;
    retain: boolean;
    packetId?: number;
    id: string;
    timestamp: Date;
    publisherId: string;
    expiresAt?: Date;
}
export interface StoredSession {
    _id?: string;
    clientId: string;
    sessionData: Session;
    lastSeen: Date;
    expiresAt?: Date;
}
export interface StoredRetainedMessage {
    _id?: string;
    topic: string;
    message: Message;
    timestamp: Date;
}
export declare class MongoDBStorage extends EventEmitter {
    private connectionUri;
    private dbName;
    private client;
    private db;
    private messagesCollection;
    private sessionsCollection;
    private retainedCollection;
    private connected;
    constructor(connectionUri: string, dbName?: string);
    /**
     * Connect to MongoDB
     */
    connect(): Promise<void>;
    /**
     * Create database indexes for optimal performance
     */
    private createIndexes;
    /**
     * Store a message
     */
    storeMessage(message: Message, ttlSeconds?: number): Promise<void>;
    /**
     * Store retained message
     */
    storeRetainedMessage(topic: string, message: Message): Promise<void>;
    /**
     * Get retained message for topic
     */
    getRetainedMessage(topic: string): Promise<Message | null>;
    /**
     * Get all retained messages matching topic pattern
     */
    getRetainedMessages(topicPattern?: string): Promise<{
        topic: string;
        message: Message;
    }[]>;
    /**
     * Delete retained message
     */
    deleteRetainedMessage(topic: string): Promise<void>;
    /**
     * Store session data
     */
    storeSession(clientId: string, session: Session, ttlSeconds?: number): Promise<void>;
    /**
     * Get session data
     */
    getSession(clientId: string): Promise<Session | null>;
    /**
     * Delete session
     */
    deleteSession(clientId: string): Promise<void>;
    /**
     * Get messages for topic (for QoS delivery)
     */
    getMessages(topic: string, limit?: number): Promise<Message[]>;
    /**
     * Get storage statistics
     */
    getStats(): Promise<{
        totalMessages: number;
        retainedMessages: number;
        activeSessions: number;
        storageSize: number;
    }>;
    /**
     * Clean up expired data
     */
    cleanup(): Promise<void>;
    /**
     * Convert MQTT topic pattern to regex
     */
    private topicPatternToRegex;
    /**
     * Disconnect from MongoDB
     */
    disconnect(): Promise<void>;
    /**
     * Check if storage is connected
     */
    isConnected(): boolean;
}
//# sourceMappingURL=mongodb-storage.d.ts.map