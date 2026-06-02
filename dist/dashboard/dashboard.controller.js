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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const dashboard_service_1 = require("./dashboard.service");
const engine_signal_service_1 = require("./engine-signal.service");
let DashboardController = class DashboardController {
    dashboardService;
    engineSignals;
    constructor(dashboardService, engineSignals) {
        this.dashboardService = dashboardService;
        this.engineSignals = engineSignals;
    }
    getSummary() {
        return this.dashboardService.getSummary();
    }
    getLiveSignals() {
        return this.engineSignals.liveSignals();
    }
    getState() {
        return this.dashboardService.getState();
    }
    approveSignal(id) {
        return this.dashboardService.approveSignal(id);
    }
    rejectSignal(id) {
        return this.dashboardService.rejectSignal(id);
    }
    haltTrading() {
        return this.dashboardService.haltTrading();
    }
    resumeTrading() {
        return this.dashboardService.resumeTrading();
    }
    closeAll() {
        return this.dashboardService.closeAll();
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('live-signals'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getLiveSignals", null);
__decorate([
    (0, common_1.Get)('state'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getState", null);
__decorate([
    (0, common_1.Post)('signals/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "approveSignal", null);
__decorate([
    (0, common_1.Post)('signals/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "rejectSignal", null);
__decorate([
    (0, common_1.Post)('halt'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "haltTrading", null);
__decorate([
    (0, common_1.Post)('resume'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "resumeTrading", null);
__decorate([
    (0, common_1.Post)('close-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "closeAll", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService,
        engine_signal_service_1.EngineSignalService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map