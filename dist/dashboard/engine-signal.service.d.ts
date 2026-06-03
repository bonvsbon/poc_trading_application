import { DashboardSignalView } from '../engine/integration/signal-adapter';
import { MarketDataPort } from '../engine/ports/market-data.port';
import { MarketDataProvider } from './market-data.provider';
export declare class EngineSignalService {
    private readonly marketData;
    private readonly liveMarketData;
    private readonly strategy;
    private readonly risk;
    constructor(marketData: MarketDataProvider, liveMarketData: MarketDataPort | null);
    get isLive(): boolean;
    liveSignals(symbol?: string): Promise<DashboardSignalView[]>;
}
