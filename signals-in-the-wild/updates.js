/* updates.html — renders data/updates.json; add new entries there, not here */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("updates.html");

  S.fetchJSON("data/updates.json").then(function (d) {
    var list = document.getElementById("updates-list");
    d.updates.slice().reverse().forEach(function (u) {
      var card = S.el("div", "co500-detail-block");
      card.style.marginTop = "18px";
      var head = S.el("div", "ep-head");
      head.appendChild(S.el("span", "ep-title", u.title));
      head.appendChild(S.el("span", "muted", u.date));
      card.appendChild(head);
      card.appendChild(S.el("p", "page-sub", u.body));
      list.appendChild(card);
    });
  }).catch(function (e) { S.showError(document.getElementById("updates-list"), e); });
})();
