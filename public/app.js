const formatClock = (timeZone, label) => {
  const value = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date());

  return `${label} ${value}`;
};

const updateClocks = () => {
  const clockEt = document.querySelector("#clockEt");
  const clockLocal = document.querySelector("#clockLocal");

  if (!clockEt || !clockLocal) {
    return;
  }

  clockEt.textContent = formatClock("America/New_York", "ET");
  clockLocal.textContent = formatClock("Asia/Bangkok", "BKK");
};

const setText = (selector, value) => {
  const element = document.querySelector(selector);
  if (element && value !== undefined && value !== null) {
    element.textContent = value;
  }
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const createIcon = (name) => `<i data-lucide="${name}"></i>`;

const renderIcons = () => {
  if (window.lucide) {
    lucide.createIcons();
  }
};

const postJson = async (url) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Action failed with ${response.status}`);
  }

  return response.json();
};

const renderChecks = (checks) => {
  const container = document.querySelector("#decisionChecks");
  if (!container || !Array.isArray(checks)) {
    return;
  }

  container.innerHTML = checks
    .map((label) => `<span>${createIcon("check-circle-2")} ${escapeHtml(label)}</span>`)
    .join("");
};

const renderSummary = (summary) => {
  if (!summary) {
    return;
  }

  const riskRemaining = Number(summary.riskRemainingPercent ?? 0);
  const riskRemainingBar = document.querySelector("#riskRemainingBar");

  setText("#safetyState", summary.safetyState);
  setText("#decisionTitle", summary.decisionTitle);
  setText("#decisionSummary", summary.decisionSummary);
  setText("#nextAction", summary.nextAction);
  setText("#riskRemaining", `${riskRemaining}%`);
  setText("#systemHealth", summary.systemHealth);
  setText("#blockedTrades", `${summary.blockedTrades ?? 0} trade blocked today`);
  renderChecks(summary.checks);

  if (riskRemainingBar) {
    riskRemainingBar.style.width = `${Math.max(0, Math.min(100, riskRemaining))}%`;
  }

  document.querySelectorAll(".mode-option").forEach((option) => {
    option.classList.toggle("is-selected", option.textContent.trim() === summary.mode);
  });

  document.body.classList.toggle("is-halted", summary.systemHealth === "Halted");
  refreshKillSwitchUi();
};

const renderMetrics = (metrics) => {
  const grid = document.querySelector(".metrics-grid");
  if (!grid || !Array.isArray(metrics)) {
    return;
  }

  grid.innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric-card">
          <span class="metric-label">${escapeHtml(metric.label)}</span>
          <strong class="${metric.tone === "positive" ? "positive" : metric.tone === "negative" ? "negative" : ""}">${escapeHtml(metric.value)}</strong>
          <span class="metric-note ${metric.tone === "positive" ? "positive" : metric.tone === "negative" ? "negative" : ""}">${escapeHtml(metric.note)}</span>
        </article>
      `,
    )
    .join("");
};

const signalTagClass = (signal) => {
  if (signal.status === "approved") return "approved";
  if (signal.status === "rejected") return "sell";
  if (signal.side === "Long") return "buy";
  if (signal.side === "Short") return "sell";
  return "watch";
};

