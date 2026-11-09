(() => {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---- Starfield ---- */
  const canvas = document.querySelector("[data-sky]");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    let stars = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let last = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.floor((width * height) / 14000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.78,
        r: Math.random() * 1.2 + 0.2,
        a: Math.random() * 0.55 + 0.15,
        tw: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.4 + 0.15,
        drift: Math.random() * 0.08 + 0.02,
      }));
    };

    const draw = (t) => {
      const now = t || 0;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;

      ctx.clearRect(0, 0, width, height);

      // Deep night wash
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, "#10182a");
      g.addColorStop(0.55, "#0c121c");
      g.addColorStop(1, "#0a0e16");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      for (const s of stars) {
        s.tw += s.sp * dt;
        s.x += s.drift * dt * 8;
        if (s.x > width + 2) s.x = -2;

        const alpha = s.a * (0.65 + 0.35 * Math.sin(s.tw));
        ctx.beginPath();
        ctx.fillStyle = `rgba(232, 217, 184, ${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) {
        raf = requestAnimationFrame(draw);
      }
    };

    resize();
    draw(0);

    if (reduceMotion) {
      // Static sky only
    } else {
      raf = requestAnimationFrame(draw);
    }

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        if (reduceMotion) draw(0);
      }, 120);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        last = 0;
      } else if (!reduceMotion) {
        raf = requestAnimationFrame(draw);
      }
    });
  }

  /* ---- Reveals ---- */
  const revealEls = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach((el) => observer.observe(el));

    requestAnimationFrame(() => {
      document
        .querySelectorAll(".hero .reveal")
        .forEach((el) => el.classList.add("is-visible"));
    });
  }

  /* ---- Breath ---- */
  const root = document.querySelector("[data-breath]");
  if (!root) return;

  const toggle = root.querySelector("[data-breath-toggle]");
  const label = root.querySelector("[data-breath-label]");
  const status = root.querySelector("[data-breath-status]");
  const orb = root.querySelector("[data-breath-orb]");

  const PHASES = [
    {
      id: "inhale",
      label: "Rise",
      status: "Draw the night in.",
      ms: 4000,
    },
    {
      id: "hold",
      label: "Still",
      status: "Nothing to measure here.",
      ms: 1600,
    },
    {
      id: "exhale",
      label: "Settle",
      status: "Give the wind what it asks.",
      ms: 5000,
    },
  ];

  let running = false;
  let phaseIndex = 0;
  let cycles = 0;
  let timerId = 0;

  const clearTimer = () => {
    window.clearTimeout(timerId);
    timerId = 0;
  };

  const setIdle = () => {
    delete root.dataset.phase;
    label.textContent = "Begin";
    status.textContent = "Press the light. Follow it home.";
    toggle.setAttribute("aria-pressed", "false");
  };

  const finish = () => {
    running = false;
    clearTimer();
    delete root.dataset.phase;
    label.textContent = "Again";
    toggle.setAttribute("aria-pressed", "false");
    status.textContent =
      cycles >= 3
        ? "Enough. You were here."
        : "Paused. The sky keeps watch.";
    if (orb) orb.style.transform = "";
  };

  const tick = () => {
    if (!running) return;
    const phase = PHASES[phaseIndex];
    root.dataset.phase = phase.id;
    label.textContent = phase.label;
    status.textContent = phase.status;

    timerId = window.setTimeout(() => {
      phaseIndex += 1;
      if (phaseIndex >= PHASES.length) {
        phaseIndex = 0;
        cycles += 1;
        if (cycles >= 3) {
          finish();
          return;
        }
      }
      tick();
    }, phase.ms);
  };

  const start = () => {
    running = true;
    phaseIndex = 0;
    cycles = 0;
    toggle.setAttribute("aria-pressed", "true");
    tick();
  };

  const pause = () => {
    running = false;
    clearTimer();
    toggle.setAttribute("aria-pressed", "false");
    label.textContent = "Resume";
    status.textContent = "Rest. Continue when ready.";
  };

  toggle.addEventListener("click", () => {
    const pressed = toggle.getAttribute("aria-pressed") === "true";
    if (!running && (label.textContent === "Begin" || label.textContent === "Again")) {
      start();
      return;
    }
    if (running || pressed) {
      pause();
      return;
    }
    running = true;
    toggle.setAttribute("aria-pressed", "true");
    tick();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && running) pause();
  });

  if (reduceMotion && orb) {
    orb.style.transition = "none";
  }
})();
