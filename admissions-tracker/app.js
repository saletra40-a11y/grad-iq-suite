(function () {
  "use strict";
  var G = GQ, STATUS = ["Researching", "Preparing", "Submitted", "Interview", "Accepted", "Waitlisted", "Rejected", "Declined"], SOP = ["Not started", "Outlining", "Drafting", "Revising", "Final"];
  function prog(o) { return Object.assign({ id: G.uid(), school: "", program: "", deadline: "", status: "Researching", sop: "Not started", fee: "", portal: "", gpaNotes: "", notes: "", letters: [] }, o || {}); }
  function letter(o) { return Object.assign({ name: "", requested: "", submitted: false }, o || {}); }
  function sorted(s) {
    var arr = s.programs.map(function (p, i) { return { p: p, i: i }; }), k = s.sortKey, dir = s.sortDir === "desc" ? -1 : 1;
    arr.sort(function (a, b) { var x = a.p[k] || "", y = b.p[k] || ""; if (k === "deadline") { if (!x) return 1; if (!y) return -1; } return String(x).localeCompare(String(y)) * dir; });
    return arr;
  }
  function daysPill(d, p) { if (!d) return '<span class="pill">no deadline</span>'; var n = G.diffDays(G.today(), d); if (["Submitted", "Interview", "Accepted", "Waitlisted", "Rejected", "Declined"].indexOf(p.status) >= 0) return '<span class="pill ok">' + G.esc(p.status) + "</span>"; return n < 0 ? '<span class="pill bad">passed</span>' : n <= 14 ? '<span class="pill warn">' + n + "d left</span>" : '<span class="pill lav">' + n + "d left</span>"; }
  function sortBtn(s, key, label) { var on = s.sortKey === key; return '<th scope="col" aria-sort="' + (on ? (s.sortDir === "desc" ? "descending" : "ascending") : "none") + '"><button type="button" data-action="sort" data-key="' + key + '">' + label + (on ? (s.sortDir === "desc" ? " ↓" : " ↑") : "") + "</button></th>"; }
  function render(s) {
    var rows = sorted(s);
    G.$("#table").innerHTML = "<thead><tr>" + sortBtn(s, "school", "School / program") + sortBtn(s, "deadline", "Deadline") + '<th scope="col">SoP</th><th scope="col">Letters</th>' + sortBtn(s, "status", "Status") + "</tr></thead><tbody>" +
      (rows.length ? rows.map(function (x) { var p = x.p, got = p.letters.filter(function (l) { return l.submitted; }).length;
        return '<tr><td><a href="#prog-' + p.id + '"><strong>' + G.esc(p.school || "Untitled") + "</strong></a><br><span class='small muted'>" + G.esc(p.program) + "</span></td><td>" + G.fmtDate(p.deadline) + "<br>" + daysPill(p.deadline, p) + "</td><td>" + G.esc(p.sop) + "</td><td>" + got + "/" + p.letters.length + "</td><td>" + G.esc(p.status) + "</td></tr>"; }).join("") : '<tr><td colspan="5" class="empty">No programs yet. Add your first one.</td></tr>') + "</tbody>";
    G.$("#programs").innerHTML = rows.map(function (x) {
      var p = x.p, i = x.i, b = "programs." + i + ".";
      return '<article class="card" id="prog-' + p.id + '" aria-label="' + G.esc(p.school || "Program") + '"><div class="card-head"><h3>' + G.esc(p.school || "New program") + (p.program ? " · " + G.esc(p.program) : "") + '</h3><button type="button" class="btn sm danger no-print" data-action="del" data-i="' + i + '">Delete</button></div>' +
        '<div class="field-row"><label class="field">School<input type="text" data-bind="' + b + 'school" data-rerender></label><label class="field">Program<input type="text" data-bind="' + b + 'program" data-rerender></label><label class="field">Deadline<input type="date" data-bind="' + b + 'deadline" data-rerender></label></div>' +
        '<div class="field-row"><label class="field">Application status<select data-bind="' + b + 'status" data-rerender>' + STATUS.map(function (o) { return "<option>" + o + "</option>"; }).join("") + '</select></label><label class="field">Statement of purpose<select data-bind="' + b + 'sop" data-rerender>' + SOP.map(function (o) { return "<option>" + o + "</option>"; }).join("") + '</select></label><label class="field">Application fee<span class="money"><input type="number" min="0" data-bind="' + b + 'fee"></span></label><label class="field">Portal link<input type="url" placeholder="https://…" data-bind="' + b + 'portal"></label></div>' +
        '<label class="field">GPA notes<span class="hint">Minimums, how you\'ll address a weak semester, etc.</span><textarea rows="2" style="min-height:60px" data-bind="' + b + 'gpaNotes"></textarea></label>' +
        '<h4 style="margin:.4rem 0">Letters of recommendation</h4><div class="rows">' + (p.letters.length ? p.letters.map(function (l, li) { var lb = b + "letters." + li + "."; return '<div class="row-line" style="--cols: 2fr 1fr auto auto"><label class="field">Recommender<input type="text" data-bind="' + lb + 'name"></label><label class="field">Requested on<input type="date" data-bind="' + lb + 'requested"></label><label class="check" style="min-height:44px;align-items:center"><input type="checkbox" data-bind="' + lb + 'submitted" data-rerender> Submitted</label><button type="button" class="btn icon ghost no-print" data-action="delLetter" data-i="' + i + '" data-li="' + li + '" aria-label="Remove recommender">✕</button></div>'; }).join("") : '<p class="empty">No recommenders added.</p>') + '</div><button type="button" class="btn sm no-print" style="margin-top:.5rem" data-action="addLetter" data-i="' + i + '">+ Recommender</button>' +
        '<label class="field" style="margin-top:.8rem">Notes<textarea rows="2" style="min-height:60px" data-bind="' + b + 'notes" placeholder="Faculty to mention, research fit, interview prep…"></textarea></label></article>';
    }).join("");
  }
  function update(s) {
    var active = s.programs.filter(function (p) { return ["Researching", "Preparing"].indexOf(p.status) >= 0; }), next = active.filter(function (p) { return p.deadline && p.deadline >= G.today(); }).sort(function (a, b) { return a.deadline.localeCompare(b.deadline); })[0];
    var letters = 0, got = 0; s.programs.forEach(function (p) { letters += p.letters.length; got += p.letters.filter(function (l) { return l.submitted; }).length; });
    G.$("#stats").innerHTML = '<div class="stat"><div class="label">Programs</div><div class="value">' + s.programs.length + '</div></div><div class="stat lav"><div class="label">Next deadline</div><div class="value" style="font-size:1.1rem">' + (next ? G.esc(next.school) + "<br>" + G.fmtDate(next.deadline, { month: "short", day: "numeric" }) : "—") + '</div></div><div class="stat mint"><div class="label">Letters in</div><div class="value">' + got + "/" + letters + '</div></div><div class="stat"><div class="label">Submitted</div><div class="value">' + s.programs.filter(function (p) { return active.indexOf(p) < 0; }).length + "</div></div>";
  }
  G.tool({
    key: "gradiq-admissions-tracker-v1", name: "Grad admissions tracker", section: "Study & time",
    defaults: function () { return { sortKey: "deadline", sortDir: "asc", programs: [] }; },
    demo: function () { var t = G.today(); return { sortKey: "deadline", sortDir: "asc", programs: [
      prog({ school: "SAMPLE State University", program: "PhD, Sociology", deadline: G.addDays(t, 12), status: "Preparing", sop: "Revising", fee: 90, gpaNotes: "SAMPLE: min 3.0; explain sophomore dip in SoP.", letters: [letter({ name: "Prof. A (sample)", requested: G.addDays(t, -20), submitted: true }), letter({ name: "Dr. B (sample)", requested: G.addDays(t, -20) }), letter({ name: "Supervisor C (sample)", requested: G.addDays(t, -10) })] }),
      prog({ school: "SAMPLE Tech Institute", program: "MS, Data Science", deadline: G.addDays(t, 45), status: "Researching", sop: "Outlining", fee: 75, letters: [letter({ name: "Prof. A (sample)" })] }),
      prog({ school: "SAMPLE College of the Coast", program: "PhD, Marine Biology", deadline: G.addDays(t, -5), status: "Submitted", sop: "Final", fee: 100, letters: [letter({ name: "Prof. D (sample)", requested: G.addDays(t, -40), submitted: true }), letter({ name: "Dr. E (sample)", requested: G.addDays(t, -40), submitted: true })] })] }; },
    render: render, update: update,
    actions: {
      add: function (el, s, api) { var p = prog(); s.programs.push(p); api.commit(true); var c = document.getElementById("prog-" + p.id); if (c) { c.scrollIntoView({ behavior: "smooth", block: "start" }); var inp = c.querySelector("input"); if (inp) inp.focus({ preventScroll: true }); } },
      del: function (el, s, api) { var p = s.programs[+el.getAttribute("data-i")]; if (!confirm("Delete " + (p.school || "this program") + "?")) return; s.programs.splice(+el.getAttribute("data-i"), 1); api.commit(true); },
      sort: function (el, s, api) { var k = el.getAttribute("data-key"); if (s.sortKey === k) s.sortDir = s.sortDir === "asc" ? "desc" : "asc"; else { s.sortKey = k; s.sortDir = "asc"; } api.commit(true); var b = G.$('[data-action=sort][data-key="' + k + '"]'); if (b) b.focus(); },
      addLetter: function (el, s, api) { s.programs[+el.getAttribute("data-i")].letters.push(letter()); api.commit(true); },
      delLetter: function (el, s, api) { s.programs[+el.getAttribute("data-i")].letters.splice(+el.getAttribute("data-li"), 1); api.commit(true); }
    },
    csv: function (s) {
      var rows = [["School", "Program", "Deadline", "Status", "SoP", "Fee", "Letters submitted", "Letters total", "GPA notes", "Notes"]], lrows = [["School", "Program", "Recommender", "Requested", "Submitted"]];
      sorted(s).forEach(function (x) { var p = x.p; rows.push([p.school, p.program, p.deadline, p.status, p.sop, p.fee, p.letters.filter(function (l) { return l.submitted; }).length, p.letters.length, p.gpaNotes, p.notes]); p.letters.forEach(function (l) { lrows.push([p.school, p.program, l.name, l.requested, l.submitted ? "yes" : "no"]); }); });
      return [{ title: "Programs", rows: rows }, { title: "Letters of recommendation", rows: lrows }];
    }
  });
})();