const renderSignals = (signals) => {
  const container = document.querySelector(".signal-list");
  if (!container || !Array.isArray(signals)) {
    return;
  }

  container.innerHTML = signals
    .map((signal) => {
      const isActionable = signal.status === "pending";
      const statusLabel = signal.status === "approved" ? "Approved" : signal.status === "rejected" ? "Rejected" : signal.side;
      const stats = [
        ["Confidence", `${signal.confidence}%`],
        ["R:R", signal.riskReward],
        signal.stop ? ["ATR Stop", signal.stop] : ["Spread", signal.spread ?? "-"],
        signal.target ? ["Target", signal.target] : ["News", signal.newsState ?? "-"],
      ];

      return `
        <article class="signal-item ${signal.priority ? "is-priority" : ""} ${signal.status !== "pending" ? "is-muted" : ""}">
          <div class="signal-main">
            <div>
              <span class="ticker">${escapeHtml(signal.symbol)}</span>
              <span class="tag ${signalTagClass(signal)}">${escapeHtml(statusLabel)}</span>
            </div>
            <strong>${escapeHtml(signal.price)}</strong>
          </div>
          <div class="signal-data">
            ${stats
              .map(
                ([label, value]) => `
                  <span>${escapeHtml(label)}<strong>${escapeHtml(value)}</strong></span>
                `,
              )
              .join("")}
          </div>
          <p>${escapeHtml(signal.thesis)}</p>
          ${
            isActionable
              ? `
                <div class="approval-actions">
                  <button class="approve-button" type="button" data-action="approve-signal" data-signal-id="${escapeHtml(signal.id)}">
                    ${createIcon("check")}
                    <span>Approve</span>
                  </button>
                  <button class="reject-button" type="button" data-action="reject-signal" data-signal-id="${escapeHtml(signal.id)}">
                    ${createIcon("x")}
                    <span>Reject</span>
                  </button>
                  <button class="icon-button" type="button" title="View detail" aria-label="View ${escapeHtml(signal.symbol)} detail">
                    ${createIcon("eye")}
                  </button>
                </div>
              `
              : ""
          }
        </article>
      `;
    })
    .join("");
};

const renderRisk = (risk) => {
  if (!risk) {
    return;
  }

  const riskMeter = document.querySelector(".risk-meter");
  const controlList = document.querySelector(".control-list");
  const limitGrid = document.querySelector(".limit-grid");

  if (riskMeter) {
    riskMeter.innerHTML = `
      <div class="risk-meter-top">
        <span>Daily loss limit</span>
        <strong>${risk.riskUsedPercent}%</strong>
      </div>
      <div class="meter-track">
        <span style="width: ${risk.riskUsedPercent}%"></span>
      </div>
    `;
  }

  if (controlList) {
    controlList.innerHTML = risk.toggles
      .map(
        (toggle) => `
          <label class="toggle-row">
            <span>${escapeHtml(toggle.label)}</span>
            <input type="checkbox" ${toggle.enabled ? "checked" : ""} disabled />
          </label>
        `,
      )
      .join("");
  }

  if (limitGrid) {
    limitGrid.innerHTML = risk.limits
      .map(
        (limit) => `
          <label>
            <span>${escapeHtml(limit.label)}</span>
            <input type="number" value="${escapeHtml(limit.value)}" disabled />
          </label>
        `,
      )
      .join("");
  }
};

const renderPositions = (positions) => {
  const tbody = document.querySelector(".positions-panel tbody");
  if (!tbody || !Array.isArray(positions)) {
    return;
  }

  tbody.innerHTML = positions
    .map(
      (position) => `
        <tr>
          <td data-label="Symbol">${escapeHtml(position.symbol)}</td>
          <td data-label="Side"><span class="tag ${position.side === "Long" ? "buy" : "sell"}">${escapeHtml(position.side)}</span></td>
          <td data-label="Qty">${escapeHtml(position.quantity)}</td>
          <td data-label="Entry">${escapeHtml(position.entry)}</td>
          <td data-label="Stop">${escapeHtml(position.stop)}</td>
          <td data-label="PnL" class="${position.pnlTone}">${escapeHtml(position.pnl)}</td>
          <td><button class="row-button" type="button">Exit</button></td>
        </tr>
      `,
    )
    .join("");
};

const orderIconName = (icon) => {
  if (icon === "filled") return "check";
  if (icon === "pending") return "clock-3";
  return "x";
};

