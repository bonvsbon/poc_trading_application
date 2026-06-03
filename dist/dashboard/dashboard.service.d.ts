import { BrokerPort } from '../engine/ports/broker.port';
import { ClockService } from './clock.service';
import { PlaceOrderDto } from './place-order.dto';
import { DashboardState, DashboardSummary } from './dashboard.types';
export declare class DashboardService {
    private readonly clock;
    private readonly broker;
    private tradingHalted;
    constructor(clock: ClockService, broker: BrokerPort | null);
    private readonly metrics;
    private readonly risk;
    private signals;
    private positions;
    private orders;
    private readonly news;
    private journal;
    getState(): DashboardState;
    getSummary(): DashboardSummary;
    approveSignal(id: string): DashboardState;
    rejectSignal(id: string): DashboardState;
    haltTrading(): DashboardState;
    closeAll(): DashboardState;
    placeOrder(dto: PlaceOrderDto): Promise<DashboardState>;
    resumeTrading(): DashboardState;
    private updateSignalStatus;
    private findSignal;
}
