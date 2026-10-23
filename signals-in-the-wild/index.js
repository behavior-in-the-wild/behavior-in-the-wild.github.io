/* index.html page logic — the whole site lives on one page now: live
   predictions (flagship) + the frozen-historical leaderboard, no separate
   live.html or leaderboard.html to drift out of sync with. Just the stats +
   leaderboard breakdown for the live track, not the full per-company list. */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("index.html");

  document.getElementById("hero-art").appendChild(S.heroArt());

  function pct(x) { return x == null ? "—" : Math.round(x * 100) + "%"; }

  // ----- live-track (the flagship track) -- stats + leaderboard breakdown -----
  S.fetchJSON("data/live_scale_500.json").then(function (data) {
    var allLiveRows = data.rows || [];

    var box = document.getElementById("live-preview-table");
    if (box) box.appendChild(S.liveMetricsTable(data));
    var sub = document.getElementById("live-preview-sub");
    if (sub) {
      sub.textContent = allLiveRows.length + " S&P 500 companies with an upcoming, not-yet-reported quarter, " +
        "pre-registered before the outcome exists — frozen before the outcome exists, so leakage is structurally impossible.";
    }

    var nResolved = allLiveRows.filter(function (r) { return r.resolved; }).length;
    var lbTitle = document.getElementById("live-lb-title");
    var lbSub = document.getElementById("live-lb-sub");
    var lbBox = document.getElementById("live-preview-leaderboard");
    if (nResolved && lbBox) {
      if (lbTitle) lbTitle.textContent = "Live leaderboard (resolved so far)";
      if (lbSub) lbSub.textContent = "Same columns as the frozen-historical leaderboard below, scored on just the " +
        nResolved + " companies that have actually reported so far — small samples, so treat these as early reads, not final results.";
      S.renderScaleLeaderboard(lbBox, S.buildLiveLeaderboardData(data), { expanded: false });
    }
  }).catch(function (e) { console.error(e); S.showError(document.getElementById("live-preview-table"), "data/live_scale_500.json"); });

  // ----- frozen-historical leaderboard (full table, right here on home) -----
  S.fetchJSON("data/scale_results.json").then(function (data) {
    var rows = data.rows || [];
    var conds = {};
    rows.forEach(function (r) { conds[r.condition + "|" + (r.corpus || "")] = 1; });

    rows.forEach(function (r) {
      if (r.is_human_baseline) r.condition = "Analysts themselves (baseline)";
    });

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
    if (note) note.textContent = "Scored against real analyst consensus, recovered for 332 of 443 companies (75%).";
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
