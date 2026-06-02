import { loadAlpacaConfig } from './alpaca.config';

describe('loadAlpacaConfig', () => {
  it('returns null when keys are missing', () => {
    expect(loadAlpacaConfig({})).toBeNull();
  });

  it('defaults to paper + trading disabled', () => {
    const cfg = loadAlpacaConfig({
      ALPACA_API_KEY_ID: 'key',
      ALPACA_API_SECRET_KEY: 'secret',
    });
    expect(cfg).toEqual({
      keyId: 'key',
      secretKey: 'secret',
      paper: true,
      tradingEnabled: false,
    });
  });

  it('enables live only when ALPACA_LIVE=true', () => {
    const cfg = loadAlpacaConfig({
      ALPACA_API_KEY_ID: 'k',
      ALPACA_API_SECRET_KEY: 's',
      ALPACA_LIVE: 'true',
    });
    expect(cfg?.paper).toBe(false);
  });

  it('enables order submission only when ALPACA_TRADING_ENABLED=true', () => {
    const cfg = loadAlpacaConfig({
      ALPACA_API_KEY_ID: 'k',
      ALPACA_API_SECRET_KEY: 's',
      ALPACA_TRADING_ENABLED: 'true',
    });
    expect(cfg?.tradingEnabled).toBe(true);
  });
});
