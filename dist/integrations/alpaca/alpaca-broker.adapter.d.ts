import { BrokerAccount, BrokerPort, BrokerPosition, SubmitBracketOrder, SubmittedOrder } from '../../engine/ports/broker.port';
import { AlpacaConfig } from './alpaca.config';
import { AlpacaSdkClient } from './alpaca-client';
export declare class AlpacaBrokerAdapter implements BrokerPort {
    private readonly client;
    private readonly config;
    constructor(client: AlpacaSdkClient, config: AlpacaConfig);
    get canTrade(): boolean;
    getAccount(): Promise<BrokerAccount>;
    getPositions(): Promise<BrokerPosition[]>;
    submitBracketOrder(order: SubmitBracketOrder): Promise<SubmittedOrder>;
    cancelOrder(brokerOrderId: string): Promise<void>;
}
