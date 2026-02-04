/**
 * QoS Handler for MQTT message delivery semantics
 */

import { EventEmitter } from 'events';
import { QoSHandler as IQoSHandler, Message, Subscription, QoSLevel } from '../types';

interface InflightMessage {
  message: Message;
  clientId: string;
  timestamp: number;
  retryCount: number;
}

export class QoSHandler extends EventEmitter implements IQoSHandler {
  private inflightQoS1: Map<string, InflightMessage> = new Map(); // key: clientId:packetId
  private inflightQoS2: Map<string, InflightMessage> = new Map(); // key: clientId:packetId
  private qos2Received: Map<string, Message> = new Map(); // key: clientId:packetId
  
  private retryInterval: NodeJS.Timeout | null = null;
  private retryTimeoutMs: number = 5000; // 5 seconds
  private maxRetries: number = 3;

  constructor() {
    super();
    this.startRetryTimer();
  }

  /**
   * Publish message with QoS 0 (at most once)
   */
  publishQoS0(message: Message, subscribers: Subscription[]): void {
    // Fire and forget - no acknowledgment required
    for (const subscriber of subscribers) {
      const deliveryMessage = {
        ...message,
        qos: Math.min(message.qos, subscriber.qos) as QoSLevel // Downgrade QoS if needed
      };

      this.emit('deliverMessage', {
        clientId: subscriber.clientId,
        message: deliveryMessage
      });
    }

    this.emit('qos0Published', { message, subscriberCount: subscribers.length });
  }

