(function () {
  "use strict";
  var G = GQ;
  var MS = [
    ["Full draft to advisor", -70], ["Advisor feedback & revisions", -56], ["Defense paperwork / scheduling forms filed", -45],
    ["Draft to committee", -35], ["Announce defense (per department rules)", -28], ["Build slides", -21], ["Practice talk #1 (lab / friends)", -14],
    ["Practice talk #2 (full run-through, timed)", -7], ["Final paperwork check (signature pages, forms)", -3], ["Defense day", 0], ["Post-defense revisions & final submission", 21]
  ];
  var CK = [
    "Confirm committee availability, room and remote link", "Check the graduate school's formatting and submission deadlines", "Send the final draft to the committee by the required date",
    "Prepare answers to likely questions (limitations, contributions, future work)", "Plan how you'll greet the audience at the start of your talk",
    "Thank your committee, advisor and attendees (opening or closing slide)", "Decide what to wear and whether water / a jacket-off break is OK",
    "Test slides, clicker, screen share and backup copy", "Print signature pages / forms", "Plan a small celebration 🎉", "Send thank-you notes to committee members after"
  ];
  function build(date) { return MS.map(function (m) { return { id: G.uid(), name: m[0], offset: m[1], date: date ? G.addDays(date, m[1]) : "", done: false }; }); }
  function render(s) {
    var td = G.today();
    var ms = s.milestones.map(function (m, i) { return { m: m, i: i }; }).sort(function (a, b) { return (a.m.date || "9999").localeCompare(b.m.date || "9999"); });
    G.$("#milestones").innerHTML = ms.map(function (x) {
      var m = x.m, i = x.i, dl = m.date ? G.diffDays(td, m.date) : null, st = m.done ? '<span class="pill ok">done</span>' : dl == null ? '<span class="pill">no date</span>' : dl < 0 ? '<span class="pill bad">' + (-dl) + "d overdue</span>" : dl === 0 ? '<span class="pill warn">today</span>' : '<span class="pill lav">in ' + dl + "d</span>";
      return '<div class="ms-row"><input type="checkbox" data-bind="milestones.' + i + '.done" data-rerender aria-label="' + G.esc(m.name) + ' done"><input type="text" data-bind="milestones.' + i + '.name" aria-label="Milestone name">' + st + '<input class="ms-date" type="date" data-bind="milestones.' + i + '.date" data-rerender aria-label="Date for ' + G.esc(m.name) + '"><button type="button" class="btn icon ghost no-print ms-del" data-action="delMs" data-i="' + i + '" aria-label="Delete milestone">✕</button></div>';
    }).join("");
    G.$("#checklist").innerHTML = s.checklist.map(function (c, i) {
      return '<div class="ck-row"><input type="checkbox" data-bind="checklist.' + i + '.done" aria-label="Done"><input type="text" data-bind="checklist.' + i + '.text" aria-label="Checklist item"><button type="button" class="btn icon ghost no-print" data-action="delCk" data-i="' + i + '" aria-label="Delete item">✕</button></div>';
    }).join("");
  }
  function update(s) {
    var el = G.$("#countdown");
    if (!s.defenseDate) el.innerHTML = '<p class="eyebrow">Countdown</p><p class="days" aria-hidden="true">—</p><p>Enter your defense date to start the countdown.</p>';
    else { var d = G.diffDays(G.today(), s.defenseDate); el.innerHTML = '<p class="eyebrow">' + (d > 0 ? "Days until your defense" : d === 0 ? "Defense day" : "Since your defense") + '</p><p class="days" id="daysleft">' + Math.abs(d) + '</p><p style="margin:0"><strong>' + G.fmtDate(s.defenseDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) + "</strong>" + (s.where ? "<br>" + G.esc(s.where) : "") + "</p>" + (d === 0 ? "<p>You've got this. 💜</p>" : ""); }
    var done = s.checklist.filter(function (c) { return c.done; }).length; G.$("#ckprog").textContent = done + " of " + s.checklist.length + " ready";
  }
  G.tool({
    key: "gradiq-defense-countdown-v1", name: "Dissertation & defense countdown", section: "Study & time",
    defaults: function () { return { title: "", defenseDate: "", where: "", milestones: build(""), checklist: CK.map(function (t) { return { text: t, done: false }; }), planFor: "" }; },
    demo: function () { var d = G.addDays(G.today(), 30), ms = build(d); ms.forEach(function (m) { if (m.date < G.today()) m.done = true; }); var ck = CK.map(function (t, i) { return { text: t, done: i < 3 }; }); return { title: "SAMPLE: Networks of Care in Rural Clinics (fictional)", defenseDate: d, where: "SAMPLE: 2pm, Room 210 + Zoom", milestones: ms, checklist: ck, planFor: d }; },
    init: function (s) { if (s.defenseDate && s.planFor !== s.defenseDate && s.milestones.every(function (m) { return !m.date; })) { s.milestones.forEach(function (m) { if (m.offset != null) m.date = G.addDays(s.defenseDate, m.offset); }); s.planFor = s.defenseDate; } },
    render: function (s, api) {
      if (s.defenseDate && s.planFor !== s.defenseDate) {
        var blankAll = s.milestones.every(function (m) { return !m.date || m.offset == null || m.date === G.addDays(s.planFor || s.defenseDate, m.offset); });
        if (blankAll) { s.milestones.forEach(function (m) { if (m.offset != null) m.date = G.addDays(s.defenseDate, m.offset); }); s.planFor = s.defenseDate; api.save(); }
      }
      render(s);
    },
    update: update,
    actions: {
      replan: function (el, s, api) { if (!s.defenseDate) { G.toast("Enter your defense date first"); return; } if (!confirm("Reset milestone dates from your defense date? Custom dates on suggested milestones will be replaced.")) return; s.milestones.forEach(function (m) { if (m.offset != null) m.date = G.addDays(s.defenseDate, m.offset); }); s.planFor = s.defenseDate; api.commit(true); },
      addMs: function (el, s, api) { s.milestones.push({ id: G.uid(), name: "New milestone", offset: null, date: "", done: false }); api.commit(true); },
      delMs: function (el, s, api) { if (!confirm("Delete this milestone?")) return; s.milestones.splice(+el.getAttribute("data-i"), 1); api.commit(true); },
      addCk: function (el, s, api) { var v = G.$("#ck-new").value.trim(); if (!v) return; s.checklist.push({ text: v, done: false }); G.$("#ck-new").value = ""; api.commit(true); },
      delCk: function (el, s, api) { s.checklist.splice(+el.getAttribute("data-i"), 1); api.commit(true); }
    },
    csv: function (s) { return [{ title: "Milestones (defense " + (s.defenseDate || "not set") + ")", rows: [["Milestone", "Date", "Done"]].concat(s.milestones.map(function (m) { return [m.name, m.date, m.done ? "yes" : "no"]; })) }, { title: "Defense-prep checklist", rows: [["Item", "Done"]].concat(s.checklist.map(function (c) { return [c.text, c.done ? "yes" : "no"]; })) }]; }
  });
})();
