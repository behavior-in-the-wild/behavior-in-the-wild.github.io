/* leaderboard.html — full sortable multi-model table (blind + fed) */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("leaderboard.html");

  var COLS = [
    { key: "rank", label: "#", num: true, sortable: true },
    { key: "model", label: "Model", num: false, sortable: true },
    { key: "type", label: "Type", num: false, sortable: true },
    { key: "blind_acc", label: "Blind accuracy", num: true, sortable: true, bar: true },
    { key: "fed_acc", label: "Feed accuracy", num: true, sortable: true, bar: true },
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
})();
