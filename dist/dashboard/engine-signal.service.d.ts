import { DashboardSignalView } from '../engine/integration/signal-adapter';
import { MarketDataProvider } from './market-data.provider';
export declare class EngineSignalService {
    private readonly marketData;
    private readonly strategy;
    private readonly risk;
    constructor(marketData: MarketDataProvider);
    liveSignals(symbol?: string): DashboardSignalView[];
}
