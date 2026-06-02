# How to Run — PoC Trading Application

NestJS control-center dashboard + a pure-TypeScript trading engine (strategy / risk /
execution) with a backtest harness. คู่มือนี้ครอบคลุมการรันแอป, การเทส, และการ backtest

## ข้อกำหนดเบื้องต้น
- Node.js 20+ (โปรเจกต์ใช้ `@types/node` 24, target ES2023)
- npm

## ติดตั้ง
```bash
npm install
```

---

## 1) รันแอป (dashboard)

```bash
npm run start:dev      # โหมด watch (พัฒนา)
npm run start          # รันปกติ
npm run build && npm run start:prod   # build แล้วรันจาก dist/
```

- เปิดเบราว์เซอร์: `http://localhost:3000/` (หน้า dashboard จาก `public/`)
- ตั้งพอร์ตเองได้: `PORT=4000 npm run start`
- API อยู่ใต้ prefix `/api`

### REST endpoints
| Method | Path | หน้าที่ |
|---|---|---|
| GET  | `/api/dashboard/summary` | สรุปสถานะระบบ (mode, health, risk) |
| GET  | `/api/dashboard/state` | state เต็มของ dashboard |
| GET  | `/api/dashboard/live-signals` | signal จาก engine จริง (strategy + risk) |
| POST | `/api/dashboard/signals/:id/approve` | อนุมัติ signal (ถูกบล็อกถ้า halt → 409) |
| POST | `/api/dashboard/signals/:id/reject` | ปฏิเสธ signal |
| POST | `/api/dashboard/halt` | Kill switch — หยุดรับคำสั่ง |
| POST | `/api/dashboard/resume` | เปิดระบบกลับ |
| POST | `/api/dashboard/close-all` | ยกเลิก pending signal ทั้งหมด + flatten positions |
| GET  | `/api/alpaca/status` | สถานะการตั้งค่า Alpaca (`configured`, `paper`, `tradingEnabled`) |
| GET  | `/api/alpaca/account` | account snapshot จาก Alpaca (503 ถ้ายังไม่ตั้งค่าคีย์) |
| GET  | `/api/alpaca/positions` | positions จริงจาก Alpaca |

ตัวอย่าง:
```bash
curl http://localhost:3000/api/dashboard/live-signals
curl -X POST http://localhost:3000/api/dashboard/halt
```

---

## 2) เทส

```bash
npm test          # unit tests (jest, ไฟล์ *.spec.ts ใน src/)
npm run test:watch
npm run test:cov  # unit tests + รายงาน coverage (โฟลเดอร์ coverage/)
npm run test:e2e  # e2e tests (supertest, test/*.e2e-spec.ts)
npm run typecheck # ตรวจชนิดด้วย tsc --noEmit (ไม่ build)
```

- Unit tests วางคู่กับโค้ดใน `src/**/*.spec.ts`
- e2e tests อยู่ใน `test/` ใช้ config `test/jest-e2e.json`

---

## 3) เชื่อม Alpaca (paper / live)

**ขั้นต่ำสุด — แค่ดูสถานะ:** ไม่ต้องทำอะไร ระบบจะตอบ `/api/alpaca/status` ว่า `configured:false` และ
`/api/alpaca/account` คืน 503 พร้อมข้อความอธิบาย

