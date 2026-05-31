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

const wireModeControl = () => {
  document.querySelectorAll(".mode-option").forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll(".mode-option")
        .forEach((option) => option.classList.remove("is-selected"));
      button.classList.add("is-selected");
    });
  });
};

const wireTradingActions = () => {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    const signalId = button.dataset.signalId;
    button.disabled = true;

    try {
      if (action === "approve-signal" && signalId) {
        renderState(await postJson(`/api/dashboard/signals/${signalId}/approve`));
      }

      if (action === "reject-signal" && signalId) {
        renderState(await postJson(`/api/dashboard/signals/${signalId}/reject`));
      }
    } finally {
      button.disabled = false;
    }
  });

  const killSwitch = document.querySelector("#killSwitch");
  if (killSwitch) {
    killSwitch.addEventListener("click", async () => {
      killSwitch.disabled = true;
      killSwitch.innerHTML = `${createIcon("octagon-alert")}<span>Trading Halted</span>`;

      try {
        renderState(await postJson("/api/dashboard/halt"));
      } finally {
        renderIcons();
      }
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  updateClocks();
  loadDashboardState();
  wireModeControl();
  wireTradingActions();

  window.setInterval(updateClocks, 1000);
  window.setInterval(loadDashboardState, 15000);

  renderIcons();
});
