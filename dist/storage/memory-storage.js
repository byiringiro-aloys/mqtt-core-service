"use strict";
/**
 * Memory Storage Implementation for MQTT Broker
 * In-memory storage for development and testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStorage = void 0;
const events_1 = require("events");
class MemoryStorage extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.messages = new Map();
        this.retainedMessages = new Map();
        this.sessions = new Map();
        this.connected = false;
    }
    async connect() {
        this.connected = true;
        this.emit('connected');
    }
    async disconnect() {
        this.connected = false;
        this.messages.clear();
        this.retainedMessages.clear();
        this.sessions.clear();
        this.emit('disconnected');
    }
    isConnected() {
        return this.connected;
    }
    async storeMessage(message, ttlSeconds) {
        if (!this.connected) {
            throw new Error('Memory storage not connected');
        }
        const topic = message.topic;
        if (!this.messages.has(topic)) {
            this.messages.set(topic, []);
        }
        this.messages.get(topic).push(message);
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
    async storeRetainedMessage(topic, message) {
        if (!this.connected) {
            throw new Error('Memory storage not connected');
        }
        this.retainedMessages.set(topic, message);
        this.emit('retainedMessageStored', topic, message);
    }
    async getRetainedMessage(topic) {
        if (!this.connected) {
            throw new Error('Memory storage not connected');
        }
        return this.retainedMessages.get(topic) || null;
    }
    async getRetainedMessages(topicPattern) {
        if (!this.connected) {
            throw new Error('Memory storage not connected');
        }
        const results = [];
        for (const [topic, message] of this.retainedMessages.entries()) {
            if (!topicPattern || this.matchesPattern(topic, topicPattern)) {
                results.push({ topic, message });
            }
        }
        return results;
    }
    async deleteRetainedMessage(topic) {
        if (!this.connected) {
            throw new Error('Memory storage not connected');
        }
        this.retainedMessages.delete(topic);
        this.emit('retainedMessageDeleted', topic);
    }
    async storeSession(clientId, session, ttlSeconds) {
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
    async getSession(clientId) {
        if (!this.connected) {
            throw new Error('Memory storage not connected');
        }
        return this.sessions.get(clientId) || null;
    }
    async deleteSession(clientId) {
        if (!this.connected) {
            throw new Error('Memory storage not connected');
        }
        this.sessions.delete(clientId);
        this.emit('sessionDeleted', clientId);
    }
    async getMessages(topic, limit = 100) {
        if (!this.connected) {
            throw new Error('Memory storage not connected');
        }
        const messages = this.messages.get(topic) || [];
        return messages.slice(-limit); // Return last N messages
    }
    async getStats() {
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
    async cleanup() {
        // Memory storage doesn't need cleanup as TTL is handled automatically
    }
    /**
     * Check if topic matches pattern (simple implementation)
     */
    matchesPattern(topic, pattern) {
        const regex = pattern
            .replace(/\+/g, '[^/]+')
            .replace(/#$/, '.*')
            .replace(/\//g, '\\/');
        return new RegExp(`^${regex}$`).test(topic);
    }
}
exports.MemoryStorage = MemoryStorage;
//# sourceMappingURL=memory-storage.js.map