**ต่อ Alpaca paper จริง:**
1. สมัครบัญชี + สร้าง API key/secret ที่ [alpaca.markets](https://alpaca.markets) (เริ่มที่ paper account — ฟรี ไม่ต้องฝาก)
2. ตั้ง env (แนะนำใช้ไฟล์ `.env` ที่ **ไม่ commit**):
   ```
   ALPACA_API_KEY_ID=...
   ALPACA_API_SECRET_KEY=...
   # ALPACA_LIVE=true              # ใส่เพื่อใช้ live api.alpaca.markets (default = paper)
   # ALPACA_TRADING_ENABLED=true   # gate แยกอีกชั้นสำหรับการ submit order
   ```
3. รันแอป → เช็คว่าเชื่อมต่อสำเร็จ:
   ```bash
   curl http://localhost:3000/api/alpaca/status
   curl http://localhost:3000/api/alpaca/account
   ```

**ความปลอดภัย by default:**
- ไม่มี env → `configured:false`, ทุก endpoint Alpaca อื่นคืน 503 (ไม่ crash)
- มี env แต่ไม่ตั้ง `ALPACA_LIVE=true` → ชี้ไปที่ **paper-api.alpaca.markets** เสมอ
- ไม่มี `ALPACA_TRADING_ENABLED=true` → `submitBracketOrder()` โยน `TradingDisabledError` (อ่านบัญชี/positions ได้, ส่ง order ไม่ได้)
- **ห้าม commit คีย์ลง repo** — เพิ่ม `.env` ใน `.gitignore`

> หมายเหตุ: ยังไม่มี HTTP endpoint ที่ submit order ออกไปจริง (กันยิงพลาด) — จะเปิดเมื่อ Phase L4 ผูก approve flow → broker เสร็จ ดู [GO_LIVE_PLAN.md](GO_LIVE_PLAN.md)

## 4) Backtest

รันบนชุดข้อมูลตัวอย่างที่ให้มา:
```bash
npm run backtest
```

รันบนไฟล์ CSV ของคุณเอง:
```bash
npx ts-node src/engine/backtest/run.ts <csv-path> [symbol] [startingCash] [sector]
# ตัวอย่าง
npx ts-node src/engine/backtest/run.ts ./data/AAPL.csv AAPL 100000 Tech
```

รูปแบบ CSV (มี header หรือไม่ก็ได้):
```
timestamp,open,high,low,close,volume
2026-05-29T13:30:00.000Z,100,101,99,100,1000
```

ผลลัพธ์ที่พิมพ์ออกมา: metrics (total return, win rate, max drawdown, Sharpe,
profit factor, จำนวนเทรด) + รายการเทรดที่ปิดแล้ว

> หมายเหตุ: ในเอาต์พุต JSON ค่า `profitFactor` จะเป็น `null` เมื่อไม่มีเทรดขาดทุน
> (Infinity ไม่ใช่ JSON ที่ถูกต้อง) — ค่าในโค้ดคือ `Infinity` ตามจริง

---

## โครงสร้างโปรเจกต์

```
src/
  main.ts                     bootstrap (global prefix /api, ValidationPipe, static public/)
  app.module.ts
  dashboard/                  ชั้น NestJS (HTTP)
    dashboard.controller.ts   REST endpoints
    dashboard.service.ts      state ของ control center (mock + logic halt/approve)
    clock.service.ts          เวลาที่ inject ได้ (ทำให้เทส deterministic)
    engine-signal.service.ts  รัน engine จริงเพื่อสร้าง live signal
    market-data.provider.ts   ป้อน bar (PoC = replay ในหน่วยความจำ)
  engine/                     โดเมนบริสุทธิ์ (ไม่ผูก NestJS, backtest ได้ตรง)
    market/                   Bar type + indicators (VWAP, avg volume, swing low)
    strategy/                 Strategy interface + VwapReclaimStrategy
    risk/                     RiskEngine (sizing, exposure cap, daily loss, cooldown)
    execution/                ExecutionSimulator (fill/slippage) + order types
    portfolio/                Portfolio (cash/equity/PnL, long-only)
    backtest/                 data-loader, backtester, metrics, run.ts (CLI), fixtures/
    integration/              adapter: StrategySignal -> dashboard signal
    ports/                    interfaces กลาง: MarketDataPort, BrokerPort
  integrations/
    alpaca/                   AlpacaModule + adapter (paper-safe, opt-in via env)
public/                       frontend (vanilla JS) — escape HTML แล้ว (กัน XSS)
test/                         e2e (supertest)
TESTING_PROGRESS.md           สถานะแต่ละ phase ของแผนเทส/แบ็คเทส
AUDIT.md                      ตรวจทุกฟังก์ชัน/เมนู/โมดูล (ใช้ได้จริง / decorative)
GO_LIVE_PLAN.md               แผน Go-Live (Phase L1–L7) + broker research
```

### สถาปัตยกรรมโดยย่อ
โค้ดโดเมนใน `src/engine/` เป็น TypeScript บริสุทธิ์ ไม่มี decorator/DI — โค้ดชุดเดียวกัน
จึงใช้ได้ทั้งตอน live (ผ่าน `EngineSignalService` ใน dashboard) และตอน backtest
(`Backtester` ป้อน bar ย้อนหลัง) ทำให้ทดสอบและตรวจสอบผลได้ง่าย

flow ของ backtest ต่อหนึ่ง bar: `strategy.evaluate → riskEngine.sizePosition →
executionSimulator (fill/exit) → portfolio (PnL/equity) → metrics`
