/**
 * Topic Trie for efficient MQTT topic subscription matching
 */

import { TopicTrie as ITopicTrie, Subscription, QoSLevel } from '../types';

interface TrieNode {
  subscriptions: Map<string, Subscription>; // clientId -> subscription
  children: Map<string, TrieNode>;
  singleWildcard: TrieNode | null; // + wildcard
  multiWildcard: TrieNode | null;  // # wildcard
}

export class TopicTrie implements ITopicTrie {
  private root: TrieNode;

  constructor() {
    this.root = this.createNode();
  }

  private createNode(): TrieNode {
    return {
      subscriptions: new Map(),
      children: new Map(),
      singleWildcard: null,
      multiWildcard: null
    };
  }

  /**
   * Add subscription to the trie
   */
  addSubscription(topicFilter: string, clientId: string, qos: QoSLevel): void {
    const subscription: Subscription = {
      clientId,
      topicFilter,
      qos,
      subscriptionTime: Date.now()
    };

    const levels = this.splitTopic(topicFilter);
    this.insertSubscription(this.root, levels, 0, subscription);
  }

  /**
   * Remove subscription from the trie
   */
  removeSubscription(topicFilter: string, clientId: string): void {
    const levels = this.splitTopic(topicFilter);
    this.removeSubscriptionRecursive(this.root, levels, 0, clientId);
  }

  /**
   * Find all subscribers matching a topic
   */
  findSubscribers(topic: string): Subscription[] {
    const levels = this.splitTopic(topic);
    const subscribers: Subscription[] = [];
    
    this.findSubscribersRecursive(this.root, levels, 0, subscribers);
    
    // Remove duplicates and return highest QoS for each client
    const clientSubscriptions = new Map<string, Subscription>();
    
    for (const subscription of subscribers) {
      const existing = clientSubscriptions.get(subscription.clientId);
      if (!existing || subscription.qos > existing.qos) {
        clientSubscriptions.set(subscription.clientId, subscription);
      }
    }
    
    return Array.from(clientSubscriptions.values());
  }

  /**
   * Remove all subscriptions for a client
   */
  removeAllSubscriptions(clientId: string): void {
    this.removeClientSubscriptions(this.root, clientId);
  }

  /**
   * Split topic into levels
   */
  private splitTopic(topic: string): string[] {
    if (topic === '') return [''];
    return topic.split('/');
  }

  /**
   * Insert subscription into trie recursively
   */
  private insertSubscription(node: TrieNode, levels: string[], index: number, subscription: Subscription): void {
    if (index >= levels.length) {
      // End of topic filter, add subscription
      node.subscriptions.set(subscription.clientId, subscription);
      return;
    }

    const level = levels[index];

    if (level === '+') {
      // Single-level wildcard
      if (!node.singleWildcard) {
        node.singleWildcard = this.createNode();
      }
      this.insertSubscription(node.singleWildcard, levels, index + 1, subscription);
    } else if (level === '#') {
      // Multi-level wildcard (must be last level)
      if (!node.multiWildcard) {
        node.multiWildcard = this.createNode();
      }
      node.multiWildcard.subscriptions.set(subscription.clientId, subscription);
    } else {
      // Regular topic level
      if (!node.children.has(level)) {
        node.children.set(level, this.createNode());
      }
      this.insertSubscription(node.children.get(level)!, levels, index + 1, subscription);
    }
  }

