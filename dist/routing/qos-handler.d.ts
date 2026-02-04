/**
 * QoS Handler for MQTT message delivery semantics
 */
import { EventEmitter } from 'events';
import { QoSHandler as IQoSHandler, Message, Subscription } from '../types';
export declare class QoSHandler extends EventEmitter implements IQoSHandler {
    private inflightQoS1;
    private inflightQoS2;
    private qos2Received;
    private retryInterval;
    private retryTimeoutMs;
    private maxRetries;
    constructor();
    /**
     * Publish message with QoS 0 (at most once)
     */
    publishQoS0(message: Message, subscribers: Subscription[]): void;
    /**
     * Publish message with QoS 1 (at least once)
     */
    publishQoS1(message: Message, subscribers: Subscription[]): Promise<void>;
    /**
     * Publish message with QoS 2 (exactly once)
     */
    publishQoS2(message: Message, subscribers: Subscription[]): Promise<void>;
    /**
     * Handle QoS 2 four-way handshake
     */
    private handleQoS2Flow;
    /**
     * Handle acknowledgment packets
     */
    handleAcknowledgment(packetId: number, clientId: string, type: 'PUBACK' | 'PUBREC' | 'PUBREL' | 'PUBCOMP'): void;
    /**
     * Handle received QoS 2 PUBLISH (store for duplicate detection)
     */
    handleQoS2Publish(clientId: string, packetId: number, message: Message): void;
    /**
     * Generate packet ID
     */
    private generatePacketId;
    /**
     * Start retry timer for inflight messages
     */
    private startRetryTimer;
    /**
     * Retry inflight messages that have timed out
     */
    private retryInflightMessages;
    /**
     * Stop retry timer
     */
    stopRetryTimer(): void;
    /**
     * Get inflight message counts
     */
    getInflightCounts(): {
        qos1: number;
        qos2: number;
        qos2Received: number;
    };
    /**
     * Clear all inflight messages (for testing)
     */
    clearInflightMessages(): void;
}
//# sourceMappingURL=qos-handler.d.ts.map