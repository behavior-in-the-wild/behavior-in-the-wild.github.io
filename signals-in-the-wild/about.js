/* about.html — mount chrome + render the causal ladder as inline SVG */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("about.html");

  var steps = [
    { t: "Customer behavior", c: "#9AA4B2" },
    { t: "Demand", c: "#7C5CFF" },
    { t: "Selling (price / mix / execution)", c: "#7C5CFF" },
    { t: "Realized segment revenue", c: "#3DDC97", target: true },
    { t: "Stock reaction", c: "#5B6577", out: true },
  ];

  var box = document.getElementById("ladder");
  var w = 960, h = 120, n = steps.length;
  var svg = S.svg("svg", { viewBox: "0 0 " + w + " " + h, width: "100%", role: "img", "aria-label": "Causal ladder from customer behavior to revenue" });
  var gap = 16;
  var boxW = (w - gap * (n - 1)) / n;
  steps.forEach(function (st, i) {
    var x = i * (boxW + gap);
    var g = S.svg("g");
    g.appendChild(S.svg("rect", { x: x, y: 34, width: boxW, height: 52, rx: 10,
      fill: st.target ? "rgba(61,220,151,0.14)" : (st.out ? "rgba(91,101,119,0.10)" : "rgba(124,92,255,0.10)"),
      stroke: st.c, "stroke-width": st.target ? 2 : 1, "stroke-dasharray": st.out ? "5 4" : "0" }));
    // wrap label into up to 2 lines
    var words = st.t.split(" ");
    var lines = [], cur = "";
    words.forEach(function (word) {
      if ((cur + " " + word).trim().length > 18) { lines.push(cur.trim()); cur = word; }
      else cur += " " + word;
    });
    if (cur.trim()) lines.push(cur.trim());
    lines.slice(0, 2).forEach(function (ln, li) {
      var tx = S.svg("text", { x: x + boxW / 2, y: 60 + (li - (lines.length - 1) / 2) * 15,
        "text-anchor": "middle", "dominant-baseline": "central", "font-size": 13,
        "font-family": "system-ui", "font-weight": st.target ? "800" : "600",
        fill: st.out ? "#5B6577" : "#E6EAF0", "text-decoration": st.out ? "line-through" : "none" });
      tx.textContent = ln;
      g.appendChild(tx);
    });
    if (st.target) {
      var badge = S.svg("text", { x: x + boxW / 2, y: 24, "text-anchor": "middle", "font-size": 10,
        "font-family": "system-ui", "font-weight": "800", fill: "#3DDC97", "letter-spacing": "0.08em" });
      badge.textContent = "TARGET"; g.appendChild(badge);
    }
    if (st.out) {
      var ob = S.svg("text", { x: x + boxW / 2, y: 104, "text-anchor": "middle", "font-size": 10,
        "font-family": "system-ui", "font-weight": "700", fill: "#5B6577", "letter-spacing": "0.06em" });
      ob.textContent = "OUT OF SCOPE"; g.appendChild(ob);
    }
    // arrow to next
    if (i < n - 1) {
      var ax = x + boxW + gap / 2;
      g.appendChild(S.svg("path", { d: "M " + (x + boxW + 2) + " 60 L " + (x + boxW + gap - 2) + " 60",
        stroke: "#3DDC97", "stroke-width": 2 }));
      g.appendChild(S.svg("path", { d: "M " + (x + boxW + gap - 6) + " 56 L " + (x + boxW + gap - 2) + " 60 L " + (x + boxW + gap - 6) + " 64",
        fill: "none", stroke: "#3DDC97", "stroke-width": 2 }));
    }
    svg.appendChild(g);
  });
  box.appendChild(svg);
})();
