/**
 * MQTT packet parser implementing MQTT 3.1.1 specification
 */

import { 
  MQTTPacket, 
  PacketType, 
  ConnectPacket, 
  PublishPacket, 
  SubscribePacket,
  QoSLevel 
} from '../types';

export class MQTTParser {
  /**
   * Parse MQTT packet from buffer
   */
  parsePacket(data: Buffer): MQTTPacket {
    if (data.length < 2) {
      throw new Error('Invalid packet: too short');
    }

    const firstByte = data[0];
    const type = (firstByte >> 4) as PacketType;
    const flags = firstByte & 0x0F;

    // Parse remaining length
    let remainingLength = 0;
    let multiplier = 1;
    let offset = 1;

    do {
      if (offset >= data.length) {
        throw new Error('Invalid packet: incomplete remaining length');
      }
      
      const byte = data[offset];
      remainingLength += (byte & 0x7F) * multiplier;
      
      if (multiplier > 128 * 128 * 128) {
        throw new Error('Invalid packet: remaining length too large');
      }
      
      multiplier *= 128;
      offset++;
    } while ((data[offset - 1] & 0x80) !== 0);

    if (data.length < offset + remainingLength) {
      throw new Error('Invalid packet: incomplete payload');
    }

    const payload = data.slice(offset, offset + remainingLength);

    return {
      type,
      flags,
      payload,
      remainingLength
    };
  }

  /**
   * Parse CONNECT packet payload
   */
  parseConnectPacket(payload: Buffer): ConnectPacket {
    let offset = 0;

    // Protocol name
    const protocolNameLength = payload.readUInt16BE(offset);
    offset += 2;
    const protocolName = payload.slice(offset, offset + protocolNameLength).toString('utf8');
    offset += protocolNameLength;

    // Protocol version
    const protocolVersion = payload[offset];
    offset += 1;

    // Connect flags
    const connectFlags = payload[offset];
    offset += 1;

    const flags = {
      cleanSession: (connectFlags & 0x02) !== 0,
      willFlag: (connectFlags & 0x04) !== 0,
      willQoS: ((connectFlags & 0x18) >> 3) as QoSLevel,
      willRetain: (connectFlags & 0x20) !== 0,
      passwordFlag: (connectFlags & 0x40) !== 0,
      usernameFlag: (connectFlags & 0x80) !== 0
    };

    // Keep alive
    const keepAlive = payload.readUInt16BE(offset);
    offset += 2;

    // Client ID
    const clientIdLength = payload.readUInt16BE(offset);
    offset += 2;
    const clientId = payload.slice(offset, offset + clientIdLength).toString('utf8');
    offset += clientIdLength;

    const result: ConnectPacket = {
      protocolName,
      protocolVersion,
      flags,
      keepAlive,
      clientId
    };

    // Will topic and message
    if (flags.willFlag) {
      const willTopicLength = payload.readUInt16BE(offset);
      offset += 2;
      result.willTopic = payload.slice(offset, offset + willTopicLength).toString('utf8');
      offset += willTopicLength;

      const willMessageLength = payload.readUInt16BE(offset);
      offset += 2;
      result.willMessage = payload.slice(offset, offset + willMessageLength);
      offset += willMessageLength;
    }

    // Username
    if (flags.usernameFlag) {
      const usernameLength = payload.readUInt16BE(offset);
      offset += 2;
      result.username = payload.slice(offset, offset + usernameLength).toString('utf8');
      offset += usernameLength;
    }

    // Password
    if (flags.passwordFlag) {
      const passwordLength = payload.readUInt16BE(offset);
      offset += 2;
      result.password = payload.slice(offset, offset + passwordLength);
      offset += passwordLength;
    }

    return result;
  }

