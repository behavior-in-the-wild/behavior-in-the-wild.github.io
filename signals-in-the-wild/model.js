/* model.html?m=KEY */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("leaderboard.html");

  var key = S.getParam("m") || "";

  function tile(k, l, accent) {
    var t = S.el("div", "tile");
    t.appendChild(S.el("div", "k" + (accent ? " accent" : ""), k));
    t.appendChild(S.el("div", "l", l));
    return t;
  }

  S.fetchJSON("data/models.json").then(function (data) {
    var m = data.models[key];
    var header = document.getElementById("model-header");
    var stats = document.getElementById("model-stats");

    if (!m) {
      header.appendChild(S.el("h2", "page-title", "Model not found"));
      header.appendChild(S.el("p", "page-sub", "No model matches \"" + key + "\"."));
      return;
    }
    document.title = m.name + " — SITW";

    var head = S.el("div"); head.style.marginTop = "34px";
    var row = S.el("div", "model-cell");
    var big = S.avatar(m.avatar, m.key, 56); row.appendChild(big);
    var nm = S.el("div");
    var t = S.el("h2", "page-title", m.name); t.style.margin = "0";
    nm.appendChild(t);
    var sub = S.el("div", "page-sub");
    sub.appendChild(S.typeTag(m.type));
    sub.appendChild(document.createTextNode(" " + m.condition));
    nm.appendChild(sub);
    row.appendChild(nm);
    head.appendChild(row);
    header.appendChild(head);

    stats.appendChild(tile(S.fmtPct(m.accuracy), "Surprise accuracy", true));
    stats.appendChild(tile(S.fmtSkill(m.skill_pp), "Skill vs analyst consensus"));
    stats.appendChild(tile(S.fmtBrier(m.brier), "Calibration (Brier ↓)"));
    stats.appendChild(tile(m.correct + " / " + m.n, "Correct predictions"));

    document.getElementById("ep-title").textContent = "Per-episode predictions vs. actual";

    var box = document.getElementById("model-episodes");
    var table = S.el("table", "data-table");
    var thead = S.el("thead"), htr = S.el("tr");
    ["Company", "Quarter", "Prediction", "Confidence", "Actual", "Result"].forEach(function (h, i) {
      var th = S.el("th", i === 3 ? "num" : null, h); htr.appendChild(th);
    });
    thead.appendChild(htr); table.appendChild(thead);
    var tbody = S.el("tbody");
    m.episodes.forEach(function (e) {
      var tr = S.el("tr", "clickable");
      tr.addEventListener("click", function () { location.href = "company.html?c=" + encodeURIComponent(e.ticker); });
      tr.appendChild(S.el("td", null, e.company));
      tr.appendChild(S.el("td", null, e.quarter.split(" (")[0]));
      var pc = S.el("td"); pc.appendChild(S.pill(e.pred)); tr.appendChild(pc);
      tr.appendChild(S.el("td", "num", e.conf != null ? Math.round(e.conf * 100) + "%" : "—"));
      var ac = S.el("td"); ac.appendChild(S.pill(e.actual)); tr.appendChild(ac);
      var rc = S.el("td");
      rc.appendChild(S.el("span", e.ok ? "ok" : "no", e.ok ? "✓ hit" : "✗ miss"));
      rc.firstChild.style.color = e.ok ? "var(--beat)" : "var(--miss)";
      rc.firstChild.style.fontWeight = "800";
      tr.appendChild(rc);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    box.appendChild(table);

    // Mining transparency: show search queries + cited sources per episode
    var mined = m.episodes.filter(function (e) { return e.mining; });
    if (mined.length) {
      var wrap = document.createElement("div");
      var h = S.el("h3", null, "What the model searched");
      h.style.marginTop = "34px";
      wrap.appendChild(h);
      wrap.appendChild(S.el("p", "page-sub", "Tier-A open-web mining: the queries gpt-4o-mini issued (date-filtered to cd_max ≤ cutoff) and the sources it cited."));
      mined.forEach(function (e) {
        var card = S.el("div", "ep"); card.style.marginTop = "16px";
        var hd = S.el("div", "ep-head");
        var t = S.el("span", "ep-title");
        t.appendChild(document.createTextNode(e.company + " · " + e.quarter.split(" (")[0] + " "));
        t.appendChild(S.pill(e.actual));
        hd.appendChild(t);
        card.appendChild(hd);
        var mp = S.miningPanel(e.mining);
        if (mp) { mp.style.borderTop = "none"; mp.style.paddingTop = "0"; card.appendChild(mp); }
        wrap.appendChild(card);
      });
      box.parentNode.insertBefore(wrap, box.nextSibling);
    }
  }).catch(function (e) { console.error(e); S.showError(document.getElementById("model-episodes"), "data/models.json"); });
})();
