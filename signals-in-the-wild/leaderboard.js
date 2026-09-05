/* leaderboard.html — same table as the homepage (S.renderScaleLeaderboard),
   just as its own page for direct linking. Scored against real analyst
   consensus (the meaningful ground truth); the naive vs-prior-year proxy
   used to build the underlying labels is documented in the paper. */
(function () {
  "use strict";
  var S = window.SITW;
  S.mountChrome("leaderboard.html");

  function pct(x) { return x == null ? "—" : Math.round(x * 100) + "%"; }

  Promise.all([
    S.fetchJSON("data/scale_results.json"),
    S.fetchJSON("data/mining_recall_scale.json").catch(function () { return null; }),
  ]).then(function (results) {
    var data = results[0];
    var mr = results[1];
    // relabel the one row that's genuinely confusable with the "real consensus"
    // ground truth it's scored against -- it's not a model, it's how often
    // analysts' own number turned out to be right
    data.rows.forEach(function (r) {
      if (r.is_human_baseline) r.condition = "Analysts themselves (baseline)";
    });

    var { naive } = S.renderScaleLeaderboard(document.getElementById("leaderboard-container"), data, { expanded: true });

    var note = document.getElementById("lb-note");
    if (note) note.textContent = "Scored against real analyst consensus, recovered for 332 of 443 companies (75%). " +
      "Click a model to expand/collapse its rows.";

    var mrNote = document.getElementById("lb-mining-recall-note");
    if (mrNote) mrNote.textContent = mr ? mr.note : "";
  }).catch(function (e) {
    console.error(e);
    S.showError(document.getElementById("leaderboard-container"), "data/scale_results.json");
  });
})();
