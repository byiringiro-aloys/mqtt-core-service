/**
 * Storage Manager for MQTT Broker
 * Manages different storage implementations and provides unified interface
 */
import { IStorage } from './storage-interface';
import { BrokerConfig } from '../types';
import { EventEmitter } from 'events';
export declare class StorageManager extends EventEmitter {
    private config;
    private storage;
    private cleanupInterval?;
    constructor(config: BrokerConfig);
    /**
     * Create storage instance based on configuration
     */
    private createStorage;
    /**
     * Initialize storage
     */
    initialize(): Promise<void>;
    /**
     * Set up periodic cleanup
     */
    private setupCleanup;
    /**
     * Get storage instance
     */
    getStorage(): IStorage;
    /**
     * Shutdown storage
     */
    shutdown(): Promise<void>;
    /**
     * Check if storage is ready
     */
    isReady(): boolean;
    /**
     * Get storage statistics
     */
    getStats(): Promise<{
        totalMessages: number;
        retainedMessages: number;
        activeSessions: number;
        storageSize: number;
    }>;
}
//# sourceMappingURL=storage-manager.d.ts.map