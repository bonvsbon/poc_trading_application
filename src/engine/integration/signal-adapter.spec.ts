import { PositionSizing } from '../risk/risk-engine';
import { StrategySignal } from '../strategy/strategy';
import { toDashboardSignal } from './signal-adapter';

const signal: StrategySignal = {
  symbol: 'NVDA',
  side: 'long',
  reason: 'VWAP reclaim with 2.00x volume',
  confidence: 72,
  price: 103,
  stop: 96,
  target: 117,
};

describe('toDashboardSignal', () => {
  it('maps an engine signal to the dashboard shape', () => {
    const view = toDashboardSignal(signal);
    expect(view.id).toBe('live-nvda');
    expect(view.side).toBe('Long');
    expect(view.price).toBe('$103.00');
    expect(view.stop).toBe('$96.00');
    expect(view.target).toBe('$117.00');
    // risk 7, reward 14 -> 1:2.0
    expect(view.riskReward).toBe('1:2.0');
    expect(view.status).toBe('pending');
    expect(view.priority).toBe(true);
  });

  it('appends sizing detail when an approved sizing is supplied', () => {
    const sizing: PositionSizing = {
      approved: true,
      reason: 'Approved',
      shares: 49,
      riskAmount: 343,
      notional: 5047,
    };
    expect(toDashboardSignal(signal, sizing).thesis).toContain('size 49 shares');
  });

  it('reports n/a risk-reward when the stop equals the price', () => {
    const view = toDashboardSignal({ ...signal, stop: 103 });
    expect(view.riskReward).toBe('n/a');
  });
});
