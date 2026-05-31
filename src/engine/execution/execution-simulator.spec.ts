import { Bar } from '../market/bar';
import { ExecutionSimulator } from './execution-simulator';
import { BracketOrder } from './order';

const bar = (over: Partial<Bar>): Bar => ({
  timestamp: '2026-05-29T13:30:00.000Z',
  symbol: 'NVDA',
  open: 100,
  high: 101,
  low: 99,
  close: 100,
  volume: 1000,
  ...over,
});

const order: BracketOrder = {
  symbol: 'NVDA',
  side: 'long',
  shares: 10,
  entry: 100,
  stop: 96,
  target: 108,
};

describe('ExecutionSimulator', () => {
  // 2 + 1 = 3 bps adverse cost
  const sim = new ExecutionSimulator({ slippageBps: 2, spreadBps: 1 });

  it('fills a long entry above the reference price', () => {
    const fill = sim.fillEntry(order, 100);
    expect(fill.price).toBeCloseTo(100 * 1.0003, 6);
    expect(fill.shares).toBe(10);
  });

  it('exits at the stop when the low breaches it', () => {
    const exit = sim.checkExit({ side: 'long', stop: 96, target: 108 }, bar({ low: 95 }));
    expect(exit?.reason).toBe('stop');
    expect(exit?.price).toBeCloseTo(96 * 0.9997, 6);
  });

  it('exits at the target when the high reaches it', () => {
    const exit = sim.checkExit({ side: 'long', stop: 96, target: 108 }, bar({ high: 109 }));
    expect(exit?.reason).toBe('target');
  });

  it('prefers the stop when both stop and target are touched in one bar', () => {
    const exit = sim.checkExit({ side: 'long', stop: 96, target: 108 }, bar({ low: 95, high: 110 }));
    expect(exit?.reason).toBe('stop');
  });

  it('returns null when neither stop nor target is hit', () => {
    const exit = sim.checkExit({ side: 'long', stop: 96, target: 108 }, bar({ low: 99, high: 101 }));
    expect(exit).toBeNull();
  });

  it('force closes at the bar close below the reference for a long', () => {
    const exit = sim.forceClose({ side: 'long', stop: 96, target: 108 }, bar({ close: 102 }));
    expect(exit.reason).toBe('close');
    expect(exit.price).toBeCloseTo(102 * 0.9997, 6);
  });

  describe('short side', () => {
    const shortOrder: BracketOrder = { ...order, side: 'short', stop: 104, target: 92 };

    it('fills a short entry below the reference price', () => {
      const fill = sim.fillEntry(shortOrder, 100);
      expect(fill.price).toBeCloseTo(100 * 0.9997, 6);
    });

    it('stops out a short when the high breaches the stop', () => {
      const exit = sim.checkExit({ side: 'short', stop: 104, target: 92 }, bar({ high: 105 }));
      expect(exit?.reason).toBe('stop');
      expect(exit?.price).toBeCloseTo(104 * 1.0003, 6);
    });

    it('takes profit on a short when the low reaches the target', () => {
      const exit = sim.checkExit({ side: 'short', stop: 104, target: 92 }, bar({ low: 91 }));
      expect(exit?.reason).toBe('target');
    });

    it('returns null for a short when neither level is hit', () => {
      const exit = sim.checkExit({ side: 'short', stop: 104, target: 92 }, bar({ high: 101, low: 99 }));
      expect(exit).toBeNull();
    });

    it('force closes a short above the reference', () => {
      const exit = sim.forceClose({ side: 'short', stop: 104, target: 92 }, bar({ close: 98 }));
      expect(exit.price).toBeCloseTo(98 * 1.0003, 6);
    });
  });
});
