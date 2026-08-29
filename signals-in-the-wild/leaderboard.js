/* leaderboard.html — clean S&P-500-scale results table (mirrors the paper's scale table).
   One row per (condition, model), ONE table -- proxy-label and real-consensus
   accuracy shown side by side per row, not as two separate tables. */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("leaderboard.html");

  function pct(x) { return x == null ? "—" : Math.round(x * 100) + "%"; }
  function num(x) { return x == null ? "—" : x; }
  function ciStr(ci) { return ci ? Math.round(ci[0] * 100) + "–" + Math.round(ci[1] * 100) + "%" : ""; }
  function accCell(acc, ci) {
    var wrap = S.el("span");
    wrap.appendChild(document.createTextNode(pct(acc)));
    if (ci) {
      var small = S.el("span", "muted");
      small.style.fontSize = "10.5px";
      small.style.marginLeft = "4px";
      small.textContent = " (" + ciStr(ci) + ")";
      wrap.appendChild(small);
    }
    return wrap;
  }

  S.fetchJSON("data/scale_results.json").then(function (data) {
    var rows = data.rows || [];
    var naive = null;
    rows.forEach(function (r) { if (r.is_baseline && r.acc != null) naive = r.acc; });

    var metric = document.getElementById("lb-metric");
    if (metric) metric.textContent =
      "Metric: surprise-direction accuracy (beat / inline / miss) across 443 S&P 500 companies, 2026 quarters. " +
      "'Real acc.' rescores the same predictions against real analyst consensus where we have it (see note below).";
    var note = document.getElementById("lb-note");
    if (note) note.textContent = (data.label_note || "") + " " + (data.real_consensus_note || "");

    var container = document.getElementById("leaderboard-container");
    S.clear(container);

    var scroll = S.el("div", "table-scroll");
    var table = S.el("table", "lb-table");
    var thead = S.el("thead"), htr = S.el("tr");
    ["Condition", "Corpus", "Model", "Dir. acc. (proxy)", "n", "Dir. acc. (real consensus)", "Bal. acc. (real)",
     "n (real)", "Brier ↓", "ECE ↓", "Surprise MAE (pp) ↓"]
      .forEach(function (h) { htr.appendChild(S.el("th", null, h)); });
    thead.appendChild(htr); table.appendChild(thead);

    var tbody = S.el("tbody");
    rows.forEach(function (r) {
      var tr = S.el("tr", r.is_baseline ? "lb-row-baseline" : null);
      tr.appendChild(S.el("td", null, r.condition + (r.partial ? " *" : "")));
      tr.appendChild(S.el("td", null, r.corpus || "—"));

      var mc = S.el("td");
      if (r.model && r.model !== "—") { mc.appendChild(S.el("code", null, r.model)); }
      else { mc.textContent = "—"; }
      tr.appendChild(mc);

      // proxy accuracy — flag rows below the naive baseline
      var ac = S.el("td");
      if (r.acc != null) {
        var below = !r.is_baseline && naive != null && r.acc < naive;
        var span = S.el("span", below ? "lb-below-baseline" : null);
        span.appendChild(accCell(r.acc, r.acc_ci95));
        ac.appendChild(span);
      } else {
        ac.textContent = "—";
      }
      tr.appendChild(ac);
      tr.appendChild(S.el("td", null, num(r.n)));

      // real-consensus accuracy
      var rac = S.el("td");
      if (r.real_acc != null) rac.appendChild(accCell(r.real_acc, r.real_acc_ci95));
      else rac.textContent = "—";
      tr.appendChild(rac);
      tr.appendChild(S.el("td", null, r.real_balanced_acc == null ? "—" : r.real_balanced_acc));
      tr.appendChild(S.el("td", null, num(r.real_n)));

      tr.appendChild(S.el("td", null, num(r.brier)));
      tr.appendChild(S.el("td", null, num(r.ece)));
      tr.appendChild(S.el("td", null, r.mae == null ? "—" : r.mae));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    container.appendChild(scroll);

    var legend = S.el("p", "muted");
    legend.style.marginTop = "12px";
    legend.style.fontSize = "12.5px";
    legend.textContent =
      "No mining condition beats the naive always-beat baseline on the proxy label, and the wide spread across " +
      "models on the same condition tracks each model's prediction distribution (how often it says “beat”), not " +
      "its reasoning. 95% Wilson CIs shown in parentheses next to each accuracy figure. Lower is better for " +
      "Brier, ECE, and Surprise MAE (proxy-label only -- not computed against real consensus).";
    container.appendChild(legend);
  }).catch(function (e) {
    console.error(e);
    S.showError(document.getElementById("leaderboard-container"), "data/scale_results.json");
  });
})();
