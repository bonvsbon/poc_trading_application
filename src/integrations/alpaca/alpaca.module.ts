import { Module } from '@nestjs/common';
import { AlpacaController } from './alpaca.controller';
import { loadAlpacaConfig } from './alpaca.config';
import { ALPACA_BROKER, ALPACA_CONFIG, ALPACA_MARKET_DATA } from './alpaca.tokens';
import { AlpacaBrokerAdapter } from './alpaca-broker.adapter';
import { AlpacaSdkClient } from './alpaca-client';
import { AlpacaMarketDataAdapter } from './alpaca-market-data.adapter';

const createSdkClient = (config: ReturnType<typeof loadAlpacaConfig>): AlpacaSdkClient | null => {
  if (!config) return null;
  // Lazy require so test environments without keys never load the SDK.
  /* eslint-disable @typescript-eslint/no-var-requires */
  const Alpaca = require('@alpacahq/alpaca-trade-api');
  return new Alpaca({
    keyId: config.keyId,
    secretKey: config.secretKey,
    paper: config.paper,
  }) as AlpacaSdkClient;
};

@Module({
  controllers: [AlpacaController],
  providers: [
    {
      provide: ALPACA_CONFIG,
      useFactory: () => loadAlpacaConfig(),
    },
    {
      provide: ALPACA_BROKER,
      inject: [ALPACA_CONFIG],
      useFactory: (config: ReturnType<typeof loadAlpacaConfig>) => {
        const client = createSdkClient(config);
        return client && config ? new AlpacaBrokerAdapter(client, config) : null;
      },
    },
    {
      provide: ALPACA_MARKET_DATA,
      inject: [ALPACA_CONFIG],
      useFactory: (config: ReturnType<typeof loadAlpacaConfig>) => {
        const client = createSdkClient(config);
        return client ? new AlpacaMarketDataAdapter(client) : null;
      },
    },
  ],
  exports: [ALPACA_BROKER, ALPACA_MARKET_DATA, ALPACA_CONFIG],
})
export class AlpacaModule {}
