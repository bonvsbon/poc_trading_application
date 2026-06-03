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

**ต่อ Alpaca paper จริง (วิธีขอ key):**
1. สมัครบัญชีฟรีที่ [alpaca.markets](https://alpaca.markets) → ยืนยันอีเมล (paper account ไม่ต้องฝากเงิน)
2. ล็อกอินเข้า [app.alpaca.markets](https://app.alpaca.markets) → มุมขวาบนสลับเป็น **"Paper Trading"**
3. ที่หน้า Home แผง **"API Keys"** กด **"Generate New Keys"** → จะได้ `Key ID` กับ `Secret Key`
   (Secret แสดงครั้งเดียว — คัดลอกเก็บทันที)
4. สร้างไฟล์ `.env` จากเทมเพลต แล้วเติมคีย์:
   ```bash
   cp .env.example .env
   # แก้ .env ใส่ ALPACA_API_KEY_ID และ ALPACA_API_SECRET_KEY
   ```
   เนื้อหา `.env`:
   ```
   ALPACA_API_KEY_ID=PK............
   ALPACA_API_SECRET_KEY=................
   # ALPACA_LIVE=true              # ใส่เพื่อใช้ live api.alpaca.markets (default = paper)
   # ALPACA_TRADING_ENABLED=true   # gate แยกอีกชั้นสำหรับการ submit order
   ```
5. รันแอป (`npm run start:dev`) — `.env` จะถูกโหลดอัตโนมัติ (ผ่าน dotenv) → เช็คว่าเชื่อมต่อสำเร็จ:
   ```bash
   curl http://localhost:3000/api/alpaca/status     # → {"configured":true,"paper":true,...}
   curl "http://localhost:3000/api/alpaca/prices?symbols=AAPL,NVDA,TSLA"
   curl http://localhost:3000/api/alpaca/account
   ```

**ดูราคา real-time บน dashboard:**
- เปิด `http://localhost:3000/` → แผง **"ราคาเรียลไทม์ (Live Prices)"** ที่คอลัมน์ขวา
  จะ poll ราคาทุก 5 วินาที พร้อมไฮไลต์ขึ้น/ลง (เขียว/แดง)
- ยังไม่ใส่คีย์ → แผงจะขึ้น "ยังไม่ได้เชื่อม" และบอกให้ตั้ง `.env` (ไม่ crash)
- เปลี่ยน watchlist ได้ที่ตัวแปร `WATCHLIST_SYMBOLS` ใน `public/app.js`

> หมายเหตุเรื่องข้อมูล: บัญชีฟรีใช้ฟีด **IEX** — ราคาล่าสุดมาจาก trade ของ IEX (เพียงพอสำหรับ PoC)
> นอกเวลาตลาด (US market ปิด) ราคาจะนิ่งที่ trade ล่าสุด ถือว่าปกติ

### เทรด paper จริง (BTC) — ประเมิน → อนุมัติ+ใส่ตัวเลข → ส่งคำสั่ง → monitor

flow นี้ส่ง **คำสั่งจริงไปบัญชี paper** ของ Alpaca (เริ่มที่ **BTC/USD**; XAUUSD เทรดบน Alpaca ไม่ได้)

1. เปิด `ALPACA_TRADING_ENABLED=true` ใน `.env` แล้วรีสตาร์ท (ถ้าไม่เปิด = ดู/ค้นหาได้ แต่ส่ง order ไม่ได้)
2. เปิด `http://localhost:3000/` → แผง **"เข้าไม้จริงบน Alpaca Paper"** (คอลัมน์ซ้าย)
   - **ค้นหา asset:** พิมพ์ในช่องค้นหา (เช่น `BTC`) เลือกประเภท (Crypto / หุ้น-ETF) → คลิกเลือกตัวที่สนใจ
   - **ระบบประเมินให้:** การ์ด recommendation บอกว่าควรเข้า Long/Short ไหม + ราคา/stop/target แนะนำ
   - **อนุมัติ + ใส่ตัวเลข:** กรอกขนาด (มูลค่า `$` notional หรือจำนวนหน่วย), เลือก market/limit → กด **"อนุมัติ & ส่งคำสั่ง Paper"**
3. ดูผลที่แผง **"บัญชี Alpaca จริง (Paper Account)"** — equity, positions, คำสั่งล่าสุด (refresh ทุก 15 วิ)

endpoint ที่เกี่ยวข้อง:
```text
GET  /api/alpaca/assets?search=btc&class=crypto   # ค้นหา asset ที่เทรดได้
GET  /api/dashboard/live-signals?symbol=BTC/USD   # recommendation จาก engine
POST /api/dashboard/orders                         # ส่งคำสั่ง paper (DTO: symbol, side, type, notional|qty, limitPrice?)
GET  /api/alpaca/orders                            # คำสั่งล่าสุด (monitor)
GET  /api/alpaca/positions                         # position จริง
```
ตัวอย่างส่งคำสั่งซื้อ BTC มูลค่า $10:
```bash
curl -X POST http://localhost:3000/api/dashboard/orders \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTC/USD","side":"long","type":"market","notional":10}'
```

> ⚠️ ข้อจำกัด v1: crypto บน Alpaca **ไม่มี bracket order** — stop/target เป็นแค่ตัวเลขแนะนำ ระบบ**ยังไม่**ตั้ง stop-loss อัตโนมัติให้ ต้องปิดไม้เอง (จะทำ monitoring loop ใน Phase L5)

**ความปลอดภัย by default:**
- ไม่มี env → `configured:false`, ทุก endpoint Alpaca อื่นคืน 503 (ไม่ crash)
- มี env แต่ไม่ตั้ง `ALPACA_LIVE=true` → ชี้ไปที่ **paper-api.alpaca.markets** เสมอ
- ไม่มี `ALPACA_TRADING_ENABLED=true` → ส่ง order ไม่ได้ (อ่านบัญชี/positions/ราคา/ค้นหา asset ได้): `POST /api/dashboard/orders` คืน 403
- Kill Switch (halt) → `POST /api/dashboard/orders` ถูกบล็อก (409) ทุกเส้นทาง
- ทุกคำสั่งต้อง **ผู้ใช้อนุมัติด้วยมือ + กรอกตัวเลขเอง** เท่านั้น
- **ห้าม commit คีย์ลง repo** — `.env` อยู่ใน `.gitignore` แล้ว

> สถานะ: ส่วน **Phase L4** (ผูก approve flow → broker) ทำบางส่วนแล้วสำหรับ paper crypto ดูแผนเต็มที่ [GO_LIVE_PLAN.md](GO_LIVE_PLAN.md)

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
