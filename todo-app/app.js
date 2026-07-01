/* Momentum — ADHD-friendly todo app. No dependencies, saves to localStorage. */

(() => {
  "use strict";

  const STORAGE_KEY = "momentum.v1";
  const FOCUS_LIMIT = 3;
  const XP_PER_TASK = 10;
  const XP_IMPORTANT_BONUS = 5;
  const XP_PER_LEVEL = 50;

  // ---------- state ----------

  const defaultState = () => ({
    tasks: [], // { id, title, space: 'work'|'personal'|null, important, tiny, done, createdAt, doneAt }
    xp: 0,
    streak: 0,
    lastDoneDay: null, // "YYYY-MM-DD" of the last day a task was completed
  });

  let state = load();
  let activeSpace = "all"; // 'all' | 'personal' | 'work'
  let viewMode = "focus"; // 'focus' | 'all'

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return { ...defaultState(), ...JSON.parse(raw) };
    } catch {
      return defaultState();
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // ---------- date helpers ----------

  const dayKey = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  function refreshStreak() {
    // A streak survives if the last completion was today or yesterday.
    if (!state.lastDoneDay) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (state.lastDoneDay !== dayKey() && state.lastDoneDay !== dayKey(yesterday)) {
      state.streak = 0;
      save();
    }
  }

  // ---------- capture parsing ----------

  // "email Sam #work ! ~2m" -> { title: "email Sam", space: "work", important: true, tiny: true }
  function parseCapture(raw) {
    let text = raw.trim();
    if (!text) return null;

    let space = null;
    let important = false;
    let tiny = false;

    text = text.replace(/#(work|personal)\b/gi, (_, s) => {
      space = s.toLowerCase();
      return "";
    });
    text = text.replace(/~\s*\d*\s*m(in)?\b/gi, () => {
      tiny = true;
      return "";
    });
    text = text.replace(/(^|\s)!+(\s|$)/g, () => {
      important = true;
      return " ";
    });

    const title = text.replace(/\s+/g, " ").trim();
    if (!title) return null;
    return { title, space, important, tiny };
  }

  // ---------- task operations ----------

  function addTask(parsed) {
    // If a space tab is selected and none was typed, file it there automatically.
    const space = parsed.space ?? (activeSpace === "all" ? null : activeSpace);
    state.tasks.unshift({
      id: crypto.randomUUID(),
      title: parsed.title,
      space,
      important: parsed.important,
      tiny: parsed.tiny,
      done: false,
      createdAt: Date.now(),
      doneAt: null,
    });
    save();
    render();
  }

  function completeTask(id, taskEl) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task || task.done) return;

    task.done = true;
    task.doneAt = Date.now();

    // XP + level
    const gained = XP_PER_TASK + (task.important ? XP_IMPORTANT_BONUS : 0);
    const levelBefore = levelFor(state.xp);
    state.xp += gained;
    const levelAfter = levelFor(state.xp);

    // streak
    const today = dayKey();
    if (state.lastDoneDay !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      state.streak = state.lastDoneDay === dayKey(yesterday) ? state.streak + 1 : 1;
      state.lastDoneDay = today;
      bump(document.getElementById("streak-stat"));
    }

    save();

    // celebrate, then re-render after the exit animation
    confettiBurst(taskEl);
    if (levelAfter > levelBefore) {
      toast(`🎉 LEVEL UP! You're now level ${levelAfter}`);
      confettiBurst(taskEl, 90);
    } else {
      toast(pickCheer(task, gained));
    }

    taskEl.querySelector(".check").classList.add("checked");
    taskEl.classList.add("completing");
    setTimeout(render, 480);
  }

  function undoTask(id) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    task.done = false;
    task.doneAt = null;
    save();
    render();
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    save();
    render();
  }

  const levelFor = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;

  // ---------- cheers ----------

  const CHEERS = [
    "Nice! +{xp} XP",
    "Done and dusted. +{xp} XP",
    "That's momentum! +{xp} XP",
    "One less thing in your head. +{xp} XP",
    "Boom. +{xp} XP",
    "Look at you go! +{xp} XP",
  ];

  function pickCheer(task, gained) {
    const base = CHEERS[Math.floor(Math.random() * CHEERS.length)];
    let msg = base.replace("{xp}", gained);
    if (task.important) msg = "⭐ Big one! " + msg;
    return msg;
  }

  // ---------- rendering ----------

  const $ = (id) => document.getElementById(id);
  const taskListEl = $("task-list");
  const doneListEl = $("done-list");

  function visibleTasks() {
    return state.tasks.filter(
      (t) => !t.done && (activeSpace === "all" || t.space === activeSpace)
    );
  }

  function doneToday() {
    const today = dayKey();
    return state.tasks.filter(
      (t) =>
        t.done &&
        t.doneAt &&
        dayKey(new Date(t.doneAt)) === today &&
        (activeSpace === "all" || t.space === activeSpace)
    );
  }

  // In focus mode: important first, then tiny (quick wins), then oldest first.
  function focusOrder(tasks) {
    return [...tasks].sort((a, b) => {
      if (a.important !== b.important) return a.important ? -1 : 1;
      if (a.tiny !== b.tiny) return a.tiny ? -1 : 1;
      return a.createdAt - b.createdAt;
    });
  }

  function taskItem(task) {
    const li = document.createElement("li");
    li.className = "task" + (task.done ? " done" : "");
    li.dataset.id = task.id;
    if (task.space) li.dataset.space = task.space;

    const check = document.createElement("button");
    check.className = "check";
    check.textContent = "✓";
    check.setAttribute(
      "aria-label",
      task.done ? `Mark "${task.title}" as not done` : `Complete "${task.title}"`
    );
    check.addEventListener("click", () =>
      task.done ? undoTask(task.id) : completeTask(task.id, li)
    );

    const body = document.createElement("div");
    body.className = "task-body";

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;
    body.appendChild(title);

    const badges = [];
    if (task.important) badges.push(["important", "important"]);
    if (task.tiny) badges.push(["tiny", "~2 min"]);
    if (task.space && activeSpace === "all")
      badges.push([`space-${task.space}`, task.space]);

    if (badges.length) {
      const meta = document.createElement("div");
      meta.className = "task-meta";
      for (const [cls, label] of badges) {
        const b = document.createElement("span");
        b.className = `badge ${cls}`;
        b.textContent = label;
        meta.appendChild(b);
      }
      body.appendChild(meta);
    }

    const del = document.createElement("button");
    del.className = "task-del";
    del.textContent = "✕";
    del.setAttribute("aria-label", `Delete "${task.title}"`);
    del.addEventListener("click", () => deleteTask(task.id));

    li.append(check, body, del);
    return li;
  }

  function render() {
    // stats
    $("streak-count").textContent = state.streak;
    $("level-label").textContent = `Lv ${levelFor(state.xp)}`;
    $("xp-fill").style.width = `${((state.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100}%`;

    // open tasks
    const open = visibleTasks();
    const shown =
      viewMode === "focus" ? focusOrder(open).slice(0, FOCUS_LIMIT) : open;

    taskListEl.replaceChildren(...shown.map(taskItem));

    const note = $("focus-note");
    if (viewMode === "focus" && open.length > FOCUS_LIMIT) {
      note.textContent = `Just these ${shown.length}. The other ${open.length - shown.length} can wait — they're safe in “Everything”.`;
      note.style.display = "";
    } else if (viewMode === "focus" && open.length > 0) {
      note.textContent = "Just these. Everything else can wait.";
      note.style.display = "";
    } else {
      note.style.display = "none";
    }

    // empty state
    const empty = $("empty-state");
    const finished = doneToday();
    if (open.length === 0) {
      empty.classList.remove("hidden");
      if (finished.length > 0) {
        $("empty-emoji").textContent = "🏆";
        $("empty-title").textContent = `Inbox zero — ${finished.length} done today!`;
        $("empty-sub").textContent = "Go enjoy the dopamine. You earned it.";
      } else {
        $("empty-emoji").textContent = "🌤️";
        $("empty-title").textContent = "All clear!";
        $("empty-sub").textContent =
          "Add one small thing above — starting is the whole game.";
      }
    } else {
      empty.classList.add("hidden");
    }

    // done today
    $("done-count").textContent = finished.length;
    doneListEl.replaceChildren(
      ...finished.sort((a, b) => b.doneAt - a.doneAt).map(taskItem)
    );
    $("done-section").style.display = finished.length ? "" : "none";
  }

  // ---------- pick for me ----------

  function pickForMe() {
    const open = visibleTasks();
    if (!open.length) {
      toast("Nothing to pick — add something first!");
      return;
    }
    // Prefer tiny tasks (quick wins beat paralysis), then important, then random.
    const pool =
      open.filter((t) => t.tiny).length > 0
        ? open.filter((t) => t.tiny)
        : open.filter((t) => t.important).length > 0
          ? open.filter((t) => t.important)
          : open;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    // Make sure it's on screen: switch to focus view isn't guaranteed to show it,
    // so temporarily show everything if needed.
    let el = taskListEl.querySelector(`[data-id="${chosen.id}"]`);
    if (!el) {
      viewMode = "all";
      syncModeButtons();
      render();
      el = taskListEl.querySelector(`[data-id="${chosen.id}"]`);
    }
    if (el) {
      el.classList.remove("spotlight");
      void el.offsetWidth; // restart animation
      el.classList.add("spotlight");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    toast(`🎯 Just this one: “${chosen.title}”`);
  }

  // ---------- toast ----------

  let toastTimer = null;
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function bump(el) {
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }

  // ---------- confetti ----------

  const canvas = $("confetti-canvas");
  const ctx = canvas.getContext("2d");
  let particles = [];
  let confettiRunning = false;

  function confettiBurst(originEl, count = 36) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    const rect = originEl.getBoundingClientRect();
    const x = rect.left + 30;
    const y = rect.top + rect.height / 2;
    const colors = ["#ff7a45", "#f5b301", "#3cab5a", "#4a7dff", "#b558d6"];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 4 + Math.random() * 5,
        color: colors[i % colors.length],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        life: 60 + Math.random() * 30,
      });
    }
    if (!confettiRunning) {
      confettiRunning = true;
      requestAnimationFrame(confettiTick);
    }
  }

  function confettiTick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18; // gravity
      p.rot += p.vr;
      p.life -= 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (particles.length) {
      requestAnimationFrame(confettiTick);
    } else {
      confettiRunning = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // ---------- wiring ----------

  $("capture-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("capture-input");
    const parsed = parseCapture(input.value);
    if (parsed) {
      addTask(parsed);
      input.value = "";
    }
    input.focus();
  });

  document.querySelectorAll(".space-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeSpace = btn.dataset.space;
      document
        .querySelectorAll(".space-tab")
        .forEach((b) => b.classList.toggle("active", b === btn));
      render();
    });
  });

  function syncModeButtons() {
    document
      .querySelectorAll(".mode-btn")
      .forEach((b) => b.classList.toggle("active", b.dataset.mode === viewMode));
  }

  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      viewMode = btn.dataset.mode;
      syncModeButtons();
      render();
    });
  });

  $("pick-btn").addEventListener("click", pickForMe);

  // keyboard: "/" focuses capture from anywhere
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== $("capture-input")) {
      e.preventDefault();
      $("capture-input").focus();
    }
  });

  // ---------- go ----------

  refreshStreak();
  render();
  $("capture-input").focus();
})();
