(() => {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---- Starfield + wind ---- */
  const canvas = document.querySelector("[data-sky]");
  if (canvas?.getContext) {
    const ctx = canvas.getContext("2d");
    let stars = [];
    let motes = [];
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

      const starCount = Math.floor((width * height) / 12000);
      stars = Array.from({ length: starCount }, () => {
        const bright = Math.random() > 0.92;
        return {
          x: Math.random() * width,
          y: Math.random() * height * 0.72,
          r: bright ? Math.random() * 1.6 + 0.8 : Math.random() * 1.1 + 0.2,
          a: bright ? Math.random() * 0.35 + 0.55 : Math.random() * 0.45 + 0.15,
          tw: Math.random() * Math.PI * 2,
          sp: Math.random() * 0.55 + 0.12,
          drift: Math.random() * 0.06 + 0.015,
        };
      });

      motes = Array.from({ length: Math.floor(width / 45) }, () => ({
        x: Math.random() * width,
        y: height * (0.55 + Math.random() * 0.35),
        r: Math.random() * 1.4 + 0.4,
        a: Math.random() * 0.12 + 0.04,
        vx: Math.random() * 12 + 6,
        vy: (Math.random() - 0.5) * 3,
      }));
    };

    const paintBackdrop = () => {
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, "#1e1830");
      g.addColorStop(0.45, "#1a1528");
      g.addColorStop(0.72, "#241c28");
      g.addColorStop(1, "#2c211c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      // Soft horizon warmth
      const h = ctx.createRadialGradient(
        width * 0.5,
        height * 0.78,
        0,
        width * 0.5,
        height * 0.78,
        width * 0.55
      );
      h.addColorStop(0, "rgba(196, 122, 74, 0.22)");
      h.addColorStop(0.45, "rgba(150, 90, 55, 0.08)");
      h.addColorStop(1, "transparent");
      ctx.fillStyle = h;
      ctx.fillRect(0, 0, width, height);
    };

    const draw = (t = 0) => {
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0.016;
      last = t;

      paintBackdrop();

      for (const s of stars) {
        if (!reduceMotion) {
          s.tw += s.sp * dt;
          s.x += s.drift * dt * 7;
          if (s.x > width + 2) s.x = -2;
        }

        const alpha = reduceMotion
          ? s.a
          : s.a * (0.62 + 0.38 * Math.sin(s.tw));

        ctx.beginPath();
        ctx.fillStyle = `rgba(240, 226, 192, ${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) {
        for (const m of motes) {
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          if (m.x > width + 10) {
            m.x = -10;
            m.y = height * (0.55 + Math.random() * 0.35);
          }
          ctx.beginPath();
          ctx.fillStyle = `rgba(212, 180, 132, ${m.a})`;
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reduceMotion) raf = requestAnimationFrame(draw);
    };

    resize();
    draw(0);
    if (!reduceMotion) raf = requestAnimationFrame(draw);

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
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach((el) => observer.observe(el));

    requestAnimationFrame(() => {
      document
        .querySelectorAll(".hero .reveal")
        .forEach((el) => el.classList.add("is-visible"));
    });
  }

  /* ---- Star rite ---- */
  const root = document.querySelector("[data-breath]");
  if (!root) return;

  const toggle = root.querySelector("[data-breath-toggle]");
  const label = root.querySelector("[data-breath-label]");
  const status = root.querySelector("[data-breath-status]");
  const orb = root.querySelector("[data-breath-orb]");

  const PHASES = [
    {
      id: "inhale",
      label: "Expand",
      status: "As the tide. As the dawn.",
      ms: 4000,
    },
    {
      id: "hold",
      label: "Still",
      status: "The hinge between every turning.",
      ms: 1600,
    },
    {
      id: "exhale",
      label: "Return",
      status: "What rises comes home.",
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

  const isStartLabel = () => {
    const t = label.textContent;
    return t === "Begin" || t === "Again";
  };

  const finish = () => {
    running = false;
    clearTimer();
    delete root.dataset.phase;
    label.textContent = "Again";
    toggle.setAttribute("aria-pressed", "false");
    status.textContent =
      cycles >= 3
        ? "The wheel has turned. You were inside it."
        : "Paused. The pattern waits without hurry.";
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
    status.textContent = "Rest. Cycles forgive delay.";
  };

  toggle.addEventListener("click", () => {
    if (!running && isStartLabel()) {
      start();
      return;
    }
    if (running) {
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

  if (reduceMotion && orb) orb.style.transition = "none";
})();
