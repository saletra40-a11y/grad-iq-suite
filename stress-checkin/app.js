(function () {
  "use strict";
  var G = GQ;
  var SCALES = [
    { k: "stress", label: "Stress level", lo: "calm", hi: "overwhelmed", color: "#b0475a", invert: true },
    { k: "sleep", label: "Sleep quality", lo: "poor", hi: "restful", color: "#4f7fa8" },
    { k: "energy", label: "Energy", lo: "drained", hi: "energized", color: "#6b5b8a" },
    { k: "support", label: "Feeling supported / connected", lo: "alone", hi: "supported", color: "#3f8a66" },
    { k: "workload", label: "Workload feels manageable", lo: "not at all", hi: "very", color: "#b07a1c" }
  ];
  var PROMPTS = ["What took the most energy this week, and what gave some back?", "What's one thing you'd like to be different next week? What's one small step toward it?", "Who or what helped this week?", "What are you proud of, even if it's small?", "What can you let go of or ask for help with?"];
  function weekStart() { var d = new Date(), wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return G.iso(d); }
  var draft = {};
  function drawScales() {
    G.$("#scales").innerHTML = SCALES.map(function (sc) {
      return '<fieldset class="field" style="border:0;padding:0;margin:0 0 .9rem"><legend style="font-weight:600;margin-bottom:.3rem">' + sc.label + ' <span class="hint">(1 = ' + sc.lo + ", 5 = " + sc.hi + ')</span></legend><div class="btn-row" role="radiogroup">' +
        [1, 2, 3, 4, 5].map(function (n) { return '<label class="check pill" style="padding:.45rem .8rem;font-size:.95rem"><input type="radio" name="sc-' + sc.k + '" value="' + n + '"' + (draft[sc.k] === n ? " checked" : "") + "> " + n + "</label>"; }).join("") + "</div></fieldset>";
    }).join("");
  }
  function loadDraft(s) {
    var wk = G.$("#c-week").value || weekStart(), e = s.entries.filter(function (x) { return x.week === wk; })[0];
    draft = e ? Object.assign({}, e) : {}; drawScales(); G.$("#c-reflect").value = e ? e.reflection || "" : "";
    G.$("#c-mode").textContent = e ? " Editing your saved check-in for this week." : "";
  }
  function chart(s) {
    var es = s.entries.slice().sort(function (a, b) { return a.week.localeCompare(b.week); }).slice(-12);
    if (es.length < 1) { G.$("#chart").innerHTML = '<p class="empty">Your trend appears after your first check-in.</p>'; G.$("#legend").innerHTML = ""; return; }
    var W = 640, H = 240, L = 34, R = 12, T = 12, B = 34, n = es.length, x = function (i) { return L + (n === 1 ? (W - L - R) / 2 : i * (W - L - R) / (n - 1)); }, y = function (v) { return T + (5 - v) * (H - T - B) / 4; };
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-labelledby="chart-title"><title id="chart-title">Check-in scores over the last ' + n + " week" + (n > 1 ? "s" : "") + "</title>";
    for (var v = 1; v <= 5; v++) svg += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#eee4da"/><text x="' + (L - 10) + '" y="' + (y(v) + 4) + '" font-size="12" text-anchor="end" fill="#676173">' + v + "</text>";
    es.forEach(function (e, i) { if (n <= 8 || i % 2 === 0) svg += '<text x="' + x(i) + '" y="' + (H - 10) + '" font-size="11" text-anchor="middle" fill="#676173">' + G.fmtDate(e.week, { month: "numeric", day: "numeric" }) + "</text>"; });
    SCALES.forEach(function (sc) {
      var pts = es.map(function (e, i) { return e[sc.k] ? [x(i), y(e[sc.k])] : null; }).filter(Boolean);
      if (pts.length > 1) svg += '<polyline fill="none" stroke="' + sc.color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"' + (sc.invert ? ' stroke-dasharray="6 4"' : "") + ' points="' + pts.map(function (p) { return p.join(","); }).join(" ") + '"/>';
      pts.forEach(function (p) { svg += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="' + sc.color + '"/>'; });
    });
    G.$("#chart").innerHTML = svg + "</svg>";
    G.$("#legend").innerHTML = SCALES.map(function (sc) { return '<span><i style="background:' + sc.color + '"></i>' + sc.label + (sc.invert ? " (dashed; lower is calmer)" : "") + "</span>"; }).join("");
  }
  function render(s) {
    if (!G.$("#c-week").value) { G.$("#c-week").value = weekStart(); G.$("#w-date").value = G.today(); }
    G.$("#prompt").textContent = PROMPTS[Math.abs(G.parseISO(G.$("#c-week").value || weekStart()).getTime() / 604800000 | 0) % PROMPTS.length];
    loadDraft(s); chart(s);
    var es = s.entries.map(function (e, i) { return { e: e, i: i }; }).sort(function (a, b) { return b.e.week.localeCompare(a.e.week); });
    G.$("#entries").innerHTML = "<thead><tr><th scope='col'>Week of</th>" + SCALES.map(function (sc) { return "<th scope='col'>" + sc.label.split(" ")[0] + "</th>"; }).join("") + "<th scope='col'>Reflection</th><th scope='col'><span class='sr-only'>Delete</span></th></tr></thead><tbody>" +
      (es.length ? es.map(function (x) { return "<tr><td>" + G.fmtDate(x.e.week, { month: "short", day: "numeric" }) + "</td>" + SCALES.map(function (sc) { return "<td>" + (x.e[sc.k] || "—") + "</td>"; }).join("") + "<td>" + G.esc(x.e.reflection) + '</td><td><button type="button" class="btn sm ghost no-print" data-action="delEntry" data-i="' + x.i + '" aria-label="Delete check-in">✕</button></td></tr>'; }).join("") : '<tr><td colspan="8" class="empty">No check-ins yet.</td></tr>') + "</tbody>";
    var ws = s.wins.map(function (w, i) { return { w: w, i: i }; }).sort(function (a, b) { return b.w.date.localeCompare(a.w.date); });
    G.$("#wins").innerHTML = ws.length ? ws.map(function (x) { return '<li style="margin-bottom:.35rem"><strong>' + G.fmtDate(x.w.date, { month: "short", day: "numeric" }) + "</strong> — " + G.esc(x.w.text) + ' <button type="button" class="btn sm ghost no-print" data-action="delWin" data-i="' + x.i + '" aria-label="Delete win">✕</button></li>'; }).join("") : '<li class="empty" style="list-style:none;margin-left:-1.1rem">Your first win could be opening this page. That counts.</li>';
  }
  var api = G.tool({
    key: "gradiq-stress-checkin-v1", name: "Weekly stress check-in", section: "Stress & support", stress: true,
    defaults: function () { return { entries: [], wins: [] }; },
    demo: function () { var w = weekStart(), mk = function (o, st, sl, en, su, wl, r) { return { week: G.addDays(w, -7 * o), stress: st, sleep: sl, energy: en, support: su, workload: wl, reflection: r }; };
      return { entries: [mk(5, 3, 3, 3, 3, 3, "SAMPLE: settling into the semester."), mk(4, 4, 2, 2, 3, 2, "SAMPLE: grading + quals prep."), mk(3, 5, 2, 2, 2, 1, "SAMPLE: rough week, reached out to a friend."), mk(2, 4, 3, 3, 4, 2, "SAMPLE: talked to advisor about workload."), mk(1, 3, 3, 3, 4, 3, "SAMPLE: better sleep routine."), mk(0, 2, 4, 4, 4, 4, "SAMPLE: steady week.")],
        wins: [{ date: G.addDays(G.today(), -9), text: "SAMPLE: booked a counseling intake appointment" }, { date: G.addDays(G.today(), -4), text: "SAMPLE: wrote 400 words before lunch" }, { date: G.addDays(G.today(), -1), text: "SAMPLE: went for a walk without my phone" }] }; },
    render: render,
    actions: {
      save: function (el, s, api) {
        var e = { week: G.$("#c-week").value || weekStart(), reflection: G.$("#c-reflect").value.trim() }, any = false;
        SCALES.forEach(function (sc) { var r = G.$('input[name="sc-' + sc.k + '"]:checked'); e[sc.k] = r ? +r.value : null; if (r) any = true; });
        if (!any) { G.toast("Pick at least one rating"); return; }
        s.entries = s.entries.filter(function (x) { return x.week !== e.week; }); s.entries.push(e); api.commit(true); G.toast("Check-in saved. Thanks for checking in with yourself.");
      },
      delEntry: function (el, s, api) { if (!confirm("Delete this check-in?")) return; s.entries.splice(+el.getAttribute("data-i"), 1); api.commit(true); },
      addWin: function (el, s, api) { var t = G.$("#w-text").value.trim(); if (!t) { G.$("#w-text").focus(); return; } s.wins.push({ date: G.$("#w-date").value || G.today(), text: t }); G.$("#w-text").value = ""; api.commit(true); G.toast("Win logged 🌱"); },
      delWin: function (el, s, api) { s.wins.splice(+el.getAttribute("data-i"), 1); api.commit(true); }
    },
    csv: function (s) { return [{ title: "Weekly check-ins", rows: [["Week of"].concat(SCALES.map(function (x) { return x.label + " (1-5)"; }), ["Reflection"])].concat(s.entries.slice().sort(function (a, b) { return a.week.localeCompare(b.week); }).map(function (e) { return [e.week].concat(SCALES.map(function (x) { return e[x.k] == null ? "" : e[x.k]; }), [e.reflection]); })) }, { title: "Small wins", rows: [["Date", "Win"]].concat(s.wins.map(function (w) { return [w.date, w.text]; })) }]; }
  });
  G.$("#c-week").addEventListener("change", function () { render(api.state); });
})();
