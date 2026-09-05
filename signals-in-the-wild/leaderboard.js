/* leaderboard.html — S&P-500-scale results, grouped by model. Baseline rows
   (naive proxy, human analyst consensus) are always visible; each model is
   one clickable summary row that expands to its per-condition breakdown --
   click the model name to see everything for that model, in the table
   itself, not a separate summary section. */
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

  var COLS = ["Condition", "Corpus", "Model", "Dir. acc. (proxy)", "n", "Dir. acc. (real)", "Bal. acc. (real)",
    "n (real)", "Brier ↓", "ECE ↓", "MAE (pp) ↓"];
  var NCOL = COLS.length;

  function dataRow(r, naive) {
    var tr = S.el("tr", (r.is_baseline || r.is_human_baseline) ? "lb-row-baseline" : null);
    tr.appendChild(S.el("td", null, r.condition + (r.partial ? " *" : "")));
    tr.appendChild(S.el("td", null, r.corpus || "—"));
    var mc = S.el("td");
    if (r.model && r.model !== "—") { mc.appendChild(S.el("code", null, r.model)); }
    else { mc.textContent = "—"; }
    tr.appendChild(mc);

    var ac = S.el("td");
    if (r.acc != null) {
      var below = !r.is_baseline && naive != null && r.acc < naive;
      var span = S.el("span", below ? "lb-below-baseline" : null);
      span.appendChild(accCell(r.acc, r.acc_ci95));
      ac.appendChild(span);
    } else { ac.textContent = "—"; }
    tr.appendChild(ac);
    tr.appendChild(S.el("td", null, num(r.n)));

    var rac = S.el("td");
    if (r.real_acc != null) rac.appendChild(accCell(r.real_acc, r.real_acc_ci95));
    else rac.textContent = "—";
    tr.appendChild(rac);
    tr.appendChild(S.el("td", null, r.real_balanced_acc == null ? "—" : r.real_balanced_acc));
    tr.appendChild(S.el("td", null, num(r.real_n)));

    tr.appendChild(S.el("td", null, num(r.brier)));
    tr.appendChild(S.el("td", null, num(r.ece)));
    tr.appendChild(S.el("td", null, r.mae == null ? "—" : r.mae));
    return tr;
  }

  function bestRow(rows) {
    var top = null;
    rows.forEach(function (r) {
      var score = r.real_balanced_acc != null ? r.real_balanced_acc : r.balanced_acc;
      if (score == null) return;
      var topScore = top ? (top.real_balanced_acc != null ? top.real_balanced_acc : top.balanced_acc) : -1;
      if (score > topScore) top = r;
    });
    return top;
  }

  function modelSummaryRow(model, rows) {
    var tr = S.el("tr", "co500-row lb-model-row");
    var td = S.el("td");
    td.colSpan = NCOL;
    var line = S.el("div", "model-cell");
    line.appendChild(S.el("span", "lb-caret", "▸"));
    line.appendChild(S.avatar(model, model, 22));
    line.appendChild(S.el("strong", null, model));
    var best = bestRow(rows);
    if (best) {
      var note = S.el("span", "muted");
      note.style.marginLeft = "10px";
      note.style.fontSize = "12.5px";
      var scoreLabel = best.real_balanced_acc != null
        ? best.real_balanced_acc + " bal. acc. (real), " + pct(best.real_acc) + " dir."
        : best.balanced_acc + " bal. acc. (proxy), " + pct(best.acc) + " dir.";
      note.textContent = "best: " + best.condition + (best.corpus && best.corpus !== "—" ? " / " + best.corpus : "") + " — " + scoreLabel;
      line.appendChild(note);
    }
    td.appendChild(line);
    tr.appendChild(td);
    return tr;
  }

  function renderTable(rows, models, naive) {
    var container = document.getElementById("leaderboard-container");
    S.clear(container);
    var scroll = S.el("div", "table-scroll");
    var table = S.el("table", "lb-table");
    var thead = S.el("thead"), htr = S.el("tr");
    COLS.forEach(function (h) { htr.appendChild(S.el("th", null, h)); });
    thead.appendChild(htr); table.appendChild(thead);
    var tbody = S.el("tbody");

    // baselines: always visible, not tied to a model
    rows.filter(function (r) { return r.is_baseline || r.is_human_baseline; })
      .forEach(function (r) { tbody.appendChild(dataRow(r, naive)); });

    // one collapsible group per model -- click the model name to expand
    models.forEach(function (m) {
      var modelRows = rows.filter(function (r) { return r.model === m; });
      var summary = modelSummaryRow(m, modelRows);
      tbody.appendChild(summary);
      var detailTrs = modelRows.map(function (r) {
        var dt = dataRow(r, naive);
        dt.style.display = "none";
        return dt;
      });
      detailTrs.forEach(function (dt) { tbody.appendChild(dt); });
      summary.addEventListener("click", function () {
        var showing = detailTrs[0].style.display !== "none";
        detailTrs.forEach(function (dt) { dt.style.display = showing ? "none" : ""; });
        summary.querySelector(".lb-caret").textContent = showing ? "▸" : "▾";
      });
    });

    table.appendChild(tbody);
    scroll.appendChild(table);
    container.appendChild(scroll);
  }

  function renderMiningRecall(mr) {
    var wrap = document.getElementById("lb-mining-recall");
    S.clear(wrap);
    if (!mr) return;
    wrap.appendChild(S.el("h3", null, "Mining recall"));
    wrap.appendChild(S.el("p", "page-sub",
      "Did the search actually find the real signals behind the outcome, not just get the final call right? " +
      pct(mr.mean_recall) + " mean recall (" + mr.condition + ", " + mr.model + ", n=" + mr.n_companies + ")."));
  }

  Promise.all([
    S.fetchJSON("data/scale_results.json"),
    S.fetchJSON("data/mining_recall_scale.json").catch(function () { return null; }),
  ]).then(function (results) {
    var data = results[0];
    var mr = results[1];
    var rows = data.rows || [];
    var naive = null;
    rows.forEach(function (r) { if (r.is_baseline && r.acc != null) naive = r.acc; });
    var models = Array.from(new Set(rows.map(function (r) { return r.model; })
      .filter(function (m) { return m && m !== "—"; })));

    var metric = document.getElementById("lb-metric");
    if (metric) metric.textContent =
      "Beat/miss/inline direction accuracy, 443 S&P 500 companies. Two labels: a free year-over-year proxy " +
      "(always available, beat-heavy) and real analyst consensus (harder, recovered for 75%). Click a model to expand.";
    var note = document.getElementById("lb-note");
    if (note) note.textContent = "";

    renderTable(rows, models, naive);
    renderMiningRecall(mr);
  }).catch(function (e) {
    console.error(e);
    S.showError(document.getElementById("leaderboard-container"), "data/scale_results.json");
  });
})();
