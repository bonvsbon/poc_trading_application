# แผนเชื่อมข้อมูลจริง + เริ่มเทรดจริง (Go-Live Plan) & Broker Research

> ⚠️ **คำเตือน:** เอกสารนี้เป็นข้อมูลเชิงเทคนิค/สถาปัตยกรรม **ไม่ใช่คำแนะนำการลงทุน**
> การเทรดด้วยเงินจริงมีความเสี่ยงสูง — ต้อง paper trade ให้ผ่านก่อนเสมอ
> **คุณต้องสมัครบัญชี/สร้าง API key ด้วยตัวเอง** ระบบ/ผู้ช่วยจะไม่กรอกข้อมูลบัญชีหรือคีย์ให้
> **ห้าม commit API key/secret ลง repo** — ใช้ environment variable / secret manager เท่านั้น

ปัจจุบันระบบเป็น PoC: ข้อมูลเป็น mock + engine (strategy/risk/execution) เป็น pure TS ที่ backtest ได้
สถาปัตยกรรมถูกออกแบบให้ "ใช้ engine ชุดเดียว" ทั้ง backtest และ live แล้ว เหลือการต่อ **data จริง** + **broker จริง** ผ่าน adapter

---

## ส่วนที่ 1 — แผน Go-Live (แบ่งเป็น Phase L)

> สถานะ: **L1/L2 ทำแล้ว + L4 บางส่วน** — Alpaca adapter + ports + AlpacaModule (paper-safe by default),
> ดึงราคา/บาร์จริง (หุ้น + crypto), ค้นหา asset, และ **ส่งคำสั่ง paper จริงสำหรับ BTC/USD** ผ่าน
> `POST /api/dashboard/orders` (ประเมิน → อนุมัติ+ใส่ตัวเลข → ส่ง → monitor) โดยมี gate: halt + `ALPACA_TRADING_ENABLED`
> เหลือ L3, L4 (auth + persistence ของ order/audit), L5–L7 ก่อนจะใช้เงินจริงได้
>
> ⚠️ v1 ของการเทรด: crypto ไม่มี bracket → ยังไม่มี stop-loss อัตโนมัติฝั่ง server (ต้องปิดไม้เอง จนกว่าจะทำ L5 runtime loop)

### Phase L1 — Data layer (ข้อมูลจริง)
- นิยาม port กลาง `MarketDataPort` (ต่อยอดจาก `MarketDataProvider` ปัจจุบัน)
  - `historicalBars(symbol, timeframe, from, to)` → ใช้ป้อน backtest
  - `streamBars(symbols)` / `streamQuotes` → real-time ผ่าน WebSocket สำหรับ live
- เขียน adapter ตามโบรกเกอร์ที่เลือก (เช่น `AlpacaMarketData`, `SettradeMarketData`)
- อ่าน API key จาก env (`.env` + `@nestjs/config`) — ห้าม hardcode

### Phase L2 — Broker / Execution port
- นิยาม `BrokerPort`: `submitBracketOrder`, `cancelOrder`, `getPositions`, `getAccount`, `streamFills`
- โหมด **backtest/paper** → ใช้ `ExecutionSimulator` (มีแล้ว)
- โหมด **live** → ใช้ broker adapter จริง
- ต้องมี: client order ID (idempotency), การ reconcile สถานะ order/position ตอน start, retry/timeout

### Phase L3 — Persistence (เก็บสถานะถาวร)
- ตอนนี้ state อยู่ในหน่วยความจำ → หายเมื่อ restart
- เพิ่ม DB (PostgreSQL หรือ SQLite สำหรับเริ่มต้น) เก็บ: positions, orders, journal, equity curve, audit log
- จำเป็นมากสำหรับ live เพราะต้องกู้สถานะหลัง crash/redeploy

### Phase L4 — Safety enforcement ฝั่ง server (สำคัญที่สุด)
- ปัจจุบัน Kill Switch + risk limit ทำงานระดับ logic/UI — live ต้องบังคับที่ **execution layer**
  - Kill Switch ต้องบล็อกการส่ง order จริงทุกเส้นทาง (มี halt-guard แล้วใน `approveSignal`)
  - Daily loss limit / max exposure / cooldown → ตรวจ server-side ก่อนส่งทุกคำสั่ง (มี `RiskEngine` แล้ว)
- เพิ่ม **auth** บน API (ตอนนี้เปิดโล่ง) — เช่น API key/JWT, จำกัด IP
- เก็บ audit log ของทุกการ approve/reject/halt พร้อม timestamp + ผู้ทำ

### Phase L5 — Runtime / Scheduler
- Loop จริง: `data stream → strategy → risk → (human approval ถ้าเปิด) → broker → reconcile`
- รู้เวลาเปิด-ปิดตลาด (market calendar), reconnect WebSocket, จัดการ error/หลุดเน็ต
- กันส่งซ้ำเมื่อ reconnect

### Phase L6 — Observability & Ops
- Logging แบบ structured, metrics (latency, fill rate, slippage จริง vs จำลอง)
- Alert (Slack/email/Line Notify) เมื่อ: order reject ผิดปกติ, position ไม่ตรง, daily loss ใกล้ limit, ระบบหลุด
- Health check + auto-restart

### Phase L7 — Gating ก่อนใช้เงินจริง
1. **Paper trade** ต่อเนื่องอย่างน้อย 2–4 สัปดาห์ บนข้อมูล real-time
2. เทียบผล paper จริง vs backtest (expectancy, win rate, slippage) — ต้องใกล้เคียง
3. เริ่มเงินจริง **ก้อนเล็กมาก** แล้วค่อย ๆ เพิ่ม (capital ramp)
4. ตั้ง circuit breaker: หยุดอัตโนมัติเมื่อขาดทุนเกิน budget/วัน หรือพฤติกรรมผิดจาก backtest

