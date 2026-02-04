/**
 * MQTT protocol handler combining parsing and serialization
 */
import { ProtocolHandler, MQTTPacket } from '../types';
import { MQTTParser } from './parser';
import { MQTTSerializer } from './serializer';
export declare class MQTTProtocolHandler implements ProtocolHandler {
    private parser;
    private serializer;
    constructor();
    /**
     * Parse MQTT packet from buffer
     */
    parsePacket(data: Buffer): MQTTPacket;
    /**
     * Serialize MQTT packet to buffer
     */
    serializePacket(packet: MQTTPacket): Buffer;
    /**
     * Validate packet structure
     */
    validatePacket(packet: MQTTPacket): boolean;
    /**
     * Get parser instance
     */
    getParser(): MQTTParser;
    /**
     * Get serializer instance
     */
    getSerializer(): MQTTSerializer;
}
//# sourceMappingURL=handler.d.ts.map