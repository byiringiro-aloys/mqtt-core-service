/**
 * Topic Trie for efficient MQTT topic subscription matching
 */
import { TopicTrie as ITopicTrie, Subscription, QoSLevel } from '../types';
export declare class TopicTrie implements ITopicTrie {
    private root;
    constructor();
    private createNode;
    /**
     * Add subscription to the trie
     */
    addSubscription(topicFilter: string, clientId: string, qos: QoSLevel): void;
    /**
     * Remove subscription from the trie
     */
    removeSubscription(topicFilter: string, clientId: string): void;
    /**
     * Find all subscribers matching a topic
     */
    findSubscribers(topic: string): Subscription[];
    /**
     * Remove all subscriptions for a client
     */
    removeAllSubscriptions(clientId: string): void;
    /**
     * Split topic into levels
     */
    private splitTopic;
    /**
     * Insert subscription into trie recursively
     */
    private insertSubscription;
    /**
     * Remove subscription recursively
     */
    private removeSubscriptionRecursive;
    /**
     * Find subscribers recursively
     */
    private findSubscribersRecursive;
    /**
     * Check if node is empty (no subscriptions and no children)
     */
    private isNodeEmpty;
    /**
     * Remove all subscriptions for a client recursively
     */
    private removeClientSubscriptions;
    /**
     * Get all subscriptions in the trie
     */
    getAllSubscriptions(): Subscription[];
    /**
     * Collect all subscriptions recursively
     */
    private collectAllSubscriptions;
    /**
     * Get subscription count
     */
    getSubscriptionCount(): number;
    /**
     * Validate topic filter according to MQTT specification
     */
    static validateTopicFilter(topicFilter: string): boolean;
    /**
     * Validate publish topic (no wildcards allowed)
     */
    static validatePublishTopic(topic: string): boolean;
}
//# sourceMappingURL=topic-trie.d.ts.map