/* company.html?c=TICKER */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("companies.html");

  var ticker = (S.getParam("c") || "").toUpperCase();

  function metaItem(label, value) {
    var s = S.el("span");
    s.appendChild(S.el("strong", null, label + " "));
    s.appendChild(document.createTextNode(value));
    return s;
  }

  var miningScoresPromise = S.fetchJSON("data/mining_scores.json")
    .catch(function () { return null; });

  Promise.all([S.fetchJSON("data/companies.json"), miningScoresPromise]).then(function (results) {
    var data = results[0];
    var miningScoresData = results[1];
    var co = null;
    data.companies.forEach(function (c) { if (c.ticker === ticker) co = c; });

    var header = document.getElementById("company-header");
    var epsBox = document.getElementById("episodes");

    if (!co) {
      header.appendChild(S.el("h2", "page-title", "Company not found"));
      header.appendChild(S.el("p", "page-sub", "No company matches ticker \"" + ticker + "\"."));
      return;
    }
    document.title = co.name + " — SITW";

    var head = S.el("div");
    var titleRow = S.el("div", "ep-head");
    titleRow.style.marginTop = "34px";
    var h = S.el("h2", "page-title", co.name);
    h.style.margin = "0";
    var tw = S.el("span"); tw.style.display = "inline-flex"; tw.appendChild(S.chip(co.ticker, co.color));
    titleRow.appendChild(h); titleRow.appendChild(tw);
    head.appendChild(titleRow);
    head.appendChild(S.el("p", "page-sub", co.sector + " · " + co.quarters + " quarters · " + co.note));
    header.appendChild(head);

    co.episodes.forEach(function (ep) {
      var card = S.el("div", "ep");
      card.style.marginTop = "18px";

      var hd = S.el("div", "ep-head");
      hd.appendChild(S.el("span", "ep-title", ep.quarter));
      hd.appendChild(S.pill(ep.surprise_actual));
      card.appendChild(hd);

      var meta = S.el("div", "ep-meta");
      meta.appendChild(metaItem("Cutoff T:", ep.cutoff_T));
      if (ep.consensus_rev_b != null) meta.appendChild(metaItem("Consensus:", "$" + ep.consensus_rev_b + "B"));
      if (ep.actual_rev_b != null) {
        var yoy = ep.actual_yoy_pct != null ? " (" + ep.actual_yoy_pct + "% YoY)" : "";
        meta.appendChild(metaItem("Actual:", "$" + ep.actual_rev_b + "B" + yoy));
      }
      card.appendChild(meta);

      if (ep.prior_trend) {
        var pt = S.el("p", "page-sub", "Prior trend: " + ep.prior_trend);
        pt.style.margin = "0 0 4px";
        card.appendChild(pt);
      }

      if (ep.signals && ep.signals.length) {
        card.appendChild(S.el("div", "cc-sector", "Example signals mined before cutoff:"));
        var ul = S.el("ul", "ep-signals");
        ep.signals.forEach(function (sig) { ul.appendChild(S.el("li", null, sig)); });
        card.appendChild(ul);
      }

      if (ep.model_preds && ep.model_preds.length) {
        card.appendChild(S.el("div", "cc-sector", "Model predictions:"));
        var row = S.el("div", "pred-row");
        ep.model_preds.forEach(function (mp) {
          var chip = S.el("a", "pred-chip");
          chip.href = "model.html?m=" + encodeURIComponent(mp.key);
          chip.appendChild(S.avatar(mp.avatar, mp.key, 26));
          var txt = S.el("span");
          txt.appendChild(document.createTextNode(mp.condition + ": "));
          var b = S.el("strong", null, mp.pred);
          txt.appendChild(b);
          if (mp.conf != null) txt.appendChild(document.createTextNode(" @ " + Math.round(mp.conf * 100) + "%"));
          chip.appendChild(txt);
          chip.appendChild(S.el("span", mp.ok ? "ok" : "no", mp.ok ? "✓" : "✗"));
          row.appendChild(chip);
        });
        card.appendChild(row);
      }

      if (ep.note) card.appendChild(S.el("div", "ep-note", ep.note));

      var mp = S.miningPanel(ep.mining);
      if (mp) card.appendChild(mp);

      if (miningScoresData && miningScoresData.episodes && miningScoresData.episodes[ep.id]) {
        var mrs = S.miningRecallSection(miningScoresData.episodes[ep.id], miningScoresData.caveat, { showEpisode: false });
        if (mrs) card.appendChild(mrs);
      }

      epsBox.appendChild(card);
    });

    // ---- Weekly forecast trajectories for this company ----
    S.fetchJSON("data/trajectories.json").then(function (tdata) {
      var mine = tdata.items.filter(function (it) { return it.ticker === ticker; });
      if (!mine.length) return;
      var wrap = document.createElement("div");
      var h = S.el("h3", null, "Weekly forecast trajectories");
      h.style.marginTop = "36px";
      wrap.appendChild(h);
      wrap.appendChild(S.el("p", "page-sub",
        "How each model's weekly call evolved as it self-mined date-capped signals toward the cutoff — "
        + "revealing flips and how early the correct answer was locked in (lead-time)."));
      mine.forEach(function (it) { wrap.appendChild(S.trajCard(it, { showModel: true })); });
      epsBox.appendChild(wrap);
    }).catch(function (e) { console.error(e); });
  }).catch(function (e) { console.error(e); S.showError(document.getElementById("episodes"), "data/companies.json"); });
})();
