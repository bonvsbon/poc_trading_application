import { DashboardService } from './dashboard.service';
import { PlaceOrderDto } from './place-order.dto';
import { EngineSignalService } from './engine-signal.service';
export declare class DashboardController {
    private readonly dashboardService;
    private readonly engineSignals;
    constructor(dashboardService: DashboardService, engineSignals: EngineSignalService);
    getSummary(): import("./dashboard.types").DashboardSummary;
    getLiveSignals(symbol?: string): Promise<import("../engine/integration/signal-adapter").DashboardSignalView[]>;
    getState(): import("./dashboard.types").DashboardState;
    approveSignal(id: string): import("./dashboard.types").DashboardState;
    rejectSignal(id: string): import("./dashboard.types").DashboardState;
    haltTrading(): import("./dashboard.types").DashboardState;
    resumeTrading(): import("./dashboard.types").DashboardState;
    closeAll(): import("./dashboard.types").DashboardState;
    placeOrder(dto: PlaceOrderDto): Promise<import("./dashboard.types").DashboardState>;
}
