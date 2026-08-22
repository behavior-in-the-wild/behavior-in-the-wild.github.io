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
    var cls = (s === "beat" || s === "miss" || s === "inline") ? s : "inline";
    return el("span", "pill pill-" + cls, outcome || "n/a");
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
    [["index.html", "Home"], ["leaderboard.html", "Leaderboard"], ["companies.html", "Companies"], ["about.html", "About"]]
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
    [["leaderboard.html", "Leaderboard"], ["companies.html", "Companies"], ["about.html", "About"]].forEach(function (p) {
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

  global.SITW = {
    el: el, frag: frag, clear: clear, svg: svg,
    avatar: avatar, avatarColor: avatarColor, chip: chip, pill: pill, typeTag: typeTag,
    accBar: accBar, barChart: barChart, heroArt: heroArt, brandMark: brandMark,
    miningPanel: miningPanel,
    mountChrome: mountChrome, fetchJSON: fetchJSON,
    fmtPct: fmtPct, fmtSkill: fmtSkill, fmtBrier: fmtBrier,
    getParam: getParam, showError: showError,
  };
})(window);
