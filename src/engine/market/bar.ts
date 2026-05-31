export interface Bar {
  timestamp: string;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const typicalPrice = (bar: Bar): number => (bar.high + bar.low + bar.close) / 3;
