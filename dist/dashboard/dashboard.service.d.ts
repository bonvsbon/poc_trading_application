import { ClockService } from './clock.service';
import { DashboardState, DashboardSummary } from './dashboard.types';
export declare class DashboardService {
    private readonly clock;
    private tradingHalted;
    constructor(clock: ClockService);
    private readonly metrics;
    private readonly risk;
    private signals;
    private readonly positions;
    private orders;
    private readonly news;
    private journal;
    getState(): DashboardState;
    getSummary(): DashboardSummary;
    approveSignal(id: string): DashboardState;
    rejectSignal(id: string): DashboardState;
    haltTrading(): DashboardState;
    resumeTrading(): DashboardState;
    private updateSignalStatus;
    private findSignal;
}
