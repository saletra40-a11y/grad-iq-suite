/* Public demo build: storage is in-memory only, so nothing persists after reload. */
var memStore = (function () { var m = {}; return { getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; } }; })();
/**
 * Grad-IQ — Grad Milestones Planner (folded in from the earlier milestones planner)
 * Self-contained; persists to memStore.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "gradiq-milestones-v1";
  const DEMO_FLAG_KEY = "gradiq-milestones-demo-active";
  const REAL_BACKUP_KEY = "gradiq-milestones-backup-v1";

  const MILESTONE_DEFS = {
    phd: [
      {
        id: "coursework",
        title: "Coursework / core requirements",
        color: "blush",
        bufferWeeks: 0,
        // fraction of program from start → target (end of phase)
        endFrac: 0.35,
        startFrac: 0,
        items: [
          "Map required courses from handbook",
          "Track grades / remaining credits",
          "Identify methods courses needed for research",
          "Note any teaching requirements",
        ],
      },
      {
        id: "quals",
        title: "Qualifying / comprehensive exams",
        color: "lavender",
        bufferWeeks: 4,
        endFrac: 0.4,
        startFrac: 0.28,
        items: [
          "Confirm exam format & reading list",
          "Build spaced retrieval schedule (Anki / free-recall)",
          "Schedule practice orals with peers",
          "Book exam date with graduate division",
        ],
      },
      {
        id: "proposal",
        title: "Dissertation proposal + committee approval",
        color: "lavender",
        bufferWeeks: 6,
        endFrac: 0.5,
        startFrac: 0.4,
        items: [
          "Form committee (chair + members)",
          "Draft research questions & design",
          "Circulate proposal draft (allow 2–4 weeks review)",
          "Defend / revise until approved",
        ],
      },
      {
        id: "irb",
        title: "IRB / ethics approval",
        color: "sky",
        optional: true,
        bufferWeeks: 4,
        endFrac: 0.52,
        startFrac: 0.45,
        items: [
          "Determine if human/animal subjects apply",
          "Complete CITI / ethics training",
          "Submit protocol; budget revision time",
          "Store approval letter with project files",
        ],
      },
      {
        id: "research",
        title: "Research execution",
        color: "mint",
        bufferWeeks: 0,
        endFrac: 0.78,
        startFrac: 0.5,
        items: [
          "Pilot methods; lock analysis plan",
          "Collect / generate data with dated lab notes",
          "Backup data weekly (Fri ritual)",
          "Log decisions the same day as experiments",
        ],
      },
      {
        id: "drafts",
        title: "Chapter / paper drafts + feedback loops",
        color: "mint",
        bufferWeeks: 8,
        endFrac: 0.9,
        startFrac: 0.65,
        items: [
          "Outline all chapters early",
          "Write weekly (analysis → prose)",
          "Share drafts early with advisor / peers",
          "Build 20–30% slack before hard deadlines",
        ],
      },
      {
        id: "defense",
        title: "Final defense",
        color: "sky",
        bufferWeeks: 4,
        endFrac: 0.97,
        startFrac: 0.92,
        items: [
          "Confirm defense window with graduate division",
          "Circulate final draft (committee buffer: weeks)",
          "Prepare talk + anticipated questions",
          "Schedule room / remote logistics",
        ],
      },
      {
        id: "submit",
        title: "Submission / deposit",
        color: "sky",
        bufferWeeks: 2,
        endFrac: 1.0,
        startFrac: 0.97,
        items: [
          "Apply committee revisions",
          "Format per graduate division checklist",
          "Deposit dissertation / thesis",
          "Confirm degree paperwork & deadlines",
        ],
      },
    ],
    masters: [
      {
        id: "coursework",
        title: "Coursework / core requirements",
        color: "blush",
        bufferWeeks: 0,
        endFrac: 0.7,
        startFrac: 0,
        items: [
          "Map required courses from handbook",
          "Track remaining credits toward degree",
          "Align electives with capstone/thesis topic",
        ],
      },
      {
        id: "quals",
        title: "Qualifying / comprehensive exams",
        color: "lavender",
        optional: true,
        naByDefault: true,
        bufferWeeks: 2,
        endFrac: 0.55,
        startFrac: 0.45,
        items: [
          "Confirm if your program requires comps",
          "If yes: reading list + spaced retrieval",
          "If no: mark N/A and skip",
        ],
      },
      {
        id: "proposal",
        title: "Thesis / capstone proposal + approval",
        color: "lavender",
        bufferWeeks: 3,
        endFrac: 0.55,
        startFrac: 0.4,
        items: [
          "Choose advisor / readers",
          "Draft scope & research questions",
          "Get written approval of plan",
        ],
      },
      {
        id: "irb",
        title: "IRB / ethics approval",
        color: "sky",
        optional: true,
        bufferWeeks: 3,
        endFrac: 0.58,
        startFrac: 0.5,
        items: [
          "Check if human/animal subjects apply",
          "Submit or mark N/A",
        ],
      },
      {
        id: "research",
        title: "Research / project execution",
        color: "mint",
        bufferWeeks: 0,
        endFrac: 0.82,
        startFrac: 0.55,
        items: [
          "Execute methods / project plan",
          "Log results same day",
          "Backup data regularly",
        ],
      },
      {
        id: "drafts",
        title: "Thesis / capstone drafts + feedback",
        color: "mint",
        bufferWeeks: 4,
        endFrac: 0.92,
        startFrac: 0.7,
        items: [
          "Outline chapters / deliverables early",
          "Weekly writing blocks (30–90 min)",
          "Share drafts; leave revision buffer",
        ],
      },
      {
        id: "defense",
        title: "Defense / final presentation",
        color: "sky",
        optional: true,
        bufferWeeks: 2,
        endFrac: 0.97,
        startFrac: 0.92,
        items: [
          "Confirm if oral defense is required",
          "Circulate final draft with buffer",
          "Prepare presentation",
        ],
      },
      {
        id: "submit",
        title: "Submission / degree paperwork",
        color: "sky",
        bufferWeeks: 1,
        endFrac: 1.0,
        startFrac: 0.96,
        items: [
          "Apply final revisions",
          "Deposit thesis / submit capstone",
          "File graduation paperwork",
        ],
      },
    ],
  };

  const DEFAULT_WEEK = [
    { day: "Mon", kind: "making", label: "Making", text: "3–4 hrs deep analysis/writing (morning). Admin / email afternoon." },
    { day: "Tue", kind: "making", label: "Making", text: "Lab / field / code. Log results the same day." },
    { day: "Wed", kind: "mixed", label: "Mixed", text: "Advisor meeting + decision write-up. Literature block." },
    { day: "Thu", kind: "making", label: "Making", text: "Deep writing / figures. Protect the morning." },
    { day: "Fri", kind: "managing", label: "Managing", text: "Teaching / service if any. Light planning. Backup data." },
    { day: "Sat", kind: "rest", label: "Flexible", text: "Flexible research or full rest — prevent burnout." },
    { day: "Sun", kind: "managing", label: "Plan", text: "30 min Gantt update. Set 3 MITs for the week." },
  ];

  const TIPS = [
    { fail: "Endless literature review, no writing", fix: "Write from day one. Outline chapters early — even rough titles count." },
    { fail: "Waiting for motivation", fix: "Calendar research like a job. Short daily sessions (30–90 min) beat heroic weekends." },
    { fail: "Advisor radio silence", fix: "Send agenda + notes after every meeting. Request a standing cadence. Use your committee when stuck." },
    { fail: "Scope creep", fix: "Keep written research questions. Kill non-essential analyses ruthlessly at quarterly refreshes." },
    { fail: "Isolation / burnout", fix: "Join a cohort or writing group. Keep clear hours. Use campus mental health resources early." },
    { fail: "Writing treated as the last step", fix: "Integrate analysis → prose every week. Share imperfect drafts early." },
    { fail: "No buffer for revisions", fix: "Build 20–30% slack before hard deadlines. Committee review often takes weeks–months." },
  ];

  const GUIDED_STEPS = [
    {
      title: "Milestone map",
      body: "List requirements from your program handbook. We’ve seeded a standard arc—edit dates and skip what doesn’t apply.",
      bullets: [
        "Coursework → quals → proposal → (IRB) → research → drafts → defense → deposit",
        "Master’s programs often skip or shorten quals-heavy gates",
        "Your handbook wins over any template",
      ],
      chips: ["handbook first", "editable dates"],
    },
    {
      title: "Work backward",
      body: "Start from defense / graduation. Add committee-review buffers (weeks to months) before every hard gate.",
      bullets: [
        "Drafts need circulation time before defense",
        "IRB and formatting queues are slower than you hope",
        "20–30% slack is a feature, not padding",
      ],
      chips: ["buffers", "backward design"],
    },
    {
      title: "Weekly rhythm",
      body: "Separate making (analysis, experiments, new prose) from managing (email, meetings, admin).",
      bullets: [
        "Protect morning deep-work for making",
        "Batch email and logistics to afternoons",
        "Use the Week tab as your living template",
      ],
      chips: ["making", "managing"],
    },
    {
      title: "Daily writing habit",
      body: "Thirty to ninety minutes most days beats binge writing. Treat the calendar as a research job.",
      bullets: [
        "Same time cue helps automaticity",
        "Ugly first drafts still move the dissertation",
        "Log a sentence even on thin days",
      ],
      chips: ["30–90 min", "consistency"],
    },
    {
      title: "Spaced lit practice",
      body: "Retrieval + spacing beat highlighting. Keep a living lit matrix: paper × methods × findings × gaps.",
      bullets: [
        "Free-recall key claims before reopening the PDF",
        "Use Anki for quals formulas and seminal papers",
        "The Lit tab is your lightweight matrix",
      ],
      chips: ["retrieval", "spacing"],
    },
    {
      title: "Advisor OS",
      body: "Agenda-driven meetings. Written notes. Agreed next deliverables. Cadence you can count on.",
      bullets: [
        "Send agenda 24h ahead",
        "End with owner + next action + due date",
        "Silence → polite follow-up + committee backup",
      ],
      chips: ["agenda", "notes", "deliverables"],
    },
    {
      title: "Quarterly refresh",
      body: "Update the Gantt every quarter. If behind, cut scope—don’t just work longer hours.",
      bullets: [
        "Re-estimate remaining chapters / analyses",
        "Kill nice-to-have experiments",
        "Celebrate finished gates, not just busy weeks",
      ],
      chips: ["cut scope", "refresh"],
    },
  ];

  // ——— State ———
  let state = loadState();
  let guidedStep = 0;
  let activeDrawerId = null;
  let demoMode = false;
  let tourStep = 0;
  let tourActive = false;

  const TOUR_STEPS = [
    {
      title: "Your filled Ph.D. plan",
      body: "This demo loads a dissertation-phase plan ~15 months from defense. Coursework, quals, and proposal are done—research and drafts are in flight.",
      view: "milestones",
      target: "[data-tour=\'degree\']",
      place: "bottom",
    },
    {
      title: "Milestone map",
      body: "Gantt + checklist cards work backward from defense with buffers. Tap any card to edit dates, notes, and checklist items.",
      view: "milestones",
      target: "[data-tour=\'gantt\']",
      place: "bottom",
    },
    {
      title: "Toggle progress",
      body: "Hit the circle on a card to mark a milestone complete (or reopen it). Progress ring updates live.",
      view: "milestones",
      target: "[data-tour=\'ms-list\'] .ms-card",
      place: "top",
    },
    {
      title: "Weekly rhythm",
      body: "Making vs managing blocks keep deep work sacred. Edit the template and set 3 MITs for the week.",
      view: "week",
      target: "[data-tour=\'mits\'], #view-week .mits-bar",
      place: "bottom",
    },
    {
      title: "Tips when stuck",
      body: "Common failure modes → concrete fixes, plus the learning-science backbone. Swipe the bottom nav anytime.",
      view: "tips",
      target: "[data-tour=\'tips\'] .tips-grid, #tips-grid",
      place: "top",
    },
    {
      title: "Reset or exit",
      body: "Use the purple bar: Tour again or Reset demo to re-seed. This is a demo, so nothing is saved. Ready to explore?",
      view: "milestones",
      target: "#demo-banner",
      place: "bottom",
    },
  ];

  function defaultState() {
    const today = new Date();
    const target = new Date(today);
    target.setFullYear(target.getFullYear() + 4);
    return {
      degree: "phd",
      targetDate: iso(target),
      startDate: iso(today),
      setupDone: false,
      guidedDone: false,
      milestones: [],
      week: DEFAULT_WEEK.map((d) => ({ ...d })),
      mits: ["", "", ""],
      lit: [],
      meetings: [],
      advisorCadence: "biweekly",
    };
  }


  function addMonths(d, n) {
    const x = new Date(d);
    x.setMonth(x.getMonth() + n);
    return x;
  }

  /** Rich Ph.D. dissertation-phase sample for mobile demo. */
  function buildDemoState() {
    const today = new Date();
    const target = addMonths(today, 15); // ~15 months to defense
    const start = addMonths(today, -36); // ~3 years into program
    const targetStr = iso(target);
    const startStr = iso(start);

    let milestones = buildMilestones("phd", startStr, targetStr, {});
    // Pin defense / submit near target
    const defMs = milestones.find((m) => m.id === "defense");
    const sub = milestones.find((m) => m.id === "submit");
    if (defMs) {
      defMs.targetDate = targetStr;
      defMs.endDate = targetStr;
      defMs.startDate = iso(addMonths(target, -2));
    }
    if (sub) {
      sub.targetDate = iso(addDays(target, 14));
      sub.startDate = targetStr;
      sub.endDate = sub.targetDate;
    }

    const mark = (id, doneCount, notes) => {
      const m = milestones.find((x) => x.id === id);
      if (!m) return;
      m.items.forEach((it, i) => { it.done = i < doneCount; });
      if (notes) m.notes = notes;
    };
    mark("coursework", 4, "All core + methods complete. Teaching requirement finished AY24.");
    mark("quals", 4, "Passed oral + written Spring 2025. Reading list archived in Zotero.");
    mark("proposal", 4, "Committee approved Sept 2025 after one revision round.");
    mark("irb", 4, "Exempt determination on file; no amendments pending.");
    mark("research", 2, "Pilot locked. Main data collection ~60% done. Backup Fridays.");
    mark("drafts", 1, "Ch. 2 methods outline shared. Results chapter skeleton started.");
    mark("defense", 0, "");
    mark("submit", 0, "");

    // Tighten research / drafts windows for dissertation phase feel
    const research = milestones.find((m) => m.id === "research");
    const drafts = milestones.find((m) => m.id === "drafts");
    if (research) {
      research.startDate = iso(addMonths(today, -10));
      research.targetDate = iso(addMonths(today, 6));
      research.endDate = iso(addMonths(today, 8));
    }
    if (drafts) {
      drafts.startDate = iso(addMonths(today, -4));
      drafts.targetDate = iso(addMonths(today, 12));
      drafts.endDate = iso(addMonths(today, 13));
    }

    return {
      degree: "phd",
      targetDate: targetStr,
      startDate: startStr,
      setupDone: true,
      guidedDone: true,
      demoMode: true,
      milestones,
      week: DEFAULT_WEEK.map((d) => ({ ...d })),
      mits: [
        "Finish participant 42–48 coding + memo",
        "Draft results section 4.2 (figures 3–4)",
        "Send advisor agenda for Wed check-in",
      ],
      lit: [
        {
          paper: "Nguyen & Ortiz (2022). Collaborative sense-making in labs.",
          methods: "Ethnography + interview (n=24)",
          findings: "Shared artifacts reduce coordination cost; silence ≠ agreement.",
          gaps: "Little on remote hybrid labs — links to my RQ2.",
        },
        {
          paper: "Keller (2019). Temporal scaffolds for dissertation writing.",
          methods: "Mixed methods survey + diaries",
          findings: "Daily 45-min blocks predicted completion better than weekend binges.",
          gaps: "No STEM sample; test with my cohort writing group.",
        },
        {
          paper: "Park et al. (2024). Retrieval practice in doctoral quals prep.",
          methods: "RCT free-recall vs. reread",
          findings: "Spaced retrieval +2σ on oral mock scores.",
          gaps: "Use for leftover theory chapter claims.",
        },
      ],
      meetings: [
        {
          date: iso(addDays(today, -10)),
          agenda: "1) Data collection pace 2) Ch.4 outline 3) Conference abstract",
          notes: "Advisor wants tighter RQ wording. OK to drop secondary analysis B. Abstract due in 3 weeks.",
          next: "Maya: revise RQ paragraph by Fri. Advisor: intro examples by next meeting.",
        },
        {
          date: iso(addDays(today, -24)),
          agenda: "Pilot debrief + IRB status",
          notes: "Pilot coding reliable enough to proceed. Keep memo template.",
          next: "Lock codebook v2; schedule next 3 interviews.",
        },
      ],
      advisorCadence: "biweekly",
    };
  }

  function loadState() {
    try {
      const raw = memStore.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return { ...defaultState(), ...parsed };
    } catch {
      return defaultState();
    }
  }

  function save() {
    memStore.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function iso(d) {
    const x = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(x.getTime())) return "";
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const day = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function parseDate(s) {
    if (!s) return null;
    const d = new Date(s + "T12:00:00");
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  function fmt(s) {
    const d = parseDate(s);
    if (!d) return "—";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  // ——— Milestone generation ———
  function buildMilestones(degree, startStr, targetStr, preserve) {
    const defs = MILESTONE_DEFS[degree] || MILESTONE_DEFS.phd;
    const start = parseDate(startStr) || new Date();
    let target = parseDate(targetStr);
    if (!target || target <= start) {
      target = addDays(start, degree === "masters" ? 365 * 2 : 365 * 5);
    }
    const span = target - start;
    const prev = preserve || {};

    return defs.map((def) => {
      const old = prev[def.id] || {};
      const end = new Date(start.getTime() + span * def.endFrac);
      // pull back by buffer so the "target" is buffer-aware
      const buffered = addDays(end, -(def.bufferWeeks || 0) * 7);
      const startD = new Date(start.getTime() + span * def.startFrac);
      const skipped = old.skipped != null ? old.skipped : !!def.naByDefault;
      return {
        id: def.id,
        title: def.title,
        color: def.color,
        optional: !!def.optional,
        bufferWeeks: def.bufferWeeks || 0,
        startDate: iso(startD),
        targetDate: iso(buffered < startD ? startD : buffered),
        endDate: iso(end),
        skipped,
        notes: old.notes || "",
        items: (def.items || []).map((label, i) => ({
          label,
          done: (old.items && old.items[i] && old.items[i].done) || false,
        })),
      };
    });
  }

  function ensureMilestones(force) {
    if (force || !state.milestones.length) {
      const prev = {};
      state.milestones.forEach((m) => { prev[m.id] = m; });
      state.milestones = buildMilestones(state.degree, state.startDate, state.targetDate, prev);
      // ensure target milestone lands near target date
      const defMs = state.milestones.find((m) => m.id === "defense");
      const sub = state.milestones.find((m) => m.id === "submit");
      if (defMs && state.targetDate) {
        defMs.targetDate = state.targetDate;
        defMs.endDate = state.targetDate;
      }
      if (sub && state.targetDate) {
        const t = parseDate(state.targetDate);
        sub.targetDate = iso(addDays(t, 14));
        sub.startDate = state.targetDate;
        sub.endDate = sub.targetDate;
      }
      save();
    }
  }

  // ——— UI helpers ———
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function showScreen(id) {
    ["welcome", "guided", "main"].forEach((s) => {
      const el = document.getElementById(s);
      if (el) el.classList.toggle("hidden", s !== id);
    });
    const bn = $("#bottom-nav");
    if (bn) bn.hidden = id !== "main";
  }

  function setDegreeUI(degree) {
    $$(".degree-btn").forEach((b) => {
      b.classList.toggle("selected", b.dataset.degree === degree);
    });
    const label = degree === "masters" ? "Master’s" : "Ph.D.";
    const badge = $("#degree-badge");
    const gbadge = $("#guided-badge");
    if (badge) badge.textContent = label;
    if (gbadge) gbadge.textContent = label;
  }

  function setDefaultDatesIfEmpty() {
    const target = $("#target-date");
    const start = $("#start-date");
    if (target && !target.value) {
      target.value = state.targetDate || iso(addDays(new Date(), state.degree === "masters" ? 365 * 2 : 365 * 5));
    }
    if (start && !start.value) {
      start.value = state.startDate || iso(new Date());
    }
  }

  // ——— Guided ———
  function renderGuided() {
    const step = GUIDED_STEPS[guidedStep];
    const total = GUIDED_STEPS.length;
    $("#guided-step-label").textContent = `Step ${guidedStep + 1} of ${total}`;
    $("#guided-step-title").textContent = step.title;
    $("#guided-fill").style.width = `${((guidedStep + 1) / total) * 100}%`;
    $("#guided-progress").setAttribute("aria-valuenow", guidedStep + 1);

    const chips = (step.chips || [])
      .map((c, i) => `<span class="chip ${["", "mint", "blush", "sky"][i % 4]}">${escapeHtml(c)}</span>`)
      .join("");
    const bullets = (step.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("");

    $("#guided-panel").innerHTML = `
      <p class="eyebrow">Guided setup</p>
      <h1>${escapeHtml(step.title)}</h1>
      <p class="lede">${escapeHtml(step.body)}</p>
      <ul class="guided-bullets">${bullets}</ul>
      <div class="chip-row">${chips}</div>
    `;

    $("#btn-guided-back").disabled = guidedStep === 0;
    $("#btn-guided-next").textContent = guidedStep === total - 1 ? "Open planner" : "Next";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ——— Main views ———
  function switchView(name) {
    $$(".nav-tab").forEach((t) => {
      const on = t.dataset.view === name;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    $$("#bottom-nav button").forEach((t) => {
      t.classList.toggle("active", t.dataset.view === name);
    });
    ["milestones", "week", "lit", "advisor", "tips"].forEach((v) => {
      const el = document.getElementById(`view-${v}`);
      if (!el) return;
      const on = v === name;
      el.classList.toggle("active", on);
      el.hidden = !on;
    });
  }

  function milestoneProgress(m) {
    if (m.skipped) return { done: 0, total: 0, pct: 100, label: "N/A" };
    const total = m.items.length;
    const done = m.items.filter((i) => i.done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { done, total, pct, label: `${done}/${total}` };
  }

  function overallProgress() {
    const active = state.milestones.filter((m) => !m.skipped);
    if (!active.length) return 0;
    let sum = 0;
    active.forEach((m) => { sum += milestoneProgress(m).pct; });
    return Math.round(sum / active.length);
  }

  function renderMilestones() {
    const pct = overallProgress();
    const ring = $("#progress-ring");
    const circ = 2 * Math.PI * 30;
    if (ring) {
      ring.style.strokeDasharray = String(circ);
      ring.style.strokeDashoffset = String(circ * (1 - pct / 100));
    }
    $("#progress-pct").textContent = `${pct}%`;

    const deg = state.degree === "masters" ? "Master’s" : "Ph.D.";
    $("#timeline-summary").textContent =
      `${deg} · target ${fmt(state.targetDate)} · start ${fmt(state.startDate)}. Tap a card to edit.`;

    // Gantt
    const start = parseDate(state.startDate) || new Date();
    const target = parseDate(state.targetDate) || addDays(start, 365 * 4);
    const endPad = addDays(target, 30);
    const span = Math.max(endPad - start, 1);

    const gantt = $("#gantt");
    const rows = state.milestones.map((m) => {
      const s = parseDate(m.startDate) || start;
      const e = parseDate(m.endDate || m.targetDate) || s;
      const left = Math.max(0, Math.min(100, ((s - start) / span) * 100));
      const right = Math.max(0, Math.min(100, ((e - start) / span) * 100));
      const width = Math.max(2, right - left);
      const prog = milestoneProgress(m);
      const doneClass = prog.pct === 100 && !m.skipped ? "done" : "";
      const skipClass = m.skipped ? "skipped" : "";
      return `
        <div class="gantt-row">
          <div class="gantt-label ${doneClass} ${skipClass}" title="${escapeHtml(m.title)}">${escapeHtml(shortTitle(m.title))}</div>
          <div class="gantt-track">
            <div class="gantt-bar ${m.color} ${doneClass}" style="left:${left}%;width:${width}%"></div>
          </div>
        </div>`;
    }).join("");

    gantt.innerHTML = rows + `
      <div class="gantt-axis">
        <span>${fmt(iso(start))}</span>
        <span>today-ish</span>
        <span>${fmt(state.targetDate)}</span>
      </div>`;

    const list = $("#milestone-list");
    list.innerHTML = state.milestones.map((m) => {
      const prog = milestoneProgress(m);
      const checked = !m.skipped && prog.pct === 100;
      return `
        <article class="ms-card ${m.skipped ? "skipped" : ""}" data-id="${m.id}" tabindex="0" role="button">
          <button type="button" class="ms-check ${checked ? "checked" : ""}" data-toggle="${m.id}" aria-label="Toggle complete">
            ${checked ? "✓" : ""}
          </button>
          <div class="ms-body">
            <h3>${escapeHtml(m.title)}</h3>
            <p class="ms-meta">
              ${m.optional ? '<span class="ms-tag optional">optional</span>' : ""}
              ${m.skipped ? '<span class="ms-tag na">N/A</span>' : ""}
              Target ${fmt(m.targetDate)}
              ${m.bufferWeeks ? ` · ${m.bufferWeeks}w buffer baked in` : ""}
            </p>
          </div>
          <span class="ms-progress">${prog.label}</span>
        </article>`;
    }).join("");
  }

  function shortTitle(t) {
    if (t.length <= 28) return t;
    return t.replace(/ \/ .*/, "").replace(/approval.*/, "approval").slice(0, 28);
  }

  function renderWeek() {
    const grid = $("#week-grid");
    grid.innerHTML = state.week.map((d, i) => `
      <div class="day-card ${d.kind}">
        <header>
          <h3>${escapeHtml(d.day)}</h3>
          <span class="day-kind">${escapeHtml(d.label)}</span>
        </header>
        <textarea data-day="${i}" aria-label="${escapeHtml(d.day)} plan">${escapeHtml(d.text)}</textarea>
      </div>
    `).join("");

    $$("#mits input").forEach((inp) => {
      const i = Number(inp.dataset.mit);
      inp.value = state.mits[i] || "";
    });
  }

  function renderLit() {
    const body = $("#lit-body");
    if (!state.lit.length) {
      body.innerHTML = `<tr><td colspan="5" style="padding:1.25rem;color:var(--muted)">No papers yet. Add one to start your living matrix.</td></tr>`;
      return;
    }
    body.innerHTML = state.lit.map((row, i) => `
      <tr data-lit="${i}">
        <td data-label="Paper / author"><input value="${escapeHtml(row.paper || "")}" data-f="paper" placeholder="Author, year, title" /></td>
        <td data-label="Methods"><textarea data-f="methods" rows="2" placeholder="Design / methods">${escapeHtml(row.methods || "")}</textarea></td>
        <td data-label="Key findings"><textarea data-f="findings" rows="2" placeholder="Key claims">${escapeHtml(row.findings || "")}</textarea></td>
        <td data-label="Gaps / links"><textarea data-f="gaps" rows="2" placeholder="Gaps / how it links">${escapeHtml(row.gaps || "")}</textarea></td>
        <td data-label=""><button type="button" class="btn-icon" data-del-lit="${i}" aria-label="Remove">×</button></td>
      </tr>
    `).join("");
  }

  function renderAdvisor() {
    $("#advisor-cadence").value = state.advisorCadence || "biweekly";
    const list = $("#meeting-list");
    if (!state.meetings.length) {
      list.innerHTML = `<p class="muted" style="padding:0.5rem 0">No meetings logged yet. After each chat: agenda → notes → next deliverables.</p>`;
      return;
    }
    list.innerHTML = state.meetings.map((m, i) => `
      <div class="meeting-card" data-meeting="${i}">
        <h3>Meeting · ${fmt(m.date) || "undated"}</h3>
        <label class="field"><span>Date</span><input type="date" data-mf="date" value="${escapeHtml(m.date || "")}" /></label>
        <label class="field"><span>Agenda</span><textarea data-mf="agenda" rows="2">${escapeHtml(m.agenda || "")}</textarea></label>
        <label class="field"><span>Notes / decisions</span><textarea data-mf="notes" rows="3">${escapeHtml(m.notes || "")}</textarea></label>
        <label class="field"><span>Next deliverables</span><textarea data-mf="next" rows="2">${escapeHtml(m.next || "")}</textarea></label>
        <div class="meeting-actions">
          <button type="button" class="btn ghost sm" data-del-meeting="${i}">Delete</button>
        </div>
      </div>
    `).join("");
  }

  function renderTips() {
    $("#tips-grid").innerHTML = TIPS.map((t) => `
      <article class="tip-card">
        <p class="fail">⚠ ${escapeHtml(t.fail)}</p>
        <h3>Fix</h3>
        <p class="fix">${escapeHtml(t.fix)}</p>
      </article>
    `).join("");
  }

  function renderAll() {
    setDegreeUI(state.degree);
    renderMilestones();
    renderWeek();
    renderLit();
    renderAdvisor();
    renderTips();
  }

  // ——— Drawer ———
  function openDrawer(id) {
    const m = state.milestones.find((x) => x.id === id);
    if (!m) return;
    activeDrawerId = id;
    $("#drawer-eyebrow").textContent = m.optional ? "Optional milestone" : "Milestone";
    $("#drawer-title").textContent = m.title;
    $("#drawer-date").value = m.targetDate || "";
    $("#drawer-skip").checked = !!m.skipped;
    $("#drawer-notes").value = m.notes || "";
    $("#drawer-checklist").innerHTML = m.items.map((it, i) => `
      <label class="check-item ${it.done ? "done" : ""}">
        <input type="checkbox" data-ci="${i}" ${it.done ? "checked" : ""} />
        <span>${escapeHtml(it.label)}</span>
      </label>
    `).join("");
    $("#ms-drawer").classList.remove("hidden");
  }

  function closeDrawer() {
    activeDrawerId = null;
    $("#ms-drawer").classList.add("hidden");
  }

  function saveDrawer() {
    const m = state.milestones.find((x) => x.id === activeDrawerId);
    if (!m) return;
    m.targetDate = $("#drawer-date").value || m.targetDate;
    m.skipped = $("#drawer-skip").checked;
    m.notes = $("#drawer-notes").value;
    $$("#drawer-checklist input[data-ci]").forEach((inp) => {
      const i = Number(inp.dataset.ci);
      if (m.items[i]) m.items[i].done = inp.checked;
    });
    save();
    closeDrawer();
    renderMilestones();
  }

  // ——— Demo mode & coach-mark tour ———
  function isDemoQuery() {
    return true; // public demo build: always sample data
  }

  function setDemoChrome(on) {
    demoMode = !!on;
    document.body.classList.toggle("demo-mode", demoMode);
    const banner = $("#demo-banner");
    const bn = $("#bottom-nav");
    if (banner) banner.classList.toggle("hidden", !demoMode);
    if (bn) {
      bn.hidden = false; // CSS hides on desktop; show whenever main is up
    }
  }

  function enterDemo(showSplash) {
    // Backup real plan once so Exit can restore
    try {
      const existing = memStore.getItem(STORAGE_KEY);
      if (existing && !memStore.getItem(REAL_BACKUP_KEY)) {
        const parsed = JSON.parse(existing);
        if (!parsed.demoMode) {
          memStore.setItem(REAL_BACKUP_KEY, existing);
        }
      }
    } catch { /* ignore */ }

    state = buildDemoState();
    save();
    try { memStore.setItem(DEMO_FLAG_KEY, "1"); } catch { /* ignore */ }
    setDemoChrome(true);
    ensureMilestones(false);
    showScreen("main");
    renderAll();
    switchView("milestones");

    if (showSplash) {
      $("#demo-splash")?.classList.remove("hidden");
    } else {
      $("#demo-splash")?.classList.add("hidden");
    }
  }

  function resetDemo() {
    endTour();
    state = buildDemoState();
    save();
    setDemoChrome(true);
    showScreen("main");
    renderAll();
    switchView("milestones");
    startTour();
  }



  function startTour() {
    tourStep = 0;
    tourActive = true;
    $("#tour-overlay")?.classList.remove("hidden");
    renderTourStep();
  }

  function endTour() {
    tourActive = false;
    $("#tour-overlay")?.classList.add("hidden");
    const spot = $("#tour-spotlight");
    if (spot) spot.hidden = true;
  }

  function renderTourStep() {
    if (!tourActive) return;
    const step = TOUR_STEPS[tourStep];
    if (!step) { endTour(); return; }

    if (step.view) switchView(step.view);

    $("#tour-step-label").textContent = `${tourStep + 1} of ${TOUR_STEPS.length}`;
    $("#tour-title").textContent = step.title;
    $("#tour-body").textContent = step.body;
    $("#btn-tour-next").textContent = tourStep === TOUR_STEPS.length - 1 ? "Done" : "Next";

    const dots = $("#tour-dots");
    if (dots) {
      dots.innerHTML = TOUR_STEPS.map((_, i) =>
        `<span class="${i === tourStep ? "on" : ""}"></span>`
      ).join("");
    }

    // Position card + optional spotlight after layout
    requestAnimationFrame(() => {
      requestAnimationFrame(() => positionTour(step));
    });
  }

  function positionTour(step) {
    const card = $("#tour-card");
    const spot = $("#tour-spotlight");
    if (!card) return;

    let el = null;
    if (step.target) {
      const parts = step.target.split(",").map((s) => s.trim());
      for (const sel of parts) {
        el = document.querySelector(sel);
        if (el && el.offsetParent !== null) break;
        if (el) break;
      }
    }

    const pad = 8;
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    if (el && spot) {
      const r = el.getBoundingClientRect();
      spot.hidden = false;
      spot.style.top = `${Math.max(0, r.top - pad)}px`;
      spot.style.left = `${Math.max(0, r.left - pad)}px`;
      spot.style.width = `${Math.min(vw - 4, r.width + pad * 2)}px`;
      spot.style.height = `${Math.min(vh - 4, r.height + pad * 2)}px`;

      const cardH = card.offsetHeight || 180;
      let top;
      if (step.place === "top" || r.bottom > vh * 0.55) {
        top = Math.max(12, r.top - cardH - 16);
      } else {
        top = Math.min(vh - cardH - 16, r.bottom + 16);
      }
      // Keep clear of demo banner / bottom nav
      top = Math.max(56, Math.min(top, vh - cardH - 72));
      card.style.top = `${top}px`;
      card.style.bottom = "auto";
    } else if (spot) {
      spot.hidden = true;
      card.style.top = "auto";
      card.style.bottom = "24%";
    }
  }

  function nextTour() {
    if (tourStep < TOUR_STEPS.length - 1) {
      tourStep++;
      renderTourStep();
    } else {
      endTour();
    }
  }

  // ——— Events ———
  function bind() {
    // Degree on welcome
    $$("#welcome .degree-btn").forEach((b) => {
      b.addEventListener("click", () => {
        state.degree = b.dataset.degree;
        setDegreeUI(state.degree);
        // adjust default target horizon if still defaults-ish
        const years = state.degree === "masters" ? 2 : 5;
        const start = parseDate($("#start-date").value) || new Date();
        const t = addDays(start, years * 365);
        $("#target-date").value = iso(t);
      });
    });

    $("#btn-begin").addEventListener("click", () => {
      state.degree = $(".degree-btn.selected", $("#welcome"))?.dataset.degree || state.degree;
      state.targetDate = $("#target-date").value || state.targetDate;
      state.startDate = $("#start-date").value || state.startDate;
      ensureMilestones(true);
      state.setupDone = true;
      save();
      guidedStep = 0;
      showScreen("guided");
      renderGuided();
    });

    $("#btn-skip-setup").addEventListener("click", () => {
      state.degree = $(".degree-btn.selected", $("#welcome"))?.dataset.degree || state.degree;
      state.targetDate = $("#target-date").value || state.targetDate;
      state.startDate = $("#start-date").value || state.startDate;
      ensureMilestones(true);
      state.setupDone = true;
      state.guidedDone = true;
      save();
      showScreen("main");
      renderAll();
    });

    $("#btn-guided-back").addEventListener("click", () => {
      if (guidedStep > 0) {
        guidedStep--;
        renderGuided();
      } else {
        showScreen("welcome");
      }
    });

    $("#btn-guided-next").addEventListener("click", () => {
      if (guidedStep < GUIDED_STEPS.length - 1) {
        guidedStep++;
        renderGuided();
      } else {
        state.guidedDone = true;
        save();
        showScreen("main");
        renderAll();
      }
    });

    $$(".nav-tab").forEach((t) => {
      t.addEventListener("click", () => switchView(t.dataset.view));
    });

    // Milestone list delegation
    $("#milestone-list").addEventListener("click", (e) => {
      const toggle = e.target.closest("[data-toggle]");
      if (toggle) {
        e.stopPropagation();
        const id = toggle.dataset.toggle;
        const m = state.milestones.find((x) => x.id === id);
        if (!m || m.skipped) return;
        const allDone = m.items.every((i) => i.done);
        m.items.forEach((i) => { i.done = !allDone; });
        save();
        renderMilestones();
        return;
      }
      const card = e.target.closest(".ms-card");
      if (card) openDrawer(card.dataset.id);
    });

    $("#milestone-list").addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const card = e.target.closest(".ms-card");
        if (card) { e.preventDefault(); openDrawer(card.dataset.id); }
      }
    });

    $("#btn-close-drawer").addEventListener("click", closeDrawer);
    $("#btn-save-drawer").addEventListener("click", saveDrawer);
    $("#ms-drawer").addEventListener("click", (e) => {
      if (e.target.id === "ms-drawer") closeDrawer();
    });

    // Week
    $("#week-grid").addEventListener("input", (e) => {
      const ta = e.target.closest("textarea[data-day]");
      if (!ta) return;
      const i = Number(ta.dataset.day);
      if (state.week[i]) {
        state.week[i].text = ta.value;
        save();
      }
    });
    $("#mits").addEventListener("input", (e) => {
      const inp = e.target.closest("input[data-mit]");
      if (!inp) return;
      state.mits[Number(inp.dataset.mit)] = inp.value;
      save();
    });
    $("#btn-reset-week").addEventListener("click", () => {
      state.week = DEFAULT_WEEK.map((d) => ({ ...d }));
      save();
      renderWeek();
    });

    // Lit
    $("#btn-add-lit").addEventListener("click", () => {
      state.lit.push({ paper: "", methods: "", findings: "", gaps: "" });
      save();
      renderLit();
    });
    $("#lit-body").addEventListener("input", (e) => {
      const cell = e.target.closest("[data-f]");
      const row = e.target.closest("tr[data-lit]");
      if (!cell || !row) return;
      const i = Number(row.dataset.lit);
      if (state.lit[i]) {
        state.lit[i][cell.dataset.f] = cell.value;
        save();
      }
    });
    $("#lit-body").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-del-lit]");
      if (!btn) return;
      state.lit.splice(Number(btn.dataset.delLit), 1);
      save();
      renderLit();
    });

    // Advisor
    $("#advisor-cadence").addEventListener("change", (e) => {
      state.advisorCadence = e.target.value;
      save();
    });
    $("#btn-add-meeting").addEventListener("click", () => {
      state.meetings.unshift({
        date: iso(new Date()),
        agenda: "",
        notes: "",
        next: "",
      });
      save();
      renderAdvisor();
    });
    $("#meeting-list").addEventListener("input", (e) => {
      const field = e.target.closest("[data-mf]");
      const card = e.target.closest("[data-meeting]");
      if (!field || !card) return;
      const i = Number(card.dataset.meeting);
      if (state.meetings[i]) {
        state.meetings[i][field.dataset.mf] = field.value;
        save();
      }
    });
    $("#meeting-list").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-del-meeting]");
      if (!btn) return;
      state.meetings.splice(Number(btn.dataset.delMeeting), 1);
      save();
      renderAdvisor();
    });

    // Settings
    $("#btn-settings").addEventListener("click", () => {
      $("#set-target").value = state.targetDate || "";
      $("#set-start").value = state.startDate || "";
      $$("#settings-modal .degree-btn").forEach((b) => {
        b.classList.toggle("selected", b.dataset.degree === state.degree);
      });
      $("#settings-modal").classList.remove("hidden");
    });
    $$("#settings-modal .degree-btn").forEach((b) => {
      b.addEventListener("click", () => {
        $$("#settings-modal .degree-btn").forEach((x) => x.classList.remove("selected"));
        b.classList.add("selected");
      });
    });
    $("#btn-close-settings").addEventListener("click", () => {
      $("#settings-modal").classList.add("hidden");
    });
    $("#settings-modal").addEventListener("click", (e) => {
      if (e.target.id === "settings-modal") $("#settings-modal").classList.add("hidden");
    });
    $("#btn-resuggest").addEventListener("click", () => {
      const degBtn = $(".degree-btn.selected", $("#settings-modal"));
      state.degree = degBtn?.dataset.degree || state.degree;
      state.targetDate = $("#set-target").value || state.targetDate;
      state.startDate = $("#set-start").value || state.startDate;
      ensureMilestones(true);
      save();
      setDegreeUI(state.degree);
      renderAll();
      $("#settings-modal").classList.add("hidden");
    });


    $("#btn-print").addEventListener("click", () => window.print());

    // Bottom nav (mobile)
    $$("#bottom-nav button").forEach((t) => {
      t.addEventListener("click", () => switchView(t.dataset.view));
    });

    // Demo controls
    $("#btn-start-demo")?.addEventListener("click", () => {
      $("#demo-splash")?.classList.add("hidden");
      showScreen("main");
      renderAll();
      switchView("milestones");
      startTour();
    });
    $("#btn-skip-demo-tour")?.addEventListener("click", () => {
      $("#demo-splash")?.classList.add("hidden");
      showScreen("main");
      renderAll();
      switchView("milestones");
      endTour();
    });
    $("#btn-demo-tour")?.addEventListener("click", () => startTour());
    $("#btn-reset-demo")?.addEventListener("click", () => resetDemo());
    $("#btn-tour-next")?.addEventListener("click", () => nextTour());
    $("#btn-tour-skip")?.addEventListener("click", () => endTour());
    $("#tour-dim")?.addEventListener("click", () => nextTour());

    // Swipe on tour card for mobile
    let touchX = null;
    $("#tour-card")?.addEventListener("touchstart", (e) => {
      touchX = e.changedTouches[0].screenX;
    }, { passive: true });
    $("#tour-card")?.addEventListener("touchend", (e) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].screenX - touchX;
      touchX = null;
      if (dx < -40) nextTour();
      else if (dx > 40 && tourStep > 0) { tourStep--; renderTourStep(); }
    }, { passive: true });

    window.addEventListener("resize", () => {
      if (tourActive) positionTour(TOUR_STEPS[tourStep]);
    });
  }

  // ——— Boot ———
  function boot() {
    bind();
    setDefaultDatesIfEmpty();
    setDegreeUI(state.degree);

    const wantDemo = isDemoQuery();
    let flagDemo = false;
    try { flagDemo = memStore.getItem(DEMO_FLAG_KEY) === "1"; } catch { /* ignore */ }

    if (wantDemo) {
      enterDemo(true); // splash → Start demo / skip tour
      return;
    }

    // Returning mid-demo session (no query) — keep chrome if flag set
    if (flagDemo && state.demoMode) {
      setDemoChrome(true);
      ensureMilestones(false);
      showScreen("main");
      renderAll();
      return;
    }

    setDemoChrome(false);
    if (state.setupDone && state.guidedDone) {
      ensureMilestones(false);
      showScreen("main");
      renderAll();
    } else if (state.setupDone && !state.guidedDone) {
      ensureMilestones(false);
      guidedStep = 0;
      showScreen("guided");
      renderGuided();
    } else {
      showScreen("welcome");
    }
  }

  boot();
})();
