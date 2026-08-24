/* company500.html?c=TICKER — full detail for one Fortune-500 company */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("companies500.html");

  var ticker = (S.getParam("c") || "").toUpperCase();
  var DIR_COLOR = { tailwind: "#3DDC97", headwind: "#FF5C6C", neutral: "#9AA4B2" };

  function section(title) {
    var box = S.el("div", "co500-detail-block");
    box.appendChild(S.el("h3", null, title));
    return box;
  }

  Promise.all([
    S.fetchJSON("data/company_500_detail.json"),
    S.fetchJSON("data/companies_500.json"),
  ]).then(function (results) {
    var detailAll = results[0];
    var summaryAll = results[1].companies;
    var d = detailAll[ticker];
    var summary = null;
    summaryAll.forEach(function (c) { if (c.ticker === ticker) summary = c; });

    var header = document.getElementById("co500-header");
    var body = document.getElementById("co500-body");

    if (!d) {
      header.appendChild(S.el("h2", "page-title", "Company not found"));
      header.appendChild(S.el("p", "page-sub", "No company matches ticker \"" + ticker + "\"."));
      return;
    }
    document.title = d.name + " (" + ticker + ") — SITW";

    var titleRow = S.el("div", "ep-head");
    var h = S.el("h2", "page-title", d.name);
    h.style.margin = "0";
    titleRow.appendChild(h);
    titleRow.appendChild(S.chip(ticker, "#7C5CFF"));
    header.appendChild(titleRow);
    header.appendChild(S.el("p", "page-sub", d.sector || ""));

    // ---- EDGAR revenue history ----
    if (d.edgar_quarters && d.edgar_quarters.length) {
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
    if (d.consensus) {
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
    if (d.segment_revenue) {
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

    // ---- QED earnings-call drivers ----
    if (d.qed) {
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
    if (d.ccnews_predictions) {
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

    if (!d.qed && !d.segment_revenue && !d.consensus && !d.ccnews_predictions) {
      body.appendChild(S.el("p", "page-sub",
        "No scale-up data (earnings-call drivers, segment revenue, real consensus, or CC-News prediction) available yet for this company."));
    }
  }).catch(function (e) { S.showError(document.getElementById("co500-body"), e); });
})();
