/* Grad-IQ public demo additions for the milestones planner: sales banner, hub link, footer. */
(function () {
  var C = window.GRADIQ_CONFIG || {}, P = C.PRICES || {}, B = C.BUY_URLS || {};
  function fp(n) { n = +n; return "$" + (Math.round(n) === n ? String(n) : n.toFixed(2)); }
  var u = String(B["milestones"] || "").trim(), ok = /^https?:\/\//i.test(u);
  var b = document.createElement("div"); b.className = "gq-sales-banner"; b.setAttribute("role", "region"); b.setAttribute("aria-label", "Demo notice");
  b.style.cssText = "display:flex;flex-wrap:wrap;gap:.4rem 1rem;align-items:center;justify-content:space-between;padding:.65rem 1.1rem;background:#e8dff3;color:#2c2834;font-size:.9rem;position:relative;z-index:40";
  b.innerHTML = "<span><strong>This is a demo with sample data.</strong> Get the full version to save your own plan.</span><span style='display:inline-flex;gap:.8rem;align-items:center;flex-wrap:wrap'>" +
    (P["milestones"] != null ? "<strong>" + fp(P["milestones"]) + "</strong>" : "") +
    (ok ? "<a class='btn sm primary' href='" + u.replace(/'/g, "%27") + "' target='_blank' rel='noopener'>Get it</a>" : "<span style='border:1px dashed #8a6fa8;border-radius:999px;padding:.3rem .7rem;background:#fff'>Coming soon</span>") +
    "<a href='../index.html#products' style='color:#6b5b8a;font-weight:600'>Singles, bundles &amp; full suite</a></span>";
  document.body.insertBefore(b, document.body.firstChild);
  var st = document.createElement("style");
  st.textContent = "@media print { .gq-sales-banner { display: none !important; } body::before { content: 'DEMO \\00B7  SAMPLE DATA'; position: fixed; top: 42%; left: 0; right: 0; text-align: center; font: 700 60pt system-ui, sans-serif; color: rgba(107,91,138,.12); transform: rotate(-24deg); z-index: 0; pointer-events: none; } }";
  document.head.appendChild(st);
  var actions = document.querySelector("#main .top-actions");
  if (actions) { var hub = document.createElement("a"); hub.href = "../index.html"; hub.className = "btn ghost sm"; hub.textContent = "← All tools"; actions.insertBefore(hub, actions.firstChild); }
  var f = document.createElement("footer"); f.style.cssText = "text-align:center;padding:1.5rem 1rem 6rem;color:#676173;font-size:.85rem";
  f.innerHTML = "<strong>Grad-IQ by IQ Learning</strong><br>Demo with sample data: nothing is saved, and there are no accounts and no tracking. <a href='../index.html'>All tools</a> · <a href='../index.html#products'>Get the full version</a>";
  document.body.appendChild(f);
})();
