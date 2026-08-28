/* live.html — genuinely open (not-yet-reported) predictions at S&P-500 scale.
   Blind (no search) + fan-out over the frozen CC-News archive + agentic mining
   over the frozen CC-News archive, 3 models each, 371 companies. No accuracy
   shown -- resolves mechanically once each reports. */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("live.html");

  var CONDITION_LABEL = { blind: "Blind (no search)", ccnews: "Fan-out (CC-News)",
                           c6ccnews: "Agentic (CC-News)" };
  var allRows = [];

  function fmtConf(v) {
    return typeof v === "number" ? Math.round(v * 100) + "%" : "—";
  }

  function predChip(pred, conf) {
    var s = (pred || "").toLowerCase();
    if (s !== "beat" && s !== "miss" && s !== "inline") {
      return S.el("span", "pill pill-na", "n/a");
    }
    var chip = S.el("span", "pill pill-" + s, pred + " ");
    chip.appendChild(S.el("span", null, fmtConf(conf)));
    return chip;
  }

  // expandable detail: every model x condition prediction for one company
  function detailPanel(row) {
    var box = S.el("div", "co500-detail-block");
    var models = Object.keys(row.predictions).sort();
    models.forEach(function (m) {
      var mBlock = S.el("div");
      mBlock.style.marginBottom = "12px";
      var head = S.el("div", "model-cell");
      head.appendChild(S.avatar(m, m, 24));
      head.appendChild(S.el("strong", null, m));
      mBlock.appendChild(head);

      ["blind", "ccnews", "c6ccnews"].forEach(function (cond) {
        var p = row.predictions[m][cond];
        if (!p) return;
        var line = S.el("div");
        line.style.margin = "6px 0 6px 30px";
        var labelRow = S.el("div");
        labelRow.appendChild(S.el("span", "mc-cond", CONDITION_LABEL[cond] + ": "));
        labelRow.appendChild(predChip(p.pred, p.conf));
        line.appendChild(labelRow);
        if (p.reasoning) {
          line.appendChild(S.el("p", "co500-quote", p.reasoning));
        }
        mBlock.appendChild(line);
      });
      box.appendChild(mBlock);
    });
    return box;
  }

  function render(rows) {
    var container = document.getElementById("live-container");
    S.clear(container);
    var table = S.el("table", "co500-table");
    var thead = S.el("tr");
    ["Ticker", "Company", "Quarter", "Est. report date", ""].forEach(function (h) {
      thead.appendChild(S.el("th", null, h));
    });
    table.appendChild(thead);

    rows.forEach(function (row) {
      var tr = S.el("tr", "co500-row");
      tr.appendChild(S.el("td", null, row.ticker || "—"));
      tr.appendChild(S.el("td", null, row.company || "—"));
      tr.appendChild(S.el("td", null, row.quarter || "—"));
      tr.appendChild(S.el("td", null, row.next_report_date_est || "—"));
      var statusTd = S.el("td");
      var badge = S.el("span", "status-predicted");
      badge.appendChild(S.el("span", "live-dot"));
      badge.appendChild(document.createTextNode("Predicted — not yet reported"));
      statusTd.appendChild(badge);
      tr.appendChild(statusTd);
      table.appendChild(tr);

      var detailTr = S.el("tr");
      detailTr.style.display = "none";
      var detailTd = S.el("td");
      detailTd.colSpan = 5;
      detailTd.appendChild(detailPanel(row));
      detailTr.appendChild(detailTd);
      table.appendChild(detailTr);

      tr.addEventListener("click", function () {
        detailTr.style.display = detailTr.style.display === "none" ? "" : "none";
      });
    });
    container.appendChild(table);
  }

  S.fetchJSON("data/live_scale_500.json").then(function (data) {
    allRows = data.rows || [];

    document.getElementById("live-sub").textContent =
      allRows.length + " S&P 500 companies with an upcoming, not-yet-reported quarter — " +
      data.models.join(", ") + " × " + data.conditions.map(function (c) { return CONDITION_LABEL[c] || c; }).join(" & ") + ".";

    var banner = document.getElementById("live-banner");
    var b = S.el("div", "live-banner");
    b.appendChild(S.el("span", "live-dot"));
    var txt = S.el("span");
    txt.appendChild(S.el("strong", null, "Predictions open · resolves once the company reports. "));
    txt.appendChild(document.createTextNode(
      "Each row is frozen before its estimated report date, then scored mechanically once the company reports its actual results — contamination is structurally impossible. Click a row to see every model's call."));
    b.appendChild(txt);
    banner.appendChild(b);

    render(allRows);

    document.getElementById("live-search").addEventListener("input", function (e) {
      var q = e.target.value.toLowerCase();
      render(allRows.filter(function (r) {
        return ((r.ticker || "") + " " + (r.company || "")).toLowerCase().indexOf(q) !== -1;
      }));
    });

    document.getElementById("live-note").textContent =
      (data.note || "") + " Report dates are estimates to verify against IR calendars.";
  }).catch(function (e) {
    console.error(e);
    S.showError(document.getElementById("live-container"), "data/live_scale_500.json");
  });
})();
