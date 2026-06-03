import { IsIn, IsNumber, IsOptional, IsPositive, IsString, MinLength, ValidateIf } from 'class-validator';

/**
 * Payload the user submits after reviewing a recommendation: which symbol/side
 * and HOW MUCH to enter. Provide exactly one of `notional` (USD) or `qty` (units).
 */
export class PlaceOrderDto {
  @IsString()
  @MinLength(1)
  symbol!: string;

  @IsIn(['long', 'short'])
  side!: 'long' | 'short';

  @IsIn(['market', 'limit'])
  type!: 'market' | 'limit';

  /** USD amount to deploy (fractional). */
  @IsOptional()
  @IsNumber()
  @IsPositive()
  notional?: number;

  /** Units/shares to buy/sell. */
  @IsOptional()
  @IsNumber()
  @IsPositive()
  qty?: number;

  /** Required for limit orders. */
  @ValidateIf((o: PlaceOrderDto) => o.type === 'limit')
  @IsNumber()
  @IsPositive()
  limitPrice?: number;
}
