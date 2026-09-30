(function () {
  "use strict";
  var G = GQ, DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  function monday(d) { d = d || new Date(); var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); var wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return G.iso(x); }
  function toMin(t) { var p = String(t || "09:00").split(":"); return (+p[0] || 0) * 60 + (+p[1] || 0); }
  function toTime(m) { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }
  function fmtT(t) { var m = toMin(t), h = Math.floor(m / 60), mm = m % 60; return ((h % 12) || 12) + (mm ? ":" + String(mm).padStart(2, "0") : "") + (h < 12 ? "am" : "pm"); }
  function plan(s) {
    var goal = Math.round((G.num(s.goalHours) || 3.5) * 60), len = +s.blockMin || 90, brk = G.num(s.breakMin), out = [];
    s.days.forEach(function (on, d) { if (!on) return; var left = goal, t = toMin(s.bestStart), n = 0; while (left > 0 && n < 8) { var m = Math.min(len, left); out.push({ id: G.uid(), day: d, start: toTime(t), minutes: m, task: "", done: false }); left -= m; t += m + brk; n++; } });
    return out;
  }
  function render(s) {
    G.$("#daypick").innerHTML = DAYS.map(function (d, i) { return '<label class="check pill" style="padding:.4rem .7rem"><input type="checkbox" data-bind="days.' + i + '"> ' + d + "</label>"; }).join("");
    var wk = s.weekOf || monday();
    G.$("#grid").innerHTML = DAYS.map(function (d, di) {
      var blocks = s.blocks.map(function (b, i) { return { b: b, i: i }; }).filter(function (x) { return x.b.day === di; }).sort(function (a, b) { return a.b.start.localeCompare(b.b.start); });
      return '<div class="day-col"><h3><span>' + d + ' <span class="small muted" style="font-weight:500">' + G.fmtDate(G.addDays(wk, di), { month: "short", day: "numeric" }) + '</span></span><span class="pill" data-daytot="' + di + '"></span></h3>' +
        blocks.map(function (x) { var i = x.i, b = x.b; var opts = [25, 45, 60, 90, 120]; if (opts.indexOf(+b.minutes) < 0) opts.push(+b.minutes); opts.sort(function (a, c) { return a - c; });
          return '<div class="block' + (b.done ? " done" : "") + '"><div class="b-row"><input type="checkbox" data-bind="blocks.' + i + '.done" data-rerender aria-label="' + d + " " + fmtT(b.start) + ' block done"><input type="time" data-bind="blocks.' + i + '.start" data-rerender aria-label="Start time"></div><div class="b-row"><select data-bind="blocks.' + i + '.minutes" data-type="number" aria-label="Minutes">' + opts.map(function (o) { return '<option value="' + o + '">' + o + " min</option>"; }).join("") + '</select><button type="button" class="btn icon ghost no-print" style="width:32px;height:32px;min-height:32px" data-action="del" data-i="' + i + '" aria-label="Delete block">✕</button></div><input type="text" placeholder="Focus task (e.g. write §2.3)" data-bind="blocks.' + i + '.task" aria-label="Focus task"></div>'; }).join("") +
        '<button type="button" class="btn sm ghost no-print" data-action="add" data-day="' + di + '">+ Block</button></div>';
    }).join("");
  }
  function update(s) {
    var goal = G.num(s.goalHours) || 0, planned = 0, done = 0, perDay = [0, 0, 0, 0, 0, 0, 0], perDone = [0, 0, 0, 0, 0, 0, 0];
    s.blocks.forEach(function (b) { var m = G.num(b.minutes); planned += m; perDay[b.day] += m; if (b.done) { done += m; perDone[b.day] += m; } });
    G.$$("[data-daytot]").forEach(function (el) { var d = +el.getAttribute("data-daytot"); el.textContent = (perDone[d] / 60).toFixed(1).replace(".0", "") + "/" + (perDay[d] / 60).toFixed(1).replace(".0", "") + "h"; el.className = "pill " + (perDay[d] && perDone[d] >= perDay[d] ? "ok" : ""); });
    var active = s.days.filter(Boolean).length;
    G.$("#stats").innerHTML = '<div class="stat lav"><div class="label">Planned</div><div class="value">' + (planned / 60).toFixed(1) + ' h</div></div><div class="stat mint"><div class="label">Done</div><div class="value" id="donehrs">' + (done / 60).toFixed(1) + ' h</div></div><div class="stat"><div class="label">Weekly goal</div><div class="value">' + (goal * active).toFixed(1) + ' h</div></div><div class="stat"><div class="label">Completion</div><div class="value">' + (planned ? Math.round(done / planned * 100) : 0) + "%</div></div>";
  }
  G.tool({
    key: "gradiq-deep-work-v1", name: "Deep-work block planner", section: "Study & time",
    defaults: function () { return { weekOf: monday(), bestStart: "09:00", goalHours: 3.5, blockMin: "90", breakMin: 15, days: [true, true, true, true, true, false, false], blocks: [], adminNotes: "" }; },
    demo: function () {
      var s = { weekOf: monday(), bestStart: "08:30", goalHours: 3.5, blockMin: "90", breakMin: 20, days: [true, true, true, true, true, false, false], blocks: [], adminNotes: "SAMPLE: reply to committee email, file travel reimbursement, skim 2 abstracts." };
      s.blocks = plan(s); var tasks = ["SAMPLE: write methods §3.1", "SAMPLE: code analysis", "SAMPLE: edit ch. 2"]; s.blocks.forEach(function (b, i) { b.task = tasks[i % 3]; if (b.day < 2) b.done = true; }); return s;
    },
    render: render, update: update,
    actions: {
      autoplan: function (el, s, api) { if (s.blocks.length && !confirm("Replace this week's blocks with an auto-plan?")) return; s.blocks = plan(s); api.commit(true); G.toast("Planned " + s.blocks.length + " blocks"); },
      nextWeek: function (el, s, api) { s.weekOf = G.addDays(s.weekOf || monday(), 7); s.blocks.forEach(function (b) { b.done = false; }); api.commit(true); G.toast("New week started"); },
      add: function (el, s, api) { var d = +el.getAttribute("data-day"), last = s.blocks.filter(function (b) { return b.day === d; }).sort(function (a, b) { return b.start.localeCompare(a.start); })[0]; s.blocks.push({ id: G.uid(), day: d, start: last ? toTime(toMin(last.start) + G.num(last.minutes) + G.num(s.breakMin)) : s.bestStart, minutes: +s.blockMin || 90, task: "", done: false }); api.commit(true); },
      del: function (el, s, api) { s.blocks.splice(+el.getAttribute("data-i"), 1); api.commit(true); }
    },
    csv: function (s) { return [{ title: "Deep-work blocks, week of " + s.weekOf, rows: [["Day", "Date", "Start", "Minutes", "Task", "Done"]].concat(s.blocks.slice().sort(function (a, b) { return a.day - b.day || a.start.localeCompare(b.start); }).map(function (b) { return [DAYS[b.day], G.addDays(s.weekOf, b.day), b.start, b.minutes, b.task, b.done ? "yes" : "no"]; })) }]; }
  });
})();
