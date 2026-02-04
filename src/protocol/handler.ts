/**
 * MQTT protocol handler combining parsing and serialization
 */

import { ProtocolHandler, MQTTPacket } from '../types';
import { MQTTParser } from './parser';
import { MQTTSerializer } from './serializer';

export class MQTTProtocolHandler implements ProtocolHandler {
  private parser: MQTTParser;
  private serializer: MQTTSerializer;

  constructor() {
    this.parser = new MQTTParser();
    this.serializer = new MQTTSerializer();
  }

  /**
   * Parse MQTT packet from buffer
   */
  parsePacket(data: Buffer): MQTTPacket {
    return this.parser.parsePacket(data);
  }

  /**
   * Serialize MQTT packet to buffer
   */
  serializePacket(packet: MQTTPacket): Buffer {
    return this.serializer.serializePacket(packet);
  }

  /**
   * Validate packet structure
   */
  validatePacket(packet: MQTTPacket): boolean {
    return this.parser.validatePacket(packet);
  }

  /**
   * Get parser instance
   */
  getParser(): MQTTParser {
    return this.parser;
  }

  /**
   * Get serializer instance
   */
  getSerializer(): MQTTSerializer {
    return this.serializer;
  }
}