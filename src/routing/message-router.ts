/**
 * Message Router for MQTT broker
 */

import { EventEmitter } from 'events';
import { Message, Subscription, QoSLevel, TopicTrie } from '../types';
import { TopicTrie as TopicTrieImpl } from './topic-trie';
import { generateMessageId } from '../utils';

export class MessageRouter extends EventEmitter {
  private topicTrie: TopicTrie;
  private retainedMessages: Map<string, Message> = new Map();

  constructor() {
    super();
    this.topicTrie = new TopicTrieImpl();
  }

  /**
   * Add subscription to the router
   */
  addSubscription(topicFilter: string, clientId: string, qos: QoSLevel): void {
    this.topicTrie.addSubscription(topicFilter, clientId, qos);
    this.emit('subscriptionAdded', { topicFilter, clientId, qos });
  }

  /**
   * Remove subscription from the router
   */
  removeSubscription(topicFilter: string, clientId: string): void {
    this.topicTrie.removeSubscription(topicFilter, clientId);
    this.emit('subscriptionRemoved', { topicFilter, clientId });
  }

  /**
   * Remove all subscriptions for a client
   */
  removeAllSubscriptions(clientId: string): void {
    this.topicTrie.removeAllSubscriptions(clientId);
    this.emit('allSubscriptionsRemoved', { clientId });
  }

  /**
   * Route a published message to matching subscribers
   */
  routeMessage(message: Message): Subscription[] {
    // Find matching subscribers
    const subscribers = this.topicTrie.findSubscribers(message.topic);
    
    // Handle retained messages
    if (message.retain) {
      if (message.payload.length === 0) {
        // Empty retained message deletes the retained message
        this.retainedMessages.delete(message.topic);
        this.emit('retainedMessageDeleted', { topic: message.topic });
      } else {
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
  getRetainedMessages(topicFilter: string): Message[] {
    const retainedMessages: Message[] = [];

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
  getRetainedMessage(topic: string): Message | null {
    return this.retainedMessages.get(topic) || null;
  }

  /**
   * Delete retained message
   */
  deleteRetainedMessage(topic: string): boolean {
    const deleted = this.retainedMessages.delete(topic);
    if (deleted) {
      this.emit('retainedMessageDeleted', { topic });
    }
    return deleted;
  }

  /**
   * Get all retained messages
   */
  getAllRetainedMessages(): Map<string, Message> {
    return new Map(this.retainedMessages);
  }

  /**
   * Clear all retained messages
   */
  clearAllRetainedMessages(): void {
    this.retainedMessages.clear();
    this.emit('allRetainedMessagesCleared');
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.topicTrie.getSubscriptionCount();
  }

  /**
   * Get all subscriptions
   */
  getAllSubscriptions(): Subscription[] {
    return this.topicTrie.getAllSubscriptions();
  }

  /**
   * Check if topic matches topic filter with wildcards
   */
  private topicMatches(topicFilter: string, topic: string): boolean {
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
  createMessage(
    topic: string,
    payload: Buffer,
    qos: QoSLevel,
    retain: boolean,
    publisherId: string
  ): Message {
    return {
      id: generateMessageId(),
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
  validatePublishTopic(topic: string): boolean {
    return !topic.includes('+') && !topic.includes('#') && topic.length > 0;
  }

  /**
   * Validate topic filter for subscription (wildcards allowed)
   */
  validateTopicFilter(topicFilter: string): boolean {
    return TopicTrieImpl.validateTopicFilter(topicFilter);
  }
}