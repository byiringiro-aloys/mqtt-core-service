/**
 * Message Router for MQTT broker
 */
import { EventEmitter } from 'events';
import { Message, Subscription, QoSLevel } from '../types';
export declare class MessageRouter extends EventEmitter {
    private topicTrie;
    private retainedMessages;
    constructor();
    /**
     * Add subscription to the router
     */
    addSubscription(topicFilter: string, clientId: string, qos: QoSLevel): void;
    /**
     * Remove subscription from the router
     */
    removeSubscription(topicFilter: string, clientId: string): void;
    /**
     * Remove all subscriptions for a client
     */
    removeAllSubscriptions(clientId: string): void;
    /**
     * Route a published message to matching subscribers
     */
    routeMessage(message: Message): Subscription[];
    /**
     * Get retained messages for a topic filter
     */
    getRetainedMessages(topicFilter: string): Message[];
    /**
     * Get retained message for exact topic
     */
    getRetainedMessage(topic: string): Message | null;
    /**
     * Delete retained message
     */
    deleteRetainedMessage(topic: string): boolean;
    /**
     * Get all retained messages
     */
    getAllRetainedMessages(): Map<string, Message>;
    /**
     * Clear all retained messages
     */
    clearAllRetainedMessages(): void;
    /**
     * Get subscription count
     */
    getSubscriptionCount(): number;
    /**
     * Get all subscriptions
     */
    getAllSubscriptions(): Subscription[];
    /**
     * Check if topic matches topic filter with wildcards
     */
    private topicMatches;
    /**
     * Create a message object
     */
    createMessage(topic: string, payload: Buffer, qos: QoSLevel, retain: boolean, publisherId: string): Message;
    /**
     * Validate topic for publishing (no wildcards allowed)
     */
    validatePublishTopic(topic: string): boolean;
    /**
     * Validate topic filter for subscription (wildcards allowed)
     */
    validateTopicFilter(topicFilter: string): boolean;
}
//# sourceMappingURL=message-router.d.ts.map