/**
 * Core MQTT data models and interfaces
 */

export enum PacketType {
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

export enum QoSLevel {
  AT_MOST_ONCE = 0,    // Fire and forget
  AT_LEAST_ONCE = 1,   // Acknowledged delivery
  EXACTLY_ONCE = 2     // Assured delivery
}

export enum ConnectReturnCode {
  ACCEPTED = 0,
  UNACCEPTABLE_PROTOCOL_VERSION = 1,
  IDENTIFIER_REJECTED = 2,
  SERVER_UNAVAILABLE = 3,
  BAD_USERNAME_OR_PASSWORD = 4,
  NOT_AUTHORIZED = 5
}

export interface MQTTPacket {
  type: PacketType;
  flags: number;
  payload: Buffer;
  remainingLength?: number;
}

export interface Message {
  id: string;              // Globally unique message ID
  topic: string;          // Publication topic
  payload: Buffer;        // Message payload
  qos: QoSLevel;         // Quality of Service level
  retain: boolean;       // Retain flag
  timestamp: number;     // Publication timestamp
  publisherId: string;   // Publishing client ID
  packetId?: number;     // Packet ID for QoS 1 and 2
}

export interface LastWillMessage {
  topic: string;
  payload: Buffer;
  qos: QoSLevel;
  retain: boolean;
}

export interface Session {
  clientId: string;
  cleanSession: boolean;
  subscriptions: Map<string, QoSLevel>;
  messageQueue: Message[];
  lastWillMessage?: LastWillMessage;
  keepAlive: number;
  connected: boolean;
  createdAt: number;
  lastActivity: number;
  inflightMessages: Map<number, Message>; // For QoS 1 and 2
  nextPacketId: number;
}

export interface ClientConnection {
  id: string;
  clientId: string;
  protocol: 'TCP' | 'WebSocket';
  remoteAddress: string;
  connectTime: number;
  lastActivity: number;
  keepAlive: number;
  session: Session;
  socket: any; // Node.js Socket or WebSocket
  authenticated: boolean;
}

export interface Subscription {
  clientId: string;
  topicFilter: string;
  qos: QoSLevel;
  subscriptionTime: number;
}

export interface BrokerConfig {
  server: {
    port: number;
    host: string;
    maxConnections: number;
    keepAliveTimeout: number;
  };
  security: {
    enableTLS: boolean;
    certFile?: string;
    keyFile?: string;
    requireAuth: boolean;
  };
  persistence: {
    enabled: boolean;
    storageType: 'memory' | 'file' | 'database';
    retainedMessageLimit: number;
  };
  performance: {
    messageQueueLimit: number;
    inflightWindowSize: number;
    workerThreads: number;
  };
}

// Protocol handler interfaces
export interface ProtocolHandler {
  parsePacket(data: Buffer): MQTTPacket;
  serializePacket(packet: MQTTPacket): Buffer;
  validatePacket(packet: MQTTPacket): boolean;
}

export interface ConnectionManager {
  acceptConnection(socket: any): ClientConnection;
  closeConnection(connectionId: string): void;
  sendData(connectionId: string, data: Buffer): Promise<void>;
  getConnectionCount(): number;
}

export interface SessionManager {
  createSession(clientId: string, cleanSession: boolean): Session;
  getSession(clientId: string): Session | null;
  updateSession(session: Session): void;
  expireSessions(): void;
  removeSession(clientId: string): void;
}

export interface TopicTrie {
  addSubscription(topicFilter: string, clientId: string, qos: QoSLevel): void;
  removeSubscription(topicFilter: string, clientId: string): void;
  findSubscribers(topic: string): Subscription[];
  removeAllSubscriptions(clientId: string): void;
  getSubscriptionCount(): number;
  getAllSubscriptions(): Subscription[];
}

export interface QoSHandler {
  publishQoS0(message: Message, subscribers: Subscription[]): void;
  publishQoS1(message: Message, subscribers: Subscription[]): Promise<void>;
  publishQoS2(message: Message, subscribers: Subscription[]): Promise<void>;
  handleAcknowledgment(packetId: number, clientId: string, type: 'PUBACK' | 'PUBREC' | 'PUBREL' | 'PUBCOMP'): void;
}

export interface PersistentStore {
  storeRetainedMessage(topic: string, message: Message): Promise<void>;
  getRetainedMessage(topic: string): Promise<Message | null>;
  getRetainedMessages(topicPattern: string): Promise<Message[]>;
  deleteRetainedMessage(topic: string): Promise<void>;
  storeSession(session: Session): Promise<void>;
  loadSession(clientId: string): Promise<Session | null>;
  deleteSession(clientId: string): Promise<void>;
  storeMessage(message: Message): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
}

// Connect packet payload structure
export interface ConnectPacket {
  protocolName: string;
  protocolVersion: number;
  flags: {
    cleanSession: boolean;
    willFlag: boolean;
    willQoS: QoSLevel;
    willRetain: boolean;
    passwordFlag: boolean;
    usernameFlag: boolean;
  };
  keepAlive: number;
  clientId: string;
  willTopic?: string;
  willMessage?: Buffer;
  username?: string;
  password?: Buffer;
}

// Subscribe packet payload structure
export interface SubscribePacket {
  packetId: number;
  subscriptions: Array<{
    topicFilter: string;
    qos: QoSLevel;
  }>;
}

// Publish packet payload structure
export interface PublishPacket {
  topic: string;
  packetId?: number;
  payload: Buffer;
  qos: QoSLevel;
  retain: boolean;
  dup: boolean;
}