/**
 * Storage Manager for MQTT Broker
 * Manages different storage implementations and provides unified interface
 */

import { IStorage } from './storage-interface';
import { MongoDBStorage } from './mongodb-storage';
import { MemoryStorage } from './memory-storage';
import { BrokerConfig } from '../types';
import { EventEmitter } from 'events';

export class StorageManager extends EventEmitter {
  private storage: IStorage;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(private config: BrokerConfig) {
    super();
    this.storage = this.createStorage();
  }

  /**
   * Create storage instance based on configuration
   */
  private createStorage(): IStorage {
    const { persistence } = this.config;

    switch (persistence.storageType) {
      case 'database':
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
          throw new Error('MONGODB_URI environment variable is required for MongoDB storage');
        }
        return new MongoDBStorage(mongoUri, 'mqtt-broker');

      case 'memory':
      default:
        return new MemoryStorage();
    }
  }

  /**
   * Initialize storage
   */
  async initialize(): Promise<void> {
    try {
      await this.storage.connect();
      
      // Set up periodic cleanup if enabled
      if (this.config.persistence.enabled) {
        this.setupCleanup();
      }
      
      this.emit('initialized');
      console.log(`📦 Storage initialized: ${this.config.persistence.storageType}`);
    } catch (error) {
      console.error('❌ Storage initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Set up periodic cleanup
   */
  private setupCleanup(): void {
    const cleanupInterval = 300000; // 5 minutes default
    
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.storage.cleanup();
      } catch (error) {
        console.error('❌ Storage cleanup failed:', error);
      }
    }, cleanupInterval);
  }

  /**
   * Get storage instance
   */
  getStorage(): IStorage {
    return this.storage;
  }

  /**
   * Shutdown storage
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    try {
      await this.storage.disconnect();
      this.emit('shutdown');
      console.log('📦 Storage shutdown completed');
    } catch (error) {
      console.error('❌ Storage shutdown failed:', error);
      throw error;
    }
  }

  /**
   * Check if storage is ready
   */
  isReady(): boolean {
    return this.storage.isConnected();
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    return await this.storage.getStats();
  }
}