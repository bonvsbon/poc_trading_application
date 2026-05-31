"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDataProvider = void 0;
const common_1 = require("@nestjs/common");
let MarketDataProvider = class MarketDataProvider {
    recentBars(symbol = 'NVDA') {
        const baseline = Array.from({ length: 20 }, (_, i) => ({
            timestamp: `2026-05-29T13:${String(i).padStart(2, '0')}:00.000Z`,
            symbol,
            open: 100,
            high: 101,
            low: 99,
            close: 100,
            volume: 1000,
        }));
        const dip = {
            timestamp: '2026-05-29T13:50:00.000Z',
            symbol,
            open: 100,
            high: 100,
            low: 96,
            close: 98,
            volume: 1000,
        };
        const reclaim = {
            timestamp: '2026-05-29T13:51:00.000Z',
            symbol,
            open: 99,
            high: 104,
            low: 99,
            close: 103,
            volume: 2000,
        };
        return [...baseline, dip, reclaim];
    }
};
exports.MarketDataProvider = MarketDataProvider;
exports.MarketDataProvider = MarketDataProvider = __decorate([
    (0, common_1.Injectable)()
], MarketDataProvider);
//# sourceMappingURL=market-data.provider.js.map