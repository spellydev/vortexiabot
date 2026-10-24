/* Vortexia site — optional Discord login (reviews + account chip) */
(function () {
  "use strict";

  const DISCORD_CLIENT_ID = "1205185289627115670";
  /* Must match a Redirect URI in Discord Developer Portal → OAuth2 */
  // Register this exact URL in Discord Developer Portal → OAuth2 → Redirects.
  const OAUTH_REDIRECT = window.location.origin.replace(/\/$/, "") + "/";
  const AUTH_KEY = "vortexia_auth_v1";
  const REVIEWS_KEY = "vortexia_reviews_v2";
    const RETURN_PATH_KEY = "vortexia_return_path";

  function toast(msg) {
    let el = document.getElementById("vx-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "vx-toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () {
      el.classList.remove("show");
    }, 2800);
  }

  function getAuth() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    } catch (e) {
      return null;
    }
  }
  function setAuth(user) {
    if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_KEY);
    applyGate();
    updateAuthUI();
  }

  function discordAvatarUrl(id, avatar, discr) {
    if (avatar) return "https://cdn.discordapp.com/avatars/" + id + "/" + avatar + ".png?size=128";
    var idx = discr ? Number(discr) % 5 : 0;
    return "https://cdn.discordapp.com/embed/avatars/" + idx + ".png";
  }

  /* ---------- Discord OAuth (implicit grant: works on static hosting, no secret needed) ---------- */
  const STATE_KEY = "vortexia_oauth_state";
  function randomString(len) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var out = "";
    try {
      var arr = new Uint8Array(len);
      crypto.getRandomValues(arr);
      for (var i = 0; i < len; i++) out += chars[arr[i] % chars.length];
    } catch (e) {
      for (var j = 0; j < len; j++) out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }
  function safeSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) { try { sessionStorage.setItem(k, v); } catch (e2) {} }
  }
  function safeGet(k) {
    try { var v = localStorage.getItem(k); if (v !== null) return v; } catch (e) {}
    try { return sessionStorage.getItem(k); } catch (e2) { return null; }
  }
  function safeDel(k) {
    try { localStorage.removeItem(k); } catch (e) {}
    try { sessionStorage.removeItem(k); } catch (e2) {}
  }

  function startDiscordOAuth() {
    var state = randomString(24);
    safeSet(STATE_KEY, state);
    safeSet(RETURN_PATH_KEY, window.location.pathname + window.location.search);
    var url =
      "https://discord.com/oauth2/authorize" +
      "?client_id=" + encodeURIComponent(DISCORD_CLIENT_ID) +
      "&redirect_uri=" + encodeURIComponent(OAUTH_REDIRECT) +
      "&response_type=token" +
      "&scope=" + encodeURIComponent("identify") +
      "&state=" + encodeURIComponent(state);
    document.documentElement.classList.add("vx-leaving");
    window.location.href = url;
  }

  async function fetchDiscordUser(accessToken) {
    var res = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: "Bearer " + accessToken },
    });
    if (!res.ok) throw new Error("user fetch failed: " + res.status);
    return res.json();
  }

  async function handleOAuthReturn() {
    var hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    var params = new URLSearchParams(window.location.search);
    var token = hashParams.get("access_token");
    var error = params.get("error") || hashParams.get("error");
    var cleanUrl = window.location.pathname + window.location.search.replace(/[?&](code|state|error|error_description)=[^&]*/g, "");

    if (error) {
      toast("Discord login cancelled");
      safeDel(STATE_KEY);
      history.replaceState(null, "", window.location.pathname);
      return;
    }
    if (!token) return;

    var expected = safeGet(STATE_KEY);
    var got = hashParams.get("state");
    if (expected && got && expected !== got) {
      toast("Login failed (security check). Please try again.");
      history.replaceState(null, "", window.location.pathname);
      return;
    }

    document.documentElement.classList.add("vx-signing-in");
    toast("Signing you in…");
    try {
      var u = await fetchDiscordUser(token);
      setAuth({
        id: u.id,
        username: u.global_name || u.username,
        avatar: discordAvatarUrl(u.id, u.avatar, u.discriminator),
        provider: "discord",
        at: Date.now(),
      });
      safeDel(STATE_KEY);
      toast("Welcome, " + (u.global_name || u.username) + " 👋");
      var ret = safeGet(RETURN_PATH_KEY) || "/";
      safeDel(RETURN_PATH_KEY);
      history.replaceState(null, "", window.location.pathname);
      if (ret && ret.charAt(0) === "/" && ret.charAt(1) !== "/" && ret.split("?")[0] !== window.location.pathname) {
        window.location.replace(ret);
        return;
      }
    } catch (e) {
      console.error(e);
      toast("Discord sign-in failed. Please try again.");
      history.replaceState(null, "", window.location.pathname);
    }
    document.documentElement.classList.remove("vx-signing-in");
  }

  function guestLogin() {
    var name = prompt("Choose a display name to enter the site:", "");
    if (!name || !name.trim()) return;
    setAuth({
      id: "guest_" + Date.now(),
      username: name.trim().slice(0, 32),
      avatar: null,
      provider: "guest",
      at: Date.now(),
    });
    toast("Welcome, " + name.trim().slice(0, 32));
  }

  function logout() {
    setAuth(null);
    toast("Signed out");
  }

  function ensureGate() {
    var gate = document.getElementById("siteGate");
    if (gate) return gate;
    gate = document.createElement("div");
    gate.id = "siteGate";
    gate.className = "site-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "gateTitle");
    gate.innerHTML =
      '<div class="site-gate-card">' +
      '<img src="./logo.png?v=4" alt="Vortexia" class="gate-logo" width="72" height="72" onerror="this.onerror=null;this.src=\'./icon-192.png?v=4\'" />' +
      '<h1 id="gateTitle">Welcome to <span>Vortexia</span></h1>' +
      "<p>Sign in with Discord to visit this website and leave reviews.</p>" +
      '<button type="button" class="btn discord-btn press" id="gateDiscord">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="flex-shrink:0"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.548-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>' +
      " Login with Discord</button>" +
      '<button type="button" class="btn btn-ghost press" id="gateGuest">Continue as guest</button>' +
      '<p class="gate-hint">You must log in before you can browse the site.</p>' +
      "</div>";
    document.body.appendChild(gate);
    document.getElementById("gateDiscord").addEventListener("click", startDiscordOAuth);
    document.getElementById("gateGuest").addEventListener("click", guestLogin);
    return gate;
  }

  function applyGate() {
    var auth = getAuth();
    if (window.VX_GATE_REQUIRED !== true) {
      document.documentElement.classList.remove("gate-pending");
      document.body.classList.remove("gate-locked");
      var g0 = document.getElementById("siteGate");
      if (g0) g0.classList.add("hidden");
      if (typeof window.__vxRenderReviewForm === "function") window.__vxRenderReviewForm();
      return;
    }
    var gate = ensureGate();
    if (auth) {
      gate.classList.add("hidden");
      document.body.classList.remove("gate-locked");
      document.documentElement.classList.remove("gate-pending");
    } else {
      gate.classList.remove("hidden");
      document.body.classList.add("gate-locked");
      document.documentElement.classList.remove("gate-pending");
    }
    if (typeof window.__vxRenderReviewForm === "function") window.__vxRenderReviewForm();
  }

  var DISCORD_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.548-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>';

  function updateAuthUI() {
    var auth = getAuth();
    document.documentElement.classList.toggle("vx-authed", !!auth);
    document.querySelectorAll("[data-auth-chip]").forEach(function (chip) {
      var img = chip.querySelector("img");
      var name = chip.querySelector(".auth-name");
      if (auth) {
        chip.classList.add("logged-in");
        if (img) {
          if (auth.avatar) { img.src = auth.avatar; img.style.display = ""; }
          else img.style.display = "none";
        }
        if (name) name.textContent = auth.username;
        chip.setAttribute("aria-label", "Account menu for " + auth.username);
        chip.onclick = function (ev) {
          ev.stopPropagation();
          var pop = document.getElementById("vxUserMenu");
          if (pop) { pop.remove(); return; }
          pop = document.createElement("div");
          pop.id = "vxUserMenu";
          pop.className = "user-menu";
          pop.innerHTML = '<div class="um-name"></div><a href="reviews.html" class="um-item">Write a review</a><button type="button" class="um-item um-out">Sign out</button>';
          pop.querySelector(".um-name").textContent = auth.username;
          pop.querySelector(".um-out").onclick = function () { pop.remove(); logout(); };
          chip.parentNode.appendChild(pop);
        };
      } else {
        chip.classList.remove("logged-in");
        chip.onclick = null;
      }
    });
    document.querySelectorAll("[data-login-btn]").forEach(function (b) {
      b.style.display = auth ? "none" : "";
    });
    var pop2 = document.getElementById("vxUserMenu");
    if (pop2 && !auth) pop2.remove();
  }
  document.addEventListener("click", function (e) {
    var p = document.getElementById("vxUserMenu");
    if (p && !p.contains(e.target)) p.remove();
  });

  function fixLogos() {
    var fallbacks = ["./logo.png?v=4", "logo.png", "./icon-192.png?v=4", "icon-192.png", "./icon-512.png?v=4"];
    document.querySelectorAll("img").forEach(function (img) {
      var src = (img.getAttribute("src") || "").toLowerCase();
      if (src.indexOf("logo") === -1 && src.indexOf("icon-") === -1 && img.className.indexOf("logo") === -1) {
        /* still fix gate / cta by class */
        if (!/(logo-img|footer-logo|cta-logo|gate-logo)/.test(img.className)) return;
      }
      img.style.display = "block";
      img.style.opacity = "1";
      img.style.visibility = "visible";
      img.setAttribute("decoding", "async");
      if (!img.getAttribute("width")) img.setAttribute("width", "40");
      if (!img.getAttribute("height")) img.setAttribute("height", "40");
      /* normalize path */
      if (src === "logo.png" || src === "/logo.png") img.setAttribute("src", "./logo.png?v=4");
      img.onerror = function () {
        var cur = this.getAttribute("src") || "";
        var i = fallbacks.indexOf(cur);
        var next = fallbacks[i + 1] || fallbacks[fallbacks.length - 1];
        if (next && next !== cur) this.src = next;
      };
    });
  }

  function initParticles() {
    var wrap = document.querySelector(".particles");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "particles";
      document.body.prepend(wrap);
    }
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var count = reduce ? 0 : 28;
    for (var i = 0; i < count; i++) {
      var p = document.createElement("span");
      p.className = "particle";
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDuration = 8 + Math.random() * 14 + "s";
      p.style.animationDelay = Math.random() * 10 + "s";
      p.style.width = p.style.height = 2 + Math.random() * 3 + "px";
      p.style.opacity = String(0.15 + Math.random() * 0.35);
      wrap.appendChild(p);
    }
  }

  function initCursorGlow() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var glow = document.querySelector(".cursor-glow");
    if (!glow) {
      glow = document.createElement("div");
      glow.className = "cursor-glow";
      document.body.appendChild(glow);
    }
    var x = 0,
      y = 0,
      tx = 0,
      ty = 0;
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
    });
    function loop() {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      glow.style.left = x + "px";
      glow.style.top = y + "px";
      requestAnimationFrame(loop);
    }
    loop();
  }

  function initScroll() {
    var bar = document.querySelector(".progress-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "progress-bar";
      document.body.prepend(bar);
    }
    var header = document.querySelector(".site-header");
    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = pct + "%";
      if (header) header.classList.toggle("scrolled", window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  }

  function initMenu() {
    var btn = document.getElementById("menuBtn");
    var menu = document.getElementById("mobileMenu");
    if (!btn || !menu) return;
    btn.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("menu-open", open);
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("open");
        menu.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
      });
    });
  }

  function initCommands() {

    document.querySelectorAll(".cmd-kind-row .filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".cmd-kind-row .filter-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        applyCmdFilters();
      });
    });
    function applyCmdFilters() {
      var catBtn = document.querySelector(".cmd-filters .filter-btn.active");
      var kindBtn = document.querySelector(".cmd-kind-row .filter-btn.active");
      var cat = catBtn ? catBtn.dataset.filter : "all";
      var kind = kindBtn ? kindBtn.dataset.kind : "all";
      var search = document.getElementById("cmdSearch");
      var q = search ? search.value.trim().toLowerCase() : "";
      var n = 0;
      document.querySelectorAll(".cmd-card").forEach(function (c) {
        var catOk = cat === "all" || c.dataset.cat === cat;
        var kindOk = kind === "all" || c.dataset.kind === kind;
        var textOk = !q || c.textContent.toLowerCase().indexOf(q) !== -1;
        var show = catOk && kindOk && textOk;
        c.classList.toggle("hidden", !show);
        if (show) n++;
      });
      var countEl = document.getElementById("cmdCount");
      if (countEl) countEl.textContent = n + " commands shown";
    }
    window.__vxApplyCmdFilters = applyCmdFilters;

    var filters = document.querySelectorAll(".filter-btn");
    var cards = document.querySelectorAll(".cmd-card");
    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filters.forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        if (window.__vxApplyCmdFilters) { window.__vxApplyCmdFilters(); return; }
        var cat = btn.dataset.filter || "all";
        var search = document.getElementById("cmdSearch");
        var q = search ? search.value.trim().toLowerCase() : "";
        cards.forEach(function (c) {
          var match = cat === "all" || c.dataset.cat === cat;
          var text = c.textContent.toLowerCase();
          c.classList.toggle("hidden", !(match && (!q || text.indexOf(q) !== -1)));
        });
      });
    });
    var search = document.getElementById("cmdSearch");
    if (search) {
      search.addEventListener("input", function () {
        if (window.__vxApplyCmdFilters) { window.__vxApplyCmdFilters(); return; }
        var q = search.value.trim().toLowerCase();
        var catBtn = document.querySelector(".filter-btn.active");
        var cat = catBtn ? catBtn.dataset.filter : "all";
        cards.forEach(function (c) {
          var text = c.textContent.toLowerCase();
          var catOk = cat === "all" || c.dataset.cat === cat;
          c.classList.toggle("hidden", !(catOk && (!q || text.indexOf(q) !== -1)));
        });
      });
    }
    document.querySelectorAll(".copy-btn").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        var cmd = btn.dataset.cmd || btn.textContent;
        try {
          await navigator.clipboard.writeText(cmd);
          btn.classList.add("copied");
          btn.textContent = "Copied!";
          toast("Copied " + cmd);
          setTimeout(function () {
            btn.classList.remove("copied");
            btn.textContent = "Copy";
          }, 1500);
        } catch (e) {
          toast("Could not copy");
        }
      });
    });
  }

  function initFaq() {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      var q = item.querySelector(".faq-q");
      if (!q) return;
      q.addEventListener("click", function () {
        var was = item.classList.contains("open");
        document.querySelectorAll(".faq-item.open").forEach(function (i) {
          i.classList.remove("open");
        });
        if (!was) item.classList.add("open");
      });
    });
  }

  function loadReviews() {
    try {
      return JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }
  function saveReviews(list) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(list.slice(-100)));
  }
  function starStr(n) {
    return "★".repeat(n) + "☆".repeat(5 - n);
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initReviews() {
    var listEl = document.getElementById("reviewList");
    var formWrap = document.getElementById("reviewFormWrap");
    if (!listEl && !formWrap) return;
    var selectedStars = 5;

    function renderList() {
      if (!listEl) return;
      var reviews = loadReviews();
      var stats = document.getElementById("reviewStats");
      if (stats) {
        var avg =
          reviews.length === 0
            ? "—"
            : (
                reviews.reduce(function (a, r) {
                  return a + (r.stars || 5);
                }, 0) / reviews.length
              ).toFixed(1);
        stats.innerHTML =
          "<div><strong>" +
          reviews.length +
          "</strong><span>Reviews</span></div><div><strong>" +
          avg +
          "</strong><span>Avg rating</span></div>";
      }
      if (reviews.length === 0) {
        listEl.innerHTML =
          '<div class="review-empty">No reviews yet. Be the first to share your experience.</div>';
        return;
      }
      listEl.innerHTML = reviews
        .slice()
        .reverse()
        .map(function (r) {
          return (
            '<article class="review-card reveal visible"><div class="review-head"><div>' +
            '<div class="review-name">' +
            (r.avatar
              ? '<img src="' +
                escapeHtml(r.avatar) +
                '" alt="" width="28" height="28" onerror="this.style.display=\'none\'" />'
              : "") +
            escapeHtml(r.name) +
            '</div><div class="review-stars">' +
            starStr(r.stars) +
            '</div></div><div class="review-date">' +
            escapeHtml(r.date) +
            '</div></div><p class="review-text">' +
            escapeHtml(r.text) +
            "</p></article>"
          );
        })
        .join("");
    }

    function renderForm() {
      if (!formWrap) return;
      var auth = getAuth();
      if (!auth) {
        formWrap.innerHTML =
          '<div class="login-gate reveal visible"><p>Sign in to leave a review.</p></div>';
        return;
      }
      formWrap.innerHTML =
        '<form class="review-form-card reveal visible" id="reviewForm">' +
        "<h2>Share your experience</h2><p>Signed in as <strong>" +
        escapeHtml(auth.username) +
        '</strong> <button type="button" class="guest-link" id="revLogout">Sign out</button></p>' +
        '<div class="form-row"><label>Rating</label><div class="star-picker" id="starPicker" role="group" aria-label="Star rating">' +
        "<span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div></div>" +
        '<div class="form-row"><label for="revText">Your experience</label>' +
        '<textarea id="revText" rows="4" placeholder="How has Vortexia helped your server?" maxlength="500" required></textarea></div>' +
        '<button type="submit" class="btn btn-primary press">Submit review</button></form>';
      document.getElementById("revLogout").addEventListener("click", logout);
      var starPicker = document.getElementById("starPicker");
      var spans = starPicker ? starPicker.querySelectorAll("span") : [];
      selectedStars = 5;
      spans.forEach(function (span, i) {
        span.addEventListener("click", function () {
          selectedStars = i + 1;
          spans.forEach(function (s, j) {
            s.classList.toggle("on", j < selectedStars);
          });
        });
        span.addEventListener("mouseenter", function () {
          spans.forEach(function (s, j) {
            s.classList.toggle("on", j <= i);
          });
        });
        span.classList.toggle("on", i < selectedStars);
      });
      if (starPicker) {
        starPicker.addEventListener("mouseleave", function () {
          spans.forEach(function (s, j) {
            s.classList.toggle("on", j < selectedStars);
          });
        });
      }
      document.getElementById("reviewForm").addEventListener("submit", function (e) {
        e.preventDefault();
        var text = ((document.getElementById("revText") || {}).value || "").trim().slice(0, 500);
        if (!text) return;
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var d = new Date();
        var a = getAuth();
        var reviews = loadReviews();
        reviews.push({
          name: (a && a.username) || "Anonymous",
          avatar: (a && a.avatar) || null,
          stars: selectedStars,
          text: text,
          date: months[d.getMonth()] + " " + d.getFullYear(),
        });
        saveReviews(reviews);
        toast("Thanks for your review!");
        renderList();
        renderForm();
      });
    }

    window.__vxRenderReviewForm = renderForm;
    renderList();
    renderForm();
  }

  function ensureBg() {
    if (!document.querySelector(".page-bg")) {
      var bg = document.createElement("div");
      bg.className = "page-bg";
      document.body.prepend(bg);
    }
  }

  function injectHeaderAuth() {
    var actions = document.querySelector(".header-actions") || document.querySelector(".header-inner");
    if (!actions || document.querySelector("[data-auth-chip]")) return;
    var menu = document.getElementById("menuBtn");
    var login = document.createElement("button");
    login.type = "button";
    login.className = "btn login-btn press";
    login.setAttribute("data-login-btn", ""); login.setAttribute("aria-label", "Login with Discord");
    login.innerHTML = DISCORD_SVG + "<span>Login</span>";
    login.addEventListener("click", startDiscordOAuth);
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "auth-chip";
    chip.setAttribute("data-auth-chip", "");
    chip.innerHTML = '<img alt="" width="28" height="28" /><span class="auth-name"></span>';
    if (menu && menu.parentNode === actions) { actions.insertBefore(login, menu); actions.insertBefore(chip, menu); }
    else { actions.appendChild(login); actions.appendChild(chip); }
    actions.style.position = "relative";

    var mm = document.getElementById("mobileMenu");
    if (mm && !mm.querySelector(".mobile-login")) {
      var ml = document.createElement("button");
      ml.type = "button";
      ml.className = "btn discord-btn mobile-login press";
      ml.setAttribute("data-login-btn", "");
      ml.innerHTML = DISCORD_SVG + " Login with Discord";
      ml.addEventListener("click", startDiscordOAuth);
      mm.appendChild(ml);
    }
  }

  function setActiveNav() {
    var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".nav-link, .mobile-link").forEach(function (a) {
      var href = (a.getAttribute("href") || "").toLowerCase();
      if (
        href === path ||
        (path === "" && href.indexOf("index") !== -1) ||
        (path === "index.html" && href === "./")
      ) {
        a.classList.add("active");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async function () {
    document.body.classList.add("gate-locked");
    ensureBg();
    ensureGate();
    fixLogos();
    initParticles();
    initCursorGlow();
    initScroll();
    initMenu();
    injectHeaderAuth();
    await handleOAuthReturn();
    applyGate();
    updateAuthUI();
    initReveal();
    initCommands();
    initFaq();
    initReviews();
    setActiveNav();
  });
})();
