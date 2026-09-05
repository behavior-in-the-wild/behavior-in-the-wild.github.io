/* SITW shared helpers, SVG builders, nav + footer injection.
   All dynamic text uses textContent / DOM APIs (never innerHTML with data). */
(function (global) {
  "use strict";

  var REPO_URL = "https://github.com/ykumar_adobe/signals-in-the-wild"; // code repo (private until published)
  var CONTACT = "behavior-in-the-wild@googlegroups.com";
  var AUTHORS = "Yaman Kumar Singla, Balaji Krishnamurthy";

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function frag() { return document.createDocumentFragment(); }
  function clear(node) { if (node) node.textContent = ""; }

  var SVGNS = "http://www.w3.org/2000/svg";
  function svg(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    return n;
  }

  // ----- Avatar (colored circle + monogram) -----
  var AVATAR_COLORS = {
    "gpt-4o-mini-blind": "#7C5CFF",
    "gpt-4o-mini-mined": "#3DDC97",
    "human-consensus": "#3DDC97",
    "naive-beat": "#F5B23D",
  };
  function avatarColor(key, fallback) {
    return AVATAR_COLORS[key] || fallback || "#5B6577";
  }
  function avatar(label, key, size) {
    size = size || 34;
    var color = avatarColor(key);
    var s = svg("svg", { width: size, height: size, viewBox: "0 0 40 40", "class": "avatar", role: "img" });
    var title = svg("title"); title.textContent = label || ""; s.appendChild(title);
    s.appendChild(svg("circle", { cx: 20, cy: 20, r: 19, fill: color, opacity: "0.18" }));
    s.appendChild(svg("circle", { cx: 20, cy: 20, r: 19, fill: "none", stroke: color, "stroke-width": "1.5" }));
    var t = svg("text", { x: 20, y: 20, "text-anchor": "middle", "dominant-baseline": "central",
      "font-family": "system-ui, sans-serif", "font-size": (label && label.length > 2 ? 12 : 15),
      "font-weight": "800", fill: color });
    t.textContent = label || "?";
    s.appendChild(t);
    return s;
  }

  // ----- ticker chip -----
  function chip(ticker, color) {
    var c = el("span", "chip", ticker);
    c.style.background = color || "#5B6577";
    return c;
  }

  // ----- outcome pill -----
  function pill(outcome) {
    var s = (outcome || "").toLowerCase();
    if (s !== "beat" && s !== "miss" && s !== "inline") {
      return el("span", "pill pill-na", "n/a");
    }
    return el("span", "pill pill-" + s, outcome);
  }

  // ----- type tag -----
  function typeTag(type) {
    var t = (type || "").toLowerCase();
    var cls = t === "llm" ? "tag-llm" : t === "human" ? "tag-human" : "tag-baseline";
    return el("span", "tag " + cls, type);
  }

  // ----- accuracy bar -----
  function accBar(acc) {
    var box = el("div", "accbar");
    var track = el("div", "track");
    var fill = el("div", "fill");
    fill.style.width = (acc != null ? Math.round(acc * 100) : 0) + "%";
    track.appendChild(fill);
    box.appendChild(track);
    box.appendChild(el("span", "val", acc != null ? Math.round(acc * 100) + "%" : "—"));
    return box;
  }

  // ----- small SVG bar chart: data = [{label,value,color}], value 0..1 -----
  function barChart(data, opts) {
    opts = opts || {};
    var w = opts.width || 320, rowH = 30, pad = 8, labelW = opts.labelW || 96;
    var h = data.length * rowH + pad * 2;
    var s = svg("svg", { width: "100%", viewBox: "0 0 " + w + " " + h, role: "img" });
    var barMax = w - labelW - 60;
    data.forEach(function (d, i) {
      var y = pad + i * rowH;
      var lab = svg("text", { x: 0, y: y + 15, "font-size": 12, fill: "#9AA4B2", "font-family": "system-ui" });
      lab.textContent = d.label; s.appendChild(lab);
      s.appendChild(svg("rect", { x: labelW, y: y + 5, width: barMax, height: 12, rx: 6, fill: "#1C2230" }));
      s.appendChild(svg("rect", { x: labelW, y: y + 5, width: Math.max(2, barMax * (d.value || 0)), height: 12, rx: 6, fill: d.color || "#3DDC97" }));
      var v = svg("text", { x: labelW + barMax + 8, y: y + 15, "font-size": 12, fill: "#E6EAF0", "font-family": "ui-monospace, monospace", "font-weight": "700" });
      v.textContent = (opts.fmt ? opts.fmt(d.value) : Math.round((d.value || 0) * 100) + "%"); s.appendChild(v);
    });
    return s;
  }

  // ----- hero illustration: signal dots -> rising sparkline burst -----
  function heroArt() {
    var s = svg("svg", { viewBox: "0 0 420 300", width: "100%", role: "img", "aria-label": "Signals flowing into a rising revenue line" });
    var defs = svg("defs");
    var grad = svg("linearGradient", { id: "hg", x1: "0", y1: "1", x2: "1", y2: "0" });
    grad.appendChild(svg("stop", { offset: "0", "stop-color": "#3DDC97" }));
    grad.appendChild(svg("stop", { offset: "1", "stop-color": "#7C5CFF" }));
    defs.appendChild(grad); s.appendChild(defs);
    // scattered signal dots on the left
    var dots = [[30,60],[55,120],[24,170],[70,210],[48,250],[90,90],[100,160],[80,40]];
    dots.forEach(function (p, i) {
      s.appendChild(svg("circle", { cx: p[0], cy: p[1], r: 4 + (i % 3), fill: "#9AA4B2", opacity: 0.5 }));
      s.appendChild(svg("line", { x1: p[0], y1: p[1], x2: 150, y2: 150, stroke: "#262E3D", "stroke-width": 1 }));
    });
    // funnel node
    s.appendChild(svg("circle", { cx: 150, cy: 150, r: 16, fill: "none", stroke: "#7C5CFF", "stroke-width": 2 }));
    s.appendChild(svg("circle", { cx: 150, cy: 150, r: 6, fill: "#7C5CFF" }));
    // rising sparkline to the right
    var pts = "150,150 200,140 235,155 270,110 305,120 345,70 390,40";
    s.appendChild(svg("polyline", { points: pts, fill: "none", stroke: "url(#hg)", "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    // bars under the line
    var bars = [[210,175,55],[250,190,40],[290,160,70],[330,140,90],[370,110,120]];
    bars.forEach(function (b) {
      s.appendChild(svg("rect", { x: b[0], y: 230 - (b[2]), width: 22, height: b[2], rx: 4, fill: "#3DDC97", opacity: 0.22 }));
    });
    // burst star at the tip
    s.appendChild(svg("circle", { cx: 390, cy: 40, r: 6, fill: "#3DDC97" }));
    s.appendChild(svg("circle", { cx: 390, cy: 40, r: 12, fill: "none", stroke: "#3DDC97", "stroke-width": 1.5, opacity: 0.6 }));
    return s;
  }

  // ----- "What the model searched" panel -----
  function safeUrl(u) {
    return (typeof u === "string" && /^https?:\/\//i.test(u)) ? u : null;
  }
  function prettyUrl(u) {
    try { var a = new URL(u); return a.hostname.replace(/^www\./, "") + (a.pathname !== "/" ? a.pathname : ""); }
    catch (e) { return u; }
  }
  function miningPanel(mining) {
    if (!mining) return null;
    var box = el("div", "mining");
    var head = el("div", "mining-head");
    head.appendChild(el("span", "mining-title", "What the model searched"));
    var meta = el("span", "mining-meta");
    if (mining.serp_calls != null) meta.appendChild(el("span", "mmeta", mining.serp_calls + " SERP calls"));
    if (mining.n_docs_retrieved != null) meta.appendChild(el("span", "mmeta", mining.n_docs_retrieved + " docs retrieved"));
    if (mining.cutoff_T) meta.appendChild(el("span", "mmeta", "cd_max ≤ " + mining.cutoff_T));
    head.appendChild(meta);
    box.appendChild(head);

    if (mining.queries && mining.queries.length) {
      var qwrap = el("div", "query-wrap");
      mining.queries.forEach(function (q) {
        var chip = el("span", "query-chip" + (q.n_results ? " hit" : ""));
        chip.appendChild(el("code", null, q.query));
        chip.appendChild(el("span", "qcount", (q.n_results || 0) + " res"));
        qwrap.appendChild(chip);
      });
      box.appendChild(qwrap);
    }

    var urls = (mining.cited_urls || []).map(safeUrl).filter(Boolean);
    if (urls.length) {
      box.appendChild(el("div", "mining-sub", "Cited sources (retrievable ≤ cutoff):"));
      var ul = el("ul", "cited-list");
      urls.forEach(function (u) {
        var li = el("li");
        var a = el("a", null, prettyUrl(u));
        a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer";
        li.appendChild(a);
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }
    if (mining.reasoning) {
      var r = el("p", "mining-reason");
      r.appendChild(el("strong", null, "Model rationale: "));
      r.appendChild(document.createTextNode(mining.reasoning));
      box.appendChild(r);
    }
    return box;
  }

  // ----- Mining Recall / Driver-Decomposition-Score (DDS) — PRELIMINARY v1 -----
  function fmtPctOrDash(x) { return (x == null) ? "—" : Math.round(x * 100) + "%"; }

  function mrCaveatBanner(caveatText) {
    var b = el("div", "mining-recall-caveat");
    var icon = el("span", "mrc-icon", "⚠");
    b.appendChild(icon);
    var body = el("div");
    body.appendChild(el("strong", null, "Preliminary / v1 approximate scoring, small sample. "));
    body.appendChild(document.createTextNode(caveatText || ""));
    b.appendChild(body);
    return b;
  }

  function mrStat(label, value) {
    var s = el("div", "mr-stat");
    s.appendChild(el("div", "mr-stat-v", value));
    s.appendChild(el("div", "mr-stat-l", label));
    return s;
  }

  function mrFamilyList(className, label, families) {
    var wrap = el("div", "mr-families");
    wrap.appendChild(el("span", "mr-families-l", label + ":"));
    if (families && families.length) {
      families.forEach(function (fam) {
        wrap.appendChild(el("span", className, fam));
      });
    } else {
      wrap.appendChild(el("span", "mr-families-l", "none"));
    }
    return wrap;
  }

  // one condition's card (e.g. "deep-mined" or "C6") within a mining-recall episode block
  function mrConditionCard(condName, cond) {
    var card = el("div", "mr-card");
    var head = el("div", "mr-card-head");
    head.appendChild(el("span", "mr-cond", condName));
    if (cond.model) head.appendChild(el("span", "mr-model", cond.model));
    card.appendChild(head);

    var stats = el("div", "mr-stats");
    stats.appendChild(mrStat("Family recall", fmtPctOrDash(cond.family_recall)));
    stats.appendChild(mrStat("Source recall", fmtPctOrDash(cond.source_recall)));
    stats.appendChild(mrStat("Source precision", fmtPctOrDash(cond.source_precision)));
    stats.appendChild(mrStat("DDS", fmtPctOrDash(cond.dds)));
    card.appendChild(stats);

    card.appendChild(mrFamilyList("mr-fam-covered", "Families covered", cond.families_covered));

    if (cond.family_source) {
      var fs = el("div", "mr-fam-source");
      fs.appendChild(el("span", null, "family source: "));
      fs.appendChild(el("code", null, cond.family_source));
      card.appendChild(fs);
    }
    return card;
  }

  // full "Mining Recall (preliminary)" section for one episode's mining_scores entry
  // epScore = { id, ticker, company, quarter, gold_families, conditions: { condName: {...} } }
  function miningRecallSection(epScore, caveatText, opts) {
    if (!epScore) return null;
    opts = opts || {};
    var box = el("div", "mining-recall");
    var head = el("div", "mining-recall-head");
    head.appendChild(el("span", "mining-recall-title", "Mining Recall (preliminary)"));
    box.appendChild(head);

    if (opts.showCaveat !== false) box.appendChild(mrCaveatBanner(caveatText));

    if (opts.showEpisode !== false) {
      box.appendChild(el("div", "mr-ep-label", (epScore.company || epScore.ticker) + " · " + (epScore.quarter || epScore.id)));
    }

    box.appendChild(mrFamilyList("mr-fam-gold", "Gold demand-driver families", epScore.gold_families));

    var grid = el("div", "mr-grid");
    var conds = epScore.conditions || {};
    Object.keys(conds).forEach(function (condName) {
      grid.appendChild(mrConditionCard(condName, conds[condName]));
    });
    box.appendChild(grid);
    return box;
  }

  // ----- QED ground-truth mining recall (D50/D52/D58) -----
  // Ground truth here is management's OWN post-report-call driver attribution (quote-
  // audited against the transcript), not a hand-curated map -- richer than the older
  // family/domain-recall scoring, so it gets its own renderer rather than being forced
  // into mrConditionCard's shape.
  function qedRecallSection(epScore, opts) {
    if (!epScore) return null;
    opts = opts || {};
    var box = el("div", "mining-recall");
    var head = el("div", "mining-recall-head");
    head.appendChild(el("span", "mining-recall-title", "Mining Recall vs. Real Earnings-Call Drivers (QED)"));
    box.appendChild(head);

    var note = el("p", "muted");
    note.style.fontSize = "12.5px";
    note.appendChild(document.createTextNode(
      "Ground truth = management's own attribution of what drove the quarter, from the post-report " +
      "earnings call (never shown to the model). Every driver's quote is verified to appear in the " +
      "transcript. qed_driver_recall (below) checks whether the model's retrieved evidence actually " +
      "touched the SPECIFIC real driver, not just the broad topic family."));
    box.appendChild(note);

    if (opts.showEpisode !== false) {
      box.appendChild(el("div", "mr-ep-label", (epScore.company || epScore.ticker) + " · " + (epScore.quarter || epScore.id)));
    }

    var grid = el("div", "mr-grid");
    var conds = epScore.conditions || {};
    Object.keys(conds).forEach(function (condName) {
      var sc = conds[condName];
      var card = el("div", "mr-card");
      var head = el("div", "mr-card-head");
      head.appendChild(el("span", "mr-cond", condName));
      if (sc.model) head.appendChild(el("span", "mr-model", sc.model));
      card.appendChild(head);

      var stats = el("div", "mr-stats");
      stats.appendChild(mrStat("Family recall", fmtPctOrDash(sc.qed_family_recall)));
      stats.appendChild(mrStat("Driver recall", fmtPctOrDash(sc.qed_driver_recall) +
        " (" + (sc.n_drivers_found || 0) + "/" + (sc.n_drivers_total || 0) + ")"));
      if (sc.qed_dds != null) stats.appendChild(mrStat("DDS", fmtPctOrDash(sc.qed_dds)));
      card.appendChild(stats);

      if (sc.driver_detail && sc.driver_detail.length) {
        var details = el("details", "mr-driver-details");
        details.appendChild(el("summary", null, "show " + sc.driver_detail.length + " real drivers checked"));
        var tbl = el("table", "mr-driver-table");
        var thead = el("tr");
        ["family", "driver", "direction", "found?"].forEach(function (h) { thead.appendChild(el("th", null, h)); });
        tbl.appendChild(thead);
        sc.driver_detail.forEach(function (d) {
          var tr = el("tr");
          tr.appendChild(el("td", null, d.family));
          tr.appendChild(el("td", null, d.driver));
          tr.appendChild(el("td", null, d.direction));
          tr.appendChild(el("td", d.hit ? "mr-hit-yes" : "mr-hit-no", d.hit ? "✓" : "✗"));
          tbl.appendChild(tr);
        });
        details.appendChild(tbl);
        card.appendChild(details);
      }
      grid.appendChild(card);
    });
    box.appendChild(grid);
    return box;
  }

  // ----- Weekly trajectory (SITW sequential forecast) -----
  var OUTCOME_HEX = { beat: "#3DDC97", miss: "#FF5C6C", inline: "#F5B23D" };
  function outcomeHex(p) { return OUTCOME_HEX[(p || "").toLowerCase()] || "#5B6577"; }

  // small confidence line chart across weeks; points colored by prediction, flips ringed
  function trajChart(weeks) {
    var W = 520, H = 150, padL = 30, padR = 14, padT = 12, padB = 30;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var n = weeks.length;
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", role: "img",
      "aria-label": "Weekly prediction confidence trajectory" });
    function x(i) { return n <= 1 ? padL + plotW / 2 : padL + i * (plotW / (n - 1)); }
    function y(c) { return padT + (1 - (c == null ? 0 : c)) * plotH; }
    // horizontal guides at 0, .5, 1
    [0, 0.5, 1].forEach(function (g) {
      s.appendChild(svg("line", { x1: padL, y1: y(g), x2: W - padR, y2: y(g),
        stroke: "#262E3D", "stroke-width": 1, "stroke-dasharray": g === 0.5 ? "3 4" : "0" }));
      var yl = svg("text", { x: padL - 6, y: y(g) + 3, "text-anchor": "end", "font-size": 9,
        fill: "#5B6577", "font-family": "ui-monospace, monospace" });
      yl.textContent = Math.round(g * 100) + ""; s.appendChild(yl);
    });
    // connecting confidence polyline
    var pts = weeks.map(function (w, i) { return x(i) + "," + y(w.conf); }).join(" ");
    s.appendChild(svg("polyline", { points: pts, fill: "none", stroke: "#7C5CFF",
      "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.7 }));
    // points + flip rings + x labels
    weeks.forEach(function (w, i) {
      if (w.changed) {
        s.appendChild(svg("circle", { cx: x(i), cy: y(w.conf), r: 9, fill: "none",
          stroke: "#7C5CFF", "stroke-width": 1.5, opacity: 0.9 }));
      }
      var c = svg("circle", { cx: x(i), cy: y(w.conf), r: 5, fill: outcomeHex(w.pred),
        stroke: w.ok ? "#0B0E14" : "#0B0E14", "stroke-width": 1 });
      var tt = svg("title");
      tt.textContent = (w.pred || "n/a") + " @ " + (w.conf != null ? Math.round(w.conf * 100) + "%" : "—")
        + " (" + w.weeks_before_cutoff + "w before cutoff)" + (w.changed ? " — flip" : "");
      c.appendChild(tt); s.appendChild(c);
      var xl = svg("text", { x: x(i), y: H - 14, "text-anchor": "middle", "font-size": 10,
        fill: "#9AA4B2", "font-family": "ui-monospace, monospace" });
      xl.textContent = w.weeks_before_cutoff + "w"; s.appendChild(xl);
      var xl2 = svg("text", { x: x(i), y: H - 3, "text-anchor": "middle", "font-size": 8, fill: "#5B6577" });
      xl2.textContent = w.week_date.slice(5); s.appendChild(xl2);
    });
    return s;
  }

  // lead-time badge
  function leadBadge(item) {
    var b = el("span", "lead-badge");
    if (item.final_correct && item.lead_time) {
      b.classList.add("lead-good");
      b.textContent = "Locked correct " + item.lead_time.weeks_before_cutoff + "w before cutoff";
    } else if (item.final_correct) {
      b.classList.add("lead-good");
      b.textContent = "Correct at cutoff";
    } else {
      b.classList.add("lead-bad");
      b.textContent = "Never correct before the report";
    }
    return b;
  }

  // full trajectory card (one model x one episode)
  function trajCard(item, opts) {
    opts = opts || {};
    var card = el("div", "traj");

    var head = el("div", "traj-head");
    var who = el("div", "traj-who");
    if (opts.showModel !== false) {
      who.appendChild(avatar(item.avatar, item.model, 28));
      var mn = el("a", "traj-model", item.model);
      mn.href = "model.html?m=" + encodeURIComponent(item.model);
      who.appendChild(mn);
    }
    var ep = el("a", "traj-ep");
    ep.href = "company.html?c=" + encodeURIComponent(item.ticker);
    ep.appendChild(document.createTextNode(item.company + " · " + item.quarter_short + " "));
    who.appendChild(ep);
    head.appendChild(who);

    var right = el("div", "traj-right");
    var act = el("span", "traj-actual");
    act.appendChild(document.createTextNode("actual "));
    act.appendChild(pill(item.actual));
    right.appendChild(act);
    right.appendChild(leadBadge(item));
    head.appendChild(right);
    card.appendChild(head);

    card.appendChild(trajChart(item.weeks));

    // per-week detail strip
    var strip = el("div", "week-strip");
    item.weeks.forEach(function (w) {
      var cell = el("div", "week-cell" + (w.changed ? " flip" : ""));
      var top = el("div", "week-top");
      top.appendChild(el("span", "week-wbc", w.weeks_before_cutoff + "w"));
      if (w.changed) top.appendChild(el("span", "flip-marker", "⟳ flip"));
      cell.appendChild(top);
      cell.appendChild(pill(w.pred));
      var meta = el("div", "week-meta");
      meta.appendChild(el("span", null, (w.conf != null ? Math.round(w.conf * 100) + "%" : "—") + " conf"));
      meta.appendChild(el("span", null, w.n_queries + " queries"));
      meta.appendChild(el("span", null, (w.n_docs || 0) + " docs"));
      cell.appendChild(meta);
      strip.appendChild(cell);
    });
    card.appendChild(strip);
    return card;
  }

  function brandMark() {
    var s = svg("svg", { width: 26, height: 26, viewBox: "0 0 32 32", "class": "brand-mark" });
    s.appendChild(svg("rect", { x: 1, y: 1, width: 30, height: 30, rx: 8, fill: "#151A23", stroke: "#262E3D" }));
    s.appendChild(svg("polyline", { points: "6,22 12,18 17,20 22,11 27,8", fill: "none", stroke: "#3DDC97", "stroke-width": 2.5, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    s.appendChild(svg("circle", { cx: 27, cy: 8, r: 3, fill: "#7C5CFF" }));
    return s;
  }

  // ----- Nav -----
  function buildNav(active) {
    var nav = el("nav", "nav");
    var inner = el("div", "nav-inner");
    var brand = el("a", "brand"); brand.href = "index.html";
    brand.appendChild(brandMark());
    var bt = el("span", null, "SITW"); brand.appendChild(bt);
    brand.appendChild(el("small", null, "Signals in the Wild"));
    inner.appendChild(brand);

    var links = el("div", "nav-links");
    [["index.html", "Home"], ["leaderboard.html", "Leaderboard"],
     ["companies.html", "Companies"], ["live.html", "Live"], ["about.html", "About"]]
      .forEach(function (p) {
        var a = el("a", active === p[0] ? "active" : null, p[1]);
        a.href = p[0];
        links.appendChild(a);
      });
    inner.appendChild(links);
    nav.appendChild(inner);
    return nav;
  }

  // ----- Footer -----
  function buildFooter() {
    var f = el("footer", "footer");
    var inner = el("div", "footer-inner");

    var c1 = el("div");
    c1.appendChild(el("h4", null, "Signals in the Wild"));
    c1.appendChild(el("p", "muted", "A benchmark where AI and humans mine public signals before a company reports and predict its segment-revenue surprise — with provenance and calibration."));

    var c2 = el("div");
    c2.appendChild(el("h4", null, "Explore"));
    [["leaderboard.html", "Leaderboard"], ["companies.html", "Companies"],
     ["live.html", "Live"], ["about.html", "About"]].forEach(function (p) {
      var a = el("a", null, p[1]); a.href = p[0]; c2.appendChild(a);
    });

    var c3 = el("div");
    c3.appendChild(el("h4", null, "Project"));
    var authors = el("p", "muted", AUTHORS); c3.appendChild(authors);
    var mail = el("a", null, CONTACT); mail.href = "mailto:" + CONTACT; c3.appendChild(mail);
    var repo = el("a", null, "Code repository"); repo.href = REPO_URL; repo.rel = "noopener"; c3.appendChild(repo);

    inner.appendChild(c1); inner.appendChild(c2); inner.appendChild(c3);
    f.appendChild(inner);
    f.appendChild(el("div", "disclaimer", "For research and illustration only. Not investment advice. © 2026 SITW."));
    return f;
  }

  function mountChrome(active) {
    var body = document.body;
    body.insertBefore(buildNav(active), body.firstChild);
    body.appendChild(buildFooter());
  }

  function fetchJSON(path) {
    return fetch(path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " for " + path);
      return r.json();
    });
  }

  function fmtPct(x) { return x == null ? "—" : Math.round(x * 100) + "%"; }
  function fmtSkill(pp) { return pp == null ? "—" : (pp > 0 ? "+" : "") + pp + " pp"; }
  function fmtBrier(b) { return b == null ? "—" : b.toFixed(3); }

  // safe query param getter, allowlisted chars only
  function getParam(name) {
    var m = new RegExp("[?&]" + name + "=([^&]*)").exec(location.search);
    if (!m) return null;
    var v = decodeURIComponent(m[1].replace(/\+/g, " "));
    return v.replace(/[^A-Za-z0-9 .\-]/g, "").slice(0, 40);
  }

  function showError(container, path) {
    if (!container) return;
    clear(container);
    container.appendChild(el("p", "error",
      "Could not load " + path + ". Serve the folder over HTTP (see README): python3 -m http.server"));
  }

  // ---- shared scale-leaderboard table: used identically by the homepage and
  // the leaderboard page, so there is exactly one leaderboard, not a "preview"
  // and a "full" version that can drift apart or look different. Scored
  // against real analyst consensus (the meaningful ground truth) -- the proxy
  // vs-prior-year label used to build these is documented in the paper, not
  // duplicated here as a second set of columns. ----
  var LB_COLS = ["Condition", "Corpus", "Model", "Dir. acc.", "Bal. acc.", "Growth error (pp)", "Mining recall"];

  function lbAccCell(acc, ci, n) {
    var wrap = el("span");
    if (acc == null) { wrap.textContent = "—"; return wrap; }
    wrap.appendChild(document.createTextNode(Math.round(acc * 100) + "%"));
    var small = el("span", "muted");
    small.style.fontSize = "10.5px"; small.style.marginLeft = "4px";
    small.textContent = "(n=" + n + (ci ? ", " + Math.round(ci[0] * 100) + "–" + Math.round(ci[1] * 100) + "%" : "") + ")";
    wrap.appendChild(small);
    return wrap;
  }

  function lbDataRow(r, naive) {
    var tr = el("tr", (r.is_baseline || r.is_human_baseline) ? "lb-row-baseline" : null);
    tr.appendChild(el("td", null, r.condition + (r.partial ? " *" : "")));
    tr.appendChild(el("td", null, r.corpus || "—"));
    var mc = el("td");
    if (r.model && r.model !== "—") mc.appendChild(el("code", null, r.model)); else mc.textContent = "—";
    tr.appendChild(mc);
    var ac = el("td");
    var below = !r.is_baseline && !r.is_human_baseline && naive != null && r.real_acc != null && r.real_acc < naive;
    var span = el("span", below ? "lb-below-baseline" : null);
    span.appendChild(lbAccCell(r.real_acc, r.real_acc_ci95, r.real_n));
    ac.appendChild(span);
    tr.appendChild(ac);
    tr.appendChild(el("td", null, r.real_balanced_acc == null ? "—" : r.real_balanced_acc));
    tr.appendChild(el("td", null, r.mae == null ? "—" : r.mae));
    var mrTd = el("td");
    mrTd.textContent = r.mining_recall != null ? Math.round(r.mining_recall * 100) + "%" : "—";
    tr.appendChild(mrTd);
    return tr;
  }

  // model group-header row: SAME number of cells as a data row (no colspan),
  // so columns always stay aligned with the header regardless of which rows
  // are expanded/collapsed
  function lbModelHeaderRow(model, expanded) {
    var tr = el("tr", "co500-row lb-model-row");
    var first = el("td");
    var line = el("div", "model-cell");
    line.appendChild(el("span", "lb-caret", expanded ? "▾" : "▸"));
    line.appendChild(avatar(model, model, 20));
    line.appendChild(el("strong", null, model));
    first.appendChild(line);
    tr.appendChild(first);
    for (var i = 1; i < LB_COLS.length; i++) tr.appendChild(el("td"));
    return tr;
  }

  function renderScaleLeaderboard(container, data, opts) {
    opts = opts || {};
    clear(container);
    var rows = data.rows || [];
    var naive = null;
    rows.forEach(function (r) { if (r.is_baseline && r.real_acc != null) naive = r.real_acc; });
    var models = [];
    rows.forEach(function (r) { if (r.model && r.model !== "—" && models.indexOf(r.model) === -1) models.push(r.model); });

    var scroll = el("div", "table-scroll");
    var table = el("table", "lb-table");
    var thead = el("thead"), htr = el("tr");
    LB_COLS.forEach(function (h) { htr.appendChild(el("th", null, h)); });
    thead.appendChild(htr); table.appendChild(thead);
    var tbody = el("tbody");

    rows.filter(function (r) { return r.is_baseline || r.is_human_baseline; })
      .forEach(function (r) { tbody.appendChild(lbDataRow(r, naive)); });

    models.forEach(function (m) {
      var modelRows = rows.filter(function (r) { return r.model === m; });
      var header = lbModelHeaderRow(m, opts.expanded);
      tbody.appendChild(header);
      var detailTrs = modelRows.map(function (r) {
        var dt = lbDataRow(r, naive);
        dt.style.display = opts.expanded ? "" : "none";
        return dt;
      });
      detailTrs.forEach(function (dt) { tbody.appendChild(dt); });
      header.addEventListener("click", function () {
        var showing = detailTrs[0].style.display !== "none";
        detailTrs.forEach(function (dt) { dt.style.display = showing ? "none" : ""; });
        header.querySelector(".lb-caret").textContent = showing ? "▸" : "▾";
      });
    });

    table.appendChild(tbody);
    scroll.appendChild(table);
    container.appendChild(scroll);
    return { naive: naive, models: models };
  }

  global.SITW = {
    el: el, frag: frag, clear: clear, svg: svg,
    avatar: avatar, avatarColor: avatarColor, chip: chip, pill: pill, typeTag: typeTag,
    accBar: accBar, barChart: barChart, heroArt: heroArt, brandMark: brandMark,
    miningPanel: miningPanel, trajChart: trajChart, trajCard: trajCard, leadBadge: leadBadge,
    miningRecallSection: miningRecallSection, qedRecallSection: qedRecallSection,
    renderScaleLeaderboard: renderScaleLeaderboard,
    mountChrome: mountChrome, fetchJSON: fetchJSON,
    fmtPct: fmtPct, fmtSkill: fmtSkill, fmtBrier: fmtBrier,
    getParam: getParam, showError: showError,
  };
})(window);
