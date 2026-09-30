(function () {
  "use strict";
  var G = GQ, ST = ["To check", "Looking into it", "Applied", "Receiving / done", "Not for me"];
  function item(key, title, why, links) { return { key: key, title: title, why: why, links: links || [], status: "To check", myLink: "", notes: "" }; }
  function defaults() {
    return { items: [
      item("fafsa", "FAFSA", "FAFSA is an application, not a loan. It unlocks grants (which don't have to be repaid), work-study and federal loans, and grad students can file too.", [["FAFSA at StudentAid.gov", "https://studentaid.gov/h/apply-for-aid/fafsa"], ["fafsa.gov", "https://fafsa.gov"]]),
      item("emergency", "Campus emergency aid", "Ask your financial aid office or dean of students about emergency grants or short-term loans. Most students don't know these exist.", [["Inside Higher Ed on emergency aid (2025)", "https://www.insidehighered.com/news/student-success/academic-life/2025/10/07/students-struggle-surprise-costs-dont-know-about-help"]]),
      item("snap", "SNAP eligibility", "\"Can college students get food stamps?\" is a common question. Students enrolled at least half-time face extra SNAP rules, with exemptions. Check the USDA page and your state agency.", [["USDA: SNAP and students", "https://www.fns.usda.gov/snap/students"], ["USDA: SNAP eligibility", "https://www.fns.usda.gov/snap/recipient/eligibility"]]),
      item("pantry", "Campus or local food pantry", "Many campuses run a pantry or basic-needs center. Add your campus link below. For off-campus help, USA.gov lists food assistance options.", [["USA.gov: food assistance", "https://www.usa.gov/food-help"]]),
      item("health", "Health coverage", "Check your school's student health plan, and whether you qualify for Medicaid or a Marketplace plan.", [["HealthCare.gov", "https://www.healthcare.gov"], ["Medicaid.gov", "https://www.medicaid.gov"]]),
      item("aidoffice", "Financial aid office check-in", "Ask about cost-of-attendance adjustments, assistantships, fellowships and payment plans. Only 27% of students fully understand their cost of attendance (IHE 2025).", [])
    ] };
  }
  function demo() { var d = defaults(); d.items[0].status = "Receiving / done"; d.items[0].notes = "SAMPLE: filed in October."; d.items[1].status = "Looking into it"; d.items[1].notes = "SAMPLE: emailed the dean of students office."; d.items[3].myLink = "https://example.edu/pantry"; d.items[3].notes = "SAMPLE: pantry open Tue/Thu (fictional)."; return d; }
  function render(s) {
    G.$("#items").innerHTML = s.items.map(function (it, i) {
      var my = G.safeUrl(it.myLink);
      return '<article class="row-card" aria-labelledby="it-' + i + '"><div style="display:flex;justify-content:space-between;gap:.5rem;align-items:flex-start"><h3 id="it-' + i + '" style="margin:0;font-family:var(--font);font-weight:700">' + G.esc(it.title) + '</h3><span class="pill" data-pill="' + i + '"></span></div>' +
        (it.custom ? '<label class="field">Resource name<input type="text" data-bind="items.' + i + '.title" data-rerender></label>' : "") +
        (it.why ? '<p class="small" style="margin:0">' + G.esc(it.why) + "</p>" : "") +
        (it.links.length || my ? '<ul class="small" style="margin:0;padding-left:1.1rem">' + it.links.map(function (l) { return '<li><a href="' + G.esc(l[1]) + '" target="_blank" rel="noopener">' + G.esc(l[0]) + "</a></li>"; }).join("") + (my ? '<li><a href="' + G.esc(my) + '" target="_blank" rel="noopener">My campus link</a></li>' : "") + "</ul>" : "") +
        '<div class="field-row"><label class="field">Status<select data-bind="items.' + i + '.status">' + ST.map(function (o) { return "<option>" + o + "</option>"; }).join("") + '</select></label>' +
        '<label class="field">My campus / local link<input type="url" placeholder="https://…" data-bind="items.' + i + '.myLink" data-rerender></label></div>' +
        '<label class="field">Notes<textarea rows="2" style="min-height:60px" data-bind="items.' + i + '.notes" placeholder="Who I talked to, what I need, next step…"></textarea></label>' +
        (it.custom ? '<button type="button" class="btn sm danger no-print" data-action="del" data-i="' + i + '">Delete</button>' : "") + "</article>";
    }).join("");
  }
  function update(s) {
    var done = s.items.filter(function (x) { return x.status === "Receiving / done" || x.status === "Not for me" || x.status === "Applied"; }).length;
    G.$("#progress").textContent = done + " of " + s.items.length + " checked";
    G.$$("[data-pill]").forEach(function (el) { var it = s.items[+el.getAttribute("data-pill")]; if (!it) return; el.textContent = it.status; el.className = "pill " + ({ "Receiving / done": "ok", "Applied": "ok", "Looking into it": "warn", "To check": "lav" }[it.status] || ""); });
  }
  G.tool({
    key: "gradiq-basic-needs-v1", name: "Basic-needs & benefits checklist", section: "Budget & money",
    defaults: defaults, demo: demo, render: render, update: update,
    actions: {
      add: function (el, s, api) { var it = item("custom-" + G.uid(), "My resource", "", []); it.custom = true; s.items.push(it); api.commit(true); },
      del: function (el, s, api) { if (!confirm("Delete this resource?")) return; s.items.splice(+el.getAttribute("data-i"), 1); api.commit(true); }
    },
    csv: function (s) { return [{ title: "Benefits checklist", rows: [["Item", "Status", "My link", "Notes"]].concat(s.items.map(function (i) { return [i.title, i.status, i.myLink, i.notes]; })) }]; }
  });
})();
