/**
 * MQTT packet serializer implementing MQTT 3.1.1 specification
 */

import { 
  MQTTPacket, 
  PacketType, 
  ConnectReturnCode,
  QoSLevel,
  Message
} from '../types';
import { MQTTParser } from './parser';

export class MQTTSerializer {
  /**
   * Serialize MQTT packet to buffer
   */
  serializePacket(packet: MQTTPacket): Buffer {
    const firstByte = (packet.type << 4) | (packet.flags & 0x0F);
    const remainingLengthBuffer = MQTTParser.encodeRemainingLength(packet.payload.length);
    
    return Buffer.concat([
      Buffer.from([firstByte]),
      remainingLengthBuffer,
      packet.payload
    ]);
  }

  /**
   * Create CONNACK packet
   */
  createConnackPacket(sessionPresent: boolean, returnCode: ConnectReturnCode): Buffer {
    const flags = sessionPresent ? 0x01 : 0x00;
    const payload = Buffer.from([flags, returnCode]);
    
    const packet: MQTTPacket = {
      type: PacketType.CONNACK,
      flags: 0,
      payload
    };

    return this.serializePacket(packet);
  }

  /**
   * Create PUBLISH packet
   */
  createPublishPacket(message: Message, dup: boolean = false): Buffer {
    let flags = 0;
    
    if (message.retain) flags |= 0x01;
    flags |= (message.qos << 1);
    if (dup) flags |= 0x08;

    // Topic name
    const topicBuffer = MQTTParser.encodeString(message.topic);
    
    let payload = topicBuffer;

    // Packet ID for QoS 1 and 2
    if (message.qos > 0 && message.packetId !== undefined) {
      const packetIdBuffer = Buffer.allocUnsafe(2);
      packetIdBuffer.writeUInt16BE(message.packetId, 0);
      payload = Buffer.concat([payload, packetIdBuffer]);
    }

    // Message payload
    payload = Buffer.concat([payload, message.payload]);

    const packet: MQTTPacket = {
      type: PacketType.PUBLISH,
      flags,
      payload
    };

    return this.serializePacket(packet);
  }

  /**
   * Create PUBACK packet
   */
  createPubackPacket(packetId: number): Buffer {
    const payload = Buffer.allocUnsafe(2);
    payload.writeUInt16BE(packetId, 0);

    const packet: MQTTPacket = {
      type: PacketType.PUBACK,
      flags: 0,
      payload
    };

    return this.serializePacket(packet);
  }

  /**
   * Create PUBREC packet
   */
  createPubrecPacket(packetId: number): Buffer {
    const payload = Buffer.allocUnsafe(2);
    payload.writeUInt16BE(packetId, 0);

    const packet: MQTTPacket = {
      type: PacketType.PUBREC,
      flags: 0,
      payload
    };

    return this.serializePacket(packet);
  }

  /**
   * Create PUBREL packet
   */
  createPubrelPacket(packetId: number): Buffer {
    const payload = Buffer.allocUnsafe(2);
    payload.writeUInt16BE(packetId, 0);

    const packet: MQTTPacket = {
      type: PacketType.PUBREL,
      flags: 2, // Fixed flags for PUBREL
      payload
    };

    return this.serializePacket(packet);
  }

  /**
   * Create PUBCOMP packet
   */
  createPubcompPacket(packetId: number): Buffer {
    const payload = Buffer.allocUnsafe(2);
    payload.writeUInt16BE(packetId, 0);

    const packet: MQTTPacket = {
      type: PacketType.PUBCOMP,
      flags: 0,
      payload
    };

    return this.serializePacket(packet);
  }

  /**
   * Create SUBACK packet
   */
  createSubackPacket(packetId: number, returnCodes: QoSLevel[]): Buffer {
    const packetIdBuffer = Buffer.allocUnsafe(2);
    packetIdBuffer.writeUInt16BE(packetId, 0);
    
    const returnCodesBuffer = Buffer.from(returnCodes);
    const payload = Buffer.concat([packetIdBuffer, returnCodesBuffer]);

    const packet: MQTTPacket = {
      type: PacketType.SUBACK,
      flags: 0,
      payload
    };

    return this.serializePacket(packet);
  }

  /**
   * Create UNSUBACK packet
   */
  createUnsubackPacket(packetId: number): Buffer {
    const payload = Buffer.allocUnsafe(2);
    payload.writeUInt16BE(packetId, 0);

    const packet: MQTTPacket = {
      type: PacketType.UNSUBACK,
      flags: 0,
      payload
    };

    return this.serializePacket(packet);
  }

  /**
   * Create PINGRESP packet
   */
  createPingrespPacket(): Buffer {
    const packet: MQTTPacket = {
      type: PacketType.PINGRESP,
      flags: 0,
      payload: Buffer.alloc(0)
    };

    return this.serializePacket(packet);
  }

  /**
   * Create DISCONNECT packet
   */
  createDisconnectPacket(): Buffer {
    const packet: MQTTPacket = {
      type: PacketType.DISCONNECT,
      flags: 0,
      payload: Buffer.alloc(0)
    };

    return this.serializePacket(packet);
  }
}