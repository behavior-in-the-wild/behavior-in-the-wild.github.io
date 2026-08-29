/* leaderboard.html — clean S&P-500-scale results table (mirrors the paper's scale table).
   One row per (condition, model). No pilot-condition duplicity. */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("leaderboard.html");

  function pct(x) { return x == null ? "—" : Math.round(x * 100) + "%"; }
  function num(x) { return x == null ? "—" : x; }

  S.fetchJSON("data/scale_results.json").then(function (data) {
    var rows = data.rows || [];
    var naive = null;
    rows.forEach(function (r) { if (r.is_baseline) naive = r.acc; });

    var metric = document.getElementById("lb-metric");
    if (metric) metric.textContent =
      "Metric: surprise-direction accuracy (beat / inline / miss) across 443 S&P 500 companies, 2026 quarters.";
    var note = document.getElementById("lb-note");
    if (note) note.textContent = data.label_note || "";

    var container = document.getElementById("leaderboard-container");
    S.clear(container);

    var scroll = S.el("div", "table-scroll");
    var table = S.el("table", "lb-table");
    var thead = S.el("thead"), htr = S.el("tr");
    ["Condition", "Corpus", "Model", "Dir. acc.", "Brier ↓", "ECE ↓", "Surprise MAE (pp) ↓", "n"]
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

      // accuracy — flag rows below the naive baseline
      var ac = S.el("td");
      var below = !r.is_baseline && naive != null && r.acc != null && r.acc < naive;
      ac.appendChild(S.el("span", below ? "lb-below-baseline" : null, pct(r.acc)));
      tr.appendChild(ac);

      tr.appendChild(S.el("td", null, num(r.brier)));
      tr.appendChild(S.el("td", null, num(r.ece)));
      tr.appendChild(S.el("td", null, r.mae == null ? "—" : r.mae));
      tr.appendChild(S.el("td", null, num(r.n)));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    container.appendChild(scroll);

    var legend = S.el("p", "muted");
    legend.style.marginTop = "12px";
    legend.style.fontSize = "12.5px";
    legend.textContent =
      "No mining condition beats the naive always-beat baseline, and the wide spread across models on the " +
      "same condition tracks each model's prediction distribution (how often it says “beat”), not its reasoning. " +
      "Lower is better for Brier, ECE, and Surprise MAE.";
    container.appendChild(legend);

    // ---- real-consensus rescoring, where we have it (no new model calls -- same
    // predictions above, scored against a real human/analyst number instead of proxy) ----
    var realRows = data.real_consensus_rows || [];
    if (realRows.length) {
      var head2 = S.el("h3", null, "Scored against real analyst consensus");
      head2.style.marginTop = "32px";
      container.appendChild(head2);
      var note2 = S.el("p", "muted");
      note2.style.fontSize = "12.5px";
      note2.textContent = data.real_consensus_note || "";
      container.appendChild(note2);

      var scroll2 = S.el("div", "table-scroll");
      var table2 = S.el("table", "lb-table");
      var thead2 = S.el("thead"), htr2 = S.el("tr");
      ["Condition", "Corpus", "Model", "Dir. acc.", "Balanced acc.", "n"]
        .forEach(function (h) { htr2.appendChild(S.el("th", null, h)); });
      thead2.appendChild(htr2); table2.appendChild(thead2);
      var tbody2 = S.el("tbody");
      realRows.forEach(function (r) {
        var tr = S.el("tr", r.is_baseline ? "lb-row-baseline" : null);
        tr.appendChild(S.el("td", null, r.condition));
        tr.appendChild(S.el("td", null, r.corpus || "—"));
        var mc2 = S.el("td");
        if (r.model && r.model !== "—") { mc2.appendChild(S.el("code", null, r.model)); }
        else { mc2.textContent = "—"; }
        tr.appendChild(mc2);
        tr.appendChild(S.el("td", null, pct(r.acc)));
        tr.appendChild(S.el("td", null, r.balanced_acc == null ? "—" : r.balanced_acc));
        tr.appendChild(S.el("td", null, num(r.n)));
        tbody2.appendChild(tr);
      });
      table2.appendChild(tbody2);
      scroll2.appendChild(table2);
      container.appendChild(scroll2);
    }
  }).catch(function (e) {
    console.error(e);
    S.showError(document.getElementById("leaderboard-container"), "data/scale_results.json");
  });
})();
