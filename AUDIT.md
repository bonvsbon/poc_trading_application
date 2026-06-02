# ระบบ Audit — ตรวจสอบทุกฟังก์ชัน/เมนู/โมดูล (อัปเดต 2026-06-02)

ตรวจทุกองค์ประกอบในแอปว่า **ใช้งานได้จริง / decorative สำหรับ PoC / broken** พร้อมหลักฐานเทส
✅ = ใช้งานได้จริง (มีโค้ด + เทสครอบ) · 🎨 = decorative สำหรับ PoC (ไม่มีโค้ดด้านหลัง) · ❌ = ใช้ไม่ได้ (ต้องแก้)
ปุ่ม decorative ทั้งหมดติด `data-decorative="true"` เพื่อให้รู้แต่แรกว่าเป็น placeholder

## A) Backend endpoints

| Method | Path | สถานะ | หลักฐาน |
|---|---|---|---|
| GET  | `/api/dashboard/summary` | ✅ | unit + e2e |
| GET  | `/api/dashboard/state` | ✅ | unit + e2e |
| GET  | `/api/dashboard/live-signals` | ✅ engine-derived | unit + e2e |
| POST | `/api/dashboard/signals/:id/approve` | ✅ (เช็ค halt → 409) | unit + e2e |
| POST | `/api/dashboard/signals/:id/reject` | ✅ | unit + e2e |
| POST | `/api/dashboard/halt` | ✅ | unit + e2e |
| POST | `/api/dashboard/resume` | ✅ | unit + e2e |
| POST | `/api/dashboard/close-all` | ✅ ใหม่ (cancel pending + flatten positions) | unit + e2e |
| GET  | `/api/alpaca/status` | ✅ ไม่มีคีย์ → `configured:false` | e2e |
| GET  | `/api/alpaca/account` | ✅ ไม่มีคีย์ → 503; มีคีย์ → bridge ไป Alpaca | unit + e2e |
| GET  | `/api/alpaca/positions` | ✅ | unit |

> ⚠️ **ไม่มี endpoint สำหรับ submit order ไป Alpaca** โดยตั้งใจ — order submission ต้องผ่าน flow approve + risk + safety gate (งาน Phase L4) จึงจะ public ออกมาได้

## B) UI elements

### Sidebar nav
| Element | สถานะ | หมายเหตุ |
|---|---|---|
| ภาพรวม / สัญญาณ / ความเสี่ยง / คำสั่ง / บันทึก | ✅ | anchor `#section-id` scroll-to-section |
| Paper Linked badge | 🎨 | ป้ายโชว์เฉย ๆ ยังไม่ผูก state จาก `/api/alpaca/status` (ปรับได้ใน Phase L4) |

### Top bar
| Element | สถานะ | หมายเหตุ |
|---|---|---|
| Market clock (ET / BKK) | ✅ | update ทุก 1 วินาที |
| Refresh button | ✅ **แก้แล้ว** | เรียก `loadDashboardState()` + toast "รีเฟรชแล้ว" |
| Bell (alerts) | 🎨 | ไม่มี notification system จริง — ติด `data-decorative` |

### Control strip
| Element | สถานะ | หมายเหตุ |
|---|---|---|
| Mode "OFF" | ✅ **แก้แล้ว** | เรียก `/halt` |
| Mode "Live Approval" | ✅ **แก้แล้ว** | เรียก `/resume` (ถ้า halted อยู่) |
| Mode "Observe" / "Paper" / "Guarded Auto" | 🎨 | แสดง toast "โหมดยังไม่รองรับใน PoC" |
| Kill Switch | ✅ **ปรับปรุง** | toggle ระหว่าง Kill Switch ↔ Resume Trading ตาม `body.is-halted` |
| Close All | ✅ **แก้แล้ว** | เรียก `/close-all` (cancel pending + flatten positions) |

### Decision board / Metrics
| Element | สถานะ |
|---|---|
| Decision hero (safetyState / decisionTitle / nextAction / checks) | ✅ อัปเดตจาก `/state` ทุก 15 วินาที + เปลี่ยนสีเมื่อ halt |
| Quick cards (Next action / Risk remaining / System health) | ✅ |
| Metrics grid 5 card | ✅ |

### Signal panel
| Element | สถานะ |
|---|---|
| Signal list (NVDA, MSFT) | ✅ |
| Approve button | ✅ เรียก `/approve` |
| Reject button | ✅ เรียก `/reject` |
| Eye (view detail) | 🎨 ยังไม่มีหน้า detail |
| Filter button | 🎨 ยังไม่มี filter logic |

