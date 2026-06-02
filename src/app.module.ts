import { Module } from '@nestjs/common';
import { ClockService } from './dashboard/clock.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { EngineSignalService } from './dashboard/engine-signal.service';
import { MarketDataProvider } from './dashboard/market-data.provider';
import { AlpacaModule } from './integrations/alpaca/alpaca.module';

@Module({
  imports: [AlpacaModule],
  controllers: [DashboardController],
  providers: [DashboardService, ClockService, EngineSignalService, MarketDataProvider],
})
export class AppModule {}
