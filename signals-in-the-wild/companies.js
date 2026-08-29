/* companies.html — unified searchable index: S&P 500 scale-up companies (blind,
   feed, and weekly-trajectory mining all run at scale -- see the flags column) +
   the 5 original hand-curated case-study companies (TEAM/Atlassian isn't an S&P
   500 constituent, so it's merged in separately rather than being silently dropped) */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("companies.html");

  var allCompanies = [];

  function flag(has, label) {
    var s = S.el("span", "co500-flag");
    s.textContent = (has ? "✓ " : "— ") + label;
    if (!has) s.style.opacity = "0.35";
    return s;
  }

  function render(companies) {
    var container = document.getElementById("co500-container");
    S.clear(container);
    var table = S.el("table", "co500-table");
    var thead = S.el("tr");
    ["Ticker", "Name", "Sector", "Latest Quarter", "Revenue", "Data available"].forEach(function (h) {
      thead.appendChild(S.el("th", null, h));
    });
    table.appendChild(thead);

    companies.forEach(function (co) {
      var tr = S.el("tr", "co500-row");
      tr.addEventListener("click", function () {
        window.location.href = "company.html?c=" + encodeURIComponent(co.ticker);
      });
      var tCell = S.el("td");
      tCell.appendChild(document.createTextNode(co.ticker + " "));
      if (co.pilot_depth) tCell.appendChild(S.el("span", "pilot-badge", "case study"));
      tr.appendChild(tCell);
      tr.appendChild(S.el("td", null, co.name || ""));
      tr.appendChild(S.el("td", null, co.sector || ""));
      tr.appendChild(S.el("td", null, co.latest_quarter || "—"));
      tr.appendChild(S.el("td", null, co.latest_rev_b != null ? "$" + co.latest_rev_b + "B" : "—"));
      var flags = S.el("td");
      var flagsWrap = S.el("div");
      flagsWrap.style.display = "flex"; flagsWrap.style.gap = "8px"; flagsWrap.style.flexWrap = "wrap";
      flagsWrap.appendChild(flag(co.has_qed_drivers, "calls"));
      flagsWrap.appendChild(flag(co.has_segment_revenue, "segments"));
      flagsWrap.appendChild(flag(co.has_real_consensus, "consensus"));
      flagsWrap.appendChild(flag(co.has_ccnews_prediction, "CC-News"));
      flagsWrap.appendChild(flag(co.has_blind_scale, "blind"));
      flagsWrap.appendChild(flag(co.has_feed_scale, "feed"));
      flagsWrap.appendChild(flag(co.has_weekly_scale, "weekly"));
      flagsWrap.appendChild(flag(co.has_zacks_live_consensus, "Zacks (live)"));
      flags.appendChild(flagsWrap);
      tr.appendChild(flags);
      table.appendChild(tr);
    });
    container.appendChild(table);
  }

  Promise.all([
    S.fetchJSON("data/companies_500.json"),
    S.fetchJSON("data/companies.json"),
  ]).then(function (results) {
    var d500 = results[0];
    var pilot = results[1].companies;
    var byTicker = {};
    d500.companies.forEach(function (co) { byTicker[co.ticker] = co; });
    pilot.forEach(function (p) {
      var latest = p.episodes[p.episodes.length - 1];
      if (byTicker[p.ticker]) {
        byTicker[p.ticker].pilot_depth = true;
      } else {
        // not an S&P 500 constituent (e.g. Atlassian) -- add it in directly
        byTicker[p.ticker] = {
          ticker: p.ticker, name: p.name, sector: p.sector,
          latest_quarter: latest.quarter.split(" (")[0],
          latest_rev_b: latest.actual_rev_b,
          has_qed_drivers: false, has_segment_revenue: false,
          has_real_consensus: false, has_ccnews_prediction: false,
          pilot_depth: true,
        };
      }
    });
    allCompanies = Object.keys(byTicker).map(function (t) { return byTicker[t]; }).sort(function (a, b) {
      // pilot-depth companies first (otherwise they're invisible, scattered
      // alphabetically among 500+ rows) -- ticker order within each group
      if (!!a.pilot_depth !== !!b.pilot_depth) return a.pilot_depth ? -1 : 1;
      return a.ticker.localeCompare(b.ticker);
    });

    document.getElementById("co500-sub").textContent =
      allCompanies.length + " companies (S&P 500 + the " + pilot.length + " original hand-curated case studies). " +
      "'case study' = one of the 5 original hand-curated companies (signals, narrative writeup); " +
      "✓ marks which data sources/conditions are available at scale for that company (earnings-call " +
      "drivers, segment revenue, real analyst consensus, CC-News prediction, blind, feed, weekly-trajectory mining).";
    render(allCompanies);

    document.getElementById("co500-search").addEventListener("input", function (e) {
      var q = e.target.value.toLowerCase();
      render(allCompanies.filter(function (co) {
        return (co.ticker + " " + (co.name || "")).toLowerCase().indexOf(q) !== -1;
      }));
    });
  }).catch(function (e) { S.showError(document.getElementById("co500-container"), e); });
})();
