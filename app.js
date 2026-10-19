(function () {
  "use strict";

  // Mobile menu
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      const open = !mobileMenu.hidden;
      mobileMenu.hidden = open;
      menuBtn.setAttribute("aria-expanded", String(!open));
      menuBtn.textContent = open ? "MENU" : "CLOSE";
    });
    mobileMenu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        mobileMenu.hidden = true;
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.textContent = "MENU";
      });
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu && !mobileMenu.hidden) {
      mobileMenu.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.textContent = "MENU";
      menuBtn.focus();
    }
  });

  // Reveal
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  // Click ripple
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".press");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = e.clientX - rect.left - size / 2 + "px";
    ripple.style.top = e.clientY - rect.top - size / 2 + "px";
    btn.style.position = "relative";
    btn.style.overflow = "hidden";
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });

  // Commands filter + search + copy
  const search = document.getElementById("cmdSearch");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".cmd-card");
  let activeFilter = "all";

  function filterCmds() {
    const q = (search ? search.value : "").toLowerCase().trim();
    cards.forEach((card) => {
      const cat = card.dataset.cat || "";
      const text = card.textContent.toLowerCase();
      const matchCat = activeFilter === "all" || cat === activeFilter;
      const matchQ = !q || text.includes(q);
      card.classList.toggle("hidden", !(matchCat && matchQ));
    });
  }

  if (search) search.addEventListener("input", filterCmds);
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter || "all";
      filterCmds();
    });
  });

  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cmd = btn.dataset.cmd || "";
      const done = () => {
        btn.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("copied");
        }, 1500);
      };
      const fallback = () => {
        const t = document.createElement("textarea");
        t.value = cmd;
        t.style.position = "fixed";
        t.style.opacity = "0";
        document.body.appendChild(t);
        t.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        t.remove();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cmd).then(done, fallback);
      } else {
        fallback();
      }
    });
  });

  // Reviews system (localStorage)
  const STORAGE_KEY = "vortexia_reviews_v1";
  const form = document.getElementById("reviewForm");
  const listEl = document.getElementById("reviewList");
  const avgBox = document.getElementById("avgBox");
  let selectedStars = 5;

  function loadReviews() {
    try {
      const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }

  function saveReviews(arr) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      /* storage blocked (private mode / full) – ignore */
    }
  }

  function starStr(n) {
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  function renderReviews() {
    if (!listEl) return;
    const reviews = loadReviews();
    if (avgBox) {
      if (reviews.length === 0) {
        avgBox.innerHTML = `<div class="avg-score">—</div><div class="avg-meta">No reviews yet · Be the first</div>`;
      } else {
        const avg = reviews.reduce((s, r) => s + r.stars, 0) / reviews.length;
        avgBox.innerHTML = `<div class="avg-score">${avg.toFixed(1)}</div><div class="avg-meta">${starStr(Math.round(avg))}<br>${reviews.length} review${reviews.length > 1 ? "s" : ""}</div>`;
      }
    }
    if (reviews.length === 0) {
      listEl.innerHTML = `<div class="review-empty">No reviews yet. Share your experience above.</div>`;
      return;
    }
    listEl.innerHTML = reviews
      .slice()
      .reverse()
      .map(
        (r) => `
      <article class="review-card reveal visible">
        <div class="review-head">
          <div>
            <div class="review-name">${escapeHtml(r.name)}</div>
            <div class="review-stars">${starStr(r.stars)}</div>
          </div>
          <div class="review-date">${escapeHtml(r.date)}</div>
        </div>
        <p class="review-text">${escapeHtml(r.text)}</p>
      </article>`
      )
      .join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Star picker
  const starPicker = document.getElementById("starPicker");
  if (starPicker) {
    const spans = starPicker.querySelectorAll("span");
    spans.forEach((span, i) => {
      span.addEventListener("click", () => {
        selectedStars = i + 1;
        spans.forEach((s, j) => s.classList.toggle("on", j < selectedStars));
      });
      span.addEventListener("mouseenter", () => {
        spans.forEach((s, j) => s.classList.toggle("on", j <= i));
      });
    });
    starPicker.addEventListener("mouseleave", () => {
      spans.forEach((s, j) => s.classList.toggle("on", j < selectedStars));
    });
    spans.forEach((s, j) => s.classList.toggle("on", j < selectedStars));
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = ((document.getElementById("revName") || {}).value || "").trim().slice(0, 40) || "Anonymous";
      const text = ((document.getElementById("revText") || {}).value || "").trim().slice(0, 500);
      if (!text) return;
      const reviews = loadReviews();
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const d = new Date();
      reviews.push({
        name,
        stars: selectedStars,
        text,
        date: months[d.getMonth()] + " " + d.getFullYear(),
      });
      saveReviews(reviews);
      form.reset();
      selectedStars = 5;
      if (starPicker) {
        starPicker.querySelectorAll("span").forEach((s, j) => s.classList.toggle("on", j < 5));
      }
      renderReviews();
    });
  }

  renderReviews();
})();
