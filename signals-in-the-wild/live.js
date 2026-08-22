/* live.html — upcoming (not-yet-reported) prints; predictions open, resolve after print */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("live.html");

  S.fetchJSON("data/live.json").then(function (data) {
    document.getElementById("live-sub").textContent =
      "Upcoming earnings prints where AI models and humans forecast the revenue surprise now — before the company reports.";

    var banner = document.getElementById("live-banner");
    var b = S.el("div", "live-banner");
    b.appendChild(S.el("span", "live-dot"));
    var txt = S.el("span");
    txt.appendChild(S.el("strong", null, "Predictions open · resolves after print. "));
    txt.appendChild(document.createTextNode(
      "Each row is frozen before its estimated report date, then scored mechanically from the SEC filing — contamination is structurally impossible."));
    b.appendChild(txt);
    banner.appendChild(b);

    var scroll = S.el("div", "table-scroll");
    var table = S.el("table", "data-table");
    var thead = S.el("thead"), htr = S.el("tr");
    ["Company", "Quarter", "Est. report date", "Status"].forEach(function (h) {
      htr.appendChild(S.el("th", null, h));
    });
    thead.appendChild(htr); table.appendChild(thead);

    var tbody = S.el("tbody");
    data.episodes.forEach(function (e) {
      var tr = S.el("tr");
      var cc = S.el("td");
      var cell = S.el("div", "model-cell");
      cell.appendChild(S.chip(e.ticker, e.color));
      cell.appendChild(S.el("div", "mc-name", e.company));
      cc.appendChild(cell); tr.appendChild(cc);

      tr.appendChild(S.el("td", null, e.quarter));
      tr.appendChild(S.el("td", null, e.report_date_est));

      var sc = S.el("td");
      var st = S.el("span", "status-pending");
      st.appendChild(S.el("span", "live-dot"));
      st.appendChild(document.createTextNode(e.status));
      sc.appendChild(st); tr.appendChild(sc);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    document.getElementById("live-container").appendChild(scroll);

    var note = document.getElementById("live-note");
    note.textContent = (data.note || "") + " Report dates are estimates to verify against IR calendars.";
  }).catch(function (e) { console.error(e); S.showError(document.getElementById("live-container"), "data/live.json"); });
})();
