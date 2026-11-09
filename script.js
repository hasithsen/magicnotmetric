(() => {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---- Scroll reveals ---- */
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
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    );

    revealEls.forEach((el) => observer.observe(el));

    // Hero should animate in on load without waiting for scroll.
    requestAnimationFrame(() => {
      document
        .querySelectorAll(".hero .reveal")
        .forEach((el) => el.classList.add("is-visible"));
    });
  }

  /* ---- Breath practice ---- */
  const root = document.querySelector("[data-breath]");
  if (!root) return;

  const orb = root.querySelector("[data-breath-orb]");
  const status = root.querySelector("[data-breath-status]");
  const cycle = root.querySelector("[data-breath-cycle]");
  const toggle = root.querySelector("[data-breath-toggle]");
  const reset = root.querySelector("[data-breath-reset]");

  const PHASES = [
    {
      id: "inhale",
      label: "Inhale",
      status: "Draw the world in. Soft belly, quiet mind.",
      ms: 4000,
    },
    {
      id: "hold",
      label: "Hold",
      status: "Stay with yourself. Nothing to optimize here.",
      ms: 1500,
    },
    {
      id: "exhale",
      label: "Exhale",
      status: "Release the metric. Keep the magic.",
      ms: 5000,
    },
  ];

  let running = false;
  let phaseIndex = 0;
  let cyclesCompleted = 0;
  let timerId = 0;

  const setPhase = (phase) => {
    root.dataset.phase = phase.id;
    cycle.textContent = phase.label;
    status.textContent = phase.status;
  };

  const clearTimer = () => {
    window.clearTimeout(timerId);
    timerId = 0;
  };

  const idleCopy = () => {
    delete root.dataset.phase;
    cycle.textContent = "Ready";
    status.textContent =
      "Press start. Follow the circle. Come back to yourself.";
  };

  const finish = () => {
    running = false;
    clearTimer();
    delete root.dataset.phase;
    toggle.textContent = "Start";
    toggle.setAttribute("aria-pressed", "false");
    reset.hidden = true;
    cycle.textContent = "Complete";
    status.textContent =
      cyclesCompleted >= 3
        ? "Three breaths. That is enough to remember you are alive."
        : "Paused. The quiet will wait for you.";
    if (orb) orb.style.transform = "";
  };

  const tick = () => {
    if (!running) return;

    const phase = PHASES[phaseIndex];
    setPhase(phase);

    timerId = window.setTimeout(() => {
      phaseIndex += 1;
      if (phaseIndex >= PHASES.length) {
        phaseIndex = 0;
        cyclesCompleted += 1;
        if (cyclesCompleted >= 3) {
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
    cyclesCompleted = 0;
    toggle.textContent = "Pause";
    toggle.setAttribute("aria-pressed", "true");
    reset.hidden = false;
    tick();
  };

  const pause = () => {
    running = false;
    clearTimer();
    toggle.textContent = "Resume";
    toggle.setAttribute("aria-pressed", "false");
    cycle.textContent = "Paused";
    status.textContent = "No rush. Resume when you are ready.";
  };

  const resume = () => {
    running = true;
    toggle.textContent = "Pause";
    toggle.setAttribute("aria-pressed", "true");
    tick();
  };

  toggle.addEventListener("click", () => {
    if (!running && toggle.textContent === "Start") {
      start();
      return;
    }
    if (running) {
      pause();
      return;
    }
    resume();
  });

  reset.addEventListener("click", () => {
    running = false;
    clearTimer();
    phaseIndex = 0;
    cyclesCompleted = 0;
    toggle.textContent = "Start";
    toggle.setAttribute("aria-pressed", "false");
    reset.hidden = true;
    if (orb) orb.style.transform = "";
    idleCopy();
  });

  // Respect reduced motion: keep labels, skip orb scaling transitions via CSS.
  if (reduceMotion && orb) {
    orb.style.transition = "none";
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && running) {
      pause();
    }
  });
})();
