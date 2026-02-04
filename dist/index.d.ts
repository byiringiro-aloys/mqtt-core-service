/**
 * MQTT Broker Server Entry Point
 */
import 'dotenv/config';
import { MQTTBroker } from './broker';
import { WebServer } from './web/web-server';
import { BrokerConfig } from './types';
declare const fallbackConfig: BrokerConfig;
/**
 * Create and start MQTT broker with web dashboard
 */
declare function startBroker(config?: Partial<BrokerConfig>): Promise<{
    broker: MQTTBroker;
    webServer: WebServer;
}>;
export { MQTTBroker, WebServer, startBroker, fallbackConfig };
export * from './types';
export * from './broker';
//# sourceMappingURL=index.d.ts.map