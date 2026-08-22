/* live.html — upcoming (not-yet-reported) prints; predictions open, resolve after print */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("live.html");

  // direction -> {arrow, label, cls} (BLIND YoY revenue direction)
  var DIR = {
    up:   { arrow: "▲", label: "Up",   cls: "dir-up" },
    down: { arrow: "▼", label: "Down", cls: "dir-down" },
    flat: { arrow: "▬", label: "Flat", cls: "dir-flat" },
  };

  function hasPreds(e) { return e.predictions && e.predictions.length > 0; }

  function fmtYoy(v) {
    if (typeof v !== "number") return "—";
    return (v > 0 ? "+" : "") + v + "%";
  }
  function fmtConf(v) {
    return typeof v === "number" ? Math.round(v * 100) + "%" : "—";
  }

  // one model's prediction row inside a company card
  function predRow(p) {
    var row = S.el("div", "live-pred");

    var who = S.el("div", "lp-model");
    who.appendChild(S.avatar(p.avatar, p.model, 26));
    who.appendChild(S.el("span", "lp-name", p.model));
    row.appendChild(who);

    var d = DIR[p.direction] || { arrow: "•", label: "n/a", cls: "dir-na" };
    var dir = S.el("span", "dir-tag " + d.cls);
    dir.appendChild(S.el("span", "dir-arrow", d.arrow));
    dir.appendChild(document.createTextNode(" " + d.label));
    row.appendChild(dir);

    var yoy = S.el("span", "lp-yoy", fmtYoy(p.yoy_growth_pct));
    yoy.title = "Predicted YoY revenue growth vs. the same quarter last year";
    row.appendChild(yoy);

    var conf = S.el("span", "lp-conf");
    conf.appendChild(S.el("span", "lp-conf-label", "conf"));
    conf.appendChild(document.createTextNode(" " + fmtConf(p.confidence)));
    row.appendChild(conf);

    if (p.reasoning) {
      var r = S.el("p", "lp-reason", p.reasoning);
      r.title = p.reasoning;
      row.appendChild(r);
    }
    return row;
  }

  // one company card with its blind model predictions
  function companyCard(e) {
    var card = S.el("div", "card live-card");

    var head = S.el("div", "live-card-head");
    var who = S.el("div", "model-cell");
    who.appendChild(S.chip(e.ticker, e.color));
    var nm = S.el("div");
    nm.appendChild(S.el("div", "mc-name", e.company));
    nm.appendChild(S.el("div", "mc-cond", e.quarter + " · est. " + e.report_date_est));
    who.appendChild(nm);
    head.appendChild(who);

    var badge = S.el("span", "status-predicted");
    badge.appendChild(S.el("span", "live-dot"));
    badge.appendChild(document.createTextNode("Predicted — awaiting print"));
    head.appendChild(badge);
    card.appendChild(head);

    var list = S.el("div", "live-pred-list");
    e.predictions.forEach(function (p) { list.appendChild(predRow(p)); });
    card.appendChild(list);
    return card;
  }

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

    var container = document.getElementById("live-container");

    // ---- summary table ----
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
      var predicted = hasPreds(e);
      var st = S.el("span", predicted ? "status-predicted" : "status-pending");
      st.appendChild(S.el("span", "live-dot"));
      st.appendChild(document.createTextNode(predicted ? "Predicted — awaiting print" : e.status));
      sc.appendChild(st); tr.appendChild(sc);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    container.appendChild(scroll);

    // ---- per-company blind-prediction cards ----
    var predicted = data.episodes.filter(hasPreds);
    if (predicted.length) {
      var secHead = S.el("div", "section-head");
      secHead.appendChild(S.el("h3", null, "Model predictions (blind)"));
      secHead.appendChild(S.el("p", "sub",
        "Blind forecasts made as of " + (data.as_of || "today") +
        " — no web search, no external signals. Direction is year-over-year vs. the same quarter last year."));
      container.appendChild(secHead);

      var grid = S.el("div", "live-grid");
      predicted.forEach(function (e) { grid.appendChild(companyCard(e)); });
      container.appendChild(grid);
    }

    var note = document.getElementById("live-note");
    note.textContent = (data.note || "") + " Report dates are estimates to verify against IR calendars.";
  }).catch(function (e) { console.error(e); S.showError(document.getElementById("live-container"), "data/live.json"); });
})();
