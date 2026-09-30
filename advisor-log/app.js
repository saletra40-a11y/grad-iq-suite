(function () {
  "use strict";
  var G = GQ;
  function meeting(o) { return Object.assign({ id: G.uid(), date: G.today(), attendees: "", agenda: "", notes: "", actions: [], nextMeeting: "", sent: false }, o || {}); }
  function action(o) { return Object.assign({ text: "", owner: "Me", due: "", done: false }, o || {}); }
  function email(s, m) {
    var who = s.advisorName || "[Advisor]", me = s.myName || "[Your name]", acts = m.actions.filter(function (a) { return a.text; });
    var mine = acts.filter(function (a) { return a.owner === "Me"; }), theirs = acts.filter(function (a) { return a.owner === "Advisor"; }), other = acts.filter(function (a) { return a.owner !== "Me" && a.owner !== "Advisor"; });
    var line = function (a) { return "- " + a.text + (a.due ? " (by " + G.fmtDate(a.due, { weekday: "short", month: "short", day: "numeric" }) + ")" : ""); };
    var out = ["Subject: Follow-up from our meeting on " + G.fmtDate(m.date, { month: "short", day: "numeric", year: "numeric" }), "", "Hi " + who + ",", "", "Thank you for meeting with me on " + G.fmtDate(m.date, { weekday: "long", month: "long", day: "numeric" }) + ". Here's my summary of what we agreed, so we're on the same page:", ""];
    if (mine.length) out.push("I will:", mine.map(line).join("\n"), "");
    if (theirs.length) out.push("You offered to:", theirs.map(line).join("\n"), "");
    if (other.length) out.push("Also agreed:", other.map(function (a) { return line(a) + " [" + a.owner + "]"; }).join("\n"), "");
    if (!acts.length) out.push("- (add agreed actions above)", "");
    if (m.nextMeeting) out.push("Our next meeting: " + G.fmtDate(m.nextMeeting, { weekday: "long", month: "long", day: "numeric" }) + ".", "");
    out.push("Please let me know if I missed or misunderstood anything.", "", "Best,", me);
    return out.join("\n");
  }
  function render(s) {
    var ms = s.meetings.map(function (m, i) { return { m: m, i: i }; }).sort(function (a, b) { return (b.m.date || "").localeCompare(a.m.date || ""); });
    G.$("#meetings").innerHTML = ms.length ? ms.map(function (x) {
      var m = x.m, i = x.i, b = "meetings." + i + ".";
      return '<article class="card" aria-label="Meeting ' + G.esc(G.fmtDate(m.date)) + '"><div class="card-head"><h2>' + G.fmtDate(m.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) + '</h2><button type="button" class="btn sm danger no-print" data-action="delMeeting" data-i="' + i + '">Delete</button></div>' +
        '<div class="field-row"><label class="field">Date<input type="date" data-bind="' + b + 'date" data-rerender></label><label class="field">Attendees<input type="text" data-bind="' + b + 'attendees" placeholder="Advisor, co-advisor…"></label><label class="field">Next meeting<input type="date" data-bind="' + b + 'nextMeeting"></label></div>' +
        '<label class="field">Agenda (what I wanted to cover)<textarea rows="2" style="min-height:60px" data-bind="' + b + 'agenda"></textarea></label>' +
        '<label class="field">Notes (what was said)<textarea data-bind="' + b + 'notes"></textarea></label>' +
        '<h3>Agreed actions</h3><div class="rows">' + (m.actions.length ? m.actions.map(function (a, ai) { var ab = b + "actions." + ai + "."; return '<div class="row-line" style="--cols: auto 3fr 1fr 1fr auto"><input type="checkbox" data-bind="' + ab + 'done" data-rerender aria-label="Action done" style="align-self:center"><label class="field">Action<input type="text" data-bind="' + ab + 'text"></label><label class="field">Who<select data-bind="' + ab + 'owner"><option>Me</option><option>Advisor</option><option>Both</option><option>Committee</option></select></label><label class="field">Due<input type="date" data-bind="' + ab + 'due"></label><button type="button" class="btn icon ghost no-print" data-action="delAction" data-i="' + i + '" data-ai="' + ai + '" aria-label="Delete action">✕</button></div>'; }).join("") : '<p class="empty">No actions yet.</p>') + '</div>' +
        '<div class="btn-row no-print" style="margin-top:.6rem"><button type="button" class="btn sm" data-action="addAction" data-i="' + i + '">+ Action</button><button type="button" class="btn sm primary" data-action="genEmail" data-i="' + i + '">✉️ Generate follow-up email</button></div>' +
        '<div class="no-print" id="em-' + m.id + '" hidden><label class="field" style="margin-top:.8rem">Follow-up email (edit before sending)<textarea rows="12" id="emt-' + m.id + '" style="font-family:ui-monospace,Menlo,monospace;font-size:.88rem"></textarea></label><div class="btn-row"><button type="button" class="btn sm primary" data-action="copyEmail" data-id="' + m.id + '">📋 Copy to clipboard</button><label class="check" style="align-items:center"><input type="checkbox" data-bind="' + b + 'sent"> I sent it</label></div></div></article>';
    }).join("") : '<div class="card"><p class="empty">No meetings logged yet. Log your next one right after it happens, while it\'s fresh.</p></div>';
  }
  function update(s) {
    var open = []; s.meetings.forEach(function (m) { m.actions.forEach(function (a) { if (!a.done && a.text) open.push({ a: a, m: m }); }); });
    open.sort(function (x, y) { return (x.a.due || "9999").localeCompare(y.a.due || "9999"); });
    G.$("#open").innerHTML = open.length ? open.map(function (o) { var late = o.a.due && o.a.due < G.today(); return "<li><strong>" + G.esc(o.a.owner) + ":</strong> " + G.esc(o.a.text) + (o.a.due ? ' <span class="pill ' + (late ? "bad" : "lav") + '">' + (late ? "overdue · " : "due ") + G.fmtDate(o.a.due, { month: "short", day: "numeric" }) + "</span>" : "") + ' <span class="small muted">(from ' + G.fmtDate(o.m.date, { month: "short", day: "numeric" }) + ")</span></li>"; }).join("") : '<li class="empty" style="list-style:none;margin-left:-1.1rem">Nothing open. 🎉</li>';
  }
  G.tool({
    key: "gradiq-advisor-log-v1", name: "Advisor-meeting log", section: "Stress & support", stress: true,
    defaults: function () { return { advisorName: "", myName: "", meetings: [] }; },
    demo: function () { var t = G.today(); return { advisorName: "Dr. Sample", myName: "Sample Student", meetings: [
      meeting({ date: G.addDays(t, -2), attendees: "Dr. Sample (fictional)", agenda: "SAMPLE: chapter 2 timeline, conference abstract", notes: "SAMPLE: Advisor OK with moving ch. 2 draft to next month. Suggested trimming lit review by ~30%.", nextMeeting: G.addDays(t, 12), actions: [action({ text: "Send revised ch. 2 outline", owner: "Me", due: G.addDays(t, 5) }), action({ text: "Share contact for the methods consultant", owner: "Advisor", due: G.addDays(t, 3) }), action({ text: "Submit conference abstract draft for feedback", owner: "Me", due: G.addDays(t, 9) })] }),
      meeting({ date: G.addDays(t, -16), attendees: "Dr. Sample (fictional)", notes: "SAMPLE: Discussed workload during TA semester.", actions: [action({ text: "Draft a semester plan with 3 deep-work blocks/week", owner: "Me", due: G.addDays(t, -9), done: true })], sent: true })] }; },
    render: render, update: update,
    actions: {
      addMeeting: function (el, s, api) { s.meetings.push(meeting({ actions: [action()] })); api.commit(true); },
      delMeeting: function (el, s, api) { if (!confirm("Delete this meeting and its notes?")) return; s.meetings.splice(+el.getAttribute("data-i"), 1); api.commit(true); },
      addAction: function (el, s, api) { s.meetings[+el.getAttribute("data-i")].actions.push(action()); api.commit(true); },
      delAction: function (el, s, api) { s.meetings[+el.getAttribute("data-i")].actions.splice(+el.getAttribute("data-ai"), 1); api.commit(true); },
      genEmail: function (el, s) { var m = s.meetings[+el.getAttribute("data-i")], box = document.getElementById("em-" + m.id), ta = document.getElementById("emt-" + m.id); ta.value = email(s, m); box.hidden = false; ta.focus(); },
      copyEmail: function (el) { var ta = document.getElementById("emt-" + el.getAttribute("data-id")); G.copyText(ta.value).then(function (ok) { G.toast(ok ? "Email copied — paste it into your mail app" : "Couldn't copy; select the text and copy manually"); }); }
    },
    csv: function (s) {
      var rows = [["Meeting date", "Attendees", "Agenda", "Notes", "Next meeting", "Follow-up sent"]], ar = [["Meeting date", "Action", "Who", "Due", "Done"]];
      s.meetings.forEach(function (m) { rows.push([m.date, m.attendees, m.agenda, m.notes, m.nextMeeting, m.sent ? "yes" : "no"]); m.actions.forEach(function (a) { ar.push([m.date, a.text, a.owner, a.due, a.done ? "yes" : "no"]); }); });
      return [{ title: "Meetings", rows: rows }, { title: "Agreed actions", rows: ar }];
    }
  });
})();
