/* index.html page logic */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("index.html");

  document.getElementById("hero-art").appendChild(S.heroArt());

  // summary tiles
  S.fetchJSON("data/summary.json").then(function (sm) {
    var tiles = document.getElementById("tiles");
    var items = [
      { k: sm.models_evaluated, l: "Models × blind + feed conditions", accent: true },
      { k: sm.episodes, l: "Frozen episodes · " + sm.companies + " companies" },
      { k: sm.weekly_tracks, l: "Weekly forecast trajectories" },
      { k: sm.live_pending, l: "Live prints (predictions open)" },
    ];
    items.forEach(function (it) {
      var t = S.el("div", "tile");
      t.appendChild(S.el("div", "k" + (it.accent ? " accent" : ""), String(it.k)));
      t.appendChild(S.el("div", "l", it.l));
      tiles.appendChild(t);
    });
  }).catch(function (e) { console.error(e); });

  // compact leaderboard
  S.fetchJSON("data/leaderboard.json").then(function (data) {
    var c = document.getElementById("leaderboard-container");
    var note = document.getElementById("lb-note");
    if (note && data.note) note.textContent = data.note;

    var scroll = S.el("div", "table-scroll");
    var table = S.el("table", "data-table");
    var thead = S.el("thead"), htr = S.el("tr");
    ["#", "Model", "Blind", "Feed", "Lift", "n"].forEach(function (h) {
      var th = S.el("th", ["Lift", "n"].indexOf(h) >= 0 ? "num" : null, h);
      htr.appendChild(th);
    });
    thead.appendChild(htr); table.appendChild(thead);

    var tbody = S.el("tbody");
    data.rows.forEach(function (r) {
      var tr = S.el("tr", (r.is_baseline ? "baseline-row " : "") + "clickable");
      tr.addEventListener("click", function () { location.href = "model.html?m=" + encodeURIComponent(r.key); });
      var rk = S.el("td");
      rk.appendChild(S.el("span", "rank" + (r.rank === 1 ? " rank-1" : ""), String(r.rank)));
      tr.appendChild(rk);

      var mc = S.el("td");
      var cell = S.el("div", "model-cell");
      cell.appendChild(S.avatar(r.avatar, r.key));
      var nm = S.el("div");
      nm.appendChild(S.el("div", "mc-name", r.model));
      nm.appendChild(S.el("div", "mc-cond", r.route === "baseline" ? "condition-independent" : r.route));
      cell.appendChild(nm);
      mc.appendChild(cell); tr.appendChild(mc);

      var bc = S.el("td"); bc.appendChild(S.accBar(r.blind_acc)); tr.appendChild(bc);
      var fc = S.el("td"); fc.appendChild(S.accBar(r.fed_acc)); tr.appendChild(fc);
      var lc = S.el("td", "num");
      if (r.lift_pp == null) { lc.textContent = "—"; }
      else { lc.appendChild(S.el("span", "lift " + (r.lift_pp > 0 ? "lift-pos" : r.lift_pp < 0 ? "lift-neg" : "lift-zero"), (r.lift_pp > 0 ? "+" : "") + r.lift_pp + " pp")); }
      tr.appendChild(lc);
      tr.appendChild(S.el("td", "num", String(r.n)));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    c.appendChild(scroll);
  }).catch(function (e) { console.error(e); S.showError(document.getElementById("leaderboard-container"), "data/leaderboard.json"); });

  // companies strip
  S.fetchJSON("data/companies.json").then(function (data) {
    var strip = document.getElementById("company-strip");
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
