import { BrokerPort } from '../../engine/ports/broker.port';
import { MarketDataPort } from '../../engine/ports/market-data.port';
import { AlpacaConfig } from './alpaca.config';
export declare class AlpacaController {
    private readonly config;
    private readonly broker;
    private readonly marketData;
    constructor(config: AlpacaConfig | null, broker: BrokerPort | null, marketData: MarketDataPort | null);
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
    orders(): Promise<import("../../engine/ports/broker.port").BrokerOrder[]>;
    assets(search?: string, assetClass?: string): Promise<import("../../engine/ports/broker.port").BrokerAsset[]>;
    prices(symbols?: string): Promise<{
        asOf: string;
        prices: import("../../engine/ports/market-data.port").LatestPrice[];
    }>;
    private parseSymbols;
    private requireBroker;
    private requireMarketData;
}
