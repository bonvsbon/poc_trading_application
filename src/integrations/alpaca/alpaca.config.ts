export interface AlpacaConfig {
  keyId: string;
  secretKey: string;
  /** True = paper-api.alpaca.markets, false = api.alpaca.markets. Defaults true. */
  paper: boolean;
  /** Hard gate: even with valid keys, order submission throws unless this is true. */
  tradingEnabled: boolean;
}

const truthy = (value: string | undefined): boolean => value === 'true' || value === '1';

export const loadAlpacaConfig = (env: NodeJS.ProcessEnv = process.env): AlpacaConfig | null => {
  const keyId = env.ALPACA_API_KEY_ID;
  const secretKey = env.ALPACA_API_SECRET_KEY;
  if (!keyId || !secretKey) {
    return null;
  }

  // Default to paper unless the user explicitly opts into live AND enables trading.
  const paper = !truthy(env.ALPACA_LIVE);
  const tradingEnabled = truthy(env.ALPACA_TRADING_ENABLED);

  return { keyId, secretKey, paper, tradingEnabled };
};
