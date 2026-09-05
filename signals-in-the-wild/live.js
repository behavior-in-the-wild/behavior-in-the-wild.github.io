/* live.html — genuinely open (not-yet-reported) predictions at S&P-500 scale.
   All 5 conditions (blind, fan-out-CC-News, agentic-CC-News, agentic-live-web,
   fan-out-live-web), 3 models each, 371 companies, all complete. No accuracy
   shown -- resolves mechanically once each reports. */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("live.html");

  var CONDITION_LABEL = { blind: "Blind (no search)", ccnews: "Fan-out (CC-News)",
                           c6ccnews: "Agentic (CC-News)", c6live: "Agentic (live web)",
                           fanoutlive: "Fan-out (live web)" };
  var allRows = [];

  function fmtConf(v) {
    return typeof v === "number" ? Math.round(v * 100) + "%" : "—";
  }

  function predChip(pred, conf, correct) {
    var s = (pred || "").toLowerCase();
    if (s !== "beat" && s !== "miss" && s !== "inline") {
      return S.el("span", "pill pill-na", "n/a");
    }
    var chip = S.el("span", "pill pill-" + s, pred + " ");
    chip.appendChild(S.el("span", null, fmtConf(conf)));
    if (correct != null) {
      var mark = S.el("span", null, correct ? " ✓" : " ✗");
      mark.style.color = correct ? "var(--beat)" : "var(--miss)";
      mark.style.fontWeight = "700";
      chip.appendChild(mark);
    }
    return chip;
  }

  function consensusPill(z) {
    var chip = S.el("span", "pill pill-inline", "consensus ");
    chip.appendChild(S.el("span", null, "$" + z.consensus));
    return chip;
  }

  // expandable detail: every model x condition prediction for one company
  function detailPanel(row) {
    var box = S.el("div", "co500-detail-block");
    if (row.zacks_consensus) {
      // same DOM shape as a model block below (avatar + name header, then an
      // indented condition-label + pill line) -- so the human baseline reads
      // visually the same as any model's row, not a smaller side-note.
      var z = row.zacks_consensus;
      var zBlock = S.el("div");
      zBlock.style.marginBottom = "12px";
      var zHead = S.el("div", "model-cell");
      zHead.appendChild(S.avatar("Human analyst consensus", "human", 24));
      zHead.appendChild(S.el("strong", null, "Human analysts (Zacks, live)"));
      zBlock.appendChild(zHead);
      var zLine = S.el("div");
      zLine.style.margin = "6px 0 6px 30px";
      var zLabelRow = S.el("div");
      zLabelRow.appendChild(S.el("span", "mc-cond", z.period + ": "));
      zLabelRow.appendChild(consensusPill(z));
      zLine.appendChild(zLabelRow);
      zLine.appendChild(S.el("p", "co500-quote",
        z.n_estimates + " estimates, range $" + z.low + "–$" + z.high +
        " (vs. $" + z.year_ago + " a year ago, " + z.yoy_growth_est + " YoY est.)"));
      zBlock.appendChild(zLine);
      box.appendChild(zBlock);
    }
    var models = Object.keys(row.predictions).sort();
    models.forEach(function (m) {
      var mBlock = S.el("div");
      mBlock.style.marginBottom = "12px";
      var head = S.el("div", "model-cell");
      head.appendChild(S.avatar(m, m, 24));
      head.appendChild(S.el("strong", null, m));
      mBlock.appendChild(head);

      ["blind", "ccnews", "c6ccnews", "c6live", "fanoutlive"].forEach(function (cond) {
        var p = row.predictions[m][cond];
        if (!p) return;
        var line = S.el("div");
        line.style.margin = "6px 0 6px 30px";
        var labelRow = S.el("div");
        labelRow.appendChild(S.el("span", "mc-cond", CONDITION_LABEL[cond] + ": "));
        labelRow.appendChild(predChip(p.pred, p.conf, p.correct));
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
      if (row.resolved) {
        statusTd.appendChild(S.pill(row.real_label));
        var note = S.el("span", "muted", " reported " + (row.actual_report_date || ""));
        note.style.fontSize = "11px";
        note.style.marginLeft = "6px";
        statusTd.appendChild(note);
      } else {
        var badge = S.el("span", row.report_slipped ? "status-pending" : "status-predicted");
        badge.appendChild(S.el("span", "live-dot"));
        badge.appendChild(document.createTextNode(
          row.report_slipped ? "Report date slipped — not yet reported" : "Predicted — not yet reported"));
        statusTd.appendChild(badge);
      }
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

    var metricsBox = document.getElementById("live-metrics-table");
    if (metricsBox) {
      metricsBox.appendChild(S.liveMetricsTable(data));
    }

    var banner = document.getElementById("live-banner");
    var b = S.el("div", "live-banner");
    b.appendChild(S.el("span", "live-dot"));
    var txt = S.el("span");
    txt.appendChild(S.el("strong", null, "Predictions open: "));
    txt.appendChild(document.createTextNode(
      "each row is frozen before its estimated report date and scored mechanically once results land — click a row to see every model's call."));
    b.appendChild(txt);
    banner.appendChild(b);

    var scoringNote = document.getElementById("live-scoring-note");
    scoringNote.textContent =
      "Unlike the leaderboard's historical proxy scoring, this track is pre-registered before outcomes exist, so " +
      "each prediction is scored directly against real analyst consensus and actual results — no leakage possible by construction.";

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
