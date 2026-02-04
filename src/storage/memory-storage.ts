/**
 * Memory Storage Implementation for MQTT Broker
 * In-memory storage for development and testing
 */

import { IStorage } from './storage-interface';
import { Message, Session } from '../types';
import { EventEmitter } from 'events';

export class MemoryStorage extends EventEmitter implements IStorage {
  private messages: Map<string, Message[]> = new Map();
  private retainedMessages: Map<string, Message> = new Map();
  private sessions: Map<string, Session> = new Map();
  private connected: boolean = false;

  async connect(): Promise<void> {
    this.connected = true;
    this.emit('connected');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.messages.clear();
    this.retainedMessages.clear();
    this.sessions.clear();
    this.emit('disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async storeMessage(message: Message, ttlSeconds?: number): Promise<void> {
    if (!this.connected) {
      throw new Error('Memory storage not connected');
    }

    const topic = message.topic;
    if (!this.messages.has(topic)) {
      this.messages.set(topic, []);
    }
    
    this.messages.get(topic)!.push(message);
    this.emit('messageStored', message);

    // Simple TTL implementation for memory storage
    if (ttlSeconds) {
      setTimeout(() => {
        const messages = this.messages.get(topic);
        if (messages) {
          const index = messages.indexOf(message);
          if (index > -1) {
            messages.splice(index, 1);
          }
        }
      }, ttlSeconds * 1000);
    }
  }

  async storeRetainedMessage(topic: string, message: Message): Promise<void> {
    if (!this.connected) {
      throw new Error('Memory storage not connected');
    }

    this.retainedMessages.set(topic, message);
    this.emit('retainedMessageStored', topic, message);
  }

  async getRetainedMessage(topic: string): Promise<Message | null> {
    if (!this.connected) {
      throw new Error('Memory storage not connected');
    }

    return this.retainedMessages.get(topic) || null;
  }

  async getRetainedMessages(topicPattern?: string): Promise<{ topic: string; message: Message }[]> {
    if (!this.connected) {
      throw new Error('Memory storage not connected');
    }

    const results: { topic: string; message: Message }[] = [];
    
    for (const [topic, message] of this.retainedMessages.entries()) {
      if (!topicPattern || this.matchesPattern(topic, topicPattern)) {
        results.push({ topic, message });
      }
    }
    
    return results;
  }

  async deleteRetainedMessage(topic: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Memory storage not connected');
    }

    this.retainedMessages.delete(topic);
    this.emit('retainedMessageDeleted', topic);
  }

  async storeSession(clientId: string, session: Session, ttlSeconds?: number): Promise<void> {
    if (!this.connected) {
      throw new Error('Memory storage not connected');
    }

    this.sessions.set(clientId, session);
    this.emit('sessionStored', clientId, session);

    // Simple TTL implementation for memory storage
    if (ttlSeconds) {
      setTimeout(() => {
        this.sessions.delete(clientId);
      }, ttlSeconds * 1000);
    }
  }

  async getSession(clientId: string): Promise<Session | null> {
    if (!this.connected) {
      throw new Error('Memory storage not connected');
    }

    return this.sessions.get(clientId) || null;
  }

  async deleteSession(clientId: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Memory storage not connected');
    }

    this.sessions.delete(clientId);
    this.emit('sessionDeleted', clientId);
  }

  async getMessages(topic: string, limit: number = 100): Promise<Message[]> {
    if (!this.connected) {
      throw new Error('Memory storage not connected');
    }

    const messages = this.messages.get(topic) || [];
    return messages.slice(-limit); // Return last N messages
  }

  async getStats(): Promise<{
    totalMessages: number;
    retainedMessages: number;
    activeSessions: number;
    storageSize: number;
  }> {
    if (!this.connected) {
      throw new Error('Memory storage not connected');
    }

    let totalMessages = 0;
    for (const messages of this.messages.values()) {
      totalMessages += messages.length;
    }

    return {
      totalMessages,
      retainedMessages: this.retainedMessages.size,
      activeSessions: this.sessions.size,
      storageSize: 0 // Memory usage not calculated
    };
  }

  async cleanup(): Promise<void> {
    // Memory storage doesn't need cleanup as TTL is handled automatically
  }

  /**
   * Check if topic matches pattern (simple implementation)
   */
  private matchesPattern(topic: string, pattern: string): boolean {
    const regex = pattern
      .replace(/\+/g, '[^/]+')
      .replace(/#$/, '.*')
      .replace(/\//g, '\\/');
    
    return new RegExp(`^${regex}$`).test(topic);
  }
}