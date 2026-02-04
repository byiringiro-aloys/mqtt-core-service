/**
 * MongoDB Storage Implementation for MQTT Broker
 * Provides persistent storage for messages, sessions, and retained messages
 */

import { MongoClient, Db, Collection } from 'mongodb';
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

export class MongoDBStorage extends EventEmitter {
  private client: MongoClient;
  private db!: Db;
  private messagesCollection!: Collection<StoredMessage>;
  private sessionsCollection!: Collection<StoredSession>;
  private retainedCollection!: Collection<StoredRetainedMessage>;
  private connected: boolean = false;

  constructor(private connectionUri: string, private dbName: string = 'mqtt-broker') {
    super();
    this.client = new MongoClient(connectionUri);
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      
      // Initialize collections
      this.messagesCollection = this.db.collection<StoredMessage>('messages');
      this.sessionsCollection = this.db.collection<StoredSession>('sessions');
      this.retainedCollection = this.db.collection<StoredRetainedMessage>('retained_messages');
      
      // Create indexes for better performance
      await this.createIndexes();
      
      this.connected = true;
      this.emit('connected');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create database indexes for optimal performance
   */
  private async createIndexes(): Promise<void> {
    try {
      // Messages indexes
      await this.messagesCollection.createIndex({ timestamp: 1 });
      await this.messagesCollection.createIndex({ topic: 1 });
      await this.messagesCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      
      // Sessions indexes
      await this.sessionsCollection.createIndex({ clientId: 1 }, { unique: true });
      await this.sessionsCollection.createIndex({ lastSeen: 1 });
      await this.sessionsCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      
      // Retained messages indexes
      await this.retainedCollection.createIndex({ topic: 1 }, { unique: true });
      await this.retainedCollection.createIndex({ timestamp: 1 });
    } catch (error) {
      // Silent error handling for index creation
    }
  }

  /**
   * Store a message
   */
  async storeMessage(message: Message, ttlSeconds?: number): Promise<void> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }

    const storedMessage: StoredMessage = {
      topic: message.topic,
      payload: message.payload,
      qos: message.qos,
      retain: message.retain,
      packetId: message.packetId,
      id: message.id,
      publisherId: message.publisherId,
      timestamp: new Date(),
      expiresAt: ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : undefined
    };

    try {
      await this.messagesCollection.insertOne(storedMessage);
      this.emit('messageStored', message);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Store retained message
   */
  async storeRetainedMessage(topic: string, message: Message): Promise<void> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }

    const retainedMessage: StoredRetainedMessage = {
      topic,
      message,
      timestamp: new Date()
    };

    try {
      await this.retainedCollection.replaceOne(
        { topic },
        retainedMessage,
        { upsert: true }
      );
      this.emit('retainedMessageStored', topic, message);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get retained message for topic
   */
  async getRetainedMessage(topic: string): Promise<Message | null> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }

    try {
      const result = await this.retainedCollection.findOne({ topic });
      return result ? result.message : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all retained messages matching topic pattern
   */
  async getRetainedMessages(topicPattern?: string): Promise<{ topic: string; message: Message }[]> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }

    try {
      const query = topicPattern ? { topic: new RegExp(this.topicPatternToRegex(topicPattern)) } : {};
      const results = await this.retainedCollection.find(query).toArray();
      
      return results.map(result => ({
        topic: result.topic,
        message: result.message
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete retained message
   */
  async deleteRetainedMessage(topic: string): Promise<void> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }

    try {
      await this.retainedCollection.deleteOne({ topic });
      this.emit('retainedMessageDeleted', topic);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Store session data
   */
  async storeSession(clientId: string, session: Session, ttlSeconds?: number): Promise<void> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }

    const storedSession: StoredSession = {
      clientId,
      sessionData: session,
      lastSeen: new Date(),
      expiresAt: ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : undefined
    };

    try {
      await this.sessionsCollection.replaceOne(
        { clientId },
        storedSession,
        { upsert: true }
      );
      this.emit('sessionStored', clientId, session);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get session data
   */
  async getSession(clientId: string): Promise<Session | null> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }

    try {
      const result = await this.sessionsCollection.findOne({ clientId });
      return result ? result.sessionData : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(clientId: string): Promise<void> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }

    try {
      await this.sessionsCollection.deleteOne({ clientId });
      this.emit('sessionDeleted', clientId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get messages for topic (for QoS delivery)
   */
  async getMessages(topic: string, limit: number = 100): Promise<Message[]> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }

    try {
      const results = await this.messagesCollection
        .find({ topic })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      return results.map(result => ({
        topic: result.topic,
        payload: result.payload,
        qos: result.qos,
        retain: result.retain,
        packetId: result.packetId,
        id: result.id,
        timestamp: result.timestamp.getTime(),
        publisherId: result.publisherId
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalMessages: number;
    retainedMessages: number;
    activeSessions: number;
    storageSize: number;
  }> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }

    try {
      const [totalMessages, retainedMessages, activeSessions, dbStats] = await Promise.all([
        this.messagesCollection.countDocuments(),
        this.retainedCollection.countDocuments(),
        this.sessionsCollection.countDocuments(),
        this.db.stats()
      ]);

      return {
        totalMessages,
        retainedMessages,
        activeSessions,
        storageSize: dbStats.dataSize || 0
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clean up expired data
   */
  async cleanup(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      const now = new Date();
      
      // MongoDB TTL indexes handle automatic cleanup, but we can also do manual cleanup
      const [messagesDeleted, sessionsDeleted] = await Promise.all([
        this.messagesCollection.deleteMany({ expiresAt: { $lt: now } }),
        this.sessionsCollection.deleteMany({ expiresAt: { $lt: now } })
      ]);

      if (messagesDeleted.deletedCount > 0 || sessionsDeleted.deletedCount > 0) {
        // Silent cleanup completion
      }
    } catch (error) {
      // Silent cleanup error handling
    }
  }

  /**
   * Convert MQTT topic pattern to regex
   */
  private topicPatternToRegex(pattern: string): string {
    return pattern
      .replace(/\+/g, '[^/]+')
      .replace(/#$/, '.*')
      .replace(/\//g, '\\/');
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.close();
      this.connected = false;
      this.emit('disconnected');
    }
  }

  /**
   * Check if storage is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}