> ลำดับแนะนำ: L1 → L2 → L3 → L4 → L5 → L6 → (paper) → L7

---

## ส่วนที่ 2 — Broker Research (โบรกเกอร์ที่ official + นิยม)

### สรุปเปรียบเทียบ

| Broker | ตลาด | จุดเด่น | เหมาะกับโปรเจกต์นี้ (Node/TS) |
|---|---|---|---|
| **Alpaca** | หุ้น/ETF/คริปโต/options สหรัฐฯ | commission-free, REST+WebSocket, **paper ฟรีไม่จำกัด**, $0 ขั้นต่ำ, docs ดีมาก | ⭐ ดีที่สุดสำหรับเริ่ม — มี Node SDK ตรง ๆ (แอปนี้ขึ้น "Alpaca sandbox" อยู่แล้ว) |
| **Interactive Brokers (IBKR)** | 150 ตลาด 34 ประเทศ | ครบที่สุด, 150+ order types, latency <50ms | ทรงพลังแต่ซับซ้อน — ต้องรัน TWS/IB Gateway, auth ยุ่งกว่า |
| **Settrade Open API** | **หุ้นไทย (SET) + TFEX** | official ของตลาดไทย ผ่านโบรกไทย (Pi, Phillip/POEMS, Yuanta, RHB ฯลฯ), มี sandbox | ⭐ ตัวเลือกหลักถ้าจะเทรด **หุ้นไทย** — SDK ทางการเป็น Python (ต้องมี Python sidecar) |
| Crypto (Binance / Bitkub) | คริปโต (Bitkub = เจ้าไทย) | REST/WebSocket API, เปิดตลอด 24 ชม. | ทางเลือกถ้าสนใจคริปโต |

### วิธีผูก & ติดตั้ง (เฉพาะที่แนะนำ)

#### A) Alpaca (แนะนำให้เริ่มที่นี่ — เข้ากับ Node/TS ทันที)
1. สมัครบัญชีที่ alpaca.markets (เริ่มที่ **paper account** ฟรี ไม่ต้องฝากเงิน) — *คุณทำเอง*
2. สร้าง API Key ID + Secret ในหน้า dashboard — *คุณทำเอง*, เก็บใน env
3. ติดตั้ง SDK:
   ```bash
   npm install @alpacahq/alpaca-trade-api
   ```
4. ตั้ง env (paper ก่อน):
   ```
   APCA_API_KEY_ID=...        # ใส่เอง อย่า commit
   APCA_API_SECRET_KEY=...
   APCA_API_BASE_URL=https://paper-api.alpaca.markets   # live = https://api.alpaca.markets
   ```
5. เขียน `AlpacaBrokerAdapter` ให้ implement `BrokerPort` + `AlpacaMarketData` ให้ implement `MarketDataPort`
6. Rate limit: free 200 req/นาที, บัญชีที่ฝากเงิน 1,000 req/นาที, WebSocket ไม่จำกัด

#### B) Settrade Open API (สำหรับหุ้นไทย / TFEX)
1. ต้องมีบัญชีหุ้นกับ **โบรกไทยที่รองรับ** (Pi Securities, Phillip/POEMS, Yuanta, RHB ฯลฯ) แล้วขอเปิดสิทธิ์ Open API — *คุณทำเอง (มี KYC)*
2. รับ app credentials + ใช้ **sandbox** ก่อน
3. SDK ทางการเป็น **Python** (`settrade_v2`) → สถาปัตยกรรมที่เหมาะคือรัน **Python service แยก** แล้วให้ NestJS คุยผ่าน REST/queue ภายใน (Node เรียก Python sidecar)
4. เอกสาร: developer.settrade.com/open-api

#### C) Interactive Brokers (ถ้าต้องการตลาดทั่วโลก)
- ใช้ **Client Portal Web API** (REST, ต้องรัน gateway) หรือ TWS API
- มี community lib ฝั่ง Node แต่ official รองรับ Python/Java ดีกว่า — ซับซ้อนกว่า Alpaca พอควร

### คำแนะนำเชิงสถาปัตยกรรม
- ทำ `BrokerPort` / `MarketDataPort` เป็น interface กลาง → สลับโบรกได้โดยไม่แตะ engine
- เริ่มที่ **Alpaca paper** (ง่ายสุด, ฟรี, เข้ากับ Node) เพื่อพิสูจน์ pipeline live ให้ครบ
- ถ้าเป้าหมายคือ **หุ้นไทย** → วางแผน Settrade ผ่าน Python sidecar ตั้งแต่แรก

---

## Sources
- Alpaca — Best Broker for Algorithmic Trading 2026 (BrokerChooser): https://alpaca.markets/blog/alpaca-recognized-as-best-broker-for-algorithmic-trading-in-2026-by-brokerchooser/
- Best Broker APIs for Algorithmic Trading 2026: https://www.tradealgo.com/trading-guides/tools/best-broker-apis-for-algorithmic-trading-in-2026
- Best Brokers with API Access 2026: https://investingintheweb.com/brokers/best-api-brokers/
- Settrade Open API (official): https://developer.settrade.com/open-api/
- Trading Thai Stock Market using Settrade Open API: https://theerapatcha.medium.com/trading-thai-stock-market-using-settrade-open-api-58e4b3cebb81
- How to set up Settrade Open API (Pi Securities): https://support.pi.financial/hc/en-us/articles/6333789684121-How-to-set-up-Settrade-Open-API
