"use strict";
/**
 * Storage Manager for MQTT Broker
 * Manages different storage implementations and provides unified interface
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageManager = void 0;
const mongodb_storage_1 = require("./mongodb-storage");
const memory_storage_1 = require("./memory-storage");
const events_1 = require("events");
class StorageManager extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.storage = this.createStorage();
    }
    /**
     * Create storage instance based on configuration
     */
    createStorage() {
        const { persistence } = this.config;
        switch (persistence.storageType) {
            case 'database':
                const mongoUri = process.env.MONGODB_URI;
                if (!mongoUri) {
                    throw new Error('MONGODB_URI environment variable is required for MongoDB storage');
                }
                return new mongodb_storage_1.MongoDBStorage(mongoUri, 'mqtt-broker');
            case 'memory':
            default:
                return new memory_storage_1.MemoryStorage();
        }
    }
    /**
     * Initialize storage
     */
    async initialize() {
        try {
            await this.storage.connect();
            // Set up periodic cleanup if enabled
            if (this.config.persistence.enabled) {
                this.setupCleanup();
            }
            this.emit('initialized');
            console.log(`📦 Storage initialized: ${this.config.persistence.storageType}`);
        }
        catch (error) {
            console.error('❌ Storage initialization failed:', error);
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Set up periodic cleanup
     */
    setupCleanup() {
        const cleanupInterval = 300000; // 5 minutes default
        this.cleanupInterval = setInterval(async () => {
            try {
                await this.storage.cleanup();
            }
            catch (error) {
                console.error('❌ Storage cleanup failed:', error);
            }
        }, cleanupInterval);
    }
    /**
     * Get storage instance
     */
    getStorage() {
        return this.storage;
    }
    /**
     * Shutdown storage
     */
    async shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        try {
            await this.storage.disconnect();
            this.emit('shutdown');
            console.log('📦 Storage shutdown completed');
        }
        catch (error) {
            console.error('❌ Storage shutdown failed:', error);
            throw error;
        }
    }
    /**
     * Check if storage is ready
     */
    isReady() {
        return this.storage.isConnected();
    }
    /**
     * Get storage statistics
     */
    async getStats() {
        return await this.storage.getStats();
    }
}
exports.StorageManager = StorageManager;
//# sourceMappingURL=storage-manager.js.map