/* leaderboard.html — full sortable multi-model table (blind + fed) */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("leaderboard.html");

  var COLS = [
    { key: "rank", label: "#", num: true, sortable: true },
    { key: "model", label: "Model", num: false, sortable: true },
    { key: "type", label: "Type", num: false, sortable: true },
    { key: "blind_acc", label: "Blind accuracy (C0)", num: true, sortable: true, bar: true },
    { key: "fed_acc", label: "Feed accuracy (C2)", num: true, sortable: true, bar: true },
    { key: "c4_acc", label: "Deep-mined (C4)", num: true, sortable: true, bar: true },
    { key: "c6_acc", label: "Agentic miner (C6)", num: true, sortable: true, bar: true },
    { key: "lift_pp", label: "Lift (feed − blind)", num: true, sortable: true },
    { key: "brier_fed", label: "Calibration (Brier↓)", num: true, sortable: true },
    { key: "n", label: "Episodes", num: true, sortable: true },
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

  function render() {
    var container = document.getElementById("leaderboard-container");
    S.clear(container);
    var sorted = rows.slice().sort(function (a, b) {
      var c = cmp(a, b, sortKey);
      return sortDir === 1 ? c : -c;
    });

    var scroll = S.el("div", "table-scroll");
    var table = S.el("table", "data-table");
    var thead = S.el("thead"), htr = S.el("tr");
    COLS.forEach(function (col) {
      var th = S.el("th", (col.num ? "num " : "") + (col.sortable ? "sortable " : "") + (col.key === sortKey ? "sorted" : ""));
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
      tr.addEventListener("click", function () { location.href = "model.html?m=" + encodeURIComponent(r.key); });

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
    var m = document.getElementById("lb-metric");
    if (m && data.metric) m.textContent = "Metric: " + data.metric;
    var n = document.getElementById("lb-note");
    if (n && data.note) n.textContent = data.note;
    render();
  }).catch(function (e) { console.error(e); S.showError(document.getElementById("leaderboard-container"), "data/leaderboard.json"); });

  // ---- Fortune-500 CC-News sweep, shown as its own section (not merged into the table above) ----
  S.fetchJSON("data/leaderboard_500.json").then(function (d) {
    var banner = document.getElementById("caveat-banner");
    var warn = S.el("div");
    warn.appendChild(S.el("strong", null, "Read this before the numbers: "));
    warn.appendChild(document.createTextNode(d.warning));
    banner.appendChild(warn);
    var caveat = S.el("p", "muted");
    caveat.style.marginTop = "8px";
    caveat.style.fontSize = "12.5px";
    caveat.appendChild(document.createTextNode(d.label_caveat));
    banner.appendChild(caveat);

    var container = document.getElementById("lb500-container");
    var table = S.el("table", "lb-table");
    var thead = S.el("tr");
    ["Model", "Accuracy", "Correct / Total", "% predicted 'beat'"].forEach(function (h) {
      thead.appendChild(S.el("th", null, h));
    });
    table.appendChild(thead);

    var nb = d.naive_always_beat_baseline;
    var baseRow = S.el("tr", "lb-row-baseline");
    baseRow.appendChild(S.el("td", null, "Always predict \"beat\" (naive baseline)"));
    baseRow.appendChild(S.el("td", null, Math.round(nb.accuracy * 100) + "%"));
    baseRow.appendChild(S.el("td", null, nb.correct + " / " + nb.total));
    baseRow.appendChild(S.el("td", null, "100%"));
    table.appendChild(baseRow);

    d.models.slice().sort(function (a, b) { return b.accuracy - a.accuracy; }).forEach(function (m) {
      var tr = S.el("tr");
      var below = m.accuracy < nb.accuracy;
      tr.appendChild(S.el("td", null, m.model));
      var accCell = S.el("td", below ? "lb-below-baseline" : null,
        Math.round(m.accuracy * 100) + "%" + (below ? " (below baseline)" : ""));
      tr.appendChild(accCell);
      tr.appendChild(S.el("td", null, m.correct + " / " + m.total));
      tr.appendChild(S.el("td", null, Math.round(m.pct_predicted_beat * 100) + "%"));
      table.appendChild(tr);
    });
    container.appendChild(table);
  }).catch(function (e) { S.showError(document.getElementById("lb500-container"), e); });
})();
