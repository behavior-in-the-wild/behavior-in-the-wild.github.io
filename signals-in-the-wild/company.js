/* company.html?c=TICKER — unified per-company detail page.
   Base: S&P-500 scale-up sections (EDGAR history, real consensus, segment revenue,
   QED drivers, CC-News predictions), rendered for any of the 503+ tracked tickers.
   Extra: for the 5 deep-pilot companies (data/companies.json), also render the
   blind/feed episode cards, weekly forecast trajectories, and the v1 mining-recall /
   QED-recall scoring -- gated purely on whether that ticker has pilot-depth data,
   so one template serves every company without a second page. */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("companies.html");

  var ticker = (S.getParam("c") || "").toUpperCase();
  var DIR_COLOR = { tailwind: "#3DDC97", headwind: "#FF5C6C", neutral: "#9AA4B2" };

  function section(title) {
    var box = S.el("div", "co500-detail-block");
    box.appendChild(S.el("h3", null, title));
    return box;
  }

  function metaItem(label, value) {
    var s = S.el("span");
    s.appendChild(S.el("strong", null, label + " "));
    s.appendChild(document.createTextNode(value));
    return s;
  }

  // ---- pilot-depth extra: one episode card (blind/feed preds + mining panels) ----
  function renderPilotEpisode(ep, miningScoresData, qedScoresData) {
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

    if (qedScoresData && qedScoresData.episodes && qedScoresData.episodes[ep.id]) {
      var qrs = S.qedRecallSection(qedScoresData.episodes[ep.id], { showEpisode: false });
      if (qrs) card.appendChild(qrs);
    }

    return card;
  }

  var pilotPromise = S.fetchJSON("data/companies.json").catch(function () { return null; });
  var miningScoresPromise = S.fetchJSON("data/mining_scores.json").catch(function () { return null; });
  var qedScoresPromise = S.fetchJSON("data/mining_scores_qed.json").catch(function () { return null; });
  var trajPromise = S.fetchJSON("data/trajectories.json").catch(function () { return null; });

  Promise.all([
    S.fetchJSON("data/company_500_detail.json"),
    S.fetchJSON("data/companies_500.json"),
    pilotPromise, miningScoresPromise, qedScoresPromise, trajPromise,
  ]).then(function (results) {
    var detailAll = results[0];
    var summaryAll = results[1].companies;
    var pilotData = results[2];
    var miningScoresData = results[3];
    var qedScoresData = results[4];
    var trajData = results[5];

    var d = detailAll[ticker];
    var summary = null;
    summaryAll.forEach(function (c) { if (c.ticker === ticker) summary = c; });
    var pilotCo = null;
    if (pilotData) pilotData.companies.forEach(function (c) { if (c.ticker === ticker) pilotCo = c; });

    var header = document.getElementById("co500-header");
    var body = document.getElementById("co500-body");

    if (!d && !pilotCo) {
      header.appendChild(S.el("h2", "page-title", "Company not found"));
      header.appendChild(S.el("p", "page-sub", "No company matches ticker \"" + ticker + "\"."));
      return;
    }
    var name = (d && d.name) || (pilotCo && pilotCo.name) || ticker;
    document.title = name + " (" + ticker + ") — SITW";

    var titleRow = S.el("div", "ep-head");
    var h = S.el("h2", "page-title", name);
    h.style.margin = "0";
    titleRow.appendChild(h);
    titleRow.appendChild(S.chip(ticker, (pilotCo && pilotCo.color) || "#7C5CFF"));
    if (pilotCo) titleRow.appendChild(S.el("span", "pilot-badge", "pilot depth"));
    header.appendChild(titleRow);
    header.appendChild(S.el("p", "page-sub", (d && d.sector) || (pilotCo && pilotCo.sector) || ""));
    if (pilotCo && pilotCo.note) {
      header.appendChild(S.el("p", "page-sub", pilotCo.quarters + " quarters · " + pilotCo.note));
    }

    // ---- EDGAR revenue history ----
    if (d && d.edgar_quarters && d.edgar_quarters.length) {
      var eg = section("EDGAR Revenue History (ground truth)");
      var tbl = S.el("table", "co500-table");
      var thead = S.el("tr");
      ["Quarter", "Revenue", "Period", "Form", "Filed"].forEach(function (hh) { thead.appendChild(S.el("th", null, hh)); });
      tbl.appendChild(thead);
      d.edgar_quarters.slice().reverse().forEach(function (q) {
        var tr = S.el("tr");
        tr.appendChild(S.el("td", null, q.fp + " " + q.fy));
        tr.appendChild(S.el("td", null, "$" + (q.value_usd / 1e9).toFixed(2) + "B"));
        tr.appendChild(S.el("td", null, q.period_start + " → " + q.period_end));
        tr.appendChild(S.el("td", null, q.form));
        tr.appendChild(S.el("td", null, q.filed));
        tbl.appendChild(tr);
      });
      eg.appendChild(tbl);
      body.appendChild(eg);
    }

    // ---- Real consensus, if matched ----
    if (d && d.consensus) {
      var cs = section("Real Analyst Consensus (CNBC/LSEG)");
      var p = S.el("p");
      p.appendChild(document.createTextNode(
        "Actual $" + (d.consensus.actual_rev_usd / 1e9).toFixed(2) + "B vs. consensus $" +
        (d.consensus.consensus_rev_usd / 1e9).toFixed(2) + "B expected (" + d.consensus.source_note + ")."));
      cs.appendChild(p);
      var a = S.el("a", null, "source article");
      a.href = d.consensus.url; a.target = "_blank"; a.rel = "noopener";
      cs.appendChild(a);
      body.appendChild(cs);
    }

    // ---- Segment/product revenue ----
    if (d && d.segment_revenue) {
      var sg = section("Segment / Product Revenue (from SEC R-report XBRL)");
      var stbl = S.el("table", "co500-table");
      var sthead = S.el("tr");
      ["Segment", "Values"].forEach(function (hh) { sthead.appendChild(S.el("th", null, hh)); });
      stbl.appendChild(sthead);
      (d.segment_revenue.rows || []).forEach(function (r) {
        var tr = S.el("tr");
        tr.appendChild(S.el("td", null, r.segment_path));
        tr.appendChild(S.el("td", null, (r.values || []).map(function (v) { return v.toLocaleString(); }).join(", ")));
        stbl.appendChild(tr);
      });
      sg.appendChild(stbl);
      var sa = S.el("a", null, "source filing");
      sa.href = d.segment_revenue.filing_url; sa.target = "_blank"; sa.rel = "noopener";
      sg.appendChild(sa);
      body.appendChild(sg);
    }

    // ---- QED earnings-call drivers (ground truth itself, from the 500-scale extraction) ----
    if (d && d.qed) {
      var qd = section("Earnings-Call Drivers (management's own attribution, quote-verified)");
      qd.appendChild(S.el("p", "muted", d.qed.quarter));
      var qtbl = S.el("table", "co500-table");
      var qthead = S.el("tr");
      ["Family", "Driver", "Direction", "Magnitude", "Quote"].forEach(function (hh) { qthead.appendChild(S.el("th", null, hh)); });
      qtbl.appendChild(qthead);
      (d.qed.drivers || []).forEach(function (dr) {
        var tr = S.el("tr");
        tr.appendChild(S.el("td", null, dr.family));
        tr.appendChild(S.el("td", null, dr.driver));
        var dc = S.el("td", null, dr.direction);
        dc.style.color = DIR_COLOR[dr.direction] || "#9AA4B2";
        tr.appendChild(dc);
        tr.appendChild(S.el("td", null, dr.magnitude || ""));
        tr.appendChild(S.el("td", "co500-quote", "“" + dr.quote + "”"));
        qtbl.appendChild(tr);
      });
      qd.appendChild(qtbl);
      if (d.qed.transcript_url) {
        var ta = S.el("a", null, "source transcript");
        ta.href = d.qed.transcript_url; ta.target = "_blank"; ta.rel = "noopener";
        qd.appendChild(ta);
      }
      body.appendChild(qd);
    }

    // ---- CC-News 3-agent predictions ----
    if (d && d.ccnews_predictions) {
      var cc = section("CC-News 3-Agent Prediction (naive YoY-proxy label, not real consensus)");
      var actualLabel = null;
      Object.keys(d.ccnews_predictions).forEach(function (m) {
        var r = d.ccnews_predictions[m];
        if (!r) return;
        actualLabel = r.actual_proxy_label;
        var block = S.el("div");
        block.style.marginBottom = "10px";
        var ok = r.pred === r.actual_proxy_label;
        var line = S.el("div");
        line.appendChild(S.el("strong", null, m + ": "));
        var predSpan = S.el("span", null, r.pred + (ok ? " ✓" : " ✗"));
        predSpan.style.color = ok ? "#3DDC97" : "#FF5C6C";
        line.appendChild(predSpan);
        line.appendChild(document.createTextNode(" (conf " + r.conf + ", " + r.n_docs + " docs retrieved)"));
        block.appendChild(line);
        if (r.reasoning) block.appendChild(S.el("p", "muted", r.reasoning));
        cc.appendChild(block);
      });
      if (actualLabel) {
        var al = S.el("p", "muted");
        al.appendChild(S.el("strong", null, "Naive-proxy label: "));
        al.appendChild(document.createTextNode(actualLabel + " (vs prior-year same quarter, NOT real consensus)"));
        cc.appendChild(al);
      }
      body.appendChild(cc);
    }

    if (!d && pilotCo) {
      body.appendChild(S.el("p", "page-sub",
        "This company isn't in the S&P-500 scale-up dataset (e.g. not an S&P 500 constituent); " +
        "showing pilot-depth data only below."));
    } else if (d && !d.qed && !d.segment_revenue && !d.consensus && !d.ccnews_predictions && !pilotCo) {
      body.appendChild(S.el("p", "page-sub",
        "No scale-up data (earnings-call drivers, segment revenue, real consensus, or CC-News prediction) available yet for this company."));
    }

    // ---- Pilot-depth extras: blind/feed episodes + weekly trajectories + mining recall ----
    if (pilotCo) {
      var pilotWrap = S.el("div");
      pilotWrap.style.marginTop = "28px";
      var ph = S.el("h3", null, "Original case study: blind vs. feed-assisted, weekly-tracked (hand-curated)");
      pilotWrap.appendChild(ph);
      pilotWrap.appendChild(S.el("p", "page-sub",
        "This is one of the 5 original case-study companies: every quarter below was also run signal-blind vs. " +
        "hand-curated-feed-assisted across 9 models, with weekly re-forecasting for lead-time measurement. " +
        "(Blind, feed, and search-driven weekly-trajectory mining are also run at S&P-500 scale -- see the " +
        "flags on the companies page and the leaderboard.)"));
      pilotCo.episodes.forEach(function (ep) {
        pilotWrap.appendChild(renderPilotEpisode(ep, miningScoresData, qedScoresData));
      });
      body.appendChild(pilotWrap);

      if (trajData) {
        var mine = trajData.items.filter(function (it) { return it.ticker === ticker; });
        if (mine.length) {
          var wrap = S.el("div");
          wrap.style.marginTop = "24px";
          var th2 = S.el("h3", null, "Weekly forecast trajectories");
          wrap.appendChild(th2);
          wrap.appendChild(S.el("p", "page-sub",
            "How each model's weekly call evolved as it self-mined date-capped signals toward the cutoff — " +
            "revealing flips and how early the correct answer was locked in (lead-time)."));
          mine.forEach(function (it) { wrap.appendChild(S.trajCard(it, { showModel: true })); });
          body.appendChild(wrap);
        }
      }
    }
  }).catch(function (e) { S.showError(document.getElementById("co500-body"), e); });
})();
