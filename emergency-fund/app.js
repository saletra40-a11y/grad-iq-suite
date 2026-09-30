(function () {
  "use strict";
  var G = GQ, STEP = { weekly: 7, biweekly: 14 };
  function saved(s) { return G.num(s.start) + s.deposits.reduce(function (a, d) { return a + G.num(d.amount); }, 0); }
  function nextAfter(dateISO, freq) { if (freq === "monthly") { var d = G.parseISO(dateISO); d.setMonth(d.getMonth() + 1); return G.iso(d); } return G.addDays(dateISO, STEP[freq] || 7); }
  function projection(s) {
    var goal = G.num(s.goal) || 1000, have = saved(s), left = Math.max(0, goal - have), auto = G.num(s.auto);
    if (left === 0) return { done: true, left: 0 };
    if (auto <= 0) return { left: left };
    var n = Math.ceil(left / auto), date = s.nextDate || G.today();
    for (var i = 1; i < n; i++) date = nextAfter(date, s.freq);
    return { left: left, n: n, date: date };
  }
  function render(s) {
    var rows = s.deposits.map(function (d, i) { return { d: d, i: i }; }).sort(function (a, b) { return (b.d.date || "").localeCompare(a.d.date || ""); });
    G.$("#deps").innerHTML = "<thead><tr><th scope='col'>Date</th><th scope='col'>Amount</th><th scope='col'>Note</th><th scope='col'><span class='sr-only'>Delete</span></th></tr></thead><tbody>" +
      (rows.length ? rows.map(function (x) { return "<tr><td>" + G.fmtDate(x.d.date) + "</td><td>" + G.money(x.d.amount, true) + "</td><td>" + G.esc(x.d.note) + '</td><td><button class="btn sm ghost no-print" type="button" data-action="delDep" data-i="' + x.i + '" aria-label="Delete deposit">✕</button></td></tr>'; }).join("") : '<tr><td colspan="4" class="empty">No deposits yet. Every small deposit counts.</td></tr>') + "</tbody>";
    if (!G.$("#d-date").value) G.$("#d-date").value = G.today();
  }
  function update(s) {
    var goal = G.num(s.goal) || 1000, have = saved(s), pct = Math.max(0, Math.min(1, have / goal)), C = 2 * Math.PI * 62;
    G.$("#ring").innerHTML = '<svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true"><defs><linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a6fa8"/><stop offset="1" stop-color="#7fbf9f"/></linearGradient></defs><circle class="ring-bg" cx="75" cy="75" r="62"/><circle class="ring-fg" cx="75" cy="75" r="62" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct)).toFixed(1) + '"/></svg><div class="ring-label" id="pct">' + Math.round(pct * 100) + "%<small>of " + G.money(goal) + "</small></div>";
    G.$("#ring").setAttribute("aria-label", Math.round(pct * 100) + "% of " + G.money(goal) + " goal saved");
    var p = projection(s);
    G.$("#stats").innerHTML = '<div class="stat mint"><div class="label">Saved</div><div class="value" id="saved">' + G.money(have, true) + '</div></div><div class="stat"><div class="label">To go</div><div class="value">' + G.money(p.left, true) + "</div></div>";
    G.$("#projection").innerHTML = p.done ? '<p class="notice"><strong>Goal reached!</strong> 🎉 Consider keeping your auto-save going toward a bigger cushion — or celebrate and pause.</p>'
      : p.n ? '<div class="stat lav"><div class="label">Projected finish</div><div class="value" id="finish">' + G.fmtDate(p.date) + '</div><div class="small muted">' + p.n + " more " + (s.freq === "monthly" ? "monthly" : s.freq === "biweekly" ? "every-2-weeks" : "weekly") + " deposit" + (p.n === 1 ? "" : "s") + " of " + G.money(s.auto, true) + "</div></div>"
      : '<p class="small muted">Add an auto-save amount to see your projected finish date.</p>';
  }
  G.tool({
    key: "gradiq-emergency-fund-v1", name: "$1,000 emergency fund builder", section: "Budget & money",
    defaults: function () { return { goal: 1000, start: "", auto: "", freq: "weekly", nextDate: G.today(), deposits: [] }; },
    demo: function () { return { goal: 1000, start: 120, auto: 25, freq: "weekly", nextDate: G.addDays(G.today(), 3), deposits: [
      { date: G.addDays(G.today(), -25), amount: 25, note: "SAMPLE auto-save" }, { date: G.addDays(G.today(), -18), amount: 25, note: "SAMPLE auto-save" },
      { date: G.addDays(G.today(), -11), amount: 25, note: "SAMPLE auto-save" }, { date: G.addDays(G.today(), -9), amount: 60, note: "SAMPLE sold old textbook" }, { date: G.addDays(G.today(), -4), amount: 25, note: "SAMPLE auto-save" }] }; },
    render: render, update: update,
    actions: {
      addDep: function (el, s, api) {
        var amt = G.$("#d-amt").value; if (amt === "" || !isFinite(+amt) || +amt === 0) { G.toast("Enter an amount"); G.$("#d-amt").focus(); return; }
        s.deposits.push({ date: G.$("#d-date").value || G.today(), amount: +amt, note: G.$("#d-note").value.trim() });
        G.$("#d-amt").value = ""; G.$("#d-note").value = ""; api.commit(true); G.toast("Deposit added");
      },
      delDep: function (el, s, api) { if (!confirm("Delete this deposit?")) return; s.deposits.splice(+el.getAttribute("data-i"), 1); api.commit(true); }
    },
    csv: function (s) { return [{ title: "Deposits", rows: [["Date", "Amount", "Note"], ["(starting balance)", G.num(s.start), ""]].concat(s.deposits.map(function (d) { return [d.date, d.amount, d.note]; })) }]; }
  });
})();
