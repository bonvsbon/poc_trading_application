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
exports.AlpacaController = void 0;
const common_1 = require("@nestjs/common");
const alpaca_tokens_1 = require("./alpaca.tokens");
let AlpacaController = class AlpacaController {
    config;
    broker;
    constructor(config, broker) {
        this.config = config;
        this.broker = broker;
    }
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
    async account() {
        return (await this.requireBroker().getAccount());
    }
    async positions() {
        return await this.requireBroker().getPositions();
    }
    requireBroker() {
        if (!this.broker) {
            throw new common_1.ServiceUnavailableException('Alpaca is not configured. Set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY in env.');
        }
        return this.broker;
    }
};
exports.AlpacaController = AlpacaController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AlpacaController.prototype, "status", null);
__decorate([
    (0, common_1.Get)('account'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlpacaController.prototype, "account", null);
__decorate([
    (0, common_1.Get)('positions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlpacaController.prototype, "positions", null);
exports.AlpacaController = AlpacaController = __decorate([
    (0, common_1.Controller)('alpaca'),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(alpaca_tokens_1.ALPACA_CONFIG)),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)(alpaca_tokens_1.ALPACA_BROKER)),
    __metadata("design:paramtypes", [Object, Object])
], AlpacaController);
//# sourceMappingURL=alpaca.controller.js.map