  /**
   * Remove subscription recursively
   */
  private removeSubscriptionRecursive(node: TrieNode, levels: string[], index: number, clientId: string): boolean {
    if (index >= levels.length) {
      // End of topic filter, remove subscription
      return node.subscriptions.delete(clientId);
    }

    const level = levels[index];
    let childRemoved = false;

    if (level === '+') {
      if (node.singleWildcard) {
        childRemoved = this.removeSubscriptionRecursive(node.singleWildcard, levels, index + 1, clientId);
        if (childRemoved && this.isNodeEmpty(node.singleWildcard)) {
          node.singleWildcard = null;
        }
      }
    } else if (level === '#') {
      if (node.multiWildcard) {
        childRemoved = node.multiWildcard.subscriptions.delete(clientId);
        if (childRemoved && this.isNodeEmpty(node.multiWildcard)) {
          node.multiWildcard = null;
        }
      }
    } else {
      const childNode = node.children.get(level);
      if (childNode) {
        childRemoved = this.removeSubscriptionRecursive(childNode, levels, index + 1, clientId);
        if (childRemoved && this.isNodeEmpty(childNode)) {
          node.children.delete(level);
        }
      }
    }

    return childRemoved;
  }

  /**
   * Find subscribers recursively
   */
  private findSubscribersRecursive(node: TrieNode, levels: string[], index: number, subscribers: Subscription[]): void {
    // Add subscriptions from multi-level wildcard
    if (node.multiWildcard) {
      subscribers.push(...node.multiWildcard.subscriptions.values());
    }

    if (index >= levels.length) {
      // End of topic, add exact match subscriptions
      subscribers.push(...node.subscriptions.values());
      return;
    }

    const level = levels[index];

    // Check exact match
    const exactChild = node.children.get(level);
    if (exactChild) {
      this.findSubscribersRecursive(exactChild, levels, index + 1, subscribers);
    }

    // Check single-level wildcard
    if (node.singleWildcard) {
      this.findSubscribersRecursive(node.singleWildcard, levels, index + 1, subscribers);
    }
  }

  /**
   * Check if node is empty (no subscriptions and no children)
   */
  private isNodeEmpty(node: TrieNode): boolean {
    return node.subscriptions.size === 0 && 
           node.children.size === 0 && 
           !node.singleWildcard && 
           !node.multiWildcard;
  }

  /**
   * Remove all subscriptions for a client recursively
   */
  private removeClientSubscriptions(node: TrieNode, clientId: string): void {
    // Remove from current node
    node.subscriptions.delete(clientId);

    // Remove from children
    for (const childNode of node.children.values()) {
      this.removeClientSubscriptions(childNode, clientId);
    }

    // Remove from wildcards
    if (node.singleWildcard) {
      this.removeClientSubscriptions(node.singleWildcard, clientId);
    }

    if (node.multiWildcard) {
      this.removeClientSubscriptions(node.multiWildcard, clientId);
    }
  }

  /**
   * Get all subscriptions in the trie
   */
  getAllSubscriptions(): Subscription[] {
    const subscriptions: Subscription[] = [];
    this.collectAllSubscriptions(this.root, subscriptions);
    return subscriptions;
  }

  /**
   * Collect all subscriptions recursively
   */
  private collectAllSubscriptions(node: TrieNode, subscriptions: Subscription[]): void {
    subscriptions.push(...node.subscriptions.values());

    for (const childNode of node.children.values()) {
      this.collectAllSubscriptions(childNode, subscriptions);
    }

    if (node.singleWildcard) {
      this.collectAllSubscriptions(node.singleWildcard, subscriptions);
    }

    if (node.multiWildcard) {
      this.collectAllSubscriptions(node.multiWildcard, subscriptions);
    }
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.getAllSubscriptions().length;
  }

  /**
   * Validate topic filter according to MQTT specification
   */
  static validateTopicFilter(topicFilter: string): boolean {
    if (topicFilter.length === 0) {
      return false;
    }

    const levels = topicFilter.split('/');
    
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      
      if (level === '#') {
        // Multi-level wildcard must be last level and alone
        return i === levels.length - 1;
      }
      
      if (level === '+') {
        // Single-level wildcard must be alone in its level
        continue;
      }
      
      // Regular level - check for invalid characters
      if (level.includes('+') || level.includes('#')) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Validate publish topic (no wildcards allowed)
   */
  static validatePublishTopic(topic: string): boolean {
    return !topic.includes('+') && !topic.includes('#') && topic.length > 0;
  }
}