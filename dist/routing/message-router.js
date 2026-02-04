"use strict";
/**
 * Message Router for MQTT broker
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRouter = void 0;
const events_1 = require("events");
const topic_trie_1 = require("./topic-trie");
const utils_1 = require("../utils");
class MessageRouter extends events_1.EventEmitter {
    constructor() {
        super();
        this.retainedMessages = new Map();
        this.topicTrie = new topic_trie_1.TopicTrie();
    }
    /**
     * Add subscription to the router
     */
    addSubscription(topicFilter, clientId, qos) {
        this.topicTrie.addSubscription(topicFilter, clientId, qos);
        this.emit('subscriptionAdded', { topicFilter, clientId, qos });
    }
    /**
     * Remove subscription from the router
     */
    removeSubscription(topicFilter, clientId) {
        this.topicTrie.removeSubscription(topicFilter, clientId);
        this.emit('subscriptionRemoved', { topicFilter, clientId });
    }
    /**
     * Remove all subscriptions for a client
     */
    removeAllSubscriptions(clientId) {
        this.topicTrie.removeAllSubscriptions(clientId);
        this.emit('allSubscriptionsRemoved', { clientId });
    }
    /**
     * Route a published message to matching subscribers
     */
    routeMessage(message) {
        // Find matching subscribers
        const subscribers = this.topicTrie.findSubscribers(message.topic);
        // Handle retained messages
        if (message.retain) {
            if (message.payload.length === 0) {
                // Empty retained message deletes the retained message
                this.retainedMessages.delete(message.topic);
                this.emit('retainedMessageDeleted', { topic: message.topic });
            }
            else {
                // Store retained message
                this.retainedMessages.set(message.topic, { ...message });
                this.emit('retainedMessageStored', { topic: message.topic, message });
            }
        }
        // Emit routing event
        this.emit('messageRouted', {
            message,
            subscribers: subscribers.map(s => ({
                clientId: s.clientId,
                qos: s.qos
            }))
        });
        return subscribers;
    }
    /**
     * Get retained messages for a topic filter
     */
    getRetainedMessages(topicFilter) {
        const retainedMessages = [];
        for (const [topic, message] of this.retainedMessages) {
            if (this.topicMatches(topicFilter, topic)) {
                retainedMessages.push({ ...message });
            }
        }
        return retainedMessages;
    }
    /**
     * Get retained message for exact topic
     */
    getRetainedMessage(topic) {
        return this.retainedMessages.get(topic) || null;
    }
    /**
     * Delete retained message
     */
    deleteRetainedMessage(topic) {
        const deleted = this.retainedMessages.delete(topic);
        if (deleted) {
            this.emit('retainedMessageDeleted', { topic });
        }
        return deleted;
    }
    /**
     * Get all retained messages
     */
    getAllRetainedMessages() {
        return new Map(this.retainedMessages);
    }
    /**
     * Clear all retained messages
     */
    clearAllRetainedMessages() {
        this.retainedMessages.clear();
        this.emit('allRetainedMessagesCleared');
    }
    /**
     * Get subscription count
     */
    getSubscriptionCount() {
        return this.topicTrie.getSubscriptionCount();
    }
    /**
     * Get all subscriptions
     */
    getAllSubscriptions() {
        return this.topicTrie.getAllSubscriptions();
    }
    /**
     * Check if topic matches topic filter with wildcards
     */
    topicMatches(topicFilter, topic) {
        const filterLevels = topicFilter.split('/');
        const topicLevels = topic.split('/');
        let filterIndex = 0;
        let topicIndex = 0;
        while (filterIndex < filterLevels.length && topicIndex < topicLevels.length) {
            const filterLevel = filterLevels[filterIndex];
            const topicLevel = topicLevels[topicIndex];
            if (filterLevel === '#') {
                // Multi-level wildcard matches everything remaining
                return true;
            }
            if (filterLevel === '+') {
                // Single-level wildcard matches any single level
                filterIndex++;
                topicIndex++;
                continue;
            }
            if (filterLevel === topicLevel) {
                // Exact match
                filterIndex++;
                topicIndex++;
                continue;
            }
            // No match
            return false;
        }
        // Check if we consumed all levels
        if (filterIndex < filterLevels.length) {
            // Remaining filter levels must be a single '#'
            return filterIndex === filterLevels.length - 1 && filterLevels[filterIndex] === '#';
        }
        return topicIndex === topicLevels.length;
    }
    /**
     * Create a message object
     */
    createMessage(topic, payload, qos, retain, publisherId) {
        return {
            id: (0, utils_1.generateMessageId)(),
            topic,
            payload,
            qos,
            retain,
            timestamp: Date.now(),
            publisherId
        };
    }
    /**
     * Validate topic for publishing (no wildcards allowed)
     */
    validatePublishTopic(topic) {
        return !topic.includes('+') && !topic.includes('#') && topic.length > 0;
    }
    /**
     * Validate topic filter for subscription (wildcards allowed)
     */
    validateTopicFilter(topicFilter) {
        return topic_trie_1.TopicTrie.validateTopicFilter(topicFilter);
    }
}
exports.MessageRouter = MessageRouter;
//# sourceMappingURL=message-router.js.map