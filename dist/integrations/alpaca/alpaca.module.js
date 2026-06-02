"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlpacaModule = void 0;
const common_1 = require("@nestjs/common");
const alpaca_controller_1 = require("./alpaca.controller");
const alpaca_config_1 = require("./alpaca.config");
const alpaca_tokens_1 = require("./alpaca.tokens");
const alpaca_broker_adapter_1 = require("./alpaca-broker.adapter");
const alpaca_market_data_adapter_1 = require("./alpaca-market-data.adapter");
const createSdkClient = (config) => {
    if (!config)
        return null;
    const Alpaca = require('@alpacahq/alpaca-trade-api');
    return new Alpaca({
        keyId: config.keyId,
        secretKey: config.secretKey,
        paper: config.paper,
    });
};
let AlpacaModule = class AlpacaModule {
};
exports.AlpacaModule = AlpacaModule;
exports.AlpacaModule = AlpacaModule = __decorate([
    (0, common_1.Module)({
        controllers: [alpaca_controller_1.AlpacaController],
        providers: [
            {
                provide: alpaca_tokens_1.ALPACA_CONFIG,
                useFactory: () => (0, alpaca_config_1.loadAlpacaConfig)(),
            },
            {
                provide: alpaca_tokens_1.ALPACA_BROKER,
                inject: [alpaca_tokens_1.ALPACA_CONFIG],
                useFactory: (config) => {
                    const client = createSdkClient(config);
                    return client && config ? new alpaca_broker_adapter_1.AlpacaBrokerAdapter(client, config) : null;
                },
            },
            {
                provide: alpaca_tokens_1.ALPACA_MARKET_DATA,
                inject: [alpaca_tokens_1.ALPACA_CONFIG],
                useFactory: (config) => {
                    const client = createSdkClient(config);
                    return client ? new alpaca_market_data_adapter_1.AlpacaMarketDataAdapter(client) : null;
                },
            },
        ],
        exports: [alpaca_tokens_1.ALPACA_BROKER, alpaca_tokens_1.ALPACA_MARKET_DATA, alpaca_tokens_1.ALPACA_CONFIG],
    })
], AlpacaModule);
//# sourceMappingURL=alpaca.module.js.map