/**
 * Core MQTT data models and interfaces
 * Implements MQTT 3.1.1 protocol specification types
 */
/**
 * MQTT Quality of Service levels
 */
export declare enum QoSLevel {
    AT_MOST_ONCE = 0,// Fire and forget
    AT_LEAST_ONCE = 1,// Acknowledged delivery
    EXACTLY_ONCE = 2
}
/**
 * MQTT packet types according to MQTT 3.1.1 specification
 */
export declare enum PacketType {
    CONNECT = 1,
    CONNACK = 2,
    PUBLISH = 3,
    PUBACK = 4,
    PUBREC = 5,
    PUBREL = 6,
    PUBCOMP = 7,
    SUBSCRIBE = 8,
    SUBACK = 9,
    UNSUBSCRIBE = 10,
    UNSUBACK = 11,
    PINGREQ = 12,
    PINGRESP = 13,
    DISCONNECT = 14
}
/**
 * Core message structure for MQTT messages
 */
export interface Message {
    /** Globally unique message ID */
    id: string;
    /** Publication topic */
    topic: string;
    /** Message payload */
    payload: Buffer;
    /** Quality of Service level */
    qos: QoSLevel;
    /** Retain flag */
    retain: boolean;
    /** Publication timestamp */
    timestamp: number;
    /** Publishing client ID */
    publisherId: string;
    /** Duplicate flag for retransmissions */
    dup?: boolean;
    /** Packet identifier for QoS 1 and 2 messages */
    packetId?: number;
}
/**
 * Last Will and Testament message
 */
export interface LastWillMessage {
    /** Will topic */
    topic: string;
    /** Will message payload */
    payload: Buffer;
    /** Will QoS level */
    qos: QoSLevel;
    /** Will retain flag */
    retain: boolean;
}
/**
 * Client subscription information
 */
export interface Subscription {
    /** Client ID that owns this subscription */
    clientId: string;
    /** Topic filter pattern */
    topicFilter: string;
    /** Requested QoS level */
    qos: QoSLevel;
    /** Subscription timestamp */
    subscriptionTime: number;
}
/**
 * Client session state
 */
export interface Session {
    /** Unique client identifier */
    clientId: string;
    /** Clean session flag */
    cleanSession: boolean;
    /** Client subscriptions */
    subscriptions: Map<string, QoSLevel>;
    /** Queued messages for offline clients */
    messageQueue: Message[];
    /** Last will message */
    lastWillMessage?: LastWillMessage;
    /** Keep alive interval in seconds */
    keepAlive: number;
    /** Connection status */
    connected: boolean;
    /** Session creation timestamp */
    createdAt: number;
    /** Last activity timestamp */
    lastActivity: number;
    /** Inflight messages for QoS 1 and 2 */
    inflightMessages: Map<number, Message>;
    /** Next packet identifier */
    nextPacketId: number;
}
/**
 * Client connection information
 */
export interface ClientConnection {
    /** Connection ID */
    id: string;
    /** MQTT client ID */
    clientId: string;
    /** Connection protocol */
    protocol: 'TCP' | 'WebSocket' | 'TLS';
    /** Remote client address */
    remoteAddress: string;
    /** Connection establishment time */
    connectTime: number;
    /** Last activity timestamp */
    lastActivity: number;
    /** Keep alive interval */
    keepAlive: number;
    /** Associated session */
    session: Session;
    /** Connection state */
    state: ConnectionState;
}
/**
 * Connection states
 */
export declare enum ConnectionState {
    CONNECTING = "connecting",
    CONNECTED = "connected",
    DISCONNECTING = "disconnecting",
    DISCONNECTED = "disconnected"
}
/**
 * MQTT packet structure
 */
export interface MQTTPacket {
    /** Packet type */
    type: PacketType;
    /** Packet flags */
    flags: number;
    /** Packet payload */
    payload: Buffer;
    /** Remaining length */
    remainingLength: number;
}
/**
 * CONNECT packet payload
 */
export interface ConnectPacket {
    /** Protocol name */
    protocolName: string;
    /** Protocol version */
    protocolVersion: number;
    /** Connect flags */
    flags: {
        cleanSession: boolean;
        willFlag: boolean;
        willQoS: QoSLevel;
        willRetain: boolean;
        passwordFlag: boolean;
        usernameFlag: boolean;
    };
    /** Keep alive interval */
    keepAlive: number;
    /** Client identifier */
    clientId: string;
    /** Will topic (if will flag is set) */
    willTopic?: string;
    /** Will message (if will flag is set) */
    willMessage?: Buffer;
    /** Username (if username flag is set) */
    username?: string;
    /** Password (if password flag is set) */
    password?: Buffer;
}
/**
 * CONNACK packet payload
 */
export interface ConnackPacket {
    /** Session present flag */
    sessionPresent: boolean;
    /** Return code */
    returnCode: ConnackReturnCode;
}
/**
 * CONNACK return codes
 */
export declare enum ConnackReturnCode {
    ACCEPTED = 0,
    UNACCEPTABLE_PROTOCOL_VERSION = 1,
    IDENTIFIER_REJECTED = 2,
    SERVER_UNAVAILABLE = 3,
    BAD_USERNAME_OR_PASSWORD = 4,
    NOT_AUTHORIZED = 5
}
/**
 * PUBLISH packet payload
 */
export interface PublishPacket {
    /** Topic name */
    topicName: string;
    /** Packet identifier (for QoS > 0) */
    packetId?: number;
    /** Message payload */
    payload: Buffer;
    /** QoS level */
    qos: QoSLevel;
    /** Retain flag */
    retain: boolean;
    /** Duplicate flag */
    dup: boolean;
}
/**
 * SUBSCRIBE packet payload
 */
export interface SubscribePacket {
    /** Packet identifier */
    packetId: number;
    /** Topic filters with QoS */
    topicFilters: Array<{
        topicFilter: string;
        qos: QoSLevel;
    }>;
}
/**
 * SUBACK packet payload
 */
export interface SubackPacket {
    /** Packet identifier */
    packetId: number;
    /** Return codes for each subscription */
    returnCodes: SubackReturnCode[];
}
/**
 * SUBACK return codes
 */
export declare enum SubackReturnCode {
    MAXIMUM_QOS_0 = 0,
    MAXIMUM_QOS_1 = 1,
    MAXIMUM_QOS_2 = 2,
    FAILURE = 128
}
/**
 * UNSUBSCRIBE packet payload
 */
export interface UnsubscribePacket {
    /** Packet identifier */
    packetId: number;
    /** Topic filters to unsubscribe from */
    topicFilters: string[];
}
/**
 * Generic acknowledgment packet (PUBACK, PUBREC, PUBREL, PUBCOMP, UNSUBACK)
 */
export interface AckPacket {
    /** Packet identifier */
    packetId: number;
}
//# sourceMappingURL=mqtt.d.ts.map