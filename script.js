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
    let meteors = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let last = 0;
    let meteorTimer = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const starCount = Math.floor((width * height) / 7000);
      stars = Array.from({ length: starCount }, () => {
        const bright = Math.random() > 0.86;
        return {
          x: Math.random() * width,
          y: Math.random() * height * 0.82,
          r: bright ? Math.random() * 2.1 + 1 : Math.random() * 1.4 + 0.35,
          a: bright ? Math.random() * 0.3 + 0.7 : Math.random() * 0.45 + 0.35,
          tw: Math.random() * Math.PI * 2,
          sp: Math.random() * 0.9 + 0.25,
          drift: Math.random() * 0.1 + 0.03,
          glow: bright,
        };
      });

      motes = Array.from({ length: Math.floor(width / 28) }, () => ({
        x: Math.random() * width,
        y: height * (0.48 + Math.random() * 0.42),
        r: Math.random() * 2.2 + 0.6,
        a: Math.random() * 0.22 + 0.08,
        vx: Math.random() * 18 + 10,
        vy: (Math.random() - 0.5) * 5,
      }));
    };

    const spawnMeteor = () => {
      if (reduceMotion) return;
      meteors.push({
        x: Math.random() * width * 0.7,
        y: Math.random() * height * 0.35,
        len: Math.random() * 90 + 70,
        speed: Math.random() * 420 + 320,
        life: 0,
        max: Math.random() * 0.7 + 0.55,
        angle: Math.PI / 5 + Math.random() * 0.2,
      });
    };

    const paintBackdrop = () => {
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, "#2a2142");
      g.addColorStop(0.35, "#1d1730");
      g.addColorStop(0.65, "#2a1f2c");
      g.addColorStop(1, "#3a2a1f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      const milky = ctx.createRadialGradient(
        width * 0.55,
        height * 0.28,
        0,
        width * 0.55,
        height * 0.28,
        width * 0.55
      );
      milky.addColorStop(0, "rgba(210, 195, 255, 0.16)");
      milky.addColorStop(0.45, "rgba(150, 130, 200, 0.06)");
      milky.addColorStop(1, "transparent");
      ctx.fillStyle = milky;
      ctx.fillRect(0, 0, width, height);

      const h = ctx.createRadialGradient(
        width * 0.5,
        height * 0.82,
        0,
        width * 0.5,
        height * 0.82,
        width * 0.65
      );
      h.addColorStop(0, "rgba(230, 145, 70, 0.42)");
      h.addColorStop(0.4, "rgba(180, 100, 50, 0.16)");
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
          s.x += s.drift * dt * 10;
          if (s.x > width + 2) s.x = -2;
        }

        const alpha = reduceMotion
          ? s.a
          : s.a * (0.55 + 0.45 * Math.sin(s.tw));

        if (s.glow) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 240, 210, ${alpha * 0.22})`;
          ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 244, 220, ${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) {
        meteorTimer += dt;
        if (meteorTimer > 4.5 + Math.random() * 3) {
          spawnMeteor();
          meteorTimer = 0;
        }

        for (let i = meteors.length - 1; i >= 0; i -= 1) {
          const m = meteors[i];
          m.life += dt;
          m.x += Math.cos(m.angle) * m.speed * dt;
          m.y += Math.sin(m.angle) * m.speed * dt;

          const fade = 1 - m.life / m.max;
          if (fade <= 0) {
            meteors.splice(i, 1);
            continue;
          }

          const tx = m.x - Math.cos(m.angle) * m.len;
          const ty = m.y - Math.sin(m.angle) * m.len;
          const trail = ctx.createLinearGradient(tx, ty, m.x, m.y);
          trail.addColorStop(0, "rgba(255, 240, 210, 0)");
          trail.addColorStop(1, `rgba(255, 236, 200, ${0.85 * fade})`);
          ctx.beginPath();
          ctx.strokeStyle = trail;
          ctx.lineWidth = 1.6;
          ctx.moveTo(tx, ty);
          ctx.lineTo(m.x, m.y);
          ctx.stroke();
        }

        for (const mote of motes) {
          mote.x += mote.vx * dt;
          mote.y += mote.vy * dt;
          if (mote.x > width + 12) {
            mote.x = -12;
            mote.y = height * (0.48 + Math.random() * 0.42);
          }
          ctx.beginPath();
          ctx.fillStyle = `rgba(233, 203, 152, ${mote.a})`;
          ctx.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
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
      label: "In",
      status: "Draw the night in. Leave the ledger outside.",
      ms: 4000,
    },
    {
      id: "hold",
      label: "Still",
      status: "Here—beneath the drone—the cosmos waits.",
      ms: 1600,
    },
    {
      id: "exhale",
      label: "Out",
      status: "Release the numbness. Keep the wonder.",
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
        ? "Alive again. The metrics can wait."
        : "Paused. The sky inside you is patient.";
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
    status.textContent = "Rest. Numbness loosens when you notice it.";
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