const renderOrders = (orders) => {
  const container = document.querySelector(".order-timeline");
  if (!container || !Array.isArray(orders)) {
    return;
  }

  container.innerHTML = orders
    .map(
      (order) => `
        <article class="timeline-item">
          <span class="timeline-icon ${order.icon}">${createIcon(orderIconName(order.icon))}</span>
          <div>
            <strong>${escapeHtml(order.title)}</strong>
            <span>${escapeHtml(order.detail)}</span>
          </div>
          <time>${escapeHtml(order.time)}</time>
        </article>
      `,
    )
    .join("");
};

const renderNews = (news) => {
  const container = document.querySelector(".news-list");
  if (!container || !Array.isArray(news)) {
    return;
  }

  container.innerHTML = news
    .map(
      (event) => `
        <article>
          <span class="tag ${event.tone}">${escapeHtml(event.category)}</span>
          <strong>${escapeHtml(event.title)}</strong>
          <p>${escapeHtml(event.summary)}</p>
        </article>
      `,
    )
    .join("");
};

const renderJournal = (journal) => {
  const container = document.querySelector(".journal-list");
  if (!container || !Array.isArray(journal)) {
    return;
  }

  container.innerHTML = journal
    .map(
      (entry) => `
        <article>
          <time>${escapeHtml(entry.time)}</time>
          <div>
            <strong>${escapeHtml(entry.title)}</strong>
            <p>${escapeHtml(entry.detail)}</p>
          </div>
        </article>
      `,
    )
    .join("");
};

const renderState = (state) => {
  renderSummary(state.summary);
  renderMetrics(state.metrics);
  renderSignals(state.signals);
  renderRisk(state.risk);
  renderPositions(state.positions);
  renderOrders(state.orders);
  renderNews(state.news);
  renderJournal(state.journal);
  renderIcons();
};

