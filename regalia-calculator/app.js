(function () {
  "use strict";
  var G = GQ, CFG = window.GRADIQ_CONFIG || {};
  function cfgNum(v, d) { return isFinite(+v) && v !== "" && v != null ? +v : d; }
  var USED_LO = cfgNum(CFG.USED_PRICE_LOW, ""), USED_HI = cfgNum(CFG.USED_PRICE_HIGH, ""), BUYBACK = cfgNum(CFG.BUYBACK_PRICE, 0);
  function has(v) { return !G.blank(v) && isFinite(+v); }
  function range(lo, hi) { return lo === hi ? G.money(lo) : G.money(lo) + "–" + G.money(hi); }
  function calc(s) {
    var wears = Math.max(1, Math.round(G.num(s.wears) || 1)), back = s.sellBack && BUYBACK > 0 ? BUYBACK : 0, extras = G.num(s.extras), o = [];
    o.push({ k: "rent", label: "Rent" + (wears > 1 ? " × " + wears : ""), ok: has(s.rental), lo: has(s.rental) ? G.num(s.rental) * wears : null, note: has(s.rental) ? G.money(s.rental, true) + " per ceremony" : "Enter a rental price" });
    var nl = G.num(s.newLow), nh = has(s.newHigh) ? G.num(s.newHigh) : nl;
    o.push({ k: "new", label: "Buy new", ok: has(s.newLow), lo: has(s.newLow) ? Math.max(0, nl - back) : null, hi: has(s.newLow) ? Math.max(0, nh - back) : null, note: back ? "after " + G.money(back) + " Grad-IQ buyback" : "you keep it" });
    var ul = G.num(s.usedLow), uh = has(s.usedHigh) ? G.num(s.usedHigh) : ul;
    o.push({ k: "used", label: "Buy once-used (Grad-IQ)", ok: has(s.usedLow), lo: has(s.usedLow) ? Math.max(0, ul + extras - back) : null, hi: has(s.usedLow) ? Math.max(0, uh + extras - back) : null, note: !has(s.usedLow) ? "Enter the Grad-IQ used price" : [extras ? "incl. " + G.money(extras, true) + " extras" : "", back ? "after " + G.money(back) + " Grad-IQ buyback" : "you keep it"].filter(Boolean).join(", ") });
    var n = o[1], u = o[2], save = n.ok && u.ok ? { lo: Math.max(0, n.lo - u.hi), hi: Math.max(0, n.hi - u.lo) } : null;
    return { wears: wears, back: back, opts: o, save: save };
  }
  function update(s) {
    G.$$("input[data-price]").forEach(function (el) { el.classList.toggle("needs-price", el.value === ""); });
    var bi = G.$("#bb-inline"); if (bi) bi.textContent = G.money(BUYBACK);
    var c = calc(s), known = c.opts.filter(function (o) { return o.ok; }), max = Math.max.apply(null, known.map(function (o) { return o.hi != null ? o.hi : o.lo; }).concat([1]));
    var best = known.length > 1 ? known.slice().sort(function (a, b) { return a.lo - b.lo; })[0] : null;
    G.$("#compare").innerHTML = '<p class="small muted">Total cost over ' + c.wears + " ceremon" + (c.wears > 1 ? "ies" : "y") + ".</p>" + c.opts.map(function (o) {
      var val = !o.ok ? '<span class="pill warn">enter price</span>' : o.hi != null && o.hi !== o.lo ? G.money(o.lo, true) + "–" + G.money(o.hi, true) : G.money(o.lo, true);
      var top = o.hi != null ? o.hi : o.lo, lowW = o.ok ? Math.max(2, o.lo / max * 100) : 0, hiW = o.ok ? Math.max(2, top / max * 100) : 0;
      return '<div style="margin-bottom:.9rem" data-opt="' + o.k + '"><div style="display:flex;justify-content:space-between;gap:.5rem;font-weight:600;flex-wrap:wrap"><span>' + o.label + (best === o ? ' <span class="pill ok">lowest cost</span>' : "") + '</span><span data-total="' + o.k + '">' + val + '</span></div><div class="bar ' + (o.k === "rent" ? "want" : o.k === "new" ? "need" : "save") + '" aria-hidden="true" style="position:relative"><span style="width:' + hiW + '%;opacity:.45;position:absolute;inset:0 auto 0 0"></span><span style="width:' + lowW + '%;position:relative"></span></div><div class="small muted">' + G.esc(o.note) + "</div></div>";
    }).join("") +
    (c.save ? '<p class="notice small" id="savings">Buying once-used from Grad-IQ instead of new saves about <strong>' + range(c.save.lo, c.save.hi) + "</strong> (comparing " + range(c.opts[2].lo, c.opts[2].hi) + " against " + range(c.opts[1].lo, c.opts[1].hi) + ").</p>" : "") +
    (known.length < 3 ? '<p class="notice warn small">Enter the missing price' + (3 - known.length > 1 ? "s" : "") + " above to complete the comparison. Grad-IQ doesn't guess rental prices.</p>" : "") +
    (c.opts[0].ok && c.wears > 1 ? '<p class="small">Renting costs add up each time you wear it. Owning pays off sooner the more ceremonies you attend.</p>' : "");
  }
  function sellBox() {
    var url = G.safeUrl(CFG.SELL_URL || ""), txt = CFG.SELL_CONTACT_TEXT || "Contact Grad-IQ";
    var net = has(USED_LO) && BUYBACK > 0 ? { lo: Math.max(0, USED_LO - BUYBACK), hi: Math.max(0, (has(USED_HI) ? USED_HI : USED_LO) - BUYBACK) } : null;
    G.$("#sell").innerHTML = '<h3 style="margin-top:0">Done with yours? Sell it to Grad-IQ 💜</h3>' +
      (BUYBACK > 0 ? '<p class="big988" id="buyback">Grad-IQ buys once-used full doctoral regalia sets for <strong>' + G.money(BUYBACK) + '</strong> <span class="small muted" style="font-weight:500">(subject to condition check)</span>.</p>' : "") +
      "<p>We resell them to new grads, so your gown gets a second ceremony and you get money back.</p>" +
      (net ? '<p class="notice small" id="netcost"><strong>The round trip:</strong> buy a once-used set from Grad-IQ for ' + range(USED_LO, has(USED_HI) ? USED_HI : USED_LO) + ", sell it back for " + G.money(BUYBACK) + ", and your net cost is <strong>" + range(net.lo, net.hi) + "</strong>.</p>" : "") +
      (url ? '<a class="btn primary" id="sell-link" href="' + G.esc(url) + '" target="_blank" rel="noopener">Sell my gown to Grad-IQ</a>' : '<p style="margin:0"><strong id="sell-contact">' + G.esc(txt) + "</strong> to sell your gown.</p>");
  }
  function base() { return { newLow: 722, newHigh: 753, rental: "", usedLow: USED_LO, usedHigh: USED_HI, extras: "", wears: 1, sellBack: false }; }
  G.tool({
    key: "gradiq-regalia-calculator-v1", name: "Regalia cost calculator", section: "Regalia",
    defaults: base,
    demo: function () { return base(); },
    init: function (s) { if (G.blank(s.usedLow)) s.usedLow = USED_LO; if (G.blank(s.usedHigh)) s.usedHigh = USED_HI; delete s.used; delete s.resale; sellBox(); },
    update: update,
    csv: function (s) { var c = calc(s); return [{ title: "Regalia cost comparison (" + c.wears + " ceremonies" + (c.back ? ", with " + c.back + " Grad-IQ buyback" : "") + ")", rows: [["Option", "Total low", "Total high", "Note"]].concat(c.opts.map(function (o) { return [o.label, o.ok ? o.lo.toFixed(2) : "enter price", o.ok && o.hi != null ? o.hi.toFixed(2) : "", o.note]; })).concat([[], ["Grad-IQ buyback offer", BUYBACK.toFixed(2), "", "subject to condition check"], ["Source for new price", "Herff Jones via SIU fall 2026 order form", "", "https://universityevents.siu.edu/_common/documents/sale-fall-2026-doctor-package.pdf"]]) }]; }
  });
})();
