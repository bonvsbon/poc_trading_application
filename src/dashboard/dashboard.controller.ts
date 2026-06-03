import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PlaceOrderDto } from './place-order.dto';
import { EngineSignalService } from './engine-signal.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly engineSignals: EngineSignalService,
  ) {}

  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('live-signals')
  getLiveSignals(@Query('symbol') symbol?: string) {
    return this.engineSignals.liveSignals(symbol || undefined);
  }

  @Get('state')
  getState() {
    return this.dashboardService.getState();
  }

  @Post('signals/:id/approve')
  approveSignal(@Param('id') id: string) {
    return this.dashboardService.approveSignal(id);
  }

  @Post('signals/:id/reject')
  rejectSignal(@Param('id') id: string) {
    return this.dashboardService.rejectSignal(id);
  }

  @Post('halt')
  haltTrading() {
    return this.dashboardService.haltTrading();
  }

  @Post('resume')
  resumeTrading() {
    return this.dashboardService.resumeTrading();
  }

  @Post('close-all')
  closeAll() {
    return this.dashboardService.closeAll();
  }

  /**
   * Submit a REAL paper order to the broker after the user reviewed the
   * recommendation and entered the size. Gated by Kill Switch + ALPACA_TRADING_ENABLED.
   */
  @Post('orders')
  placeOrder(@Body() dto: PlaceOrderDto) {
    return this.dashboardService.placeOrder(dto);
  }
}
