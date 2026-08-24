/* leaderboard500.html — Fortune-500 scale-up CC-News leaderboard, with explicit naive-baseline comparison */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("leaderboard500.html");

  S.fetchJSON("data/leaderboard_500.json").then(function (d) {
    var banner = document.getElementById("caveat-banner");
    var warn = S.el("div");
    warn.appendChild(S.el("strong", null, "Read this before the numbers: "));
    warn.appendChild(document.createTextNode(d.warning));
    banner.appendChild(warn);
    var caveat = S.el("p", "muted");
    caveat.style.marginTop = "8px";
    caveat.style.fontSize = "12.5px";
    caveat.appendChild(document.createTextNode(d.label_caveat));
    banner.appendChild(caveat);

    var container = document.getElementById("lb500-container");
    var table = S.el("table", "lb-table");
    var thead = S.el("tr");
    ["Model", "Accuracy", "Correct / Total", "% predicted 'beat'"].forEach(function (h) {
      thead.appendChild(S.el("th", null, h));
    });
    table.appendChild(thead);

    // naive baseline row first, tagged clearly as a reference, not an evaluated model
    var nb = d.naive_always_beat_baseline;
    var baseRow = S.el("tr", "lb-row-baseline");
    baseRow.appendChild(S.el("td", null, "Always predict \"beat\" (naive baseline)"));
    baseRow.appendChild(S.el("td", null, Math.round(nb.accuracy * 100) + "%"));
    baseRow.appendChild(S.el("td", null, nb.correct + " / " + nb.total));
    baseRow.appendChild(S.el("td", null, "100%"));
    table.appendChild(baseRow);

    d.models.slice().sort(function (a, b) { return b.accuracy - a.accuracy; }).forEach(function (m) {
      var tr = S.el("tr");
      var below = m.accuracy < nb.accuracy;
      tr.appendChild(S.el("td", null, m.model));
      var accCell = S.el("td", below ? "lb-below-baseline" : null,
        Math.round(m.accuracy * 100) + "%" + (below ? " (below baseline)" : ""));
      tr.appendChild(accCell);
      tr.appendChild(S.el("td", null, m.correct + " / " + m.total));
      tr.appendChild(S.el("td", null, Math.round(m.pct_predicted_beat * 100) + "%"));
      table.appendChild(tr);
    });
    container.appendChild(table);
  }).catch(function (e) { S.showError(document.getElementById("lb500-container"), e); });
})();
