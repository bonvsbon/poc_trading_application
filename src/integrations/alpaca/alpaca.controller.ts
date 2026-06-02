import {
  Controller,
  Get,
  Inject,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { BrokerPort } from '../../engine/ports/broker.port';
import { AlpacaConfig } from './alpaca.config';
import { ALPACA_BROKER, ALPACA_CONFIG } from './alpaca.tokens';

@Controller('alpaca')
export class AlpacaController {
  constructor(
    @Optional() @Inject(ALPACA_CONFIG) private readonly config: AlpacaConfig | null,
    @Optional() @Inject(ALPACA_BROKER) private readonly broker: BrokerPort | null,
  ) {}

  @Get('status')
  status() {
    if (!this.config) {
      return { configured: false, paper: null, tradingEnabled: false };
    }
    return {
      configured: true,
      paper: this.config.paper,
      tradingEnabled: this.config.tradingEnabled,
    };
  }

  @Get('account')
  async account() {
    return (await this.requireBroker().getAccount());
  }

  @Get('positions')
  async positions() {
    return await this.requireBroker().getPositions();
  }

  private requireBroker(): BrokerPort {
    if (!this.broker) {
      throw new ServiceUnavailableException(
        'Alpaca is not configured. Set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY in env.',
      );
    }
    return this.broker;
  }
}
