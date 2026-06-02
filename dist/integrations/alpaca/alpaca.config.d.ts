export interface AlpacaConfig {
    keyId: string;
    secretKey: string;
    paper: boolean;
    tradingEnabled: boolean;
}
export declare const loadAlpacaConfig: (env?: NodeJS.ProcessEnv) => AlpacaConfig | null;
