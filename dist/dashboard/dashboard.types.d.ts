export type DashboardSummary = {
    mode: string;
    safetyState: string;
    decisionTitle: string;
    decisionSummary: string;
    nextAction: string;
    riskUsedPercent: number;
    riskRemainingPercent: number;
    systemHealth: string;
    blockedTrades: number;
    checks: string[];
    updatedAt: string;
};
export type DashboardMetric = {
    label: string;
    value: string;
    note: string;
    tone?: 'positive' | 'negative' | 'neutral';
};
export type TradingSignal = {
    id: string;
    symbol: string;
    side: 'Long' | 'Short' | 'Watch';
    status: 'pending' | 'approved' | 'rejected' | 'watching';
    price: string;
    confidence: number;
    riskReward: string;
    stop?: string;
    target?: string;
    spread?: string;
    newsState?: string;
    thesis: string;
    priority: boolean;
};
export type RiskControl = {
    riskUsedPercent: number;
    toggles: Array<{
        label: string;
        enabled: boolean;
    }>;
    limits: Array<{
        label: string;
        value: number;
        suffix?: string;
    }>;
};
export type Position = {
    symbol: string;
    side: 'Long' | 'Short';
    quantity: number;
    entry: string;
    stop: string;
    pnl: string;
    pnlTone: 'positive' | 'negative';
};
export type OrderEvent = {
    id: string;
    icon: 'filled' | 'pending' | 'rejected';
    title: string;
    detail: string;
    time: string;
};
export type NewsEvent = {
    category: 'Earnings' | 'SEC 8-K' | 'Macro' | 'System';
    tone: 'warn' | 'info' | 'alert';
    title: string;
    summary: string;
};
export type JournalEntry = {
    time: string;
    title: string;
    detail: string;
};
export type DashboardState = {
    summary: DashboardSummary;
    metrics: DashboardMetric[];
    signals: TradingSignal[];
    risk: RiskControl;
    positions: Position[];
    orders: OrderEvent[];
    news: NewsEvent[];
    journal: JournalEntry[];
};
