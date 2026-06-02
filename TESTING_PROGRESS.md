# Testing & Backtest Roadmap — Progress

ติดตามความคืบหน้าการทำ unit test + backtest สำหรับ PoC Trading Application
อัปเดตล่าสุด: 2026-05-29

## สถาปัตยกรรมเป้าหมาย
แยก **domain บริสุทธิ์ (pure TS)** — strategy / risk / execution — ออกจาก NestJS
เพื่อให้โค้ดชุดเดียวกันใช้ได้ทั้ง live (dashboard) และ backtest (bar ย้อนหลัง) และเทสต์ง่าย

---

## แผน A — Fixes ที่จำเป็น

| # | ปัญหา | สถานะ |
|---|---|---|
| F1 | ไม่มี jest / test infra | ✅ Done — jest+ts-jest+supertest, scripts, jest.config.js |
| F2 | `approveSignal()` อนุมัติได้แม้ระบบ halt | ✅ Done — โยน ConflictException เมื่อ halt |
| F3 | ใช้ `new Date()`/`Intl` ตรง ๆ → เทสต์ไม่ deterministic | ✅ Done — แยกเป็น ClockService (inject ได้) |
| F4 | ไม่มี input validation / DTO | ✅ Done — global ValidationPipe ใน main.ts |
| F5 | ไม่มีทางเปิดระบบกลับหลัง halt | ✅ Done — resumeTrading() + POST /api/dashboard/resume |
| F6 | Frontend `innerHTML` ไม่ escape (XSS) | ✅ Done — เพิ่ม escapeHtml() ครอบทุก render |

---

## Phase Progress

| Phase | งาน | สถานะ |
|---|---|---|
| 0 | รากฐานเทสต์ + แก้ F1–F5 | ✅ Done — typecheck สะอาด, 6/6 tests เขียว |
| 1 | Unit/e2e test dashboard ปัจจุบัน | ✅ Done — 16 unit + 7 e2e เขียว, service coverage 100% |
| 2 | Domain model: strategy + risk (pure) | ✅ Done — engine/market+risk 100%, strategy 91%, 38 tests เขียว |
| 3 | Execution simulator + portfolio | ✅ Done — execution 100%, portfolio 100% |
| 4 | Backtest harness + metrics | ✅ Done — loader/metrics/backtester + CLI `npm run backtest` |
| 5 | เชื่อม engine เข้า dashboard + F6 | ✅ Done — adapter + /live-signals endpoint + escapeHtml |
| 6 | Backtest validation (golden/invariant) | ✅ Done — golden snapshot + 4 invariant tests |

---

## Changelog
- 2026-05-29: สร้างแผน + เริ่ม Phase 0
- 2026-05-29: Phase 0 เสร็จ — ติดตั้ง jest, สร้าง ClockService, แก้ halt-guard (F2), เพิ่ม resume (F5) + ValidationPipe (F4); smoke test 6 เคสเขียว, typecheck สะอาด
- 2026-05-29: Phase 1 เสร็จ — unit test DashboardService 16 เคส (coverage 100%), e2e 7 เคสครบ 6 endpoint + 404/409 (ติดตั้ง class-validator/class-transformer ให้ ValidationPipe; แก้ import supertest)
- 2026-05-29: Phase 2 เสร็จ — สร้าง engine แบบ pure TS: market/indicators (VWAP, avg volume, swing low), VwapReclaimStrategy (VWAP reclaim + volume anomaly), RiskEngine (sizing + ticker/sector cap + daily loss + cooldown); รวม 38 unit tests เขียว
- 2026-05-29: Phase 3 เสร็จ — ExecutionSimulator (fill/slippage/spread, bracket stop+target, force close) + Portfolio (cash/equity/PnL long-only); coverage execution+portfolio 100%, รวม 58 tests
- 2026-05-29: Phase 4 เสร็จ — parseCsv loader, Backtester (event loop strategy→risk→execution→portfolio), metrics (return/winrate/maxDD/Sharpe/profit factor) + CLI `npm run backtest` + sample fixture; รวม 77 tests
- 2026-05-29: Phase 5 เสร็จ — adapter StrategySignal→dashboard, MarketDataProvider + EngineSignalService, endpoint GET /api/dashboard/live-signals, escapeHtml กัน XSS ทั้งหน้า (F6); รวม 82 unit + 8 e2e
- 2026-05-29: Phase 6 เสร็จ — golden-file metrics snapshot + invariant tests (equity reconcile, exposure cap, drawdown/winrate sane); รวม 87 unit + 8 e2e เขียว, typecheck สะอาด, build ผ่าน, สโม้คเทส endpoint จริงผ่าน
- 2026-05-29: เพิ่ม HOW_TO_RUN.md (รันแอป/เทส/แบ็คเทส + โครงสร้างโปรเจกต์)
- 2026-05-29: ปรับ design เป็นธีมมืด trading terminal + แก้บั๊ก layout (dashboard-grid เบียดกัน → จัดเป็น 2 คอลัมน์จริงด้วย .grid-col ไม่มีช่องว่างอีก); ยืนยันด้วย screenshot จริงในเบราว์เซอร์
- 2026-05-29: เพิ่ม GO_LIVE_PLAN.md — แผนต่อ data จริง/เทรดจริง (Phase L1–L7) + research โบรกเกอร์ (Alpaca / IBKR / Settrade ไทย) พร้อมวิธีผูก/ติดตั้ง
- 2026-06-02: Phase L1/L2 — ติดตั้ง `@alpacahq/alpaca-trade-api` + `@nestjs/config`; สร้าง `MarketDataPort`/`BrokerPort`; เขียน `AlpacaBrokerAdapter`/`AlpacaMarketDataAdapter` + `loadAlpacaConfig` (paper-safe by default); `AlpacaModule` lazy-load SDK; `AlpacaController` (status/account/positions, 503 ถ้าไม่มีคีย์) — 16 unit + 2 e2e เพิ่ม
- 2026-06-02: Audit ระบบครบ — เพิ่ม `closeAll()` + endpoint, ทำ Kill Switch ↔ Resume toggle, ปุ่ม OFF/Live Approval/Refresh/Close All ทำงานจริง, ปุ่ม decorative ติด `data-decorative`, เพิ่ม notice toast; ยืนยันด้วย browser flow (halt → resume → close-all) — รวม 104 unit + 11 e2e เขียว, typecheck สะอาด, build ผ่าน
- 2026-06-02: เพิ่ม AUDIT.md + อัปเดต HOW_TO_RUN.md (Alpaca section + new endpoints + structure)
