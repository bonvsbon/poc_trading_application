import { BrokerPort } from '../../engine/ports/broker.port';
import { AlpacaConfig } from './alpaca.config';
export declare class AlpacaController {
    private readonly config;
    private readonly broker;
    constructor(config: AlpacaConfig | null, broker: BrokerPort | null);
    status(): {
        configured: boolean;
        paper: null;
        tradingEnabled: boolean;
    } | {
        configured: boolean;
        paper: boolean;
        tradingEnabled: boolean;
    };
    account(): Promise<import("../../engine/ports/broker.port").BrokerAccount>;
    positions(): Promise<import("../../engine/ports/broker.port").BrokerPosition[]>;
    private requireBroker;
}
