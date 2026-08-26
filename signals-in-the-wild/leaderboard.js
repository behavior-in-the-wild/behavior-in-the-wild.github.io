/* leaderboard.html — single sortable table, one row per model, all conditions as columns */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("leaderboard.html");

  var COLS = [
    { key: "rank", label: "#", num: true, sortable: true },
    { key: "model", label: "Model", num: false, sortable: true },
    { key: "type", label: "Type", num: false, sortable: true },
    { key: "blind_acc", label: "Blind (C0)", num: true, sortable: true,
      help: "Signal-blind: given only the target (company, quarter, cutoff date), no search, no signals. 10 pilot episodes, curated ground-truth label." },
    { key: "fed_acc", label: "Feed (C2)", num: true, sortable: true,
      help: "Signal-fed: handed the curated demand-driver signals directly, no mining required. Same 10 episodes." },
    { key: "c4_acc", label: "Deep-mined (C4)", num: true, sortable: true,
      help: "Fixed non-agentic pipeline: decompose → multi-query → rerank → summarize → ensemble (Halawi-style fan-out). Same 10 episodes." },
    { key: "c6_acc", label: "Agentic miner (C6)", num: true, sortable: true,
      help: "ReAct-interleaved, RL-agent-style miner with its own search budget. Same 10 episodes." },
    { key: "ccnews_acc", label: "CC-News (443 co.)", num: true, sortable: true,
      help: "A DIFFERENT evaluation: 443 S&P 500 companies, CC-News-only retrieval, scored against a NAIVE prior-year-proxy label (not real consensus, 81.3% beat-heavy). Not directly comparable to the columns to its left — see the note below the table." },
    { key: "wchain_acc", label: "Weekly chain (100 co.)", num: true, sortable: true,
      help: "ANOTHER different evaluation: 100 sector-stratified S&P 500 companies, live web-search retrieval, state carried week-to-week toward each company's most-recent-resolved quarter, naive prior-year-proxy label (81% beat-heavy on this sample). Also not directly comparable to the other columns." },
    { key: "lift_pp", label: "Lift (feed − blind)", num: true, sortable: true,
      help: "Feed accuracy minus blind accuracy, in percentage points — how much curated signals helped." },
    { key: "brier_fed", label: "Calibration (Brier↓)", num: true, sortable: true,
      help: "Brier score on stated confidence for the feed condition, binary correct/incorrect. Lower is better-calibrated." },
    { key: "n", label: "Episodes", num: true, sortable: true, help: "Number of pilot episodes this model was evaluated on (blind/feed/C4/C6 columns)." },
  ];

  var rows = [];
  var sortKey = "rank", sortDir = 1;

  function cmp(a, b, key) {
    var av = a[key], bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "string") return av.localeCompare(bv);
    return av - bv;
  }

  function liftCell(v) {
    var td = S.el("td", "num");
    if (v == null) { td.textContent = "—"; return td; }
    var span = S.el("span", "lift " + (v > 0 ? "lift-pos" : v < 0 ? "lift-neg" : "lift-zero"),
      (v > 0 ? "+" : "") + v + " pp");
    td.appendChild(span);
    return td;
  }

  function ccnewsCell(r) {
    var td = S.el("td", "num");
    if (r.ccnews_acc == null) { td.textContent = "—"; return td; }
    var below = !r.is_baseline && rows.length && ccnewsBaseline != null && r.ccnews_acc < ccnewsBaseline;
    var span = S.el("span", below ? "lb-below-baseline" : null,
      Math.round(r.ccnews_acc * 100) + "%" + (r.ccnews_n ? " (" + r.ccnews_n + ")" : ""));
    td.appendChild(span);
    return td;
  }

  function wchainCell(r) {
    var td = S.el("td", "num");
    if (r.wchain_acc == null) { td.textContent = "—"; return td; }
    var below = !r.is_baseline && wchainBaseline != null && r.wchain_acc < wchainBaseline;
    var span = S.el("span", below ? "lb-below-baseline" : null,
      Math.round(r.wchain_acc * 100) + "%" + (r.wchain_n ? " (" + r.wchain_n + ")" : ""));
    td.appendChild(span);
    return td;
  }

  var ccnewsBaseline = null;
  var wchainBaseline = null;

  function render() {
    var container = document.getElementById("leaderboard-container");
    S.clear(container);
    var sorted = rows.slice().sort(function (a, b) {
      var c = cmp(a, b, sortKey);
      return sortDir === 1 ? c : -c;
    });

    var legend = S.el("div", "lb-legend");
    COLS.filter(function (c) { return c.help; }).forEach(function (c) {
      var item = S.el("div", "lb-legend-item");
      item.appendChild(S.el("strong", null, c.label + ": "));
      item.appendChild(document.createTextNode(c.help));
      legend.appendChild(item);
    });
    container.appendChild(legend);

    var scroll = S.el("div", "table-scroll");
    var table = S.el("table", "data-table");
    var thead = S.el("thead"), htr = S.el("tr");
    COLS.forEach(function (col) {
      var th = S.el("th", (col.num ? "num " : "") + (col.sortable ? "sortable " : "") + (col.key === sortKey ? "sorted" : ""));
      if (col.help) th.title = col.help;
      th.appendChild(document.createTextNode(col.label + " "));
      if (col.sortable) {
        th.appendChild(S.el("span", "arrow", col.key === sortKey ? (sortDir === 1 ? "▲" : "▼") : "↕"));
        th.addEventListener("click", function () {
          if (sortKey === col.key) { sortDir = -sortDir; }
          else { sortKey = col.key; sortDir = (col.key === "model" || col.key === "type" || col.key === "brier_fed" || col.key === "rank") ? 1 : -1; }
          render();
        });
      }
      htr.appendChild(th);
    });
    thead.appendChild(htr); table.appendChild(thead);

    var tbody = S.el("tbody");
    sorted.forEach(function (r) {
      var tr = S.el("tr", (r.is_baseline ? "baseline-row " : "") + "clickable");
      tr.addEventListener("click", function () {
        if (!r.is_baseline) location.href = "model.html?m=" + encodeURIComponent(r.key);
      });

      var rk = S.el("td", "num");
      rk.appendChild(S.el("span", "rank" + (r.rank === 1 ? " rank-1" : ""), String(r.rank)));
      tr.appendChild(rk);

      var mc = S.el("td");
      var cell = S.el("div", "model-cell");
      cell.appendChild(S.avatar(r.avatar, r.key));
      var nm = S.el("div");
      nm.appendChild(S.el("div", "mc-name", r.model));
      nm.appendChild(S.el("div", "mc-cond", r.route === "baseline" ? "condition-independent" : r.route));
      cell.appendChild(nm); mc.appendChild(cell); tr.appendChild(mc);

      var tt = S.el("td"); tt.appendChild(S.typeTag(r.type)); tr.appendChild(tt);

      var bc = S.el("td"); bc.appendChild(S.accBar(r.blind_acc)); tr.appendChild(bc);
      var fc = S.el("td"); fc.appendChild(S.accBar(r.fed_acc)); tr.appendChild(fc);
      var c4c = S.el("td"); c4c.appendChild(S.accBar(r.c4_acc)); tr.appendChild(c4c);
      var c6c = S.el("td"); c6c.appendChild(S.accBar(r.c6_acc)); tr.appendChild(c6c);
      tr.appendChild(ccnewsCell(r));
      tr.appendChild(wchainCell(r));
      tr.appendChild(liftCell(r.lift_pp));
      tr.appendChild(S.el("td", "num", S.fmtBrier(r.brier_fed)));
      tr.appendChild(S.el("td", "num", String(r.n)));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    container.appendChild(scroll);
  }

  S.fetchJSON("data/leaderboard.json").then(function (data) {
    rows = data.rows;
    var baseline = rows.filter(function (r) { return r.is_baseline; })[0];
    ccnewsBaseline = baseline ? baseline.ccnews_acc : null;
    wchainBaseline = baseline ? baseline.wchain_acc : null;
    var m = document.getElementById("lb-metric");
    if (m && data.metric) m.textContent = "Metric: " + data.metric;
    var n = document.getElementById("lb-note");
    if (n && data.note) n.textContent = data.note;
    render();
  }).catch(function (e) { console.error(e); S.showError(document.getElementById("leaderboard-container"), "data/leaderboard.json"); });
})();
