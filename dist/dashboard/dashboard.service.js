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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const alpaca_tokens_1 = require("../integrations/alpaca/alpaca.tokens");
const clock_service_1 = require("./clock.service");
const describeBrokerError = (error) => {
    const body = error?.response?.data;
    if (body) {
        if (typeof body === 'string')
            return body;
        const typed = body;
        if (typed.message) {
            return typed.code ? `${typed.message} (code ${typed.code})` : typed.message;
        }
        return JSON.stringify(body);
    }
    return error instanceof Error ? error.message : 'unknown error';
};
let DashboardService = class DashboardService {
    clock;
    broker;
    tradingHalted = false;
    constructor(clock, broker) {
        this.clock = clock;
        this.broker = broker;
    }
    metrics = [
        { label: 'Equity', value: '$52,840.22', note: '+1.48% today', tone: 'positive' },
        { label: 'Buying Power', value: '$108,400', note: 'Margin ready' },
        { label: 'Daily PnL', value: '+$782.16', note: 'Risk used 24%', tone: 'positive' },
        { label: 'Data Latency', value: '184 ms', note: 'Healthy', tone: 'positive' },
        { label: 'Win Rate', value: '54.8%', note: '30-day paper' },
    ];
    risk = {
        riskUsedPercent: 24,
        toggles: [
            { label: 'Human approval', enabled: true },
            { label: 'Block stale data', enabled: true },
            { label: 'Cooldown after 3 losses', enabled: true },
            { label: 'Trade news spikes', enabled: false },
        ],
        limits: [
            { label: 'Risk / trade', value: 0.35, suffix: '%' },
            { label: 'Max trades', value: 8 },
            { label: 'Max ticker exposure', value: 10, suffix: '%' },
            { label: 'Max sector exposure', value: 25, suffix: '%' },
        ],
    };
    signals = [
        {
            id: 'sig-nvda-breakout',
            symbol: 'NVDA',
            side: 'Long',
            status: 'pending',
            price: '$1,126.40',
            confidence: 73,
            riskReward: '1:2.4',
            stop: '$1,108.20',
            target: '$1,170.00',
            thesis: 'Momentum + volume anomaly ผ่านเกณฑ์ ข่าวล่าสุดเป็นกลาง และ spread อยู่ในกรอบ',
            priority: true,
        },
        {
            id: 'sig-msft-vwap',
            symbol: 'MSFT',
            side: 'Watch',
            status: 'watching',
            price: '$486.18',
            confidence: 61,
            riskReward: '1:1.6',
            spread: '0.03%',
            newsState: 'Clean',
            thesis: 'รอ pullback เข้า VWAP ก่อนอนุมัติ ระบบยังไม่ส่งคำสั่ง',
            priority: false,
        },
    ];
    positions = [
        { symbol: 'AAPL', side: 'Long', quantity: 42, entry: '$203.14', stop: '$198.80', pnl: '+$184.22', pnlTone: 'positive' },
        { symbol: 'TSLA', side: 'Short', quantity: 18, entry: '$341.90', stop: '$349.10', pnl: '-$62.40', pnlTone: 'negative' },
        { symbol: 'SPY', side: 'Long', quantity: 15, entry: '$612.22', stop: '$607.60', pnl: '+$96.15', pnlTone: 'positive' },
    ];
    orders = [
        { id: 'ord-aapl-filled', icon: 'filled', title: 'AAPL limit buy filled', detail: '42 shares @ $203.14 · slippage 0.02%', time: '09:42:11' },
        { id: 'ord-nvda-staged', icon: 'pending', title: 'NVDA bracket staged', detail: 'Awaiting approval · stop $1,108.20', time: '09:44:32' },
        { id: 'ord-smci-blocked', icon: 'rejected', title: 'SMCI trade blocked', detail: 'Spread exceeded threshold', time: '09:45:03' },
    ];
    news = [
        { category: 'Earnings', tone: 'warn', title: 'NVDA earnings window in 2 days', summary: 'ลดขนาด position อัตโนมัติถ้ามีคำสั่งข้ามคืน' },
        { category: 'SEC 8-K', tone: 'info', title: 'MSFT filing parsed cleanly', summary: 'ไม่มี keyword เสี่ยงใน material event ล่าสุด' },
        { category: 'Macro', tone: 'alert', title: 'Fed speaker at 13:00 ET', summary: 'ระบบจะลด max exposure ช่วง 12:45-13:15 ET' },
    ];
    journal = [
        { time: '09:45', title: 'Rejected SMCI', detail: 'Spread 0.41% สูงกว่า limit 0.12% แม้ momentum score ผ่าน' },
        { time: '09:42', title: 'Entered AAPL', detail: 'VWAP reclaim + volume 1.8x ค่าเฉลี่ย 20 วัน ตั้ง stop ด้วย ATR' },
        { time: '09:38', title: 'Risk profile updated', detail: 'Daily loss budget เหลือ 76% หลังปิด ORCL ด้วยกำไร' },
    ];
    getState() {
        return {
            summary: this.getSummary(),
            metrics: this.metrics,
            signals: this.signals,
            risk: this.risk,
            positions: this.positions,
            orders: this.orders,
            news: this.news,
            journal: this.journal,
        };
    }
    getSummary() {
        const nextPendingSignal = this.signals.find((signal) => signal.status === 'pending');
        const statusText = this.tradingHalted ? 'หยุดเทรดแล้ว' : 'พร้อมเทรดแบบอนุมัติก่อน';
        return {
            mode: this.tradingHalted ? 'OFF' : 'Live Approval',
            safetyState: statusText,
            decisionTitle: this.tradingHalted ? 'ระบบหยุดส่งคำสั่งแล้ว' : 'เทรดได้: ต้องอนุมัติทุกคำสั่ง',
            decisionSummary: this.tradingHalted
                ? 'Kill Switch ทำงานอยู่ ระบบจะไม่ส่งคำสั่งใหม่จนกว่าจะเปิดอีกครั้ง'
                : 'ข้อมูล, broker และ risk budget ยังอยู่ในกรอบ พร้อมใช้ Live Approval',
            nextAction: this.tradingHalted
                ? 'ตรวจสถานะ portfolio ก่อนเปิดระบบ'
                : nextPendingSignal
                    ? `ตรวจ ${nextPendingSignal.symbol} ก่อนส่ง bracket order`
                    : 'ไม่มี signal ที่รออนุมัติ',
            riskUsedPercent: this.risk.riskUsedPercent,
            riskRemainingPercent: 100 - this.risk.riskUsedPercent,
            systemHealth: this.tradingHalted ? 'Halted' : 'Healthy',
            blockedTrades: this.orders.filter((order) => order.icon === 'rejected').length,
            checks: this.tradingHalted
                ? ['Kill Switch ทำงาน', 'Order ใหม่ถูก block', 'ต้องตรวจ position เปิดอยู่']
                : ['Market data สด', 'Broker ต่ออยู่', 'News filter ผ่าน', 'Daily loss ยังปลอดภัย'],
            updatedAt: this.clock.isoTimestamp(),
        };
    }
    approveSignal(id) {
        if (this.tradingHalted) {
            throw new common_1.ConflictException('Trading is halted: cannot approve signals');
        }
        this.updateSignalStatus(id, 'approved');
        const signal = this.findSignal(id);
        this.orders = [
            {
                id: `ord-${signal.symbol.toLowerCase()}-approved`,
                icon: 'pending',
                title: `${signal.symbol} bracket approved`,
                detail: `${signal.side} setup · stop ${signal.stop ?? 'n/a'} · target ${signal.target ?? 'n/a'}`,
                time: this.clock.marketTime(),
            },
            ...this.orders,
        ];
        this.journal = [
            {
                time: this.clock.shortTime(),
                title: `Approved ${signal.symbol}`,
                detail: `${signal.thesis} · confidence ${signal.confidence}% · R:R ${signal.riskReward}`,
            },
            ...this.journal,
        ];
        return this.getState();
    }
    rejectSignal(id) {
        this.updateSignalStatus(id, 'rejected');
        const signal = this.findSignal(id);
        this.orders = [
            {
                id: `ord-${signal.symbol.toLowerCase()}-rejected`,
                icon: 'rejected',
                title: `${signal.symbol} signal rejected`,
                detail: 'Manual rejection from control center',
                time: this.clock.marketTime(),
            },
            ...this.orders,
        ];
        this.journal = [
            {
                time: this.clock.shortTime(),
                title: `Rejected ${signal.symbol}`,
                detail: 'ผู้ใช้ปฏิเสธ signal ก่อนส่งคำสั่งจริง',
            },
            ...this.journal,
        ];
        return this.getState();
    }
    haltTrading() {
        this.tradingHalted = true;
        this.journal = [
            {
                time: this.clock.shortTime(),
                title: 'Kill Switch activated',
                detail: 'ระบบหยุดส่งคำสั่งใหม่ทั้งหมดจาก control center',
            },
            ...this.journal,
        ];
        return this.getState();
    }
    closeAll() {
        const pendingCount = this.signals.filter((s) => s.status === 'pending').length;
        this.signals = this.signals.map((s) => s.status === 'pending' ? { ...s, status: 'rejected', priority: false } : s);
        const positionsClosed = this.positions.length;
        this.positions = [];
        this.journal = [
            {
                time: this.clock.shortTime(),
                title: 'Close All triggered',
                detail: `ยกเลิก ${pendingCount} pending signal · ปิด ${positionsClosed} position`,
            },
            ...this.journal,
        ];
        return this.getState();
    }
    async placeOrder(dto) {
        if (this.tradingHalted) {
            throw new common_1.ConflictException('Trading is halted: cannot place orders');
        }
        if (!this.broker) {
            throw new common_1.ServiceUnavailableException('Alpaca is not configured. Set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY in env.');
        }
        const hasNotional = dto.notional !== undefined;
        const hasQty = dto.qty !== undefined;
        if (hasNotional === hasQty) {
            throw new common_1.BadRequestException('Provide exactly one of notional or qty');
        }
        if (!this.broker.canTrade) {
            throw new common_1.ForbiddenException('Trading is disabled. Set ALPACA_TRADING_ENABLED=true to place orders.');
        }
        let submitted;
        try {
            submitted = await this.broker.submitSimpleOrder({
                clientOrderId: (0, node_crypto_1.randomUUID)(),
                symbol: dto.symbol,
                side: dto.side,
                shares: dto.qty,
                notional: dto.notional,
                type: dto.type,
                limitPrice: dto.limitPrice,
            });
        }
        catch (error) {
            throw new common_1.BadGatewayException(`Broker rejected order: ${describeBrokerError(error)}`);
        }
        const sizeLabel = hasNotional ? `$${dto.notional}` : `${dto.qty} units`;
        this.orders = [
            {
                id: `ord-${submitted.brokerOrderId}`,
                icon: 'pending',
                title: `${dto.symbol} ${dto.side} order sent`,
                detail: `${dto.type} · ${sizeLabel} · status ${submitted.status}`,
                time: this.clock.marketTime(),
            },
            ...this.orders,
        ];
        this.journal = [
            {
                time: this.clock.shortTime(),
                title: `Order submitted ${dto.symbol}`,
                detail: `${dto.side} ${sizeLabel} (${dto.type}) → broker order ${submitted.brokerOrderId}`,
            },
            ...this.journal,
        ];
        return this.getState();
    }
    resumeTrading() {
        this.tradingHalted = false;
        this.journal = [
            {
                time: this.clock.shortTime(),
                title: 'Trading resumed',
                detail: 'ระบบกลับมารับคำสั่งแบบ Live Approval อีกครั้ง',
            },
            ...this.journal,
        ];
        return this.getState();
    }
    updateSignalStatus(id, status) {
        const signal = this.findSignal(id);
        this.signals = this.signals.map((item) => item.id === signal.id ? { ...item, status, priority: false } : item);
    }
    findSignal(id) {
        const signal = this.signals.find((item) => item.id === id);
        if (!signal) {
            throw new common_1.NotFoundException(`Signal ${id} was not found`);
        }
        return signal;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)(alpaca_tokens_1.ALPACA_BROKER)),
    __metadata("design:paramtypes", [clock_service_1.ClockService, Object])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map