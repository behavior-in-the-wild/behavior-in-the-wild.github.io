/* index.html page logic — S&P-500-scale framing (no pilot duplicity). */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("index.html");

  document.getElementById("hero-art").appendChild(S.heroArt());

  function pct(x) { return x == null ? "—" : Math.round(x * 100) + "%"; }

  Promise.all([
    S.fetchJSON("data/scale_results.json"),
    S.fetchJSON("data/mining_recall_scale.json").catch(function () { return null; }),
  ]).then(function (results) {
    var data = results[0];
    var rows = data.rows || [];
    var conds = {};
    rows.forEach(function (r) { conds[r.condition + "|" + (r.corpus || "")] = 1; });

    data.rows.forEach(function (r) {
      if (r.is_human_baseline) r.condition = "Analysts themselves (baseline)";
    });

    // ----- summary tiles (scale, not pilot) -----
    var tiles = document.getElementById("tiles");
    var render = S.renderScaleLeaderboard(document.getElementById("leaderboard-container"), data, { expanded: false });
    if (tiles) {
      S.clear(tiles);
      var items = [
        { k: "443", l: "S&P 500 companies · 2026 quarters", accent: true },
        { k: pct(render.naive), l: "Naive always-beat baseline (real consensus)" },
        { k: Object.keys(conds).length, l: "Prediction conditions evaluated" },
        { k: render.models.length, l: "Models scored so far" },
      ];
      items.forEach(function (it) {
        var t = S.el("div", "tile");
        t.appendChild(S.el("div", "k" + (it.accent ? " accent" : ""), String(it.k)));
        t.appendChild(S.el("div", "l", it.l));
        tiles.appendChild(t);
      });
    }
    var note = document.getElementById("lb-note");
    if (note) note.textContent = "This is the same leaderboard as the dedicated page -- click a model to expand its rows.";
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