  /**
   * Publish message with QoS 1 (at least once)
   */
  async publishQoS1(message: Message, subscribers: Subscription[]): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const subscriber of subscribers) {
      const effectiveQoS = Math.min(message.qos, subscriber.qos) as QoSLevel;
      
      if (effectiveQoS === QoSLevel.AT_MOST_ONCE) {
        // Downgrade to QoS 0
        this.publishQoS0(message, [subscriber]);
        continue;
      }

      // Store inflight message for QoS 1
      const deliveryMessage = {
        ...message,
        qos: effectiveQoS,
        packetId: this.generatePacketId()
      };

      const inflightKey = `${subscriber.clientId}:${deliveryMessage.packetId}`;
      this.inflightQoS1.set(inflightKey, {
        message: deliveryMessage,
        clientId: subscriber.clientId,
        timestamp: Date.now(),
        retryCount: 0
      });

      // Deliver message
      const promise = new Promise<void>((resolve, reject) => {
        this.emit('deliverMessage', {
          clientId: subscriber.clientId,
          message: deliveryMessage
        });

        // Set up timeout for acknowledgment
        const timeout = setTimeout(() => {
          reject(new Error(`QoS 1 acknowledgment timeout for ${subscriber.clientId}`));
        }, this.retryTimeoutMs * (this.maxRetries + 1));

        // Listen for acknowledgment
        const ackHandler = (clientId: string, packetId: number) => {
          if (clientId === subscriber.clientId && packetId === deliveryMessage.packetId) {
            clearTimeout(timeout);
            this.removeListener('pubackReceived', ackHandler);
            resolve();
          }
        };

        this.on('pubackReceived', ackHandler);
      });

      promises.push(promise);
    }

    try {
      await Promise.all(promises);
      this.emit('qos1Published', { message, subscriberCount: subscribers.length });
    } catch (error) {
      this.emit('qos1PublishError', { message, error });
      throw error;
    }
  }

  /**
   * Publish message with QoS 2 (exactly once)
   */
  async publishQoS2(message: Message, subscribers: Subscription[]): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const subscriber of subscribers) {
      const effectiveQoS = Math.min(message.qos, subscriber.qos) as QoSLevel;
      
      if (effectiveQoS === QoSLevel.AT_MOST_ONCE) {
        // Downgrade to QoS 0
        this.publishQoS0(message, [subscriber]);
        continue;
      } else if (effectiveQoS === QoSLevel.AT_LEAST_ONCE) {
        // Downgrade to QoS 1
        await this.publishQoS1(message, [subscriber]);
        continue;
      }

      // Store inflight message for QoS 2
      const deliveryMessage = {
        ...message,
        qos: effectiveQoS,
        packetId: this.generatePacketId()
      };

      const inflightKey = `${subscriber.clientId}:${deliveryMessage.packetId}`;
      this.inflightQoS2.set(inflightKey, {
        message: deliveryMessage,
        clientId: subscriber.clientId,
        timestamp: Date.now(),
        retryCount: 0
      });

      // Deliver message and handle QoS 2 flow
      const promise = this.handleQoS2Flow(subscriber.clientId, deliveryMessage);
      promises.push(promise);
    }

    try {
      await Promise.all(promises);
      this.emit('qos2Published', { message, subscriberCount: subscribers.length });
    } catch (error) {
      this.emit('qos2PublishError', { message, error });
      throw error;
    }
  }

  /**
   * Handle QoS 2 four-way handshake
   */
  private async handleQoS2Flow(clientId: string, message: Message): Promise<void> {
    return new Promise((resolve, reject) => {
      const packetId = message.packetId!;
      const timeout = setTimeout(() => {
        reject(new Error(`QoS 2 flow timeout for ${clientId}`));
      }, this.retryTimeoutMs * (this.maxRetries + 1) * 2); // Longer timeout for QoS 2

      let step = 'PUBLISH'; // PUBLISH -> PUBREC -> PUBREL -> PUBCOMP

      const flowHandler = (receivedClientId: string, receivedPacketId: number, type: string) => {
        if (receivedClientId !== clientId || receivedPacketId !== packetId) {
          return;
        }

        if (step === 'PUBLISH' && type === 'PUBREC') {
          step = 'PUBREC';
          // Send PUBREL
          this.emit('sendPubrel', { clientId, packetId });
        } else if (step === 'PUBREC' && type === 'PUBCOMP') {
          // QoS 2 flow complete
          clearTimeout(timeout);
          this.removeListener('qos2FlowStep', flowHandler);
          resolve();
        }
      };

      this.on('qos2FlowStep', flowHandler);

      // Start the flow by delivering the message
      this.emit('deliverMessage', { clientId, message });
    });
  }

  /**
   * Handle acknowledgment packets
   */
  handleAcknowledgment(packetId: number, clientId: string, type: 'PUBACK' | 'PUBREC' | 'PUBREL' | 'PUBCOMP'): void {
    const inflightKey = `${clientId}:${packetId}`;

    switch (type) {
      case 'PUBACK':
        // QoS 1 acknowledgment
        if (this.inflightQoS1.has(inflightKey)) {
          this.inflightQoS1.delete(inflightKey);
          this.emit('pubackReceived', clientId, packetId);
        }
        break;

      case 'PUBREC':
        // QoS 2 step 1 acknowledgment
        if (this.inflightQoS2.has(inflightKey)) {
          this.emit('qos2FlowStep', clientId, packetId, 'PUBREC');
        }
        break;

      case 'PUBREL':
        // QoS 2 step 2 - handle received PUBREL
        const receivedKey = `${clientId}:${packetId}`;
        if (this.qos2Received.has(receivedKey)) {
          // Send PUBCOMP
          this.emit('sendPubcomp', { clientId, packetId });
          this.qos2Received.delete(receivedKey);
        }
        break;

      case 'PUBCOMP':
        // QoS 2 step 3 acknowledgment
        if (this.inflightQoS2.has(inflightKey)) {
          this.inflightQoS2.delete(inflightKey);
          this.emit('qos2FlowStep', clientId, packetId, 'PUBCOMP');
        }
        break;
    }
  }

  /**
   * Handle received QoS 2 PUBLISH (store for duplicate detection)
   */
  handleQoS2Publish(clientId: string, packetId: number, message: Message): void {
    const key = `${clientId}:${packetId}`;
    
    if (this.qos2Received.has(key)) {
      // Duplicate - send PUBREC again
      this.emit('sendPubrec', { clientId, packetId });
      return;
    }

    // Store message and send PUBREC
    this.qos2Received.set(key, message);
    this.emit('sendPubrec', { clientId, packetId });
    
    // Deliver message to application
    this.emit('messageReceived', { clientId, message });
  }

  /**
   * Generate packet ID
   */
  private generatePacketId(): number {
    return Math.floor(Math.random() * 65535) + 1;
  }

  /**
   * Start retry timer for inflight messages
   */
  private startRetryTimer(): void {
    this.retryInterval = setInterval(() => {
      this.retryInflightMessages();
    }, this.retryTimeoutMs);
  }

  /**
   * Retry inflight messages that have timed out
   */
  private retryInflightMessages(): void {
    const now = Date.now();

    // Retry QoS 1 messages
    for (const [key, inflight] of this.inflightQoS1) {
      if (now - inflight.timestamp > this.retryTimeoutMs) {
        if (inflight.retryCount >= this.maxRetries) {
          // Max retries reached, remove message
          this.inflightQoS1.delete(key);
          this.emit('messageDeliveryFailed', {
            clientId: inflight.clientId,
            message: inflight.message,
            reason: 'Max retries exceeded'
          });
        } else {
          // Retry delivery
          inflight.retryCount++;
          inflight.timestamp = now;
          
          const retryMessage = { ...inflight.message, dup: true };
          this.emit('deliverMessage', {
            clientId: inflight.clientId,
            message: retryMessage
          });
          
          this.emit('messageRetried', {
            clientId: inflight.clientId,
            message: inflight.message,
            retryCount: inflight.retryCount
          });
        }
      }
    }

    // Retry QoS 2 messages
    for (const [key, inflight] of this.inflightQoS2) {
      if (now - inflight.timestamp > this.retryTimeoutMs) {
        if (inflight.retryCount >= this.maxRetries) {
          // Max retries reached, remove message
          this.inflightQoS2.delete(key);
          this.emit('messageDeliveryFailed', {
            clientId: inflight.clientId,
            message: inflight.message,
            reason: 'Max retries exceeded'
          });
        } else {
          // Retry delivery
          inflight.retryCount++;
          inflight.timestamp = now;
          
          const retryMessage = { ...inflight.message, dup: true };
          this.emit('deliverMessage', {
            clientId: inflight.clientId,
            message: retryMessage
          });
          
          this.emit('messageRetried', {
            clientId: inflight.clientId,
            message: inflight.message,
            retryCount: inflight.retryCount
          });
        }
      }
    }
  }

  /**
   * Stop retry timer
   */
  stopRetryTimer(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }

  /**
   * Get inflight message counts
   */
  getInflightCounts(): { qos1: number; qos2: number; qos2Received: number } {
    return {
      qos1: this.inflightQoS1.size,
      qos2: this.inflightQoS2.size,
      qos2Received: this.qos2Received.size
    };
  }

  /**
   * Clear all inflight messages (for testing)
   */
  clearInflightMessages(): void {
    this.inflightQoS1.clear();
    this.inflightQoS2.clear();
    this.qos2Received.clear();
  }
}