const loadDashboardState = async () => {
  try {
    const response = await fetch("/api/dashboard/state", {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Dashboard API returned ${response.status}`);
    }

    renderState(await response.json());
  } catch (error) {
    setText("#systemHealth", "API offline");
    setText("#blockedTrades", "Using fallback dashboard data");
  }
};

const WATCHLIST_SYMBOLS = ["AAPL", "NVDA", "TSLA"];
const lastPrices = {};

const formatPrice = (price) =>
  price === null || price === undefined
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price);

const setWatchlistStatus = (text, tone) => {
  const pill = document.querySelector("#watchlistStatus");
  const label = document.querySelector("#watchlistStatusText");
  if (label) label.textContent = text;
  if (pill) {
    const dot = pill.querySelector(".status-dot");
    if (dot) {
      dot.classList.toggle("is-live", tone === "live");
      dot.classList.toggle("is-warn", tone !== "live");
    }
  }
};

const setWatchlistNote = (message) => {
  const note = document.querySelector("#watchlistNote");
  if (!note) return;
  note.textContent = message ?? "";
  note.hidden = !message;
};

const renderWatchlist = (prices) => {
  const container = document.querySelector("#watchlistRows");
  if (!container || !Array.isArray(prices)) return;

  container.innerHTML = prices
    .map((row) => {
      const prev = lastPrices[row.symbol];
      let dir = "flat";
      if (row.price !== null && prev !== undefined && prev !== null) {
        if (row.price > prev) dir = "up";
        else if (row.price < prev) dir = "down";
      }
      if (row.price !== null && row.price !== undefined) {
        lastPrices[row.symbol] = row.price;
      }
      const arrow = dir === "up" ? "trending-up" : dir === "down" ? "trending-down" : "minus";
      const time = row.timestamp
        ? new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            timeZone: "America/New_York",
          }).format(new Date(row.timestamp))
        : "--:--:--";

      return `
        <div class="watch-row watch-${dir}">
          <div class="watch-id">
            <span class="watch-symbol">${escapeHtml(row.symbol)}</span>
            <span class="watch-time">ET ${escapeHtml(time)}</span>
          </div>
          <span class="watch-price">${escapeHtml(formatPrice(row.price))}</span>
          <span class="watch-dir">${createIcon(arrow)}</span>
        </div>
      `;
    })
    .join("");
  renderIcons();
};

const renderWatchlistPlaceholder = () =>
  renderWatchlist(WATCHLIST_SYMBOLS.map((symbol) => ({ symbol, price: null, timestamp: null })));

const loadWatchlist = async () => {
  try {
    const response = await fetch(
      `/api/alpaca/prices?symbols=${encodeURIComponent(WATCHLIST_SYMBOLS.join(","))}`,
      { headers: { Accept: "application/json" } },
    );

    if (response.status === 503) {
      setWatchlistStatus("ยังไม่ได้เชื่อม", "warn");
      setWatchlistNote("ตั้งค่า ALPACA_API_KEY_ID / ALPACA_API_SECRET_KEY ใน .env แล้วรีสตาร์ท");
      renderWatchlistPlaceholder();
      return;
    }
    if (!response.ok) {
      throw new Error(`Prices API returned ${response.status}`);
    }

    const data = await response.json();
    renderWatchlist(data.prices);
    setWatchlistStatus("เชื่อมแล้ว", "live");
    setWatchlistNote("");
  } catch (error) {
    setWatchlistStatus("เชื่อมต่อไม่ได้", "warn");
    setWatchlistNote("ดึงราคาไม่สำเร็จ — จะลองใหม่อัตโนมัติ");
  }
};

// ── Paper trading: asset search + recommendation + order + monitor ──────────
let tradeSymbol = "BTC/USD";
let assetSearchTimer;

const getJson = async (url) => {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }
  return { ok: response.ok, status: response.status, data };
};

const postJsonBody = async (url, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }
  return { ok: response.ok, status: response.status, data };
};

const setDot = (pillSelector, tone) => {
  const dot = document.querySelector(`${pillSelector} .status-dot`);
  if (!dot) return;
  dot.classList.toggle("is-live", tone === "live");
  dot.classList.toggle("is-warn", tone !== "live");
};

const setTradeStatus = (text, tone) => {
  const label = document.querySelector("#tradeStatusText");
  if (label) label.textContent = text;
  setDot("#tradeStatus", tone);
};

const renderReco = (signal) => {
  const box = document.querySelector("#recoBox");
  if (!box) return;
  const isLong = signal.side === "Long";
  box.innerHTML = `
    <div class="reco-head">
      <span class="reco-action ${isLong ? "buy" : "sell"}">${escapeHtml(isLong ? "แนะนำเข้า Long" : "แนะนำเข้า Short")}</span>
      <span class="reco-symbol">${escapeHtml(signal.symbol)}</span>
      <span class="reco-confidence">conf ${escapeHtml(signal.confidence)}%</span>
    </div>
    <div class="reco-stats">
      <span>ราคา<strong>${escapeHtml(signal.price)}</strong></span>
      <span>R:R<strong>${escapeHtml(signal.riskReward)}</strong></span>
      <span>Stop<strong>${escapeHtml(signal.stop)}</strong></span>
      <span>Target<strong>${escapeHtml(signal.target)}</strong></span>
    </div>
    <p class="reco-thesis">${escapeHtml(signal.thesis)}</p>
    <p class="reco-note">⚠️ stop/target เป็นคำแนะนำ — crypto บน Alpaca ไม่มี bracket อัตโนมัติ ต้องจัดการออกเอง</p>
  `;
  const symbolInput = document.querySelector("#orderSymbol");
  const sideSelect = document.querySelector("#orderSide");
  if (symbolInput) symbolInput.value = signal.symbol;
  if (sideSelect) sideSelect.value = isLong ? "long" : "short";
  renderIcons();
};

const loadRecommendation = async () => {
  const box = document.querySelector("#recoBox");
  if (!box) return;
  const res = await getJson(`/api/dashboard/live-signals?symbol=${encodeURIComponent(tradeSymbol)}`);
  if (!res.ok || !Array.isArray(res.data)) {
    box.innerHTML = `<p class="reco-empty">ประเมินไม่ได้ตอนนี้</p>`;
    return;
  }
  if (res.data.length === 0) {
    box.innerHTML = `<p class="reco-empty">ยังไม่มีสัญญาณเข้าใน ${escapeHtml(tradeSymbol)} ตอนนี้ — รอจังหวะถัดไป</p>`;
    return;
  }
  renderReco(res.data[0]);
};

const onAssetSearch = () => {
  clearTimeout(assetSearchTimer);
  assetSearchTimer = window.setTimeout(loadAssets, 300);
};

async function loadAssets() {
  const input = document.querySelector("#assetSearchInput");
  const results = document.querySelector("#assetResults");
  if (!input || !results) return;
  const term = input.value.trim();
  const klass = document.querySelector("#assetClassSelect")?.value ?? "";
  if (term.length < 1) {
    results.hidden = true;
    results.innerHTML = "";
    return;
  }
  const res = await getJson(
    `/api/alpaca/assets?search=${encodeURIComponent(term)}&class=${encodeURIComponent(klass)}`,
  );
  results.hidden = false;
  if (res.status === 503) {
    results.innerHTML = `<p class="asset-empty">ยังไม่ได้เชื่อม Alpaca — ตั้งค่า .env ก่อน</p>`;
    return;
  }
  if (!res.ok || !Array.isArray(res.data)) {
    results.innerHTML = `<p class="asset-empty">ค้นหาไม่สำเร็จ</p>`;
    return;
  }
  if (res.data.length === 0) {
    results.innerHTML = `<p class="asset-empty">ไม่พบสินทรัพย์</p>`;
    return;
  }
  results.innerHTML = res.data
    .map(
      (a) => `
        <button type="button" class="asset-item" data-symbol="${escapeHtml(a.symbol)}">
          <span class="asset-sym">${escapeHtml(a.symbol)}</span>
          <span class="asset-name">${escapeHtml(a.name)}</span>
          <span class="asset-class">${escapeHtml(a.assetClass)}</span>
        </button>
      `,
    )
    .join("");
}

const onAssetPick = (event) => {
  const button = event.target.closest(".asset-item");
  if (!button) return;
  tradeSymbol = button.dataset.symbol;
  const symbolInput = document.querySelector("#orderSymbol");
  const searchInput = document.querySelector("#assetSearchInput");
  const results = document.querySelector("#assetResults");
  if (symbolInput) symbolInput.value = tradeSymbol;
  if (searchInput) searchInput.value = tradeSymbol;
  if (results) results.hidden = true;
  loadRecommendation();
};

const onSizeModeChange = () => {
  const mode = document.querySelector("#orderSizeMode")?.value;
  const label = document.querySelector("#orderAmountLabel");
  if (label) label.textContent = mode === "qty" ? "จำนวนหน่วย" : "จำนวนเงิน ($)";
};

const onOrderTypeChange = () => {
  const type = document.querySelector("#orderType")?.value;
  const field = document.querySelector("#limitPriceField");
  if (field) field.hidden = type !== "limit";
};

async function submitOrder(event) {
  event.preventDefault();
  const symbol = document.querySelector("#orderSymbol")?.value.trim();
  const side = document.querySelector("#orderSide")?.value;
  const type = document.querySelector("#orderType")?.value;
  const sizeMode = document.querySelector("#orderSizeMode")?.value;
  const amount = Number(document.querySelector("#orderAmount")?.value);
  const limitPrice = Number(document.querySelector("#orderLimitPrice")?.value);

  if (!amount || amount <= 0) {
    showNotice("กรอกขนาดคำสั่งให้มากกว่า 0", "warn");
    return;
  }
  if (type === "limit" && (!limitPrice || limitPrice <= 0)) {
    showNotice("คำสั่ง Limit ต้องระบุราคา", "warn");
    return;
  }

  const body = { symbol, side, type };
  if (sizeMode === "qty") body.qty = amount;
  else body.notional = amount;
  if (type === "limit") body.limitPrice = limitPrice;

  const button = document.querySelector("#submitOrderBtn");
  if (button) button.disabled = true;
  try {
    const res = await postJsonBody("/api/dashboard/orders", body);
    if (!res.ok) {
      const message = res.data?.message ?? `ส่งคำสั่งไม่สำเร็จ (${res.status})`;
      showNotice(Array.isArray(message) ? message.join(", ") : message, "warn");
      return;
    }
    renderState(res.data);
    showNotice(`ส่งคำสั่ง ${symbol} แล้ว (paper)`);
    loadPaperAccount();
  } catch (error) {
    showNotice(error.message || "เกิดข้อผิดพลาด", "warn");
  } finally {
    if (button) button.disabled = false;
  }
}

async function loadPaperAccount() {
  const statusText = document.querySelector("#paperAccountStatusText");
  const metrics = document.querySelector("#paperMetrics");
  const positionsEl = document.querySelector("#paperPositions");
  const ordersEl = document.querySelector("#paperOrders");
  if (!metrics || !positionsEl || !ordersEl) return;

  const status = await getJson("/api/alpaca/status");
  const configured = status.ok && status.data?.configured;

  if (!configured) {
    setDot("#paperAccountStatus", "warn");
    if (statusText) statusText.textContent = "ยังไม่เชื่อม";
    setTradeStatus("ยังไม่เชื่อม Alpaca", "warn");
    metrics.innerHTML = `<p class="paper-empty">ตั้งค่า ALPACA_API_KEY_ID / ALPACA_API_SECRET_KEY ใน .env</p>`;
    positionsEl.innerHTML = `<p class="paper-empty">—</p>`;
    ordersEl.innerHTML = `<p class="paper-empty">—</p>`;
    return;
  }

  setDot("#paperAccountStatus", "live");
  if (statusText) statusText.textContent = status.data.paper ? "Paper" : "LIVE";
  setTradeStatus(
    status.data.tradingEnabled ? "เทรดได้ (paper)" : "ดูอย่างเดียว — ตั้ง ALPACA_TRADING_ENABLED=true",
    status.data.tradingEnabled ? "live" : "warn",
  );

  const [account, positions, orders] = await Promise.all([
    getJson("/api/alpaca/account"),
    getJson("/api/alpaca/positions"),
    getJson("/api/alpaca/orders"),
  ]);

  if (account.ok && account.data) {
    metrics.innerHTML = `
      <div class="paper-metric"><span>Equity</span><strong>${escapeHtml(formatPrice(account.data.equity))}</strong></div>
      <div class="paper-metric"><span>Cash</span><strong>${escapeHtml(formatPrice(account.data.cash))}</strong></div>
      <div class="paper-metric"><span>Buying Power</span><strong>${escapeHtml(formatPrice(account.data.buyingPower))}</strong></div>
    `;
  }

  if (positions.ok && Array.isArray(positions.data)) {
    positionsEl.innerHTML = positions.data.length
      ? positions.data
          .map(
            (p) => `
              <div class="paper-row">
                <span class="paper-sym">${escapeHtml(p.symbol)}</span>
                <span>${escapeHtml(p.shares)} @ ${escapeHtml(formatPrice(p.averageEntryPrice))}</span>
                <span class="${p.unrealizedPnl >= 0 ? "positive" : "negative"}">${escapeHtml(formatPrice(p.unrealizedPnl))}</span>
              </div>`,
          )
          .join("")
      : `<p class="paper-empty">ไม่มี position</p>`;
  }

  if (orders.ok && Array.isArray(orders.data)) {
    ordersEl.innerHTML = orders.data.length
      ? orders.data
          .slice(0, 6)
          .map(
            (o) => `
              <div class="paper-row">
                <span class="paper-sym">${escapeHtml(o.symbol)}</span>
                <span>${escapeHtml(o.side)} ${escapeHtml(o.filledQuantity ?? o.quantity ?? "")}</span>
                <span class="paper-ostatus">${escapeHtml(o.status)}</span>
              </div>`,
          )
          .join("")
      : `<p class="paper-empty">ยังไม่มีคำสั่ง</p>`;
  }
}

const initPaperTrading = () => {
  document.querySelector("#orderForm")?.addEventListener("submit", submitOrder);
  document.querySelector("#assetSearchInput")?.addEventListener("input", onAssetSearch);
  document.querySelector("#assetClassSelect")?.addEventListener("change", loadAssets);
  document.querySelector("#assetResults")?.addEventListener("click", onAssetPick);
  document.querySelector("#orderSizeMode")?.addEventListener("change", onSizeModeChange);
  document.querySelector("#orderType")?.addEventListener("change", onOrderTypeChange);
  loadRecommendation();
  loadPaperAccount();
  window.setInterval(loadRecommendation, 20000);
  window.setInterval(loadPaperAccount, 15000);
};

const showNotice = (message, tone = "info") => {
  const notice = document.querySelector("#notice");
  if (!notice) return;
  notice.textContent = message;
  notice.classList.toggle("is-warn", tone === "warn");
  notice.hidden = false;
  clearTimeout(notice._timer);
  notice._timer = window.setTimeout(() => {
    notice.hidden = true;
  }, 3500);
};

const isHalted = () => document.body.classList.contains("is-halted");

const refreshKillSwitchUi = () => {
  const killSwitch = document.querySelector("#killSwitch");
  if (!killSwitch) return;
  if (isHalted()) {
    killSwitch.innerHTML = `${createIcon("play")}<span>Resume Trading</span>`;
    killSwitch.classList.remove("danger-button");
    killSwitch.classList.add("approve-button");
  } else {
    killSwitch.innerHTML = `${createIcon("power")}<span>Kill Switch</span>`;
    killSwitch.classList.add("danger-button");
    killSwitch.classList.remove("approve-button");
  }
  renderIcons();
};

const handleModeChange = async (mode) => {
  document
    .querySelectorAll(".mode-option")
    .forEach((option) => option.classList.toggle("is-selected", option.dataset.mode === mode));

  if (mode === "OFF") {
    renderState(await postJson("/api/dashboard/halt"));
  } else if (mode === "Live Approval") {
    if (isHalted()) {
      renderState(await postJson("/api/dashboard/resume"));
    }
  } else {
    showNotice(`โหมด "${mode}" ยังไม่รองรับใน PoC (รองรับเฉพาะ OFF และ Live Approval)`, "warn");
  }
};

const wireActions = () => {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, signalId, mode } = button.dataset;
    button.disabled = true;

    try {
      if (action === "approve-signal" && signalId) {
        renderState(await postJson(`/api/dashboard/signals/${signalId}/approve`));
      } else if (action === "reject-signal" && signalId) {
        renderState(await postJson(`/api/dashboard/signals/${signalId}/reject`));
      } else if (action === "refresh") {
        await loadDashboardState();
        showNotice("รีเฟรชข้อมูลแล้ว");
      } else if (action === "kill-switch") {
        const path = isHalted() ? "/api/dashboard/resume" : "/api/dashboard/halt";
        renderState(await postJson(path));
        refreshKillSwitchUi();
      } else if (action === "close-all") {
        renderState(await postJson("/api/dashboard/close-all"));
        showNotice("ยกเลิก pending signal และปิด position ทั้งหมดแล้ว", "warn");
      } else if (action === "mode" && mode) {
        await handleModeChange(mode);
      }
    } catch (error) {
      showNotice(error.message || "เกิดข้อผิดพลาด", "warn");
    } finally {
      button.disabled = false;
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  updateClocks();
  loadDashboardState();
  renderWatchlistPlaceholder();
  loadWatchlist();
  initPaperTrading();
  wireActions();
  refreshKillSwitchUi();

  window.setInterval(updateClocks, 1000);
  window.setInterval(loadDashboardState, 15000);
  window.setInterval(loadWatchlist, 5000);

  renderIcons();
});
