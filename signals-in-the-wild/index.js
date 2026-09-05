/* index.html page logic — the whole site lives on one page now: live
   predictions (flagship, full table included) + the frozen-historical
   leaderboard, no separate live.html or leaderboard.html to drift out of
   sync with. */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("index.html");

  document.getElementById("hero-art").appendChild(S.heroArt());

  function pct(x) { return x == null ? "—" : Math.round(x * 100) + "%"; }

  var CONDITION_LABEL = { blind: "Blind (no search)", ccnews: "Fan-out (CC-News)",
                           c6ccnews: "Agentic (CC-News)", c6live: "Agentic (live web)",
                           fanoutlive: "Fan-out (live web)" };

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
  function liveDetailPanel(row) {
    var box = S.el("div", "co500-detail-block");
    if (row.zacks_consensus) {
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

  function renderLiveTable(rows) {
    var container = document.getElementById("live-container");
    if (!container) return;
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
      detailTd.appendChild(liveDetailPanel(row));
      detailTr.appendChild(detailTd);
      table.appendChild(detailTr);

      tr.addEventListener("click", function () {
        detailTr.style.display = detailTr.style.display === "none" ? "" : "none";
      });
    });
    container.appendChild(table);
  }

  // ----- live-track (the flagship track) -- stats, leaderboard breakdown,
  // then the full 371-company table, all directly on the homepage -----
  var allLiveRows = [];
  S.fetchJSON("data/live_scale_500.json").then(function (data) {
    allLiveRows = data.rows || [];

    var box = document.getElementById("live-preview-table");
    if (box) box.appendChild(S.liveMetricsTable(data));
    var sub = document.getElementById("live-preview-sub");
    if (sub) {
      sub.textContent = allLiveRows.length + " S&P 500 companies with an upcoming, not-yet-reported quarter, " +
        "pre-registered before the outcome exists — frozen before the outcome exists, so leakage is structurally impossible.";
    }

    var nResolved = allLiveRows.filter(function (r) { return r.resolved; }).length;
    var lbTitle = document.getElementById("live-lb-title");
    var lbSub = document.getElementById("live-lb-sub");
    var lbBox = document.getElementById("live-preview-leaderboard");
    if (nResolved && lbBox) {
      if (lbTitle) lbTitle.textContent = "Live leaderboard (resolved so far)";
      if (lbSub) lbSub.textContent = "Same columns as the frozen-historical leaderboard below, scored on just the " +
        nResolved + " companies that have actually reported so far — small samples, so treat these as early reads, not final results.";
      S.renderScaleLeaderboard(lbBox, S.buildLiveLeaderboardData(data), { expanded: false });
    }

    var banner = document.getElementById("live-banner");
    if (banner) {
      var b = S.el("div", "live-banner");
      b.appendChild(S.el("span", "live-dot"));
      var txt = S.el("span");
      txt.appendChild(S.el("strong", null, "Predictions open: "));
      txt.appendChild(document.createTextNode(
        "each row is frozen before its estimated report date and scored mechanically once results land — click a row to see every model's call."));
      b.appendChild(txt);
      banner.appendChild(b);
    }

    var scoringNote = document.getElementById("live-scoring-note");
    if (scoringNote) {
      scoringNote.textContent =
        "Unlike the leaderboard's historical proxy scoring, this track is pre-registered before outcomes exist, so " +
        "each prediction is scored directly against real analyst consensus and actual results — no leakage possible by construction.";
    }

    renderLiveTable(allLiveRows);

    var searchInput = document.getElementById("live-search");
    if (searchInput) {
      searchInput.addEventListener("input", function (e) {
        var q = e.target.value.toLowerCase();
        renderLiveTable(allLiveRows.filter(function (r) {
          return ((r.ticker || "") + " " + (r.company || "")).toLowerCase().indexOf(q) !== -1;
        }));
      });
    }

    var liveNote = document.getElementById("live-note");
    if (liveNote) liveNote.textContent = (data.note || "") + " Report dates are estimates to verify against IR calendars.";
  }).catch(function (e) { console.error(e); S.showError(document.getElementById("live-preview-table"), "data/live_scale_500.json"); });

  // ----- frozen-historical leaderboard (full table, right here on home) -----
  S.fetchJSON("data/scale_results.json").then(function (data) {
    var rows = data.rows || [];
    var conds = {};
    rows.forEach(function (r) { conds[r.condition + "|" + (r.corpus || "")] = 1; });

    rows.forEach(function (r) {
      if (r.is_human_baseline) r.condition = "Analysts themselves (baseline)";
    });

    var tiles = document.getElementById("tiles");
    var render = S.renderScaleLeaderboard(document.getElementById("leaderboard-container"), data, { expanded: false });
    if (tiles) {
      S.clear(tiles);
      var items = [
        { k: "443", l: "S&P 500 companies · 2026 quarters", accent: true },
        { k: pct(render.naive), l: "Naive always-beat baseline (real consensus)" },
        { k: Object.keys(conds).length, l: "Prediction conditions evaluated" },
        { k: render.models.length, l: "Models scored so far" },
      ];
      items.forEach(function (it) {
        var t = S.el("div", "tile");
        t.appendChild(S.el("div", "k" + (it.accent ? " accent" : ""), String(it.k)));
        t.appendChild(S.el("div", "l", it.l));
        tiles.appendChild(t);
      });
    }
    var note = document.getElementById("lb-note");
    if (note) note.textContent = "Scored against real analyst consensus, recovered for 332 of 443 companies (75%).";
  }).catch(function (e) { console.error(e); S.showError(document.getElementById("leaderboard-container"), "data/scale_results.json"); });

  // ----- companies strip (featured pilot examples with full episode detail) -----
  S.fetchJSON("data/companies.json").then(function (data) {
    var strip = document.getElementById("company-strip");
    if (!strip) return;
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
      a.appendChild(S.el("div", "cc-note", co.quarters + " quarters · frozen historical"));
      var qs = S.el("div", "cc-quarters");
      co.episodes.forEach(function (ep) { qs.appendChild(S.pill(ep.surprise_actual)); });
      a.appendChild(qs);
      strip.appendChild(a);
    });
  }).catch(function (e) { console.error(e); });
})();
