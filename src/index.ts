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
  }
  
  // Load environment-specific config
  const envConfigPath = path.join(configDir, `${env}.json`);
  if (fs.existsSync(envConfigPath)) {
    const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
    config = { ...config, ...envConfig };
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
  
  // Use PORT environment variable for web dashboard (Render requirement)
  const webPort = parseInt(process.env.PORT || '8080');
  const webServer = new WebServer(broker, webPort);

  // Setup event listeners
  broker.on('brokerStarted', () => {
    // Server started silently
  });

  webServer.start().then(() => {
    // Web dashboard started silently
  });

  broker.on('brokerStopped', () => {
    // Server stopped silently
  });

  // Remove client connection/disconnection logs
  // Remove message published logs
  // Remove subscription logs

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
    try {
      await Promise.all([
        broker.stop(),
        webServer.stop()
      ]);
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
      // Silent startup - v2.0.0
    })
    .catch((error) => {
      console.error('Failed to start services:', error);
      process.exit(1);
    });
}

export { MQTTBroker, WebServer, startBroker, fallbackConfig };
export * from './types';
export * from './broker';