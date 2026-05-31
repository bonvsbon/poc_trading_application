import { StrategySignal } from '../strategy/strategy';
import { AccountSnapshot, RiskEngine, SizeRequest } from './risk-engine';

const signal: StrategySignal = {
  symbol: 'NVDA',
  side: 'long',
  reason: 'test',
  confidence: 70,
  price: 100,
  stop: 96,
  target: 108,
};

const account = (over: Partial<AccountSnapshot> = {}): AccountSnapshot => ({
  equity: 50000,
  openTradesCount: 0,
  tickerNotional: {},
  sectorNotional: {},
  dailyPnlPercent: 0,
  consecutiveLosses: 0,
  ...over,
});

const req = (over: Partial<SizeRequest> = {}): SizeRequest => ({
  signal,
  sector: 'Semis',
  account: account(),
  ...over,
});

describe('RiskEngine', () => {
  const engine = new RiskEngine();

  it('sizes a position from the per-trade risk budget', () => {
    const result = engine.sizePosition(req());
    // 50000 * 0.35% = 175 budget; per-share risk 4 -> 43 shares
    expect(result.approved).toBe(true);
    expect(result.shares).toBe(43);
    expect(result.riskAmount).toBe(172);
    expect(result.notional).toBe(4300);
  });

  it('rejects when a loss cooldown is active', () => {
    const result = engine.sizePosition(req({ account: account({ consecutiveLosses: 3 }) }));
    expect(result.approved).toBe(false);
    expect(result.reason).toContain('Cooldown');
  });

  it('rejects when the daily loss limit is reached', () => {
    const result = engine.sizePosition(req({ account: account({ dailyPnlPercent: -2 }) }));
    expect(result.approved).toBe(false);
    expect(result.reason).toContain('Daily loss');
  });

  it('rejects when max concurrent trades is reached', () => {
    const result = engine.sizePosition(req({ account: account({ openTradesCount: 8 }) }));
    expect(result.approved).toBe(false);
    expect(result.reason).toContain('Max concurrent');
  });

  it('rejects a zero per-share risk', () => {
    const result = engine.sizePosition(req({ signal: { ...signal, stop: 100 } }));
    expect(result.approved).toBe(false);
    expect(result.reason).toContain('Invalid stop');
  });

  it('caps shares by ticker exposure room', () => {
    // ticker already holds 4900 of the 5000 (10%) cap -> 100 room -> 1 share
    const result = engine.sizePosition(req({ account: account({ tickerNotional: { NVDA: 4900 } }) }));
    expect(result.approved).toBe(true);
    expect(result.shares).toBe(1);
  });

  it('rejects when exposure leaves no room', () => {
    const result = engine.sizePosition(req({ account: account({ tickerNotional: { NVDA: 5000 } }) }));
    expect(result.approved).toBe(false);
    expect(result.reason).toContain('Exposure');
  });

  it('caps shares by sector exposure room', () => {
    // sector holds 12450 of the 12500 (25%) cap -> 50 room -> 0 shares for price 100
    const result = engine.sizePosition(req({ account: account({ sectorNotional: { Semis: 12450 } }) }));
    expect(result.approved).toBe(false);
  });

  it('honors overridden limits', () => {
    // 0.7% budget -> 87 risk-shares, but the 10% ticker cap (50 shares) binds first
    const capped = engine.sizePosition(req({ limits: { riskPerTradePercent: 0.7 } }));
    expect(capped.shares).toBe(50);

    // raise the ticker cap too and the larger risk budget comes through
    const uncapped = engine.sizePosition(
      req({ limits: { riskPerTradePercent: 0.7, maxTickerExposurePercent: 30 } }),
    );
    expect(uncapped.shares).toBe(87);
  });
});
