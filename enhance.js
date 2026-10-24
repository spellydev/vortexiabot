/* Vortexia — extra polish (progressive enhancement; site works without it) */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Preloader: only first visit per session, never blocks content for long */
  (function () {
    var seen = false;
    try { seen = sessionStorage.getItem("vx_pre") === "1"; sessionStorage.setItem("vx_pre", "1"); } catch (e) {}
    if (seen || reduce) return;
    var p = document.createElement("div");
    p.id = "vxPre";
    p.setAttribute("aria-hidden", "true");
    p.innerHTML = '<img src="logo-256.png" alt="" width="84" height="84">';
    document.documentElement.appendChild(p);
    function done() { p.classList.add("done"); setTimeout(function () { p.remove(); }, 600); }
    if (document.readyState === "complete") setTimeout(done, 350);
    else window.addEventListener("load", function () { setTimeout(done, 350); });
    setTimeout(done, 2200);
  })();

  /* Custom emoji map: unicode -> svg sprite id */
  var MAP = {"🎵":"music","🎶":"music","🛡️":"shield","🛡":"shield","🎫":"ticket","💰":"coin","📈":"levels","🤖":"ai","⚡":"bolt","👑":"crown","🎁":"gift","❤️":"heart","❤":"heart","✦":"vortex"};
  function emojiSvg(id) {
    return '<svg class="vx-emoji" aria-hidden="true" focusable="false"><use href="vx-emoji.svg#' + id + '"></use></svg>';
  }
  function swapEmoji() {
    var keys = Object.keys(MAP).sort(function (a, b) { return b.length - a.length; });
    var re = new RegExp("(" + keys.join("|") + ")", "g");
    $$(".feature-icon, .badge, h2, h3, .footer-label, .mock-embed > strong, .section-label").forEach(function (el) {
      if (el.closest("script,style,code,pre")) return;
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n, list = [];
      while ((n = w.nextNode())) if (re.test(n.nodeValue)) list.push(n); re.lastIndex = 0;
      list.forEach(function (t) {
        var span = document.createElement("span");
        span.innerHTML = t.nodeValue.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(re, function (m) { return emojiSvg(MAP[m]); });
        t.parentNode.replaceChild(span, t);
        while (span.firstChild) span.parentNode.insertBefore(span.firstChild, span);
        span.remove();
      });
    });
  }

  /* Feature marquee under hero (index only) */
  function marquee() {
    var hero = $(".hero");
    if (!hero || $(".vx-marquee") || !/(^\/$|index\.html$)/.test(location.pathname)) return;
    var items = [["music", "Lavalink Music"], ["shield", "Antinuke & Moderation"], ["ticket", "Ticket System"], ["coin", "Economy"], ["levels", "Levels & Ranks"], ["ai", "AI Chat"], ["bolt", "200+ Commands"], ["gift", "Giveaways"], ["crown", "100% Free"]];
    var html = items.map(function (i) { return "<span>" + emojiSvg(i[0]) + i[1] + "</span>"; }).join("");
    var m = document.createElement("div");
    m.className = "vx-marquee";
    m.setAttribute("aria-hidden", "true");
    m.innerHTML = '<div class="vx-track">' + html + html + "</div>";
    hero.insertAdjacentElement("afterend", m);
  }

  /* Scroll progress, header glass/hide, back-to-top */
  function scrollFx() {
    var bar = document.createElement("div"); bar.id = "vxProg"; document.body.appendChild(bar);
    var top = document.createElement("button");
    top.id = "vxTop"; top.type = "button"; top.setAttribute("aria-label", "Back to top");
    top.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
    document.body.appendChild(top);
    var hdr = $(".site-header"), last = 0, tick = false;
    function update() {
      var y = window.scrollY || 0, max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
      top.classList.toggle("show", y > 600);
      if (hdr) {
        hdr.classList.toggle("vx-scrolled", y > 24);
        var menuOpen = document.body.classList.contains("menu-open");
        hdr.classList.toggle("vx-hide", y > last + 6 && y > 320 && !menuOpen);
        if (y < last - 6 || y < 320) hdr.classList.remove("vx-hide");
      }
      last = y; tick = false;
    }
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* Count-up for hero stats */
  function counters() {
    if (reduce || !("IntersectionObserver" in window)) return;
    $$(".stat-item strong").forEach(function (el) {
      var m = el.textContent.trim().match(/^(\$?)(\d+)(\+?)$/);
      if (!m) return;
      var pre = m[1], to = +m[2], suf = m[3];
      if (!to) return;
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; io.disconnect();
        var t0 = performance.now();
        (function step(t) {
          var p = Math.min((t - t0) / 1400, 1), e = 1 - Math.pow(1 - p, 4);
          el.textContent = pre + Math.round(to * e) + suf;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      }, { threshold: .6 });
      io.observe(el);
    });
  }

  /* Card tilt + cursor glow (desktop only) */
  function tilt() {
    if (!fine || reduce) return;
    $$(".feature-card, .step-card, .about-card").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty("--mx", x * 100 + "%"); c.style.setProperty("--my", y * 100 + "%");
        c.classList.add("vx-tilting");
        c.style.transform = "perspective(800px) rotateX(" + ((.5 - y) * 7).toFixed(2) + "deg) rotateY(" + ((x - .5) * 9).toFixed(2) + "deg) translateY(-4px)";
      });
      c.addEventListener("pointerleave", function () { c.classList.remove("vx-tilting"); c.style.transform = ""; });
    });
  }

  /* Button ripple */
  function ripple() {
    document.addEventListener("pointerdown", function (e) {
      var b = e.target.closest && e.target.closest(".btn");
      if (!b || reduce) return;
      var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, s = document.createElement("span");
      s.className = "vx-rip"; s.style.cssText = "width:" + d + "px;height:" + d + "px;left:" + (e.clientX - r.left - d / 2) + "px;top:" + (e.clientY - r.top - d / 2) + "px";
      b.appendChild(s); setTimeout(function () { s.remove(); }, 650);
    });
  }

  /* Smooth fade between internal pages */
  function pageTransitions() {
    if (reduce) return;
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button || a.target === "_blank" || a.hasAttribute("download")) return;
      var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.hash)) return;
      e.preventDefault();
      document.documentElement.classList.add("vx-leaving");
      setTimeout(function () { location.href = u.href; }, 200);
    });
    window.addEventListener("pageshow", function (e) { if (e.persisted) document.documentElement.classList.remove("vx-leaving"); });
  }

  /* Hero parallax on orbs */
  function parallax() {
    if (!fine || reduce) return;
    var o = $$(".hero-orb");
    if (!o.length) return;
    document.addEventListener("pointermove", function (e) {
      var x = (e.clientX / innerWidth - .5) * 30, y = (e.clientY / innerHeight - .5) * 30;
      o.forEach(function (el, i) { el.style.translate = (x * (i + 1)) + "px " + (y * (i + 1)) + "px"; });
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    swapEmoji(); marquee(); scrollFx(); counters(); tilt(); ripple(); pageTransitions(); parallax();
  });
})();
