/**
 * Connectors Index
 * Exports all connector integrations for WAITRON
 */

export { MerchantOSConnector } from './merchant-os';
export { HOJAIConnector } from './hojai-core';

import { MerchantOSConnector } from './merchant-os';
import { HOJAIConnector } from './hojai-core';

export interface ConnectorConfig {
  merchantOS: {
    baseUrl: string;
    apiKey: string;
    type: 'rez' | 'standalone';
  };
  hojaiCore: {
    baseUrl: string;
    apiKey: string;
  };
}

export class ConnectorManager {
  public merchantOS: MerchantOSConnector;
  public hojaiCore: HOJAIConnector;

  constructor(config: ConnectorConfig) {
    this.merchantOS = new MerchantOSConnector(config.merchantOS);
    this.hojaiCore = new HOJAIConnector(config.hojaiCore);
  }

  async healthCheck(): Promise<{
    merchantOS: boolean;
    hojaiCore: boolean;
    overall: boolean;
  }> {
    const [merchantOS, hojaiCore] = await Promise.all([
      this.merchantOS.healthCheck(),
      this.hojaiCore.healthCheck()
    ]);

    return {
      merchantOS,
      hojaiCore,
      overall: merchantOS && hojaiCore
    };
  }
}

export default ConnectorManager;
