/**
 * Memory Storage Implementation for MQTT Broker
 * In-memory storage for development and testing
 */
import { IStorage } from './storage-interface';
import { Message, Session } from '../types';
import { EventEmitter } from 'events';
export declare class MemoryStorage extends EventEmitter implements IStorage {
    private messages;
    private retainedMessages;
    private sessions;
    private connected;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    storeMessage(message: Message, ttlSeconds?: number): Promise<void>;
    storeRetainedMessage(topic: string, message: Message): Promise<void>;
    getRetainedMessage(topic: string): Promise<Message | null>;
    getRetainedMessages(topicPattern?: string): Promise<{
        topic: string;
        message: Message;
    }[]>;
    deleteRetainedMessage(topic: string): Promise<void>;
    storeSession(clientId: string, session: Session, ttlSeconds?: number): Promise<void>;
    getSession(clientId: string): Promise<Session | null>;
    deleteSession(clientId: string): Promise<void>;
    getMessages(topic: string, limit?: number): Promise<Message[]>;
    getStats(): Promise<{
        totalMessages: number;
        retainedMessages: number;
        activeSessions: number;
        storageSize: number;
    }>;
    cleanup(): Promise<void>;
    /**
     * Check if topic matches pattern (simple implementation)
     */
    private matchesPattern;
}
//# sourceMappingURL=memory-storage.d.ts.map