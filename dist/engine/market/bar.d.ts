export interface Bar {
    timestamp: string;
    symbol: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export declare const typicalPrice: (bar: Bar) => number;
