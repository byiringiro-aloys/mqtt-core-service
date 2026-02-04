/**
 * Storage Interface for MQTT Broker
 * Defines the contract for different storage implementations
 */
import { Message, Session } from '../types';
export interface IStorage {
    /**
     * Connect to storage
     */
    connect(): Promise<void>;
    /**
     * Disconnect from storage
     */
    disconnect(): Promise<void>;
    /**
     * Check if storage is connected
     */
    isConnected(): boolean;
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
     * Get messages for topic
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
}
//# sourceMappingURL=storage-interface.d.ts.map