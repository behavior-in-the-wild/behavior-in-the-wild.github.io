/* matrix.html — models (rows) × company-quarters (cols); toggle blind/feed */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("matrix.html");

  var cond = "fed";
  var data = null;

  function toggle(onChange) {
    var wrap = S.el("div", "toggle");
    [["blind", "Signal-blind"], ["fed", "Feed-assisted"]].forEach(function (o) {
      var b = S.el("button", "toggle-btn" + (o[0] === cond ? " active" : ""), o[1]);
      b.type = "button";
      b.addEventListener("click", function () {
        cond = o[0];
        Array.prototype.forEach.call(wrap.children, function (c) { c.classList.remove("active"); });
        b.classList.add("active");
        onChange();
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function cellNode(cell, colId) {
    var td = S.el("td", "mx-cell clickable");
    var wrap = S.el("div", "mx-cellwrap");
    wrap.appendChild(S.pill(cell.pred));
    var mark = S.el("span", "mx-mark " + (cell.ok ? "ok" : "no"), cell.ok ? "✓" : "✗");
    wrap.appendChild(mark);
    td.appendChild(wrap);
    td.addEventListener("click", function () { location.href = "company.html?c=" + encodeURIComponent(colId.ticker); });
    return td;
  }

  function render() {
    var container = document.getElementById("matrix-container");
    S.clear(container);
    var scroll = S.el("div", "table-scroll");
    var table = S.el("table", "data-table matrix-table");

    // header: company group row + quarter row
    var thead = S.el("thead");
    var htr = S.el("tr");
    htr.appendChild(S.el("th", "mx-corner", "Model \\ Quarter"));
    data.columns.forEach(function (c) {
      var th = S.el("th", "mx-col");
      var top = S.el("div", "mx-colhead");
      var chip = S.chip(c.ticker, c.color);
      top.appendChild(chip);
      th.appendChild(top);
      th.appendChild(S.el("div", "mx-colq", c.quarter_short));
      var av = S.el("div", "mx-colactual");
      av.appendChild(document.createTextNode("actual "));
      av.appendChild(S.pill(c.actual));
      th.appendChild(av);
      htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);

    var tbody = S.el("tbody");
    data.models.forEach(function (m) {
      var tr = S.el("tr");
      var mc = S.el("td", "mx-modelcell clickable");
      var cell = S.el("div", "model-cell");
      cell.appendChild(S.avatar(m.avatar, m.key, 28));
      var nm = S.el("div");
      nm.appendChild(S.el("div", "mc-name", m.name));
      var acc = m[cond + "_acc"];
      nm.appendChild(S.el("div", "mc-cond", S.fmtPct(acc) + " " + cond));
      cell.appendChild(nm);
      mc.appendChild(cell);
      mc.addEventListener("click", function () { location.href = "model.html?m=" + encodeURIComponent(m.key); });
      tr.appendChild(mc);
      data.columns.forEach(function (c) {
        var cd = m.cells[c.id] ? m.cells[c.id][cond] : { pred: null, ok: false };
        tr.appendChild(cellNode(cd, c));
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    container.appendChild(scroll);
  }

  S.fetchJSON("data/matrix.json").then(function (d) {
    data = d;
    document.getElementById("mx-controls").appendChild(toggle(render));
    var note = document.getElementById("mx-note");
    note.textContent = "Toggle between the signal-blind and feed-assisted conditions. Click a column to open the company, a row label to open the model. ✓ = correct direction, ✗ = wrong.";
    render();
  }).catch(function (e) { console.error(e); S.showError(document.getElementById("matrix-container"), "data/matrix.json"); });
})();
