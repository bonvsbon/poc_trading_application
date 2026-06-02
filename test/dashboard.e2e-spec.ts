import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/dashboard/summary returns a live summary', async () => {
    const res = await request(app.getHttpServer()).get('/api/dashboard/summary').expect(200);
    expect(res.body.mode).toBe('Live Approval');
    expect(res.body.systemHealth).toBe('Healthy');
  });

  it('GET /api/dashboard/state returns all sections', async () => {
    const res = await request(app.getHttpServer()).get('/api/dashboard/state').expect(200);
    expect(res.body).toHaveProperty('summary');
    expect(res.body).toHaveProperty('signals');
    expect(res.body).toHaveProperty('positions');
    expect(Array.isArray(res.body.signals)).toBe(true);
  });

  it('POST approve marks the signal approved', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/dashboard/signals/sig-nvda-breakout/approve')
      .expect(201);
    const signal = res.body.signals.find((s: { id: string }) => s.id === 'sig-nvda-breakout');
    expect(signal.status).toBe('approved');
  });

  it('POST approve on unknown signal returns 404', async () => {
    await request(app.getHttpServer())
      .post('/api/dashboard/signals/nope/approve')
      .expect(404);
  });

  it('POST reject marks the signal rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/dashboard/signals/sig-nvda-breakout/reject')
      .expect(201);
    const signal = res.body.signals.find((s: { id: string }) => s.id === 'sig-nvda-breakout');
    expect(signal.status).toBe('rejected');
  });

  it('POST halt then approve is blocked with 409', async () => {
    await request(app.getHttpServer()).post('/api/dashboard/halt').expect(201);
    await request(app.getHttpServer())
      .post('/api/dashboard/signals/sig-nvda-breakout/approve')
      .expect(409);
  });

  it('GET /api/alpaca/status reports configured=false without env keys', async () => {
    const res = await request(app.getHttpServer()).get('/api/alpaca/status').expect(200);
    expect(res.body.configured).toBe(false);
    expect(res.body.tradingEnabled).toBe(false);
  });

  it('GET /api/alpaca/account returns 503 when Alpaca is not configured', async () => {
    await request(app.getHttpServer()).get('/api/alpaca/account').expect(503);
  });

  it('GET /api/dashboard/live-signals returns engine-derived signals', async () => {
    const res = await request(app.getHttpServer()).get('/api/dashboard/live-signals').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ id: 'live-nvda', symbol: 'NVDA', side: 'Long' });
  });

  it('POST close-all flattens positions and cancels pending signals', async () => {
    const res = await request(app.getHttpServer()).post('/api/dashboard/close-all').expect(201);
    expect(res.body.positions).toHaveLength(0);
    expect(res.body.signals.find((s: { id: string }) => s.id === 'sig-nvda-breakout').status).toBe(
      'rejected',
    );
  });

  it('POST resume re-enables approvals', async () => {
    await request(app.getHttpServer()).post('/api/dashboard/halt').expect(201);
    const resumed = await request(app.getHttpServer())
      .post('/api/dashboard/resume')
      .expect(201);
    expect(resumed.body.summary.systemHealth).toBe('Healthy');
    await request(app.getHttpServer())
      .post('/api/dashboard/signals/sig-nvda-breakout/approve')
      .expect(201);
  });
});
