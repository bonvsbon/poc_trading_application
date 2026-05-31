# POC Trading Application

ระบบต้นแบบสำหรับ Live Trading Control Center โดยใช้ NestJS เป็น backend และ static frontend ใน `public/`

## สถานะล่าสุด

เสร็จแล้ว **4 phases จากแผนงานปัจจุบัน**

| Phase | สถานะ | รายละเอียด |
| --- | --- | --- |
| Phase 1: UI Prototype | Done | ออกแบบหน้า Live Trading Control Center แบบ responsive |
| Phase 2: NestJS Migration | Done | ย้ายจาก static prototype มาเป็น NestJS app และ serve UI ผ่าน NestJS |
| Phase 3: Backend State API | Done | เพิ่ม `GET /api/dashboard/state` สำหรับ dashboard, metrics, signals, risk, positions, orders, news และ journal |
| Phase 4: Mock Trading Actions | Done | เพิ่ม mock endpoints สำหรับ approve/reject signal และ kill switch |
| Phase 5: Broker Adapter Layer | Next | เตรียม interface สำหรับต่อ paper broker เช่น Alpaca หรือ IBKR โดยไม่ให้ UI ผูกกับ broker โดยตรง |

## สิ่งที่ทำงานได้ตอนนี้

- เปิด dashboard ได้ที่ `http://127.0.0.1:3000/`
- ดึงข้อมูลสถานะผ่าน `GET /api/dashboard/state`
- กด `Approve` เพื่ออัปเดต signal/order/journal แบบ mock
- กด `Reject` เพื่อปฏิเสธ signal แบบ mock
- กด `Kill Switch` เพื่อเปลี่ยนระบบเป็น `OFF / Halted`
- ผ่านการตรวจ `npm run typecheck`
- ผ่านการตรวจ `npm run build`
- ตรวจ responsive เบื้องต้นบน desktop และ mobile แล้ว

## คำสั่งใช้งาน

```bash
npm install
npm run start:dev
```

เปิดเว็บ:

```text
http://127.0.0.1:3000/
```

## API หลัก

```text
GET  /api/dashboard/summary
GET  /api/dashboard/state
POST /api/dashboard/signals/:id/approve
POST /api/dashboard/signals/:id/reject
POST /api/dashboard/halt
```

## หมายเหตุ

ตอนนี้ยังเป็น mock backend สำหรับเตรียม flow การเทรดจริง ยังไม่ได้ต่อ broker หรือส่ง order จริง
