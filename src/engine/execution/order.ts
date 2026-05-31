import { Side } from '../strategy/strategy';

export interface BracketOrder {
  symbol: string;
  side: Side;
  shares: number;
  entry: number;
  stop: number;
  target: number;
}

export interface Fill {
  symbol: string;
  shares: number;
  price: number;
}

export type ExitReason = 'stop' | 'target' | 'close';

export interface ExitResult {
  price: number;
  reason: ExitReason;
}