### Risk panel
| Element | สถานะ |
|---|---|
| Daily loss meter | ✅ จาก `/state` |
| Toggle rows × 4 | 🎨 **read-only** — JS render set `disabled` ตั้งใจ ยังไม่มี persistence ฝั่ง server |
| Limit inputs × 4 | 🎨 read-only เช่นกัน |

### Positions panel
| Element | สถานะ |
|---|---|
| Position table | ✅ จาก `/state` |
| Export button | 🎨 ยังไม่มี export logic |
| Exit (row button) | 🎨 ยังไม่มี close-position endpoint รายตัว (close-all ทำได้) |

### Execution / News / Journal
| Element | สถานะ |
|---|---|
| Order timeline | ✅ จาก `/state` |
| News list | ✅ จาก `/state` |
| Journal list | ✅ จาก `/state` (เห็น kill switch / close-all log ทันที) |
| Search (news) / Note (journal) buttons | 🎨 ยังไม่มี backend |

## C) Backend modules (services / providers)

| Module / Service | สถานะ | Coverage |
|---|---|---|
| `DashboardService` (state, summary, approve, reject, halt, resume, **closeAll**) | ✅ | **100%** |
| `ClockService` (inject ได้, เทส deterministic) | ✅ | ใช้ใน FixedClock ของเทส |
| `MarketDataProvider` (PoC replay sample bars) | ✅ | tested via EngineSignalService |
| `EngineSignalService` (strategy + risk → live-signal) | ✅ | unit |
| `DashboardController` (8 routes) | ✅ | e2e 11 เคส |

## D) Engine modules (pure TS — backtest-ready)

| Module | สถานะ | Coverage |
|---|---|---|
| `market/bar` + `indicators` (VWAP, avg volume, swing low) | ✅ | **100%** |
| `strategy/vwap-reclaim.strategy` | ✅ | 91% (เหลือ null-guard เชิงป้องกัน) |
| `risk/risk-engine` (sizing + ticker/sector cap + daily loss + cooldown) | ✅ | **100%** |
| `execution/execution-simulator` (fill/slippage/bracket exit) | ✅ | **100%** |
| `portfolio/portfolio` (long-only, cash/equity/PnL) | ✅ | **100%** |
| `backtest/data-loader` (parseCsv) | ✅ | **100%** |
| `backtest/backtester` (event loop) | ✅ | **100%** |
| `backtest/metrics` (return/winrate/maxDD/Sharpe/profit factor) | ✅ | **100%** |
| `backtest/run.ts` (CLI `npm run backtest`) | ✅ | smoke ผ่าน (เห็นผลรัน) |
| `integration/signal-adapter` (StrategySignal→Dashboard) | ✅ | unit |

## E) Alpaca integration (ใหม่)

| Component | สถานะ | หมายเหตุ |
|---|---|---|
| `MarketDataPort` / `BrokerPort` interfaces | ✅ | กลาง — สลับโบรกได้ |
| `loadAlpacaConfig()` (env → AlpacaConfig) | ✅ tested | default **paper + tradingEnabled=false** (ปลอดภัย) |
| `AlpacaBrokerAdapter` (getAccount/getPositions/submitBracket/cancel) | ✅ tested (stub client) | submit โยน `TradingDisabledError` ถ้า `ALPACA_TRADING_ENABLED!=true` |
| `AlpacaMarketDataAdapter` (historicalBars / recentBars) | ✅ tested | wrap `getBarsV2` ของ SDK |
| `AlpacaModule` (lazy require SDK, optional providers) | ✅ | ถ้าไม่มีคีย์ → provider = null → controller ตอบ 503 |
| `AlpacaController` (status/account/positions) | ✅ e2e | **ไม่มีปุ่ม submit-order** โดยตั้งใจ |

## F) สรุปสุขภาพรวม

- `npm run typecheck` ✅ สะอาด
- `npm test` ✅ **104/104 unit เขียว**
- `npm run test:e2e` ✅ **11/11 e2e เขียว**
- `npm run build` ✅ ผ่าน
- `npm run backtest` ✅ ได้ผลตามคาด (1 trade ชนะ บน sample dataset)
- รัน server จริง + curl + browser screenshot: หน้าตา + flow halt/resume/close-all/refresh ✅ ตามคาดทั้งหมด

## G) สิ่งที่ยังไม่ทำ (ถัดไป)
1. **Phase L3** — DB persistence (state ยังหายเมื่อ restart)
2. **Phase L4** — auth ที่ API + ผูก Kill Switch ลงชั้น execution + ต่อ flow approve → Alpaca order
3. **Phase L5** — runtime loop + WebSocket market data จริง
4. รายการ 🎨 ในตาราง (Bell, Filter, Eye, Export, Exit/row, Search, Note, Risk toggles persistence, Paper Linked badge ผูกของจริง)
