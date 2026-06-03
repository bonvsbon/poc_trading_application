"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineSignalService = void 0;
const common_1 = require("@nestjs/common");
const signal_adapter_1 = require("../engine/integration/signal-adapter");
const risk_engine_1 = require("../engine/risk/risk-engine");
const vwap_reclaim_strategy_1 = require("../engine/strategy/vwap-reclaim.strategy");
const alpaca_tokens_1 = require("../integrations/alpaca/alpaca.tokens");
const market_data_provider_1 = require("./market-data.provider");
const ACCOUNT_EQUITY = 100000;
const SECTOR = 'Semis';
let EngineSignalService = class EngineSignalService {
    marketData;
    liveMarketData;
    strategy = new vwap_reclaim_strategy_1.VwapReclaimStrategy();
    risk = new risk_engine_1.RiskEngine();
    constructor(marketData, liveMarketData) {
        this.marketData = marketData;
        this.liveMarketData = liveMarketData;
    }
    get isLive() {
        return this.liveMarketData != null;
    }
    async liveSignals(symbol = 'NVDA') {
        const bars = this.liveMarketData
            ? await this.liveMarketData.recentBars(symbol)
            : this.marketData.recentBars(symbol);
        const signal = this.strategy.evaluate({ bars });
        if (!signal) {
            return [];
        }
        const sizing = this.risk.sizePosition({
            signal,
            sector: SECTOR,
            account: {
                equity: ACCOUNT_EQUITY,
                openTradesCount: 0,
                tickerNotional: {},
                sectorNotional: {},
                dailyPnlPercent: 0,
                consecutiveLosses: 0,
            },
        });
        return [(0, signal_adapter_1.toDashboardSignal)(signal, sizing)];
    }
};
exports.EngineSignalService = EngineSignalService;
exports.EngineSignalService = EngineSignalService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)(alpaca_tokens_1.ALPACA_MARKET_DATA)),
    __metadata("design:paramtypes", [market_data_provider_1.MarketDataProvider, Object])
], EngineSignalService);
//# sourceMappingURL=engine-signal.service.js.map