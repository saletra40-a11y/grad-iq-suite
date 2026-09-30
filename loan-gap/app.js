(function () {
  "use strict";
  var G = GQ, LIFETIME = 257500, CAPS = { grad: { annual: 20500, agg: 100000, label: "Master's / non-clinical PhD" }, prof: { annual: 50000, agg: 200000, label: "Professional degree" } };
  function calc(s) {
    var cap = CAPS[s.program] || CAPS.grad;
    var coa = G.num(s.coa), stipend = G.num(s.stipend), aid = G.num(s.otherAid), pg = G.num(s.priorGrad), pu = G.num(s.priorUg);
    var need = Math.max(0, coa - stipend - aid);
    var lim = [
      { name: "Annual cap (" + cap.label + ")", v: cap.annual },
      { name: "Aggregate grad cap " + G.money(cap.agg) + " minus prior grad borrowing", v: Math.max(0, cap.agg - pg) },
      { name: "Lifetime cap " + G.money(LIFETIME) + " minus all prior federal borrowing", v: Math.max(0, LIFETIME - pg - pu) },
      { name: "Cost of attendance minus stipend and other aid", v: need }
    ];
    var max = Math.min.apply(null, lim.map(function (l) { return l.v; }));
    var binding = lim.filter(function (l) { return l.v === max; })[0];
    return { cap: cap, coa: coa, need: need, lim: lim, max: max, binding: binding, gap: Math.max(0, need - max), aggLeftAfter: Math.max(0, cap.agg - pg - max), lifeLeftAfter: Math.max(0, LIFETIME - pg - pu - max) };
  }
  G.tool({
    key: "gradiq-loan-gap-v1", name: "2026 grad loan funding-gap calculator", section: "Budget & money",
    defaults: function () { return { program: "grad", coa: "", stipend: "", otherAid: "", priorGrad: "", priorUg: "", notes: "" }; },
    demo: function () { return { program: "grad", coa: 62000, stipend: 0, otherAid: 12000, priorGrad: 85000, priorUg: 27000, notes: "SAMPLE DATA — fictional unfunded master's student with prior borrowing." }; },
    update: function (s) {
      var c = calc(s);
      G.$("#stats").innerHTML =
        '<div class="stat"><div class="label">Cost to cover</div><div class="value">' + G.money(c.need) + '</div></div>' +
        '<div class="stat big lav" style="grid-column: span 2"><div class="label">Max federal loan this year</div><div class="value" id="maxfed">' + G.money(c.max) + '</div></div>' +
        '<div class="stat big ' + (c.gap > 0 ? "neg" : "pos") + '"><div class="label">Remaining gap</div><div class="value" id="gap">' + G.money(c.gap) + "</div></div>";
      G.$("#limits").innerHTML = "<thead><tr><th scope='col'>Limit</th><th scope='col'>Room</th></tr></thead><tbody>" + c.lim.map(function (l) {
        return "<tr><td>" + G.esc(l.name) + (l === c.binding ? ' <span class="pill lav">limiting</span>' : "") + "</td><td>" + G.money(l.v) + "</td></tr>";
      }).join("") + "</tbody>";
      G.$("#gapnote").innerHTML = (c.need === 0 && c.coa > 0 ? '<p class="notice">Your stipend and aid cover your cost of attendance, so no federal borrowing is needed on paper.</p>' : "") +
        (c.gap > 0 ? '<p class="notice warn">After the maximum federal loan, about <strong>' + G.money(c.gap) + "</strong> is still uncovered. Grad PLUS isn't available to new borrowers, so talk to your aid office before considering private loans.</p>" : "") +
        '<p class="small muted">After this year you\'d have about ' + G.money(c.aggLeftAfter) + " of aggregate grad room and " + G.money(c.lifeLeftAfter) + " of lifetime room left, if you borrow the maximum. If you borrowed before July 1, 2026, transition rules may differ; ask your aid office.</p>";
    },
    csv: function (s) {
      var c = calc(s), rows = [["Item", "Amount"], ["Program type", c.cap.label], ["Cost of attendance", c.coa], ["Stipend", G.num(s.stipend)], ["Other aid", G.num(s.otherAid)], ["Prior federal grad borrowing", G.num(s.priorGrad)], ["Prior federal undergrad borrowing", G.num(s.priorUg)], ["Cost to cover", c.need]];
      c.lim.forEach(function (l) { rows.push(["Limit: " + l.name, l.v]); });
      rows.push(["Max federal loan this year", c.max], ["Remaining gap", c.gap], ["Note", "Rules as of 2026; verify with your financial aid office."]);
      return [{ title: "Funding gap", rows: rows }];
    }
  });
})();
