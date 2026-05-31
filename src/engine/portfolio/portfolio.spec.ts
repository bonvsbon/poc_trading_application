import { OpenPosition, Portfolio } from './portfolio';

const position = (over: Partial<OpenPosition> = {}): OpenPosition => ({
  symbol: 'NVDA',
  side: 'long',
  shares: 10,
  entryPrice: 100,
  stop: 96,
  target: 108,
  ...over,
});

describe('Portfolio', () => {
  it('commits cash when opening a position', () => {
    const portfolio = new Portfolio(10000);
    portfolio.openPosition(position());
    expect(portfolio.cash).toBe(9000);
    expect(portfolio.hasPosition('NVDA')).toBe(true);
  });

  it('books a winning trade and returns proceeds', () => {
    const portfolio = new Portfolio(10000);
    portfolio.openPosition(position());
    const trade = portfolio.closePosition('NVDA', 108, 'target');
    expect(trade.pnl).toBe(80);
    expect(trade.returnPct).toBeCloseTo(8, 6);
    expect(portfolio.cash).toBe(10080);
    expect(portfolio.closedTrades).toHaveLength(1);
  });

  it('books a losing trade', () => {
    const portfolio = new Portfolio(10000);
    portfolio.openPosition(position());
    const trade = portfolio.closePosition('NVDA', 96, 'stop');
    expect(trade.pnl).toBe(-40);
    expect(portfolio.cash).toBe(9960);
  });

  it('marks equity to market for open positions', () => {
    const portfolio = new Portfolio(10000);
    portfolio.openPosition(position());
    // cash 9000 + 10 shares * 105 = 10050
    expect(portfolio.equity({ NVDA: 105 })).toBe(10050);
  });

  it('falls back to entry price when no mark is supplied', () => {
    const portfolio = new Portfolio(10000);
    portfolio.openPosition(position());
    expect(portfolio.equity({})).toBe(10000);
  });

  it('rejects a short position', () => {
    const portfolio = new Portfolio(10000);
    expect(() => portfolio.openPosition(position({ side: 'short' }))).toThrow('long-only');
  });

  it('rejects opening a duplicate position', () => {
    const portfolio = new Portfolio(10000);
    portfolio.openPosition(position());
    expect(() => portfolio.openPosition(position())).toThrow('already open');
  });

  it('rejects opening without enough cash', () => {
    const portfolio = new Portfolio(500);
    expect(() => portfolio.openPosition(position())).toThrow('Insufficient cash');
  });

  it('throws when closing a position that does not exist', () => {
    const portfolio = new Portfolio(10000);
    expect(() => portfolio.closePosition('NVDA', 100, 'close')).toThrow('No open position');
  });
});
