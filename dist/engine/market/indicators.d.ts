import { Bar } from './bar';
export declare const sessionVwap: (bars: Bar[]) => number | null;
export declare const averageVolume: (bars: Bar[], lookback: number) => number | null;
export declare const lowestLow: (bars: Bar[], lookback: number) => number | null;
