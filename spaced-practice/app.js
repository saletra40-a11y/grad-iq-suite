(function () {
  "use strict";
  var G = GQ;
  function parseIntervals(str) { var a = String(str || "").split(/[,\s]+/).map(function (x) { return parseInt(x, 10); }).filter(function (n) { return n > 0 && n < 1000; }); return a.length ? a : [1, 3, 7, 14, 30]; }
  function mkTopic(name, course, date, intervals) { return { id: G.uid(), name: name, course: course, start: date, reviews: parseIntervals(intervals).map(function (d) { return { day: d, due: G.addDays(date, d), done: false, doneOn: "" }; }) }; }
  function allReviews(s) { var out = []; s.topics.forEach(function (t, ti) { t.reviews.forEach(function (r, ri) { out.push({ t: t, r: r, ti: ti, ri: ri }); }); }); return out; }
  function topicName(s, id) { var t = s.topics.filter(function (x) { return x.id === id; })[0]; return t ? t.name : "(deleted topic)"; }
  function render(s) {
    var td = G.today();
    G.$("#topics").innerHTML = s.topics.length ? s.topics.map(function (t, ti) {
      var done = t.reviews.filter(function (r) { return r.done; }).length;
      return '<div class="row-card"><div style="display:flex;justify-content:space-between;gap:.5rem;flex-wrap:wrap"><div><strong>' + G.esc(t.name) + "</strong>" + (t.course ? ' <span class="pill">' + G.esc(t.course) + "</span>" : "") + '<div class="small muted">First studied ' + G.fmtDate(t.start) + " · " + done + "/" + t.reviews.length + ' reviews done</div></div><button type="button" class="btn sm danger no-print" data-action="delTopic" data-i="' + ti + '">Delete</button></div>' +
        '<div class="btn-row">' + t.reviews.map(function (r, ri) {
          var cls = r.done ? "ok" : r.due < td ? "bad" : r.due === td ? "warn" : "lav";
          return '<label class="pill ' + cls + '" style="display:inline-flex;gap:.35rem;align-items:center;padding:.35rem .6rem"><input type="checkbox" data-bind="topics.' + ti + ".reviews." + ri + '.done" data-rerender aria-label="Day ' + r.day + " review of " + G.esc(t.name) + ' done"> +' + r.day + "d · " + G.fmtDate(r.due, { month: "short", day: "numeric" }) + "</label>";
        }).join("") + "</div></div>";
    }).join("") : '<p class="empty">No topics yet. Add the first thing you studied this week.</p>';
    var sel = G.$("#q-topic"), cur = sel.value;
    sel.innerHTML = s.topics.length ? s.topics.map(function (t) { return '<option value="' + t.id + '">' + G.esc(t.name) + "</option>"; }).join("") : '<option value="">Add a topic first</option>';
    if (cur) sel.value = cur;
    var qs = s.quizzes.map(function (q, i) { return { q: q, i: i }; }).sort(function (a, b) { return (b.q.date || "").localeCompare(a.q.date || ""); });
    G.$("#quizzes").innerHTML = "<thead><tr><th scope='col'>Date</th><th scope='col'>Topic</th><th scope='col'>Score</th><th scope='col'>Confidence</th><th scope='col'>Note</th><th scope='col'><span class='sr-only'>Delete</span></th></tr></thead><tbody>" +
      (qs.length ? qs.map(function (x) { var q = x.q, pct = q.n > 0 ? Math.round(q.ok / q.n * 100) + "%" : "—"; return "<tr><td>" + G.fmtDate(q.date, { month: "short", day: "numeric" }) + "</td><td>" + G.esc(topicName(s, q.topic)) + "</td><td>" + (q.n > 0 ? q.ok + "/" + q.n + " (" + pct + ")" : "—") + "</td><td>" + "●".repeat(q.conf) + "○".repeat(5 - q.conf) + '<span class="sr-only"> ' + q.conf + " of 5</span></td><td>" + G.esc(q.note) + '</td><td><button class="btn sm ghost no-print" type="button" data-action="delQuiz" data-i="' + x.i + '" aria-label="Delete quiz entry">✕</button></td></tr>'; }).join("") : '<tr><td colspan="6" class="empty">No quizzes logged yet.</td></tr>') + "</tbody>";
    ["#t-date", "#q-date"].forEach(function (id) { if (!G.$(id).value) G.$(id).value = td; });
  }
  function update(s) {
    var td = G.today(), all = allReviews(s);
    G.$("#todaydate").textContent = G.fmtDate(td, { weekday: "short", month: "short", day: "numeric" });
    var due = all.filter(function (x) { return !x.r.done && x.r.due <= td; }).sort(function (a, b) { return a.r.due.localeCompare(b.r.due); });
    G.$("#today").innerHTML = due.length ? '<ul style="list-style:none;padding:0;margin:0;display:grid;gap:.5rem" id="duelist">' + due.map(function (x) {
      var late = G.diffDays(x.r.due, td);
      return '<li class="row-card" style="background:#fff;display:flex;align-items:center;gap:.7rem;justify-content:space-between"><span><strong>' + G.esc(x.t.name) + '</strong> <span class="small muted">day-' + x.r.day + " review" + (late > 0 ? " · " + late + " day" + (late > 1 ? "s" : "") + " overdue" : "") + '</span></span><button type="button" class="btn sm primary" data-action="doneReview" data-ti="' + x.ti + '" data-ri="' + x.ri + '">Mark reviewed</button></li>';
    }).join("") + "</ul><p class='small' style='margin:.7rem 0 0'>Tip: quiz yourself first, then check your notes. Log it below.</p>" : '<p style="margin:0">Nothing due today. ' + (s.topics.length ? "Nice — you're caught up." : "Add a topic to start your schedule.") + "</p>";
    var soon = all.filter(function (x) { return !x.r.done && x.r.due > td && x.r.due <= G.addDays(td, 14); }).sort(function (a, b) { return a.r.due.localeCompare(b.r.due); });
    G.$("#upcoming").innerHTML = soon.length ? '<ul style="padding-left:1.1rem;margin:0">' + soon.map(function (x) { return "<li><strong>" + G.fmtDate(x.r.due, { weekday: "short", month: "short", day: "numeric" }) + "</strong> — " + G.esc(x.t.name) + ' <span class="small muted">(+' + x.r.day + "d)</span></li>"; }).join("") + "</ul>" : '<p class="empty">No reviews in the next two weeks.</p>';
  }
  G.tool({
    key: "gradiq-spaced-practice-v1", name: "Spaced-practice study calendar", section: "Study & time",
    defaults: function () { return { intervals: "1, 3, 7, 14, 30", topics: [], quizzes: [] }; },
    demo: function () {
      var td = G.today(), a = mkTopic("SAMPLE: Regression assumptions", "Stats 610", G.addDays(td, -7), "1,3,7,14,30"), b = mkTopic("SAMPLE: Lit review — framing theory", "Dissertation", G.addDays(td, -3), "1,3,7,14,30"), c = mkTopic("SAMPLE: Qualifying exam flashcards", "Quals", G.addDays(td, -1), "1,3,7,14,30");
      a.reviews[0].done = true; a.reviews[1].done = true; b.reviews[0].done = true;
      return { intervals: "1, 3, 7, 14, 30", topics: [a, b, c], quizzes: [{ date: G.addDays(td, -4), topic: a.id, n: 10, ok: 6, conf: 2, note: "SAMPLE: mixed up homoscedasticity" }, { date: G.addDays(td, -1), topic: b.id, n: 8, ok: 7, conf: 4, note: "SAMPLE" }] };
    },
    render: render, update: update,
    actions: {
      addTopic: function (el, s, api) { var n = G.$("#t-name").value.trim(); if (!n) { G.toast("Name the topic first"); G.$("#t-name").focus(); return; } s.topics.push(mkTopic(n, G.$("#t-course").value.trim(), G.$("#t-date").value || G.today(), s.intervals)); G.$("#t-name").value = ""; api.commit(true); G.toast("Scheduled " + parseIntervals(s.intervals).length + " reviews"); },
      delTopic: function (el, s, api) { var t = s.topics[+el.getAttribute("data-i")]; if (!confirm("Delete \"" + t.name + "\" and its review schedule?")) return; s.topics.splice(+el.getAttribute("data-i"), 1); api.commit(true); },
      doneReview: function (el, s, api) { var r = s.topics[+el.getAttribute("data-ti")].reviews[+el.getAttribute("data-ri")]; r.done = true; r.doneOn = G.today(); api.commit(true); G.toast("Review done ✓"); },
      addQuiz: function (el, s, api) {
        var topic = G.$("#q-topic").value; if (!topic) { G.toast("Add a topic first"); return; }
        var conf = G.$('input[name=conf]:checked'); s.quizzes.push({ date: G.$("#q-date").value || G.today(), topic: topic, n: G.num(G.$("#q-n").value), ok: G.num(G.$("#q-ok").value), conf: conf ? +conf.value : 3, note: G.$("#q-note").value.trim() });
        G.$("#q-n").value = ""; G.$("#q-ok").value = ""; G.$("#q-note").value = ""; api.commit(true); G.toast("Quiz logged");
      },
      delQuiz: function (el, s, api) { if (!confirm("Delete this quiz entry?")) return; s.quizzes.splice(+el.getAttribute("data-i"), 1); api.commit(true); }
    },
    csv: function (s) {
      var rows = [["Topic", "Course", "First studied", "Review day", "Due", "Done", "Done on"]];
      s.topics.forEach(function (t) { t.reviews.forEach(function (r) { rows.push([t.name, t.course, t.start, r.day, r.due, r.done ? "yes" : "no", r.doneOn]); }); });
      return [{ title: "Review schedule", rows: rows }, { title: "Self-quiz log", rows: [["Date", "Topic", "Questions", "Correct", "Confidence (1-5)", "Note"]].concat(s.quizzes.map(function (q) { return [q.date, topicName(s, q.topic), q.n, q.ok, q.conf, q.note]; })) }];
    }
  });
})();
