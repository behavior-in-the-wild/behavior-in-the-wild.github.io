/* companies500.html — searchable index of all 503 S&P 500 companies */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("companies500.html");

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
        window.location.href = "company500.html?c=" + encodeURIComponent(co.ticker);
      });
      tr.appendChild(S.el("td", null, co.ticker));
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
      flags.appendChild(flagsWrap);
      tr.appendChild(flags);
      table.appendChild(tr);
    });
    container.appendChild(table);
  }

  S.fetchJSON("data/companies_500.json").then(function (d) {
    allCompanies = d.companies;
    document.getElementById("co500-sub").textContent =
      d.n_companies + " S&P 500 companies. ✓ marks which data sources are available for each " +
      "(earnings-call drivers, segment revenue, real analyst consensus, CC-News prediction).";
    render(allCompanies);

    document.getElementById("co500-search").addEventListener("input", function (e) {
      var q = e.target.value.toLowerCase();
      render(allCompanies.filter(function (co) {
        return (co.ticker + " " + (co.name || "")).toLowerCase().indexOf(q) !== -1;
      }));
    });
  }).catch(function (e) { S.showError(document.getElementById("co500-container"), e); });
})();
