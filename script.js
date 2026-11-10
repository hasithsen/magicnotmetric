(() => {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* Stars */
  const canvas = document.querySelector("[data-stars]");
  if (canvas?.getContext) {
    const ctx = canvas.getContext("2d");
    let stars = [];
    let motes = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let last = 0;
    let meteorTimer = 0;
    let meteors = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = Array.from({ length: Math.floor((width * height) / 7500) }, () => {
        const bright = Math.random() > 0.88;
        return {
          x: Math.random() * width,
          y: Math.random() * height * 0.78,
          r: bright ? Math.random() * 1.8 + 0.9 : Math.random() * 1.2 + 0.3,
          a: bright ? Math.random() * 0.25 + 0.7 : Math.random() * 0.4 + 0.3,
          tw: Math.random() * Math.PI * 2,
          sp: Math.random() * 0.7 + 0.2,
          drift: Math.random() * 0.08 + 0.02,
          glow: bright,
        };
      });

      motes = Array.from({ length: Math.floor(width / 32) }, () => ({
        x: Math.random() * width,
        y: height * (0.55 + Math.random() * 0.35),
        r: Math.random() * 1.8 + 0.5,
        a: Math.random() * 0.18 + 0.06,
        vx: Math.random() * 14 + 8,
        vy: (Math.random() - 0.5) * 3,
      }));
    };

    const paint = () => {
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, "#1c1830");
      g.addColorStop(0.4, "#161322");
      g.addColorStop(0.7, "#241c22");
      g.addColorStop(1, "#35261c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      const milky = ctx.createRadialGradient(
        width * 0.52,
        height * 0.26,
        0,
        width * 0.52,
        height * 0.26,
        width * 0.5
      );
      milky.addColorStop(0, "rgba(190, 175, 230, 0.12)");
      milky.addColorStop(0.5, "rgba(140, 120, 180, 0.04)");
      milky.addColorStop(1, "transparent");
      ctx.fillStyle = milky;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.84,
        0,
        width * 0.5,
        height * 0.84,
        width * 0.6
      );
      glow.addColorStop(0, "rgba(196, 122, 69, 0.38)");
      glow.addColorStop(0.45, "rgba(160, 90, 45, 0.12)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    };

    const draw = (t = 0) => {
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0.016;
      last = t;
      paint();

      for (const s of stars) {
        if (!reduceMotion) {
          s.tw += s.sp * dt;
          s.x += s.drift * dt * 8;
          if (s.x > width + 2) s.x = -2;
        }

        const alpha = reduceMotion
          ? s.a
          : s.a * (0.55 + 0.45 * Math.sin(s.tw));

        if (s.glow) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 242, 210, ${alpha * 0.2})`;
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 246, 220, ${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) {
        meteorTimer += dt;
        if (meteorTimer > 6 + Math.random() * 5) {
          meteors.push({
            x: Math.random() * width * 0.7,
            y: Math.random() * height * 0.3,
            len: Math.random() * 80 + 60,
            speed: Math.random() * 380 + 280,
            life: 0,
            max: Math.random() * 0.6 + 0.5,
            angle: Math.PI / 5 + Math.random() * 0.18,
          });
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
          trail.addColorStop(1, `rgba(255, 236, 200, ${0.8 * fade})`);
          ctx.beginPath();
          ctx.strokeStyle = trail;
          ctx.lineWidth = 1.4;
          ctx.moveTo(tx, ty);
          ctx.lineTo(m.x, m.y);
          ctx.stroke();
        }

        for (const mote of motes) {
          mote.x += mote.vx * dt;
          mote.y += mote.vy * dt;
          if (mote.x > width + 10) {
            mote.x = -10;
            mote.y = height * (0.55 + Math.random() * 0.35);
          }
          ctx.beginPath();
          ctx.fillStyle = `rgba(212, 180, 138, ${mote.a})`;
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
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
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

  /* Reveals */
  const els = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => io.observe(el));
    requestAnimationFrame(() => {
      document.querySelectorAll(".hero .reveal").forEach((el) => {
        el.classList.add("is-in");
      });
    });
  }

  /* Breath */
  const root = document.querySelector("[data-breath]");
  if (!root) return;

  const toggle = root.querySelector("[data-breath-toggle]");
  const label = root.querySelector("[data-breath-label]");
  const status = root.querySelector("[data-breath-status]");
  const orb = root.querySelector("[data-breath-orb]");

  const phases = [
    { id: "inhale", label: "In", status: "Draw the night in.", ms: 4000 },
    { id: "hold", label: "Still", status: "Stay with it.", ms: 3000 },
    { id: "exhale", label: "Out", status: "Give it back to the dark.", ms: 5000 },
  ];

  document.documentElement.style.setProperty("--in", `${phases[0].ms}ms`);
  document.documentElement.style.setProperty("--hold", `${phases[1].ms}ms`);
  document.documentElement.style.setProperty("--out", `${phases[2].ms}ms`);

  let running = false;
  let phaseIndex = 0;
  let cycles = 0;
  let timer = 0;

  const clear = () => {
    clearTimeout(timer);
    timer = 0;
  };

  const isStart = () => {
    const t = label.textContent;
    return t === "Begin" || t === "Again";
  };

  const finish = () => {
    running = false;
    clear();
    delete root.dataset.phase;
    label.textContent = "Again";
    toggle.setAttribute("aria-pressed", "false");
    status.textContent =
      cycles >= 3 ? "Steady. The night is with you." : "Pause here as long as you need.";
    if (orb) orb.style.transform = "";
  };

  const tick = () => {
    if (!running) return;
    const phase = phases[phaseIndex];
    root.dataset.phase = phase.id;
    label.textContent = phase.label;
    status.textContent = phase.status;

    timer = setTimeout(() => {
      phaseIndex += 1;
      if (phaseIndex >= phases.length) {
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
    clear();
    toggle.setAttribute("aria-pressed", "false");
    label.textContent = "Resume";
    status.textContent = "Easy. Continue when you want.";
  };

  toggle.addEventListener("click", () => {
    if (!running && isStart()) {
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
