import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClockService } from './clock.service';
import { DashboardService } from './dashboard.service';

class FixedClock extends ClockService {
  override isoTimestamp(): string {
    return '2026-05-29T00:00:00.000Z';
  }
  override marketTime(): string {
    return '09:30:00';
  }
  override shortTime(): string {
    return '09:30';
  }
}

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    service = new DashboardService(new FixedClock());
  });

  it('returns a live summary by default', () => {
    const summary = service.getSummary();
    expect(summary.mode).toBe('Live Approval');
    expect(summary.systemHealth).toBe('Healthy');
    expect(summary.updatedAt).toBe('2026-05-29T00:00:00.000Z');
  });

  it('computes risk remaining as the complement of risk used', () => {
    const summary = service.getSummary();
    expect(summary.riskUsedPercent + summary.riskRemainingPercent).toBe(100);
  });

  it('points nextAction at the first pending signal', () => {
    const summary = service.getSummary();
    expect(summary.nextAction).toContain('NVDA');
  });

  it('returns a full state snapshot with all sections', () => {
    const state = service.getState();
    expect(state.metrics.length).toBeGreaterThan(0);
    expect(state.positions.length).toBeGreaterThan(0);
    expect(state.news.length).toBeGreaterThan(0);
    expect(state.summary.systemHealth).toBe('Healthy');
  });

  it('counts pre-seeded blocked trades', () => {
    expect(service.getSummary().blockedTrades).toBe(1);
  });

  it('approves a pending signal and logs an order + journal entry', () => {
    const state = service.approveSignal('sig-nvda-breakout');
    const signal = state.signals.find((s) => s.id === 'sig-nvda-breakout');
    expect(signal?.status).toBe('approved');
    expect(state.orders[0].title).toContain('NVDA');
    expect(state.journal[0].title).toContain('Approved NVDA');
  });

  it('uses n/a fallbacks when approving a signal without stop/target', () => {
    const state = service.approveSignal('sig-msft-vwap');
    expect(state.orders[0].detail).toContain('stop n/a');
    expect(state.orders[0].detail).toContain('target n/a');
  });

  it('clears priority flag once a signal is approved', () => {
    const state = service.approveSignal('sig-nvda-breakout');
    const signal = state.signals.find((s) => s.id === 'sig-nvda-breakout');
    expect(signal?.priority).toBe(false);
  });

  it('rejects a signal and records a blocked order + journal entry', () => {
    const before = service.getSummary().blockedTrades;
    const state = service.rejectSignal('sig-nvda-breakout');
    const signal = state.signals.find((s) => s.id === 'sig-nvda-breakout');
    expect(signal?.status).toBe('rejected');
    expect(state.orders[0].icon).toBe('rejected');
    expect(state.journal[0].title).toContain('Rejected NVDA');
    expect(state.summary.blockedTrades).toBe(before + 1);
  });

  it('allows rejecting a signal even while halted', () => {
    service.haltTrading();
    expect(() => service.rejectSignal('sig-nvda-breakout')).not.toThrow();
  });

  it('throws NotFound for an unknown signal on approve', () => {
    expect(() => service.approveSignal('does-not-exist')).toThrow(NotFoundException);
  });

  it('throws NotFound for an unknown signal on reject', () => {
    expect(() => service.rejectSignal('does-not-exist')).toThrow(NotFoundException);
  });

  it('halts trading and reflects it in the summary', () => {
    const state = service.haltTrading();
    expect(state.summary.mode).toBe('OFF');
    expect(state.summary.systemHealth).toBe('Halted');
  });

  it('blocks approval while trading is halted', () => {
    service.haltTrading();
    expect(() => service.approveSignal('sig-nvda-breakout')).toThrow(ConflictException);
  });

  it('resumes trading after a halt', () => {
    service.haltTrading();
    const state = service.resumeTrading();
    expect(state.summary.systemHealth).toBe('Healthy');
    expect(state.journal[0].title).toBe('Trading resumed');
    expect(() => service.approveSignal('sig-nvda-breakout')).not.toThrow();
  });

  it('closeAll cancels pending signals and flattens positions', () => {
    const state = service.closeAll();
    expect(state.signals.find((s) => s.id === 'sig-nvda-breakout')?.status).toBe('rejected');
    expect(state.positions).toHaveLength(0);
    expect(state.journal[0].title).toBe('Close All triggered');
  });

  it('logs the kill switch in the journal when halting', () => {
    const state = service.haltTrading();
    expect(state.journal[0].title).toBe('Kill Switch activated');
    expect(state.summary.nextAction).toContain('portfolio');
  });
});
