/* index.html page logic — S&P-500-scale framing (no pilot duplicity). */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("index.html");

  document.getElementById("hero-art").appendChild(S.heroArt());

  function pct(x) { return x == null ? "—" : Math.round(x * 100) + "%"; }

  S.fetchJSON("data/scale_results.json").then(function (data) {
    var rows = data.rows || [];
    var naive = null, models = {}, conds = {};
    rows.forEach(function (r) {
      if (r.is_baseline && r.acc != null) naive = r.acc;
      if (r.model && r.model !== "—") models[r.model] = 1;
      conds[r.condition + "|" + (r.corpus || "")] = 1;
    });
    var modelList = Object.keys(models);

    // ----- summary tiles (scale, not pilot) -----
    var tiles = document.getElementById("tiles");
    if (tiles) {
      S.clear(tiles);
      var items = [
        { k: "443", l: "S&P 500 companies · 2026 quarters", accent: true },
        { k: pct(naive), l: "Naive always-beat baseline (to beat)" },
        { k: Object.keys(conds).length, l: "Prediction conditions evaluated" },
        { k: modelList.length, l: "Models scored so far" },
      ];
      items.forEach(function (it) {
        var t = S.el("div", "tile");
        t.appendChild(S.el("div", "k" + (it.accent ? " accent" : ""), String(it.k)));
        t.appendChild(S.el("div", "l", it.l));
        tiles.appendChild(t);
      });
    }

    // ----- compact preview: baselines + each model's single best row --
    // the full breakdown (23 rows) lives on the leaderboard page, not here ----
    var c = document.getElementById("leaderboard-container");
    if (c) {
      S.clear(c);
      var note = document.getElementById("lb-note");
      if (note) note.textContent = "Best result per model, real-consensus balanced accuracy where available. Full breakdown on the leaderboard.";
      var scroll = S.el("div", "table-scroll");
      var table = S.el("table", "lb-table");
      var thead = S.el("thead"), htr = S.el("tr");
      ["Condition", "Corpus", "Model", "Dir. acc.", "Bal. acc."]
        .forEach(function (h) { htr.appendChild(S.el("th", null, h)); });
      thead.appendChild(htr); table.appendChild(thead);
      var tbody = S.el("tbody");

      function addRow(r, acc, bal) {
        var tr = S.el("tr", (r.is_baseline || r.is_human_baseline) ? "lb-row-baseline" : null);
        tr.appendChild(S.el("td", null, r.condition));
        tr.appendChild(S.el("td", null, r.corpus || "—"));
        var mc = S.el("td");
        if (r.model && r.model !== "—") mc.appendChild(S.el("code", null, r.model)); else mc.textContent = "—";
        tr.appendChild(mc);
        tr.appendChild(S.el("td", null, pct(acc)));
        tr.appendChild(S.el("td", null, bal == null ? "—" : bal));
        tbody.appendChild(tr);
      }

      rows.filter(function (r) { return r.is_baseline || r.is_human_baseline; }).forEach(function (r) {
        addRow(r, r.is_human_baseline ? r.real_acc : r.acc, r.is_human_baseline ? r.real_balanced_acc : r.balanced_acc);
      });
      modelList.forEach(function (m) {
        var best = null;
        rows.filter(function (r) { return r.model === m; }).forEach(function (r) {
          var score = r.real_balanced_acc != null ? r.real_balanced_acc : r.balanced_acc;
          if (score == null) return;
          var topScore = best ? (best.real_balanced_acc != null ? best.real_balanced_acc : best.balanced_acc) : -1;
          if (score > topScore) best = r;
        });
        if (best) addRow(best, best.real_acc != null ? best.real_acc : best.acc,
          best.real_balanced_acc != null ? best.real_balanced_acc : best.balanced_acc);
      });

      table.appendChild(tbody);
      scroll.appendChild(table);
      c.appendChild(scroll);
    }
  }).catch(function (e) { console.error(e); S.showError(document.getElementById("leaderboard-container"), "data/scale_results.json"); });

  // ----- companies strip (featured pilot examples with full episode detail) -----
  S.fetchJSON("data/companies.json").then(function (data) {
    var strip = document.getElementById("company-strip");
    if (!strip) return;
    data.companies.forEach(function (co) {
      var a = S.el("a", "card company-card");
      a.href = "company.html?c=" + encodeURIComponent(co.ticker);
      var head = S.el("div", "cc-head");
      var left = S.el("div");
      left.appendChild(S.el("div", "cc-name", co.name));
      left.appendChild(S.el("div", "cc-sector", co.sector));
      head.appendChild(left);
      head.appendChild(S.chip(co.ticker, co.color));
      a.appendChild(head);
      a.appendChild(S.el("div", "cc-note", co.quarters + " quarters · frozen historical"));
      var qs = S.el("div", "cc-quarters");
      co.episodes.forEach(function (ep) { qs.appendChild(S.pill(ep.surprise_actual)); });
      a.appendChild(qs);
      strip.appendChild(a);
    });
  }).catch(function (e) { console.error(e); });
})();
