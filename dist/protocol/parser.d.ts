/**
 * MQTT packet parser implementing MQTT 3.1.1 specification
 */
import { MQTTPacket, ConnectPacket, PublishPacket, SubscribePacket } from '../types';
export declare class MQTTParser {
    /**
     * Parse MQTT packet from buffer
     */
    parsePacket(data: Buffer): MQTTPacket;
    /**
     * Parse CONNECT packet payload
     */
    parseConnectPacket(payload: Buffer): ConnectPacket;
    /**
     * Parse PUBLISH packet payload
     */
    parsePublishPacket(packet: MQTTPacket): PublishPacket;
    /**
     * Parse SUBSCRIBE packet payload
     */
    parseSubscribePacket(payload: Buffer): SubscribePacket;
    /**
     * Parse UNSUBSCRIBE packet payload
     */
    parseUnsubscribePacket(payload: Buffer): {
        packetId: number;
        topicFilters: string[];
    };
    /**
     * Validate packet structure according to MQTT specification
     */
    validatePacket(packet: MQTTPacket): boolean;
    /**
     * Encode remaining length according to MQTT specification
     */
    static encodeRemainingLength(length: number): Buffer;
    /**
     * Encode string with length prefix
     */
    static encodeString(str: string): Buffer;
}
//# sourceMappingURL=parser.d.ts.map