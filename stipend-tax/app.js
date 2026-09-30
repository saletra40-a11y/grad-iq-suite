(function () {
  "use strict";
  var G = GQ;
  function calc(s) {
    var stipend = G.num(s.stipend), q = G.num(s.tuitionFees) + G.num(s.otherQualified), wages = G.num(s.wages);
    var taxableStipend = Math.max(0, stipend - q), pct = G.blank(s.pct) ? null : Math.min(100, Math.max(0, G.num(s.pct)));
    var months = Math.max(1, Math.min(12, G.num(s.months) || 12));
    var total = pct == null ? null : taxableStipend * pct / 100;
    return { stipend: stipend, q: q, wages: wages, taxableStipend: taxableStipend, taxableAll: taxableStipend + wages, pct: pct, months: months, total: total, monthly: total == null ? null : total / months, unused: Math.max(0, q - stipend) };
  }
  G.tool({
    key: "gradiq-stipend-tax-v1", name: "Stipend tax worksheet", section: "Budget & money",
    defaults: function () { return { year: new Date().getFullYear(), stipend: "", tuitionFees: "", otherQualified: "", wages: "", pct: "", months: 12, notes: "" }; },
    demo: function () { return { year: new Date().getFullYear(), stipend: 31200, tuitionFees: 1200, otherQualified: 300, wages: 0, pct: 12, months: 12, notes: "SAMPLE DATA — fictional numbers. The 12% set-aside is an arbitrary example, not a recommendation." }; },
    update: function (s) {
      var c = calc(s);
      G.$("#stats").innerHTML =
        '<div class="stat"><div class="label">Stipend</div><div class="value">' + G.money(c.stipend) + "</div></div>" +
        '<div class="stat sky"><div class="label">Qualified expenses</div><div class="value">− ' + G.money(Math.min(c.q, c.stipend)) + "</div></div>" +
        '<div class="stat big lav"><div class="label">Est. taxable stipend</div><div class="value" id="taxable">' + G.money(c.taxableStipend) + "</div></div>" +
        '<div class="stat"><div class="label">+ TA/RA wages</div><div class="value">' + G.money(c.wages) + "</div></div>";
      G.$("#explain").textContent = "Estimated taxable stipend = stipend minus tuition, required fees and other qualified expenses (never below $0)." +
        (c.unused > 0 ? " Your qualified expenses exceed your stipend by " + G.money(c.unused) + ", so none of the stipend is estimated as taxable." : "") +
        (c.wages > 0 ? " Total estimated taxable education-related income including wages: " + G.money(c.taxableAll) + "." : "");
      G.$("#setaside").innerHTML = c.pct == null
        ? '<div class="stat" style="grid-column:1/-1"><div class="label">Set-aside</div><div class="value" style="font-size:1.05rem">Enter a % above to see your monthly amount.</div></div>'
        : '<div class="stat"><div class="label">Your rate</div><div class="value">' + c.pct + '%</div></div><div class="stat"><div class="label">Set aside for the year</div><div class="value">' + G.money(c.total, true) + '</div></div><div class="stat big mint" style="grid-column: span 2"><div class="label">Set aside each month (' + c.months + ' mo)</div><div class="value" id="monthly">' + G.money(c.monthly, true) + "</div></div>";
    },
    csv: function (s) {
      var c = calc(s);
      return [{ title: "Stipend tax worksheet", rows: [["Line", "Amount"], ["Tax year", s.year], ["Stipend / fellowship", c.stipend.toFixed(2)], ["Tuition + required fees", G.num(s.tuitionFees).toFixed(2)], ["Other qualified expenses", G.num(s.otherQualified).toFixed(2)], ["Estimated taxable stipend", c.taxableStipend.toFixed(2)], ["TA/RA wages (always taxable)", c.wages.toFixed(2)], ["Set-aside %", c.pct == null ? "" : c.pct], ["Set-aside for year", c.total == null ? "" : c.total.toFixed(2)], ["Set-aside per month", c.monthly == null ? "" : c.monthly.toFixed(2)], ["Note", "Not tax advice. See IRS Pub 970: https://www.irs.gov/publications/p970"]] }];
    }
  });
})();
