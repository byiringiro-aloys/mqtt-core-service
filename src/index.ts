/**
 * MQTT Broker Server Entry Point
 */

import 'dotenv/config';
import { MQTTBroker } from './broker';
import { WebServer } from './web/web-server';
import { BrokerConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Load configuration from JSON files
 */
function loadConfig(): BrokerConfig {
  const env = process.env.NODE_ENV || 'development';
  const configDir = path.join(__dirname, '..', 'config');
  
  // Load default config
  const defaultConfigPath = path.join(configDir, 'default.json');
  let config: any = {};
  
  if (fs.existsSync(defaultConfigPath)) {
    config = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
    console.log('📋 Loaded default configuration');
  }
  
  // Load environment-specific config
  const envConfigPath = path.join(configDir, `${env}.json`);
  if (fs.existsSync(envConfigPath)) {
    const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
    config = { ...config, ...envConfig };
    console.log(`📋 Loaded ${env} configuration`);
  }
  
  return config as BrokerConfig;
}

// Default fallback configuration
const fallbackConfig: BrokerConfig = {
  server: {
    port: 1883,
    host: '0.0.0.0',
    maxConnections: 1000,
    keepAliveTimeout: 60000
  },
  security: {
    enableTLS: false,
    requireAuth: false
  },
  persistence: {
    enabled: true,
    storageType: 'database',
    retainedMessageLimit: 1000
  },
  performance: {
    messageQueueLimit: 1000,
    inflightWindowSize: 100,
    workerThreads: 1
  }
};

/**
 * Create and start MQTT broker with web dashboard
 */
async function startBroker(config: Partial<BrokerConfig> = {}): Promise<{ broker: MQTTBroker; webServer: WebServer }> {
  // Load configuration from files
  let brokerConfig: BrokerConfig;
  try {
    brokerConfig = loadConfig();
  } catch (error) {
    console.warn('⚠️ Failed to load config files, using fallback configuration');
    brokerConfig = fallbackConfig;
  }
  
  // Merge with provided config
  brokerConfig = {
    ...brokerConfig,
    ...config,
    server: { ...brokerConfig.server, ...config.server },
    security: { ...brokerConfig.security, ...config.security },
    persistence: { ...brokerConfig.persistence, ...config.persistence },
    performance: { ...brokerConfig.performance, ...config.performance }
  };

  const broker = new MQTTBroker(brokerConfig);
  const webServer = new WebServer(broker, 8080);

  // Setup event listeners
  broker.on('brokerStarted', () => {
    console.log(`🚀 MQTT Broker started on ${brokerConfig.server.host}:${brokerConfig.server.port}`);
  });

  webServer.start().then(() => {
    console.log('🌐 Web Dashboard started on http://localhost:8080');
  });

  broker.on('brokerStopped', () => {
    console.log('🛑 MQTT Broker stopped');
  });

  broker.on('clientConnected', ({ clientId, cleanSession, keepAlive }) => {
    console.log(`Client connected: ${clientId} (clean: ${cleanSession}, keepAlive: ${keepAlive}s)`);
  });

  broker.on('clientDisconnected', ({ clientId, reason }) => {
    console.log(`Client disconnected: ${clientId} (${reason})`);
  });

  broker.on('messagePublished', ({ clientId, topic, qos, retain, subscriberCount }) => {
    console.log(`Message published: ${clientId} -> ${topic} (QoS ${qos}, retain: ${retain}, subscribers: ${subscriberCount})`);
  });

  broker.on('clientSubscribed', ({ clientId, subscriptions }) => {
    console.log(`Client subscribed: ${clientId} -> ${subscriptions.map((s: any) => s.topicFilter).join(', ')}`);
  });

  broker.on('error', (error) => {
    console.error('Broker error:', error);
  });

  // Start the broker
  await broker.start();
  
  return { broker, webServer };
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown(broker: MQTTBroker, webServer: WebServer): void {
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    
    try {
      await Promise.all([
        broker.stop(),
        webServer.stop()
      ]);
      console.log('✅ Services stopped successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGQUIT', () => shutdown('SIGQUIT'));
}

// Start broker if this file is run directly
if (require.main === module) {
  startBroker()
    .then(({ broker, webServer }) => {
      setupGracefulShutdown(broker, webServer);
      
      // Print startup information
      const stats = broker.getStats();
      console.log('📊 Broker Statistics:', JSON.stringify(stats, null, 2));
      
      console.log('\n🎯 Access Points:');
      console.log('📡 MQTT (TCP): mqtt://localhost:1883');
      console.log('🔌 MQTT (WebSocket): ws://localhost:2883');
      console.log('🌐 Web Dashboard: http://localhost:8080');
    })
    .catch((error) => {
      console.error('💥 Failed to start services:', error);
      process.exit(1);
    });
}

export { MQTTBroker, WebServer, startBroker, fallbackConfig };
export * from './types';
export * from './broker';