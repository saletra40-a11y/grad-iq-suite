(function () {
  "use strict";
  var G = GQ, TYPES = { need: "Needs", want: "Wants", save: "Savings" };
  function row(name, type, amount) { return { id: G.uid(), name: name, type: type, amount: amount === undefined ? "" : amount }; }
  function defaults() {
    return { month: G.today().slice(0, 7), stipend: "", other: "", notes: "", items: [
      row("Rent / housing", "need"), row("Utilities & internet", "need"), row("Groceries", "need"), row("Transportation", "need"),
      row("Phone", "need"), row("Health insurance / medical", "need"), row("Loan minimum payments", "need"), row("Tax set-aside", "need"),
      row("Dining out & coffee", "want"), row("Subscriptions", "want"), row("Fun & social", "want"),
      row("Emergency fund", "save"), row("Conference / travel fund", "save")
    ] };
  }
  function demo() {
    return { month: G.today().slice(0, 7), stipend: 2600, other: 150, notes: "SAMPLE DATA — fictional numbers for illustration only.", items: [
      row("Rent / housing (sample)", "need", 1150), row("Utilities & internet", "need", 95), row("Groceries", "need", 320), row("Transportation", "need", 60),
      row("Phone", "need", 45), row("Health insurance / medical", "need", 40), row("Loan minimum payments", "need", 0), row("Tax set-aside", "need", 180),
      row("Dining out & coffee", "want", 110), row("Subscriptions", "want", 32), row("Fun & social", "want", 90),
      row("Emergency fund", "save", 100), row("Conference / travel fund", "save", 50)
    ] };
  }
  function totals(s) {
    var t = { need: 0, want: 0, save: 0 }; s.items.forEach(function (i) { t[i.type] = (t[i.type] || 0) + G.num(i.amount); });
    t.income = G.num(s.stipend) + G.num(s.other); t.planned = t.need + t.want + t.save; t.left = t.income - t.planned; return t;
  }
  function render(s) {
    var html = "";
    Object.keys(TYPES).forEach(function (type) {
      var items = s.items.map(function (it, idx) { return { it: it, idx: idx }; }).filter(function (x) { return x.it.type === type; });
      html += '<h3 style="margin-top:1rem">' + TYPES[type] + ' <span class="pill" data-subtotal="' + type + '"></span></h3><div class="rows">';
      if (!items.length) html += '<p class="empty">No ' + TYPES[type].toLowerCase() + " rows yet.</p>";
      items.forEach(function (x) {
        var i = x.idx;
        var nm = G.esc(x.it.name || "row");
        html += '<div class="cat-row">' +
          '<input type="text" aria-label="Category name" placeholder="Category name" data-bind="items.' + i + '.name">' +
          '<select aria-label="Type for ' + nm + '" data-bind="items.' + i + '.type" data-rerender><option value="need">Need</option><option value="want">Want</option><option value="save">Savings</option></select>' +
          '<span class="money"><input type="number" inputmode="decimal" min="0" step="0.01" placeholder="0" aria-label="Monthly amount for ' + nm + '" data-bind="items.' + i + '.amount"></span>' +
          '<button type="button" class="btn icon ghost no-print" data-action="del" data-i="' + i + '" aria-label="Delete ' + nm + '">✕</button></div>';
      });
      html += "</div>";
    });
    G.$("#groups").innerHTML = html;
  }
  function update(s) {
    var t = totals(s), pct = function (v) { return t.income > 0 ? Math.round(v / t.income * 100) : 0; };
    G.$("#stats").innerHTML =
      '<div class="stat sky"><div class="label">Money in</div><div class="value">' + G.money(t.income) + "</div></div>" +
      '<div class="stat"><div class="label">Planned</div><div class="value">' + G.money(t.planned) + "</div></div>" +
      '<div class="stat big ' + (t.left < 0 ? "neg" : "pos") + '"><div class="label">' + (t.left < 0 ? "Over by" : "Remaining") + '</div><div class="value" id="remaining">' + G.money(Math.abs(t.left)) + "</div></div>" +
      '<div class="stat mint"><div class="label">Saving</div><div class="value">' + pct(t.save) + "%</div></div>";
    G.$("#mixbars").innerHTML = ["need", "want", "save"].map(function (k) {
      return '<div style="margin-bottom:.55rem"><div style="display:flex;justify-content:space-between;font-size:.85rem;font-weight:600"><span>' + TYPES[k] + "</span><span>" + G.money(t[k]) + " · " + pct(t[k]) + '% of income</span></div><div class="bar ' + k + '" role="img" aria-label="' + TYPES[k] + " " + pct(t[k]) + '% of income"><span style="width:' + Math.min(100, pct(t[k])) + '%"></span></div></div>';
    }).join("") + (t.left < 0 ? '<p class="notice warn" style="margin-top:.8rem">You\'ve planned ' + G.money(-t.left) + " more than comes in. Trim a want, or move money from savings for this month — no shame, just adjust.</p>" : "");
    var mo = s.month ? G.fmtDate(s.month + "-01", { month: "long", year: "numeric" }) : "";
    G.$("#print-summary").innerHTML = "<h1>Stipend budget" + (mo ? " · " + G.esc(mo) : "") + "</h1>" +
      '<table class="data" style="margin:6pt 0 10pt"><tbody><tr><td>Stipend</td><td>' + G.money(s.stipend, true) + "</td><td>Other income</td><td>" + G.money(s.other, true) + '</td><td><strong>Money in</strong></td><td><strong>' + G.money(t.income, true) + "</strong></td></tr><tr><td>Planned</td><td>" + G.money(t.planned, true) + '</td><td><strong>' + (t.left < 0 ? "Over by" : "Remaining") + "</strong></td><td><strong>" + G.money(Math.abs(t.left), true) + "</strong></td><td>Saving rate</td><td>" + pct(t.save) + "%</td></tr></tbody></table>" +
      '<div class="cols">' + ["need", "want", "save"].map(function (k) { var its = s.items.filter(function (i) { return i.type === k; }); return '<table class="data"><thead><tr><th>' + TYPES[k] + "</th><th>$/mo</th></tr></thead><tbody>" + its.map(function (i) { return "<tr><td>" + G.esc(i.name) + "</td><td>" + G.money(i.amount, true) + "</td></tr>"; }).join("") + '<tr class="tot"><td>Total</td><td>' + G.money(t[k], true) + "</td></tr></tbody></table>"; }).join("") + "</div>" +
      (s.notes ? '<p style="margin-top:10pt"><strong>Notes:</strong> ' + G.esc(s.notes) + "</p>" : "");
    G.$$("[data-subtotal]").forEach(function (el) { el.textContent = G.money(t[el.getAttribute("data-subtotal")]); });
  }
  G.tool({
    key: "gradiq-stipend-budget-v1", name: "Stipend budget planner", section: "Budget & money",
    defaults: defaults, demo: demo, render: render, update: update,
    actions: {
      add: function (el, s, api) { s.items.push(row("", el.getAttribute("data-type"))); api.commit(true); },
      del: function (el, s, api) { var i = +el.getAttribute("data-i"); if (!confirm("Delete \"" + (s.items[i].name || "this row") + "\"?")) return; s.items.splice(i, 1); api.commit(true); }
    },
    csv: function (s) {
      var t = totals(s), rows = [["Category", "Type", "Monthly amount"]];
      s.items.forEach(function (i) { rows.push([i.name, TYPES[i.type], G.num(i.amount).toFixed(2)]); });
      rows.push([], ["Money in", "", t.income.toFixed(2)], ["Planned", "", t.planned.toFixed(2)], ["Remaining", "", t.left.toFixed(2)]);
      return [{ title: "Budget " + s.month, rows: rows }];
    }
  });
})();