  /**
   * Parse PUBLISH packet payload
   */
  parsePublishPacket(packet: MQTTPacket): PublishPacket {
    const { payload, flags } = packet;
    let offset = 0;

    // Topic name
    const topicLength = payload.readUInt16BE(offset);
    offset += 2;
    const topic = payload.slice(offset, offset + topicLength).toString('utf8');
    offset += topicLength;

    const qos = ((flags & 0x06) >> 1) as QoSLevel;
    const retain = (flags & 0x01) !== 0;
    const dup = (flags & 0x08) !== 0;

    let packetId: number | undefined;
    
    // Packet ID is present for QoS 1 and 2
    if (qos > 0) {
      packetId = payload.readUInt16BE(offset);
      offset += 2;
    }

    // Message payload
    const messagePayload = payload.slice(offset);

    return {
      topic,
      packetId,
      payload: messagePayload,
      qos,
      retain,
      dup
    };
  }

  /**
   * Parse SUBSCRIBE packet payload
   */
  parseSubscribePacket(payload: Buffer): SubscribePacket {
    let offset = 0;

    // Packet ID
    const packetId = payload.readUInt16BE(offset);
    offset += 2;

    const subscriptions: Array<{ topicFilter: string; qos: QoSLevel }> = [];

    while (offset < payload.length) {
      // Topic filter
      const topicFilterLength = payload.readUInt16BE(offset);
      offset += 2;
      const topicFilter = payload.slice(offset, offset + topicFilterLength).toString('utf8');
      offset += topicFilterLength;

      // QoS
      const qos = payload[offset] as QoSLevel;
      offset += 1;

      subscriptions.push({ topicFilter, qos });
    }

    return {
      packetId,
      subscriptions
    };
  }

  /**
   * Parse UNSUBSCRIBE packet payload
   */
  parseUnsubscribePacket(payload: Buffer): { packetId: number; topicFilters: string[] } {
    let offset = 0;

    // Packet ID
    const packetId = payload.readUInt16BE(offset);
    offset += 2;

    const topicFilters: string[] = [];

    while (offset < payload.length) {
      // Topic filter
      const topicFilterLength = payload.readUInt16BE(offset);
      offset += 2;
      const topicFilter = payload.slice(offset, offset + topicFilterLength).toString('utf8');
      offset += topicFilterLength;

      topicFilters.push(topicFilter);
    }

    return {
      packetId,
      topicFilters
    };
  }

  /**
   * Validate packet structure according to MQTT specification
   */
  validatePacket(packet: MQTTPacket): boolean {
    const { type, flags } = packet;

    switch (type) {
      case PacketType.CONNECT:
        return flags === 0;
      case PacketType.CONNACK:
        return flags === 0;
      case PacketType.PUBLISH:
        // QoS validation
        const qos = (flags & 0x06) >> 1;
        return qos <= 2;
      case PacketType.PUBACK:
      case PacketType.PUBREC:
      case PacketType.PUBREL:
      case PacketType.PUBCOMP:
        return flags === 0 || (type === PacketType.PUBREL && flags === 2);
      case PacketType.SUBSCRIBE:
        return flags === 2;
      case PacketType.SUBACK:
        return flags === 0;
      case PacketType.UNSUBSCRIBE:
        return flags === 2;
      case PacketType.UNSUBACK:
        return flags === 0;
      case PacketType.PINGREQ:
      case PacketType.PINGRESP:
      case PacketType.DISCONNECT:
        return flags === 0;
      default:
        return false;
    }
  }

  /**
   * Encode remaining length according to MQTT specification
   */
  static encodeRemainingLength(length: number): Buffer {
    const bytes: number[] = [];
    
    do {
      let byte = length % 128;
      length = Math.floor(length / 128);
      
      if (length > 0) {
        byte |= 0x80;
      }
      
      bytes.push(byte);
    } while (length > 0);

    return Buffer.from(bytes);
  }

  /**
   * Encode string with length prefix
   */
  static encodeString(str: string): Buffer {
    const strBuffer = Buffer.from(str, 'utf8');
    const lengthBuffer = Buffer.allocUnsafe(2);
    lengthBuffer.writeUInt16BE(strBuffer.length, 0);
    return Buffer.concat([lengthBuffer, strBuffer]);
  }
}