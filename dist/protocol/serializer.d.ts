/**
 * MQTT packet serializer implementing MQTT 3.1.1 specification
 */
import { MQTTPacket, ConnectReturnCode, QoSLevel, Message } from '../types';
export declare class MQTTSerializer {
    /**
     * Serialize MQTT packet to buffer
     */
    serializePacket(packet: MQTTPacket): Buffer;
    /**
     * Create CONNACK packet
     */
    createConnackPacket(sessionPresent: boolean, returnCode: ConnectReturnCode): Buffer;
    /**
     * Create PUBLISH packet
     */
    createPublishPacket(message: Message, dup?: boolean): Buffer;
    /**
     * Create PUBACK packet
     */
    createPubackPacket(packetId: number): Buffer;
    /**
     * Create PUBREC packet
     */
    createPubrecPacket(packetId: number): Buffer;
    /**
     * Create PUBREL packet
     */
    createPubrelPacket(packetId: number): Buffer;
    /**
     * Create PUBCOMP packet
     */
    createPubcompPacket(packetId: number): Buffer;
    /**
     * Create SUBACK packet
     */
    createSubackPacket(packetId: number, returnCodes: QoSLevel[]): Buffer;
    /**
     * Create UNSUBACK packet
     */
    createUnsubackPacket(packetId: number): Buffer;
    /**
     * Create PINGRESP packet
     */
    createPingrespPacket(): Buffer;
    /**
     * Create DISCONNECT packet
     */
    createDisconnectPacket(): Buffer;
}
//# sourceMappingURL=serializer.d.ts.map