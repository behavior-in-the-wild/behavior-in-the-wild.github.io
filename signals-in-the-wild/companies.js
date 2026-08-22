/* companies.html */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("companies.html");

  S.fetchJSON("data/companies.json").then(function (data) {
    var grid = document.getElementById("companies-grid");
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

      // mini result: latest quarter outcome + YoY
      var latest = co.episodes[co.episodes.length - 1];
      var mini = S.el("div", "ep-meta");
      var q = S.el("span");
      q.appendChild(S.el("strong", null, "Latest: "));
      q.appendChild(document.createTextNode(latest.quarter.split(" (")[0]));
      mini.appendChild(q);
      if (latest.actual_rev_b != null) {
        var rv = S.el("span");
        rv.appendChild(S.el("strong", null, "Actual: "));
        rv.appendChild(document.createTextNode("$" + latest.actual_rev_b + "B"));
        mini.appendChild(rv);
      }
      a.appendChild(mini);

      a.appendChild(S.el("div", "cc-note", co.note));

      var qs = S.el("div", "cc-quarters");
      co.episodes.forEach(function (ep) {
        var wrap = S.el("span");
        wrap.style.display = "inline-flex";
        wrap.appendChild(S.pill(ep.surprise_actual));
        qs.appendChild(wrap);
      });
      a.appendChild(qs);

      grid.appendChild(a);
    });
  }).catch(function (e) { console.error(e); S.showError(document.getElementById("companies-grid"), "data/companies.json"); });
})();
