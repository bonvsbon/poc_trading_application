import { Controller, Get, Param, Post } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
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
  getLiveSignals() {
    return this.engineSignals.liveSignals();
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
}
