(function () {
  "use strict";
  var G = GQ, ST = ["Not started", "In progress", "Done", "N/A"];
  function step(title, detail) { return { id: G.uid(), title: title, detail: detail || "", status: "Not started", due: "", notes: "" }; }
  function defaults() {
    return { noticeDate: "", servicer: "", steps: [
      step("Log in to StudentAid.gov and your servicer account", "Confirm who your servicer is and that your contact info is current so you get the notice."),
      step("Find your 90-day notice", "Enter its date above. Copy any deadline it gives you into the due date."),
      step("List your loans and when each was disbursed", "Loans disbursed after July 1, 2026 can only use RAP or Tiered Standard."),
      step("Compare plans: RAP, IBR, ICR, Standard / Tiered Standard", "Use estimates from your servicer or StudentAid.gov. Note the monthly payment for each."),
      step("Check PSLF if you work in public service", "RAP payments count toward PSLF."),
      step("Choose a plan and submit the application", "Do this before your deadline, or you'll be auto-enrolled in Standard or Tiered Standard."),
      step("Save your confirmation", "Screenshot or download the confirmation and write the reference number in notes."),
      step("Confirm the new payment amount and first due date", ""),
      step("Update your budget", "Add the new payment to the Loan minimum payments line of your stipend budget.")
    ], loans: [] };
  }
  function demo() {
    var d = defaults(); d.servicer = "Sample Servicer (fictional)"; d.noticeDate = G.addDays(G.today(), -20);
    d.steps[0].status = "Done"; d.steps[1].status = "Done"; d.steps[1].notes = "SAMPLE: notice arrived by email.";
    d.steps[2].status = "In progress"; d.steps[3].status = "In progress"; d.steps[3].notes = "SAMPLE: compare IBR vs RAP estimates.";
    d.loans = [{ id: G.uid(), name: "Direct Unsubsidized (sample)", balance: 18500, plan: "SAVE", disbursed: "" }, { id: G.uid(), name: "Grad PLUS (sample)", balance: 9200, plan: "SAVE", disbursed: "" }];
    return d;
  }
  function render(s) {
    G.$("#steps").innerHTML = s.steps.map(function (st, i) {
      return '<div class="row-card"><div style="display:flex;gap:.6rem;align-items:flex-start;justify-content:space-between"><div><strong>' + (i + 1) + ". " + G.esc(st.title) + '</strong>' + (st.detail ? '<div class="small muted">' + G.esc(st.detail) + "</div>" : "") + '</div><span class="pill" data-pill="' + i + '"></span></div>' +
        (st.custom ? '<label class="field">Step<input type="text" data-bind="steps.' + i + '.title" data-rerender></label>' : "") +
        '<div class="field-row"><label class="field">Status<select data-bind="steps.' + i + '.status">' + ST.map(function (o) { return "<option>" + o + "</option>"; }).join("") + '</select></label>' +
        '<label class="field">Due date<span class="hint">From your notice / servicer</span><input type="date" data-bind="steps.' + i + '.due"></label></div>' +
        '<label class="field">Notes<textarea rows="2" style="min-height:60px" data-bind="steps.' + i + '.notes"></textarea></label>' +
        (st.custom ? '<button type="button" class="btn sm danger no-print" data-action="delStep" data-i="' + i + '">Delete step</button>' : "") + "</div>";
    }).join("");
    G.$("#loans").innerHTML = s.loans.length ? s.loans.map(function (l, i) {
      return '<div class="row-line" style="--cols: 2fr 1fr 1fr 1fr auto"><label class="field">Loan<input type="text" data-bind="loans.' + i + '.name"></label><label class="field">Balance<span class="money"><input type="number" inputmode="decimal" min="0" data-bind="loans.' + i + '.balance"></span></label><label class="field">Current plan<input type="text" data-bind="loans.' + i + '.plan"></label><label class="field">Disbursed<input type="date" data-bind="loans.' + i + '.disbursed"></label><button class="btn icon ghost no-print" type="button" data-action="delLoan" data-i="' + i + '" aria-label="Delete loan">✕</button></div>';
    }).join("") : '<p class="empty">No loans listed. Adding them is optional.</p>';
  }
  function update(s) {
    var done = s.steps.filter(function (x) { return x.status === "Done" || x.status === "N/A"; }).length;
    G.$("#progress").textContent = done + " of " + s.steps.length + " done";
    G.$$("[data-pill]").forEach(function (el) { var st = s.steps[+el.getAttribute("data-pill")]; if (!st) return; el.textContent = st.status; el.className = "pill " + (st.status === "Done" ? "ok" : st.status === "In progress" ? "warn" : st.status === "N/A" ? "" : "lav"); });
    var w = G.$("#window");
    if (!s.noticeDate) { w.innerHTML = '<p class="small muted">Enter your notice date to see the end of a 90-day window. Always go by the exact date printed on your notice.</p>'; return; }
    var end = G.addDays(s.noticeDate, 90), left = G.diffDays(G.today(), end);
    w.innerHTML = '<div class="stat-grid"><div class="stat"><div class="label">Notice date</div><div class="value">' + G.fmtDate(s.noticeDate) + '</div></div><div class="stat lav"><div class="label">90 days later</div><div class="value">' + G.fmtDate(end) + '</div></div><div class="stat big ' + (left < 0 ? "neg" : "") + '" style="grid-column: span 2"><div class="label">Days left</div><div class="value">' + (left < 0 ? "Passed " + (-left) + " days ago" : left) + '</div></div></div><p class="small muted" style="margin-top:.6rem">Estimate only (notice date + 90 days). Your notice\'s own deadline wins.</p>';
  }
  G.tool({
    key: "gradiq-loan-repayment-v1", name: "Loan repayment plan tracker", section: "Budget & money",
    defaults: defaults, demo: demo, render: render, update: update,
    actions: {
      addStep: function (el, s, api) { var st = step("My step"); st.custom = true; s.steps.push(st); api.commit(true); },
      delStep: function (el, s, api) { if (!confirm("Delete this step?")) return; s.steps.splice(+el.getAttribute("data-i"), 1); api.commit(true); },
      addLoan: function (el, s, api) { s.loans.push({ id: G.uid(), name: "", balance: "", plan: "", disbursed: "" }); api.commit(true); },
      delLoan: function (el, s, api) { if (!confirm("Delete this loan row?")) return; s.loans.splice(+el.getAttribute("data-i"), 1); api.commit(true); }
    },
    csv: function (s) {
      return [{ title: "Checklist", rows: [["#", "Step", "Status", "Due", "Notes"]].concat(s.steps.map(function (x, i) { return [i + 1, x.title, x.status, x.due, x.notes]; })) },
              { title: "Loans", rows: [["Loan", "Balance", "Current plan", "Disbursed"]].concat(s.loans.map(function (l) { return [l.name, l.balance, l.plan, l.disbursed]; })) }];
    }
  });
})();
