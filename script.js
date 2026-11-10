(() => {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)")
    .matches;

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
    let pointer = { x: 0.5, y: 0.35, tx: 0.5, ty: 0.35 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const starCount = Math.floor((width * height) / 6500);
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

      motes = Array.from({ length: Math.floor(width / 24) }, () => ({
        x: Math.random() * width,
        y: height * (0.48 + Math.random() * 0.42),
        r: Math.random() * 2.2 + 0.6,
        a: Math.random() * 0.24 + 0.08,
        vx: Math.random() * 20 + 10,
        vy: (Math.random() - 0.5) * 5.5,
      }));
    };

    const spawnMeteor = () => {
      if (reduceMotion) return;
      meteors.push({
        x: Math.random() * width * 0.75,
        y: Math.random() * height * 0.35,
        len: Math.random() * 100 + 70,
        speed: Math.random() * 440 + 320,
        life: 0,
        max: Math.random() * 0.75 + 0.55,
        angle: Math.PI / 5 + Math.random() * 0.22,
      });
    };

    const paintBackdrop = () => {
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, "#2c2348");
      g.addColorStop(0.32, "#1d1730");
      g.addColorStop(0.62, "#2a1f2c");
      g.addColorStop(1, "#3d2c20");
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
      milky.addColorStop(0, "rgba(210, 195, 255, 0.18)");
      milky.addColorStop(0.45, "rgba(150, 130, 200, 0.07)");
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
      h.addColorStop(0, "rgba(230, 145, 70, 0.46)");
      h.addColorStop(0.4, "rgba(180, 100, 50, 0.18)");
      h.addColorStop(1, "transparent");
      ctx.fillStyle = h;
      ctx.fillRect(0, 0, width, height);
    };

    const draw = (t = 0) => {
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0.016;
      last = t;

      if (!reduceMotion && finePointer) {
        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;
      }

      paintBackdrop();

      const px = (pointer.x - 0.5) * 18;
      const py = (pointer.y - 0.5) * 10;

      for (const s of stars) {
        if (!reduceMotion) {
          s.tw += s.sp * dt;
          s.x += s.drift * dt * 10;
          if (s.x > width + 2) s.x = -2;
        }

        const alpha = reduceMotion
          ? s.a
          : s.a * (0.55 + 0.45 * Math.sin(s.tw));
        const sx = s.x + px * (s.glow ? 0.35 : 0.15);
        const sy = s.y + py * (s.glow ? 0.35 : 0.15);

        if (s.glow) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 240, 210, ${alpha * 0.24})`;
          ctx.arc(sx, sy, s.r * 3.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 244, 220, ${alpha})`;
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) {
        meteorTimer += dt;
        if (meteorTimer > 4.2 + Math.random() * 3.2) {
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
          trail.addColorStop(1, `rgba(255, 236, 200, ${0.88 * fade})`);
          ctx.beginPath();
          ctx.strokeStyle = trail;
          ctx.lineWidth = 1.7;
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

    if (!reduceMotion && finePointer) {
      window.addEventListener(
        "pointermove",
        (e) => {
          pointer.tx = e.clientX / width;
          pointer.ty = e.clientY / height;
        },
        { passive: true }
      );
    }
  }

  /* ---- Soft parallax + pointer glow ---- */
  const world = document.querySelector("[data-world]");
  const glow = document.querySelector("[data-pointer-glow]");
  const parallaxEls = document.querySelectorAll("[data-parallax]");

  if (!reduceMotion && finePointer && world) {
    let gx = window.innerWidth * 0.5;
    let gy = window.innerHeight * 0.35;
    let tgx = gx;
    let tgy = gy;
    let px = 0;
    let py = 0;
    let tpx = 0;
    let tpy = 0;
    let glowRaf = 0;

    const tickGlow = () => {
      gx += (tgx - gx) * 0.08;
      gy += (tgy - gy) * 0.08;
      px += (tpx - px) * 0.06;
      py += (tpy - py) * 0.06;

      if (glow) {
        glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      }

      parallaxEls.forEach((el) => {
        const depth = Number(el.getAttribute("data-parallax")) || 0.1;
        el.style.transform = `translate3d(${px * depth * 28}px, ${py * depth * 18}px, 0)`;
      });

      glowRaf = requestAnimationFrame(tickGlow);
    };

    window.addEventListener(
      "pointermove",
      (e) => {
        document.body.classList.add("is-pointer-ready");
        tgx = e.clientX;
        tgy = e.clientY;
        tpx = e.clientX / window.innerWidth - 0.5;
        tpy = e.clientY / window.innerHeight - 0.5;
      },
      { passive: true }
    );

    glowRaf = requestAnimationFrame(tickGlow);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(glowRaf);
      else glowRaf = requestAnimationFrame(tickGlow);
    });
  }

  /* ---- Header scroll state ---- */
  const header = document.querySelector("[data-header]");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
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
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
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
      status: "Draw the night in. You hold more than the measure.",
      ms: 4000,
    },
    {
      id: "hold",
      label: "Still",
      status: "Here—beneath the drone—the cosmos answers.",
      ms: 3600,
    },
    {
      id: "exhale",
      label: "Out",
      status: "Keep the wonder. Let the rest fall away.",
      ms: 5000,
    },
  ];

  document.documentElement.style.setProperty("--inhale-ms", `${PHASES[0].ms}ms`);
  document.documentElement.style.setProperty("--hold-ms", `${PHASES[1].ms}ms`);
  document.documentElement.style.setProperty("--exhale-ms", `${PHASES[2].ms}ms`);

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

  const setStatus = (text) => {
    if (!status) return;
    if (reduceMotion) {
      status.textContent = text;
      return;
    }
    status.classList.add("is-fading");
    window.setTimeout(() => {
      status.textContent = text;
      status.classList.remove("is-fading");
    }, 220);
  };

  const finish = () => {
    running = false;
    clearTimer();
    delete root.dataset.phase;
    label.textContent = "Again";
    toggle.setAttribute("aria-pressed", "false");
    setStatus(
      cycles >= 3
        ? "Still alive. The metrics can wait."
        : "Paused. The sky inside you holds."
    );
    if (orb) orb.style.transform = "";
  };

  const tick = () => {
    if (!running) return;
    const phase = PHASES[phaseIndex];
    root.dataset.phase = phase.id;
    label.textContent = phase.label;
    setStatus(phase.status);

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
    setStatus("Rest. You choose when to return.");
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
