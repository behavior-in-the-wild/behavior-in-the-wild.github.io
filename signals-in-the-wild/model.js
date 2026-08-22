/* model.html?m=MODEL_NAME */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("leaderboard.html");

  var key = S.getParam("m") || "";
  var cond = "fed"; // active condition toggle

  function tile(k, l, accent) {
    var t = S.el("div", "tile");
    t.appendChild(S.el("div", "k" + (accent ? " accent" : ""), k));
    t.appendChild(S.el("div", "l", l));
    return t;
  }

  function condToggle(onChange) {
    var wrap = S.el("div", "toggle");
    [["blind", "Signal-blind"], ["fed", "Feed-assisted"]].forEach(function (o) {
      var b = S.el("button", "toggle-btn" + (o[0] === cond ? " active" : ""), o[1]);
      b.type = "button";
      b.addEventListener("click", function () {
        cond = o[0];
        Array.prototype.forEach.call(wrap.children, function (c) { c.classList.remove("active"); });
        b.classList.add("active");
        onChange();
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function renderEpisodes(m, box) {
    S.clear(box);
    var table = S.el("table", "data-table");
    var thead = S.el("thead"), htr = S.el("tr");
    ["Company", "Quarter", "Prediction", "Confidence", "Actual", "Result"].forEach(function (h, i) {
      htr.appendChild(S.el("th", i === 3 ? "num" : null, h));
    });
    thead.appendChild(htr); table.appendChild(thead);
    var tbody = S.el("tbody");
    m.episodes.forEach(function (e) {
      var c = e[cond];
      var tr = S.el("tr", "clickable");
      tr.addEventListener("click", function () { location.href = "company.html?c=" + encodeURIComponent(e.ticker); });
      tr.appendChild(S.el("td", null, e.company));
      tr.appendChild(S.el("td", null, e.quarter.split(" (")[0]));
      var pc = S.el("td"); pc.appendChild(S.pill(c.pred)); tr.appendChild(pc);
      tr.appendChild(S.el("td", "num", c.conf != null ? Math.round(c.conf * 100) + "%" : "—"));
      var ac = S.el("td"); ac.appendChild(S.pill(e.actual)); tr.appendChild(ac);
      var rc = S.el("td");
      var mark = S.el("span", c.ok ? "ok" : "no", c.ok ? "✓ hit" : "✗ miss");
      mark.style.color = c.ok ? "var(--beat)" : "var(--miss)";
      mark.style.fontWeight = "800";
      rc.appendChild(mark); tr.appendChild(rc);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    box.appendChild(table);
  }

  var miningScoresPromise = S.fetchJSON("data/mining_scores.json")
    .catch(function () { return null; });

  Promise.all([S.fetchJSON("data/models.json"), miningScoresPromise]).then(function (results) {
    var data = results[0];
    var miningScoresData = results[1];
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
    row.appendChild(S.avatar(m.avatar, m.key, 56));
    var nm = S.el("div");
    var t = S.el("h2", "page-title", m.name); t.style.margin = "0";
    nm.appendChild(t);
    var sub = S.el("div", "page-sub");
    sub.appendChild(S.typeTag(m.type));
    sub.appendChild(document.createTextNode(" " + (m.route || "")));
    nm.appendChild(sub);
    row.appendChild(nm);
    head.appendChild(row);
    header.appendChild(head);

    var lift = (m.blind.acc != null && m.fed.acc != null) ? Math.round((m.fed.acc - m.blind.acc) * 100) : null;
    stats.appendChild(tile(S.fmtPct(m.blind.acc), "Signal-blind accuracy"));
    stats.appendChild(tile(S.fmtPct(m.fed.acc), "Feed-assisted accuracy", true));
    stats.appendChild(tile(lift == null ? "—" : (lift > 0 ? "+" : "") + lift + " pp", "Lift from signals"));
    stats.appendChild(tile(S.fmtBrier(m.fed.brier), "Feed calibration (Brier ↓)"));

    var epTitle = document.getElementById("ep-title");
    epTitle.textContent = "Per-episode predictions vs. actual";
    var tg = condToggle(function () { renderEpisodes(m, box); });
    epTitle.parentNode.insertBefore(tg, epTitle.nextSibling);

    var box = document.getElementById("model-episodes");
    renderEpisodes(m, box);

    // ---- Weekly trajectories for this model ----
    S.fetchJSON("data/trajectories.json").then(function (tdata) {
      var mine = tdata.items.filter(function (it) { return it.model === m.name; });
      if (!mine.length) return;
      var wrap = document.createElement("div");
      var h = S.el("h3", null, "Weekly forecast trajectories");
      h.style.marginTop = "40px";
      wrap.appendChild(h);
      wrap.appendChild(S.el("p", "page-sub",
        "Sequential SITW runs: this model re-forecast each episode weekly, self-mining date-capped web signals. "
        + "Pills show the weekly call, the line is stated confidence, and rings mark flips. Lead-time = how early it locked the correct answer."));
      mine.forEach(function (it) { wrap.appendChild(S.trajCard(it, { showModel: false })); });
      box.parentNode.insertBefore(wrap, box.nextSibling);
    }).catch(function (e) { console.error(e); });

    // ---- Mining Recall / DDS (preliminary v1) for this model ----
    if (miningScoresData && miningScoresData.episodes) {
      var epScores = Object.keys(miningScoresData.episodes)
        .map(function (id) { return miningScoresData.episodes[id]; })
        .filter(function (es) {
          var conds = es.conditions || {};
          return Object.keys(conds).some(function (c) { return conds[c].model === m.name; });
        });
      if (epScores.length) {
        var mwrap = document.createElement("div");
        var mh = S.el("h3", null, "Mining Recall (preliminary)");
        mh.style.marginTop = "40px";
        mwrap.appendChild(mh);
        mwrap.appendChild(S.el("p", "page-sub",
          "v1 rule-based recall / Driver-Decomposition-Score against a hand-researched gold demand-driver "
          + "map, per episode this model was scored on."));
        epScores.forEach(function (es, i) {
          mwrap.appendChild(S.miningRecallSection(es, miningScoresData.caveat, { showEpisode: true, showCaveat: i === 0 }));
        });
        box.parentNode.insertBefore(mwrap, box.nextSibling);
      }
    }

  }).catch(function (e) { console.error(e); S.showError(document.getElementById("model-episodes"), "data/models.json"); });
})();
