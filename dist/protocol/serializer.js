"use strict";
/**
 * MQTT packet serializer implementing MQTT 3.1.1 specification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MQTTSerializer = void 0;
const types_1 = require("../types");
const parser_1 = require("./parser");
class MQTTSerializer {
    /**
     * Serialize MQTT packet to buffer
     */
    serializePacket(packet) {
        const firstByte = (packet.type << 4) | (packet.flags & 0x0F);
        const remainingLengthBuffer = parser_1.MQTTParser.encodeRemainingLength(packet.payload.length);
        return Buffer.concat([
            Buffer.from([firstByte]),
            remainingLengthBuffer,
            packet.payload
        ]);
    }
    /**
     * Create CONNACK packet
     */
    createConnackPacket(sessionPresent, returnCode) {
        const flags = sessionPresent ? 0x01 : 0x00;
        const payload = Buffer.from([flags, returnCode]);
        const packet = {
            type: types_1.PacketType.CONNACK,
            flags: 0,
            payload
        };
        return this.serializePacket(packet);
    }
    /**
     * Create PUBLISH packet
     */
    createPublishPacket(message, dup = false) {
        let flags = 0;
        if (message.retain)
            flags |= 0x01;
        flags |= (message.qos << 1);
        if (dup)
            flags |= 0x08;
        // Topic name
        const topicBuffer = parser_1.MQTTParser.encodeString(message.topic);
        let payload = topicBuffer;
        // Packet ID for QoS 1 and 2
        if (message.qos > 0 && message.packetId !== undefined) {
            const packetIdBuffer = Buffer.allocUnsafe(2);
            packetIdBuffer.writeUInt16BE(message.packetId, 0);
            payload = Buffer.concat([payload, packetIdBuffer]);
        }
        // Message payload
        payload = Buffer.concat([payload, message.payload]);
        const packet = {
            type: types_1.PacketType.PUBLISH,
            flags,
            payload
        };
        return this.serializePacket(packet);
    }
    /**
     * Create PUBACK packet
     */
    createPubackPacket(packetId) {
        const payload = Buffer.allocUnsafe(2);
        payload.writeUInt16BE(packetId, 0);
        const packet = {
            type: types_1.PacketType.PUBACK,
            flags: 0,
            payload
        };
        return this.serializePacket(packet);
    }
    /**
     * Create PUBREC packet
     */
    createPubrecPacket(packetId) {
        const payload = Buffer.allocUnsafe(2);
        payload.writeUInt16BE(packetId, 0);
        const packet = {
            type: types_1.PacketType.PUBREC,
            flags: 0,
            payload
        };
        return this.serializePacket(packet);
    }
    /**
     * Create PUBREL packet
     */
    createPubrelPacket(packetId) {
        const payload = Buffer.allocUnsafe(2);
        payload.writeUInt16BE(packetId, 0);
        const packet = {
            type: types_1.PacketType.PUBREL,
            flags: 2, // Fixed flags for PUBREL
            payload
        };
        return this.serializePacket(packet);
    }
    /**
     * Create PUBCOMP packet
     */
    createPubcompPacket(packetId) {
        const payload = Buffer.allocUnsafe(2);
        payload.writeUInt16BE(packetId, 0);
        const packet = {
            type: types_1.PacketType.PUBCOMP,
            flags: 0,
            payload
        };
        return this.serializePacket(packet);
    }
    /**
     * Create SUBACK packet
     */
    createSubackPacket(packetId, returnCodes) {
        const packetIdBuffer = Buffer.allocUnsafe(2);
        packetIdBuffer.writeUInt16BE(packetId, 0);
        const returnCodesBuffer = Buffer.from(returnCodes);
        const payload = Buffer.concat([packetIdBuffer, returnCodesBuffer]);
        const packet = {
            type: types_1.PacketType.SUBACK,
            flags: 0,
            payload
        };
        return this.serializePacket(packet);
    }
    /**
     * Create UNSUBACK packet
     */
    createUnsubackPacket(packetId) {
        const payload = Buffer.allocUnsafe(2);
        payload.writeUInt16BE(packetId, 0);
        const packet = {
            type: types_1.PacketType.UNSUBACK,
            flags: 0,
            payload
        };
        return this.serializePacket(packet);
    }
    /**
     * Create PINGRESP packet
     */
    createPingrespPacket() {
        const packet = {
            type: types_1.PacketType.PINGRESP,
            flags: 0,
            payload: Buffer.alloc(0)
        };
        return this.serializePacket(packet);
    }
    /**
     * Create DISCONNECT packet
     */
    createDisconnectPacket() {
        const packet = {
            type: types_1.PacketType.DISCONNECT,
            flags: 0,
            payload: Buffer.alloc(0)
        };
        return this.serializePacket(packet);
    }
}
exports.MQTTSerializer = MQTTSerializer;
//# sourceMappingURL=serializer.js.map