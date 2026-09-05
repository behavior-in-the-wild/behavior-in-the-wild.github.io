/* leaderboard.html — clean S&P-500-scale results table (mirrors the paper's scale table).
   One row per (condition, model), ONE table -- proxy-label and real-consensus
   accuracy shown side by side per row. A by-model summary + filter sits above
   the full table so a reader isn't forced to scan 23 rows to find "what's the
   best condition for gpt-5.4" -- and a mining-recall section (a completely
   different metric: did the search find the real signals, not just get the
   final call right) sits below it. */
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

  // best condition per model, ranked by real-consensus balanced accuracy where
  // we have it (the more meaningful number), falling back to proxy balanced
  // accuracy for rows with no real-consensus match
  function bestPerModel(rows, models) {
    var best = {};
    models.forEach(function (m) {
      var candidates = rows.filter(function (r) { return r.model === m; });
      var top = null;
      candidates.forEach(function (r) {
        var score = r.real_balanced_acc != null ? r.real_balanced_acc : r.balanced_acc;
        if (score == null) return;
        var topScore = top ? (top.real_balanced_acc != null ? top.real_balanced_acc : top.balanced_acc) : -1;
        if (score > topScore) top = r;
      });
      best[m] = top;
    });
    return best;
  }

  function renderByModel(rows, models) {
    var wrap = document.getElementById("lb-by-model");
    S.clear(wrap);
    wrap.appendChild(S.el("h3", null, "Best condition, by model"));
    var best = bestPerModel(rows, models);
    var grid = S.el("div", "grid grid-3");
    models.forEach(function (m) {
      var r = best[m];
      var card = S.el("div", "card");
      var head = S.el("div", "model-cell");
      head.appendChild(S.avatar(m, m, 26));
      head.appendChild(S.el("strong", null, m));
      card.appendChild(head);
      if (r) {
        var line = S.el("p", "page-sub");
        line.style.marginTop = "8px";
        line.appendChild(document.createTextNode(r.condition + (r.corpus && r.corpus !== "—" ? " (" + r.corpus + ")" : "") + ": "));
        if (r.real_balanced_acc != null) {
          line.appendChild(S.el("strong", null, r.real_balanced_acc + " bal. acc."));
          line.appendChild(document.createTextNode(" real-consensus, " + pct(r.real_acc) + " dir. acc. (n=" + r.real_n + ")"));
        } else {
          line.appendChild(S.el("strong", null, r.balanced_acc + " bal. acc."));
          line.appendChild(document.createTextNode(" proxy, " + pct(r.acc) + " dir. acc. (n=" + r.n + ")"));
        }
        card.appendChild(line);
      }
      grid.appendChild(card);
    });
    wrap.appendChild(grid);

    var filterRow = S.el("div");
    filterRow.style.marginTop = "14px";
    var label = S.el("label", null, "Filter full table by model: ");
    label.style.fontSize = "13px";
    var select = S.el("select");
    select.appendChild(S.el("option", null, "All models")).value = "";
    models.forEach(function (m) {
      var opt = S.el("option", null, m);
      opt.value = m;
      select.appendChild(opt);
    });
    label.appendChild(select);
    filterRow.appendChild(label);
    wrap.appendChild(filterRow);
    return select;
  }

  function renderTable(rows, naive) {
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
  }

  function renderMiningRecall(mr) {
    var wrap = document.getElementById("lb-mining-recall");
    S.clear(wrap);
    if (!mr) return;
    wrap.appendChild(S.el("h3", null, "Mining recall — a different metric entirely"));
    wrap.appendChild(S.el("p", "page-sub", mr.note));
    var tile = S.el("div", "card");
    tile.style.marginTop = "10px";
    var big = S.el("div", "k accent", pct(mr.mean_recall));
    var lbl = S.el("div", "l", "mean recall, " + mr.condition + " (" + mr.model + "), n=" + mr.n_companies + " companies");
    tile.appendChild(big);
    tile.appendChild(lbl);
    wrap.appendChild(tile);
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
      "Metric: surprise-direction accuracy (beat / inline / miss) across 443 S&P 500 companies, 2026 quarters. " +
      "'Real acc.' rescores the same predictions against real analyst consensus where we have it (see note below).";
    var note = document.getElementById("lb-note");
    if (note) note.textContent = (data.label_note || "") + " " + (data.real_consensus_note || "");

    var select = renderByModel(rows, models);
    renderTable(rows, naive);
    select.addEventListener("change", function () {
      var m = select.value;
      renderTable(m ? rows.filter(function (r) { return r.model === m || r.is_baseline; }) : rows, naive);
    });

    var legend = S.el("p", "muted");
    legend.style.marginTop = "12px";
    legend.style.fontSize = "12.5px";
    legend.textContent =
      "No mining condition beats the naive always-beat baseline on the proxy label, and the wide spread across " +
      "models on the same condition tracks each model's prediction distribution (how often it says “beat”), not " +
      "its reasoning. 95% Wilson CIs shown in parentheses next to each accuracy figure. Lower is better for " +
      "Brier, ECE, and Surprise MAE (proxy-label only -- not computed against real consensus).";
    document.getElementById("leaderboard-container").appendChild(legend);

    renderMiningRecall(mr);
  }).catch(function (e) {
    console.error(e);
    S.showError(document.getElementById("leaderboard-container"), "data/scale_results.json");
  });
})();
