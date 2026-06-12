import React, { useState, useEffect, useRef, useCallback } from "react";

/* ---------- Komama palette ---------- */
const C = {
  cream: "#FBF3E3",
  white: "#FFFFFF",
  pink: "#F8C8CF",
  pinkDeep: "#F2A8B2",
  tang: "#F47A20",
  lemon: "#F6BB42",
  algae: "#57A9A6",
  spinach: "#15534E",
  ink: "#15534E",
  inkSoft: "rgba(21,83,78,.55)",
  inkFaint: "rgba(21,83,78,.32)",
  border: "rgba(21,83,78,.14)",
};

/* tier visual system mapped onto the fruit palette */
const TIERS = ["S", "A", "B", "C", "D"];
const TIER_STYLE = {
  S: { bg: C.tang, fg: "#fff", label: "Hot — do now" },
  A: { bg: C.lemon, fg: C.spinach, label: "Important" },
  B: { bg: C.algae, fg: "#fff", label: "Soon" },
  C: { bg: C.pink, fg: C.spinach, label: "Eventually" },
  D: { bg: "#AFC9C5", fg: C.spinach, label: "Someday / maybe" },
  U: { bg: "#EFE6D2", fg: C.inkSoft, label: "Unranked" },
};
const SMART = [
  { k: "S", word: "Specific", hint: "What exactly will you accomplish?" },
  { k: "M", word: "Measurable", hint: "How will you know it's done?" },
  { k: "A", word: "Achievable", hint: "Is it realistic? What's needed?" },
  { k: "R", word: "Relevant", hint: "Why does this matter right now?" },
  { k: "T", word: "Time-bound", hint: "By when? Key dates or deadline." },
];

/* ---------- seed content ---------- */
const SEED_RAW = [
  ["furniture", "🪑", "Furniture & Equipment", [
    "Audit current furniture/equipment condition",
    "List new equipment needed (espresso machine, blenders, etc.)",
    "Source and get quotes from vendors",
    "Plan layout/floor arrangement",
    "Purchase and schedule delivery",
    "Install and test all equipment",
  ]],
  ["pastry", "🥐", "Pastry Menu & Recipe Development", [
    "Define pastry direction (Vietnamese, Japanese-inspired, etc.)",
    "Draft initial item list",
    "Source ingredients and test recipes",
    "Internal tasting + feedback round",
    "Finalize recipes with measurements and yield",
    "Write SOPs for each item",
    "Cost out each item",
  ]],
  ["food", "🍜", "Food Menu & Recipe Development", [
    "Define food direction",
    "Draft initial item list",
    "Source ingredients and test recipes",
    "Internal tasting + feedback round",
    "Finalize recipes with measurements and yield",
    "Write SOPs for each item",
    "Cost out each item",
  ]],
  ["drinks", "🍵", "Drink Operations", [
    ["Finalize blend lineup and use cases (hot, iced, cloud cap, etc.)", "Matcha"],
    ["Write SOP per drink", "Matcha"],
    ["Train staff on ratios and technique", "Matcha"],
    ["Select tea offerings", "Tea"],
    ["Write brew SOPs (temp, steep time, ratios)", "Tea"],
    ["Decide scope (drip, espresso, pour over)", "Coffee"],
    ["Dial in recipes", "Coffee"],
    ["Write SOPs", "Coffee"],
    ["Brainstorm and test items", "Specialty / Non-Caffeinated"],
    ["Finalize recipes and write SOPs", "Specialty / Non-Caffeinated"],
  ]],
  ["social", "📱", "Social Media Marketing", [
    "Audit current content performance",
    "Define content pillars (product, culture, education, events)",
    "Build a content calendar",
    "Batch shoot content",
    "Write captions and schedule posts",
    "Track engagement and adjust",
  ]],
  ["cleaning", "🧼", "Cleaning Procedures", [
    "List all areas and equipment to be cleaned",
    "Define frequency (daily, weekly, deep clean)",
    "Write step-by-step SOP per area",
    "Assign responsibilities per role",
    "Create a printable checklist",
  ]],
  ["tinycup", "🥤", "Tiny Cup Marketing & Recipes", [
    "Finalize tiny cup drink lineup",
    "Develop and test recipes",
    "Cost out and set pricing",
    "Shoot content specifically for tiny cup",
    "Build launch/promo plan",
  ]],
  ["merch", "🛍️", "Merch Lineup", [
    ["Keychains, stickers, small accessories — source suppliers, sample, finalize", "Small ($2–6)"],
    ["Whisks, matcha bowls — source, sample, brand/label design", "Medium ($10–20)"],
    ["Matcha tins, apparel — source blanks or manufacturer, design, sample run", "Big ($30–70)"],
    ["Finalize branding/packaging", "All tiers"],
    ["Set up in POS", "All tiers"],
    ["Plan launch", "All tiers"],
  ]],
  ["website", "🌐", "Website Development", [
    "Audit current pages for gaps",
    "Prioritize remaining pages/features",
    "Write copy for any missing sections",
    "Build and QA in Framer",
    "Publish and test on mobile",
  ]],
  ["pos", "💳", "POS Switch & Operations", [
    "Evaluate and select new POS system",
    "Map out all menu items for migration",
    "Set up modifiers, categories, pricing",
    "Train staff",
    "Run a parallel test period before full cutover",
    "Update any payment/reporting integrations",
  ]],
  ["barista", "☕", "Serving Purposes & Barista Roles", [
    "Define front-of-house flow (who does what)",
    "Write position-specific responsibilities",
    "Identify gaps in current coverage",
    "Create a shift role chart",
  ]],
  ["prep", "🔪", "Prep / Line Cook Job Description", [
    "List all prep and line tasks",
    "Group into role-specific responsibilities",
    "Draft job description per role",
    "Define hours, skills required, reporting structure",
    "Add to interview guide template",
  ]],
  ["ordering", "📦", "Streamlining Ingredient Ordering", [
    "List all current ingredients with vendors",
    "Identify overlap, substitutions, or consolidation opportunities",
    "Set par levels per ingredient",
    "Create a standing order template/schedule",
    "Assign ordering responsibility by role",
  ]],
  ["foodcost", "🧮", "Food Cost Calculations", [
    "Pull all current recipes",
    "Build a cost sheet per recipe (ingredient + yield)",
    "Calculate cost per serving",
    "Set target food cost percentage",
    "Compare against current pricing and adjust where needed",
    "Build an ongoing tracking sheet",
  ]],
];

function buildSeed() {
  return SEED_RAW.map(([id, emoji, name, tasks]) => ({
    id,
    emoji,
    name,
    tier: "U",
    tasks: tasks.map((t, i) => {
      const text = Array.isArray(t) ? t[0] : t;
      const group = Array.isArray(t) ? t[1] : null;
      return { id: `${id}-${i}`, text, group, done: false, star: false };
    }),
    smart: { S: [], M: [], A: [], R: [], T: [] },
  }));
}

/* ---------- recurring routines (auto-reset each period) ---------- */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
const CADENCES = [
  { k: "daily", label: "Daily", emoji: "☀️" },
  { k: "weekly", label: "Weekly", emoji: "📅" },
  { k: "monthly", label: "Monthly", emoji: "🗓️" },
  { k: "quarterly", label: "Quarterly", emoji: "🧭" },
  { k: "yearly", label: "Yearly", emoji: "🎯" },
];
const DAILY_SEED = [
  "Wipe down espresso machine & steam wands",
  "Restock matcha station",
  "Check milk & dairy par levels",
  "Reconcile register",
  "Post an Instagram story",
];
const SCHED_SEED = {
  weekly: ["Deep clean blenders & shakers", "Place ingredient order", "Review last week's sales", "Batch-shoot content", "Check fridge expirations"],
  monthly: ["Run food cost review", "Reconcile vendor invoices", "Full inventory count", "Plan next month's content calendar", "Equipment maintenance check"],
  quarterly: ["Review & update SOPs", "Menu performance review", "Pricing review vs costs", "Staff check-ins", "Plan seasonal / limited drinks"],
  yearly: ["Renew permits & licenses", "Annual deep clean", "Review vendor contracts", "Set annual goals & budget", "Brand & website refresh review"],
};
function buildSchedule() {
  const mk = (text) => ({ id: uid(), text, lastDone: null });
  const daily = {};
  DAYS.forEach((d) => (daily[d] = DAILY_SEED.map(mk)));
  return {
    daily,
    weekly: SCHED_SEED.weekly.map(mk),
    monthly: SCHED_SEED.monthly.map(mk),
    quarterly: SCHED_SEED.quarterly.map(mk),
    yearly: SCHED_SEED.yearly.map(mk),
  };
}

function startOfWeek(d) {
  const x = new Date(d);
  const off = (x.getDay() + 6) % 7; // Monday = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - off);
  return x;
}
function periodDone(cadence, ts) {
  if (!ts) return false;
  const a = new Date(ts), b = new Date();
  switch (cadence) {
    case "daily": return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    case "weekly": { const s = startOfWeek(b), e = new Date(s); e.setDate(e.getDate() + 7); return a >= s && a < e; }
    case "monthly": return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
    case "quarterly": return a.getFullYear() === b.getFullYear() && Math.floor(a.getMonth() / 3) === Math.floor(b.getMonth() / 3);
    case "yearly": return a.getFullYear() === b.getFullYear();
    default: return false;
  }
}
const todayKey = () => DAYS[(new Date().getDay() + 6) % 7];
const cadenceEmoji = (k) => (CADENCES.find((c) => c.k === k) || {}).emoji || "📅";

/* ---------- color + star progression (pink → orange → mint) ---------- */
const MINT = "#3EC296";
const ACCENTS = ["#F47A20", "#F2A0AC", "#F6BB42", "#57A9A6", "#3EC296", "#EA8FB3"];
const accentFor = (i) => ACCENTS[i % ACCENTS.length];
const hx = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const tint = (hex, a) => { const [r, g, b] = hx(hex); return `rgba(${r},${g},${b},${a})`; };
const lerp3 = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function progressColor(pct) {
  const p = Math.max(0, Math.min(100, pct)) / 100;
  const pink = [0xF0, 0x8C, 0xA6], orange = [0xF4, 0x7A, 0x20], mint = [0x3E, 0xC2, 0x96];
  const c = p <= 0.5 ? lerp3(pink, orange, p / 0.5) : lerp3(orange, mint, (p - 0.5) / 0.5);
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
const STAR_EMPTY = "#E7DECB";

const STORAGE_KEY = "komamaTracker_v1";
const EMOJI_CHOICES = ["🍊", "🍋", "🍓", "🥝", "🫐", "🍑", "🥑", "🍵", "☕", "🥤", "🧋", "🍰", "🧁", "📋", "✨"];
const uid = () => Math.random().toString(36).slice(2, 9);

export default function App() {
  const [areas, setAreas] = useState(buildSeed());
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("board"); // board | areas
  const [hideDone, setHideDone] = useState(false);
  const [openAreas, setOpenAreas] = useState({});
  const [smartOpen, setSmartOpen] = useState({});
  const [focus, setFocus] = useState(null);
  const [justDone, setJustDone] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dragOverTier, setDragOverTier] = useState(null);
  const [pickerFor, setPickerFor] = useState(null); // area id w/ open tier picker on board
  const [addingTask, setAddingTask] = useState(null);
  const [taskDraft, setTaskDraft] = useState("");
  const [activeSmart, setActiveSmart] = useState(null); // `${areaId}:${k}`
  const [smartDraft, setSmartDraft] = useState("");
  const [showAddArea, setShowAddArea] = useState(false);
  const [areaName, setAreaName] = useState("");
  const [areaEmoji, setAreaEmoji] = useState("🍊");
  const [schedule, setSchedule] = useState(buildSchedule());
  const [routineView, setRoutineView] = useState("daily");
  const [routineDay, setRoutineDay] = useState(todayKey());
  const [addingRoutine, setAddingRoutine] = useState(false);
  const [routineDraft, setRoutineDraft] = useState("");
  const [everyDay, setEveryDay] = useState(false);
  const [confettiOn, setConfettiOn] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [toast, setToast] = useState(null);
  const saveTimer = useRef(null);

  const celebrate = (msg) => {
    setConfettiKey((k) => k + 1);
    setConfettiOn(true);
    setTimeout(() => setConfettiOn(false), 1150);
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2300);
  };

  /* load */
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res && res.value) {
          const s = JSON.parse(res.value);
          if (Array.isArray(s.areas)) setAreas(s.areas);
          if (s.schedule && s.schedule.daily) setSchedule(s.schedule);
        }
      } catch (e) {
        /* fresh start */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  /* save (debounced) */
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify({ areas, schedule }));
      } catch (e) {
        /* session-only */
      }
    }, 450);
    return () => clearTimeout(saveTimer.current);
  }, [areas, schedule, loaded]);

  /* ---------- mutations ---------- */
  const patchArea = (areaId, fn) =>
    setAreas((as) => as.map((a) => (a.id === areaId ? fn(a) : a)));

  const setTier = (areaId, tier) => patchArea(areaId, (a) => ({ ...a, tier }));

  const toggleTask = (areaId, taskId) => {
    const a = areas.find((x) => x.id === areaId);
    if (!a) return;
    const task = a.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const willBeDone = !task.done;
    const wasComplete = a.tasks.length > 0 && a.tasks.every((t) => t.done);
    const nowComplete = a.tasks.length > 0 && a.tasks.every((t) => (t.id === taskId ? willBeDone : t.done));
    if (willBeDone) {
      setJustDone(taskId);
      setTimeout(() => setJustDone((x) => (x === taskId ? null : x)), 700);
    }
    if (!wasComplete && nowComplete) celebrate(`${a.emoji} ${a.name} — all done! 🎉`);
    patchArea(areaId, (a2) => ({
      ...a2,
      tasks: a2.tasks.map((t) => (t.id === taskId ? { ...t, done: willBeDone } : t)),
    }));
  };

  const starTask = (areaId, taskId) =>
    patchArea(areaId, (a) => ({
      ...a,
      tasks: a.tasks.map((t) => (t.id === taskId ? { ...t, star: !t.star } : t)),
    }));

  const addTask = (areaId) => {
    const text = taskDraft.trim();
    if (!text) return;
    patchArea(areaId, (a) => ({
      ...a,
      tasks: [...a.tasks, { id: uid(), text, group: null, done: false, star: false }],
    }));
    setTaskDraft("");
    setAddingTask(null);
  };

  const removeTask = (areaId, taskId) =>
    patchArea(areaId, (a) => ({ ...a, tasks: a.tasks.filter((t) => t.id !== taskId) }));

  const addArea = () => {
    const name = areaName.trim();
    if (!name) return;
    setAreas((as) => [
      ...as,
      { id: uid(), emoji: areaEmoji, name, tier: "U", tasks: [], smart: { S: [], M: [], A: [], R: [], T: [] } },
    ]);
    setAreaName("");
    setAreaEmoji("🍊");
    setShowAddArea(false);
  };

  const removeArea = (areaId) => setAreas((as) => as.filter((a) => a.id !== areaId));

  const addSmart = (areaId, k) => {
    const text = smartDraft.trim();
    if (!text) return;
    patchArea(areaId, (a) => ({
      ...a,
      smart: { ...a.smart, [k]: [...a.smart[k], { id: uid(), text, ts: Date.now() }] },
    }));
    setSmartDraft("");
    setActiveSmart(null);
  };

  const removeSmart = (areaId, k, entryId) =>
    patchArea(areaId, (a) => ({
      ...a,
      smart: { ...a.smart, [k]: a.smart[k].filter((e) => e.id !== entryId) },
    }));

  /* ---------- routine mutations ---------- */
  const routineItems = (cadence, day) =>
    cadence === "daily" ? schedule.daily[day] || [] : schedule[cadence] || [];

  const toggleRoutine = (cadence, day, itemId) => {
    const list = routineItems(cadence, day);
    const item = list.find((i) => i.id === itemId);
    if (item) {
      const willBeDone = !periodDone(cadence, item.lastDone);
      const wasComplete = list.length > 0 && list.every((i) => periodDone(cadence, i.lastDone));
      const nowComplete = list.length > 0 && list.every((i) => (i.id === itemId ? willBeDone : periodDone(cadence, i.lastDone)));
      if (willBeDone) {
        setJustDone(itemId);
        setTimeout(() => setJustDone((x) => (x === itemId ? null : x)), 700);
      }
      if (!wasComplete && nowComplete) {
        const lbl = cadence === "daily" ? DAY_FULL[day] : CADENCES.find((c) => c.k === cadence).label;
        celebrate(`${cadenceEmoji(cadence)} ${lbl} — cleared! ✨`);
      }
    }
    setSchedule((s) => {
      const upd = (arr) =>
        arr.map((it) => (it.id === itemId ? { ...it, lastDone: periodDone(cadence, it.lastDone) ? null : Date.now() } : it));
      if (cadence === "daily") return { ...s, daily: { ...s.daily, [day]: upd(s.daily[day]) } };
      return { ...s, [cadence]: upd(s[cadence]) };
    });
  };

  const addRoutine = (cadence, day) => {
    const text = routineDraft.trim();
    if (!text) return;
    const mk = () => ({ id: uid(), text, lastDone: null });
    setSchedule((s) => {
      if (cadence === "daily") {
        if (everyDay) {
          const nd = { ...s.daily };
          DAYS.forEach((d) => (nd[d] = [...nd[d], { id: uid(), text, lastDone: null }]));
          return { ...s, daily: nd };
        }
        return { ...s, daily: { ...s.daily, [day]: [...s.daily[day], mk()] } };
      }
      return { ...s, [cadence]: [...s[cadence], mk()] };
    });
    setRoutineDraft("");
    setAddingRoutine(false);
  };

  const removeRoutine = (cadence, day, itemId) => {
    setSchedule((s) => {
      if (cadence === "daily") return { ...s, daily: { ...s.daily, [day]: s.daily[day].filter((i) => i.id !== itemId) } };
      return { ...s, [cadence]: s[cadence].filter((i) => i.id !== itemId) };
    });
  };

  /* ---------- derived ---------- */
  const allTasks = areas.flatMap((a) => a.tasks.map((t) => ({ ...t, area: a })));
  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.done).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  const pickNext = () => {
    const pool = [];
    const add = (item, weight) => { for (let i = 0; i < weight; i++) pool.push(item); };
    const w = { S: 6, A: 5, B: 4, C: 3, D: 2, U: 1 };

    // project tasks (tier-weighted; flagged tasks doubled)
    allTasks.filter((t) => !t.done).forEach((t) => {
      const weight = (w[t.area.tier] || 1) * (t.star ? 2 : 1);
      add({ type: "task", areaId: t.area.id, id: t.id, text: t.text, emoji: t.area.emoji, label: t.area.name, tier: t.area.tier }, weight);
    });

    // today's daily routines (high priority — they're due today)
    const today = todayKey();
    routineItems("daily", today).filter((it) => !periodDone("daily", it.lastDone)).forEach((it) => {
      add({ type: "routine", cadence: "daily", day: today, id: it.id, text: it.text, emoji: "☀️", label: `Today · ${DAY_FULL[today]}` }, 6);
    });
    // periodic routines (lighter weight)
    [["weekly", 3], ["monthly", 2], ["quarterly", 1], ["yearly", 1]].forEach(([cad, weight]) => {
      routineItems(cad).filter((it) => !periodDone(cad, it.lastDone)).forEach((it) => {
        add({ type: "routine", cadence: cad, id: it.id, text: it.text, emoji: cadenceEmoji(cad), label: `${CADENCES.find((c) => c.k === cad).label} routine` }, weight);
      });
    });

    if (!pool.length) return setFocus("ALLDONE");
    setFocus(pool[Math.floor(Math.random() * pool.length)]);
  };

  /* ---------- render ---------- */
  const R = 26;
  const CIRC = 2 * Math.PI * R;

  return (
    <div style={st.shell}>
      <style>{CSS}</style>

      <header style={st.header}>
        <div style={st.brand}>
          <CitrusMark />
          <div>
            <div style={st.eyebrow}>freshly squeezed to-dos</div>
            <h1 style={st.h1}>Task Tracker</h1>
          </div>
        </div>
        <div style={st.overallWrap} title={`${completed} of ${total} done`}>
          <StarRating pct={pct} size={22} gap={3} />
          <div style={{ ...st.overallPct, color: progressColor(pct) }}>{pct}%</div>
        </div>
      </header>

      <button className="k-now" style={st.nowBtn} onClick={pickNext}>
        <span style={{ fontSize: 17 }}>✦</span> What should I do right now?
      </button>

      <div style={st.controls}>
        <div style={st.tabs}>
          <button className="k-tab" style={{ ...st.tab, ...(view === "board" ? st.tabOn : {}) }} onClick={() => setView("board")}>
            Priorities
          </button>
          <button className="k-tab" style={{ ...st.tab, ...(view === "areas" ? st.tabOn : {}) }} onClick={() => setView("areas")}>
            Areas
          </button>
          <button className="k-tab" style={{ ...st.tab, ...(view === "routines" ? st.tabOn : {}) }} onClick={() => setView("routines")}>
            Routines
          </button>
        </div>
        {(view === "areas" || view === "routines") && (
          <label style={st.hideToggle}>
            <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} /> Hide done
          </label>
        )}
      </div>

      {/* ---------------- PRIORITY BOARD ---------------- */}
      {view === "board" && (
        <div style={{ marginTop: 10 }}>
          <p style={st.boardHint}>Drag a card into a tier — or tap it to pick S, A, B, C, or D.</p>
          {[...TIERS, "U"].map((tier) => {
            const inTier = areas.filter((a) => a.tier === tier);
            const ts = TIER_STYLE[tier];
            return (
              <div
                key={tier}
                className={dragOverTier === tier ? "k-row k-rowover" : "k-row"}
                style={st.tierRow}
                onDragOver={(e) => { e.preventDefault(); setDragOverTier(tier); }}
                onDragLeave={() => setDragOverTier((t) => (t === tier ? null : t))}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain") || dragId;
                  if (id) setTier(id, tier);
                  setDragId(null); setDragOverTier(null);
                }}
              >
                <div style={{ ...st.tierLabel, background: ts.bg, color: ts.fg }}>
                  <span style={st.tierLetter}>{tier === "U" ? "—" : tier}</span>
                  <span style={st.tierSub}>{ts.label}</span>
                </div>
                <div style={st.tierCards}>
                  {inTier.length === 0 && <span style={st.tierEmpty}>—</span>}
                  {inTier.map((a) => {
                    const d = a.tasks.filter((t) => t.done).length;
                    const p = a.tasks.length ? Math.round((d / a.tasks.length) * 100) : 0;
                    const picking = pickerFor === a.id;
                    return (
                      <div key={a.id} style={{ display: "inline-block" }}>
                        <div
                          className="k-chip"
                          draggable
                          onDragStart={(e) => { setDragId(a.id); e.dataTransfer.setData("text/plain", a.id); }}
                          onDragEnd={() => setDragId(null)}
                          onClick={() => setPickerFor(picking ? null : a.id)}
                          style={{ ...st.chip, opacity: dragId === a.id ? 0.4 : 1 }}
                        >
                          <span style={{ fontSize: 16 }}>{a.emoji}</span>
                          <span style={st.chipName}>{a.name}</span>
                          <StarRating pct={p} size={10} gap={1} />
                          <span style={st.chipBarTrack}>
                            <span style={{ ...st.chipBarFill, width: `${p}%`, background: progressColor(p) }} />
                          </span>
                        </div>
                        {picking && (
                          <div style={st.picker}>
                            {[...TIERS, "U"].map((tk) => (
                              <button
                                key={tk}
                                onClick={(e) => { e.stopPropagation(); setTier(a.id, tk); setPickerFor(null); }}
                                style={{
                                  ...st.pickBtn,
                                  background: a.tier === tk ? TIER_STYLE[tk].bg : C.white,
                                  color: a.tier === tk ? TIER_STYLE[tk].fg : C.inkSoft,
                                  borderColor: TIER_STYLE[tk].bg,
                                }}
                              >
                                {tk === "U" ? "—" : tk}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- AREAS & TASKS ---------------- */}
      {view === "areas" && (
        <div style={{ marginTop: 10 }}>
          {areas.map((a, ai) => {
            const accent = accentFor(ai);
            const list = hideDone ? a.tasks.filter((t) => !t.done) : a.tasks;
            const d = a.tasks.filter((t) => t.done).length;
            const p = a.tasks.length ? Math.round((d / a.tasks.length) * 100) : 0;
            const complete = a.tasks.length > 0 && d === a.tasks.length;
            const isOpen = !!openAreas[a.id];
            const next = a.tasks.find((t) => !t.done);
            const ts = TIER_STYLE[a.tier];

            const groups = [];
            list.forEach((t) => {
              const g = t.group || "_";
              let b = groups.find((x) => x.g === g);
              if (!b) { b = { g, items: [] }; groups.push(b); }
              b.items.push(t);
            });

            return (
              <div key={a.id} className={`k-card${complete ? " k-card-done" : ""}`} style={{ ...st.card, marginBottom: 12 }}>
                <button className="k-cat" style={{ ...st.catHead, background: `linear-gradient(135deg, ${tint(accent, 0.26)}, ${tint(accent, 0.06)} 72%, #fff)` }}
                  onClick={() => setOpenAreas((o) => ({ ...o, [a.id]: !o[a.id] }))}>
                  <span style={{ ...st.catEmoji, background: tint(accent, 0.32) }}>{a.emoji}</span>
                  <span style={st.catText}>
                    <span style={st.catNameRow}>
                      <span style={st.catName}>{a.name}</span>
                      <span style={{ ...st.tierTag, background: ts.bg, color: ts.fg }}>{a.tier === "U" ? "—" : a.tier}</span>
                    </span>
                    {!isOpen && next && <span style={st.peek}>Next: {next.text}</span>}
                    {!isOpen && complete && <span style={st.peekDone}>✓ All done!</span>}
                  </span>
                  <span style={st.catRight}>
                    <span style={st.starCol}>
                      <StarRating pct={p} size={15} />
                      <span style={{ ...st.miniCount, color: complete ? MINT : C.inkSoft }}>{d}/{a.tasks.length}</span>
                    </span>
                    <span style={{ ...st.chevron, transform: isOpen ? "rotate(90deg)" : "none" }}>›</span>
                  </span>
                  <span style={{ ...st.accentRule, background: complete ? MINT : accent }} />
                </button>

                {isOpen && (
                  <div style={st.catBody}>
                    {groups.map((grp) => (
                      <div key={grp.g}>
                        {grp.g !== "_" && <div style={st.groupLabel}>{grp.g}</div>}
                        {grp.items.map((t) => (
                          <TaskRow
                            key={t.id} t={t} justDone={justDone === t.id}
                            onToggle={() => toggleTask(a.id, t.id)}
                            onStar={() => starTask(a.id, t.id)}
                            onRemove={() => removeTask(a.id, t.id)}
                          />
                        ))}
                      </div>
                    ))}

                    {addingTask === a.id ? (
                      <div style={st.addRow}>
                        <input
                          autoFocus value={taskDraft} placeholder="Add a task…"
                          onChange={(e) => setTaskDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addTask(a.id);
                            if (e.key === "Escape") { setAddingTask(null); setTaskDraft(""); }
                          }}
                          style={st.input}
                        />
                        <button style={st.miniBtn} onClick={() => addTask(a.id)}>Add</button>
                      </div>
                    ) : (
                      <button className="k-link" style={st.link} onClick={() => { setAddingTask(a.id); setTaskDraft(""); }}>
                        + Add a task
                      </button>
                    )}

                    {/* SMART goal log */}
                    <div style={st.smartWrap}>
                      <button
                        className="k-smarttoggle"
                        style={st.smartToggle}
                        onClick={() => setSmartOpen((s) => ({ ...s, [a.id]: !s[a.id] }))}
                      >
                        <span style={st.smartBadge}>SMART</span> Goal log
                        <span style={{ ...st.chevronSm, transform: smartOpen[a.id] ? "rotate(90deg)" : "none" }}>›</span>
                      </button>

                      {smartOpen[a.id] && (
                        <div style={st.smartBody}>
                          {SMART.map((s) => {
                            const entries = a.smart[s.k] || [];
                            const key = `${a.id}:${s.k}`;
                            return (
                              <div key={s.k} style={st.smartPortion}>
                                <div style={st.smartHead}>
                                  <span style={st.smartLetter}>{s.k}</span>
                                  <span style={st.smartWord}>{s.word}</span>
                                  <span style={st.smartHint}>{s.hint}</span>
                                </div>
                                {entries.map((e) => (
                                  <div key={e.id} className="k-logrow" style={st.logRow}>
                                    <span style={st.logDot}>•</span>
                                    <span style={st.logText}>{e.text}</span>
                                    <span style={st.logDate}>{fmt(e.ts)}</span>
                                    <button className="k-rm" style={st.logRm} onClick={() => removeSmart(a.id, s.k, e.id)}>×</button>
                                  </div>
                                ))}
                                {activeSmart === key ? (
                                  <div style={st.addRow}>
                                    <input
                                      autoFocus value={smartDraft} placeholder={`Log a ${s.word.toLowerCase()} note…`}
                                      onChange={(ev) => setSmartDraft(ev.target.value)}
                                      onKeyDown={(ev) => {
                                        if (ev.key === "Enter") addSmart(a.id, s.k);
                                        if (ev.key === "Escape") { setActiveSmart(null); setSmartDraft(""); }
                                      }}
                                      style={st.input}
                                    />
                                    <button style={st.miniBtn} onClick={() => addSmart(a.id, s.k)}>Log</button>
                                  </div>
                                ) : (
                                  <button className="k-link" style={st.linkSm} onClick={() => { setActiveSmart(key); setSmartDraft(""); }}>
                                    + Add to log
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button className="k-removearea" style={st.removeArea} onClick={() => {
                      if (window.confirm(`Remove "${a.name}" and all its tasks?`)) removeArea(a.id);
                    }}>
                      Remove this area
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* add area */}
          {showAddArea ? (
            <div style={{ ...st.card, padding: 16 }}>
              <div style={st.emojiRow}>
                {EMOJI_CHOICES.map((e) => (
                  <button key={e} onClick={() => setAreaEmoji(e)}
                    style={{ ...st.emojiBtn, background: areaEmoji === e ? C.pink : "transparent", borderColor: areaEmoji === e ? C.pinkDeep : C.border }}>
                    {e}
                  </button>
                ))}
              </div>
              <div style={st.addRow}>
                <input
                  autoFocus value={areaName} placeholder="New area name…"
                  onChange={(e) => setAreaName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addArea(); if (e.key === "Escape") setShowAddArea(false); }}
                  style={st.input}
                />
                <button style={st.miniBtn} onClick={addArea}>Add</button>
              </div>
              <button className="k-link" style={st.link} onClick={() => setShowAddArea(false)}>Cancel</button>
            </div>
          ) : (
            <button className="k-addarea" style={st.addArea} onClick={() => setShowAddArea(true)}>
              + Add a new area
            </button>
          )}
        </div>
      )}

      {/* ---------------- ROUTINES ---------------- */}
      {view === "routines" && (() => {
        const items = routineItems(routineView, routineDay);
        const doneCount = items.filter((it) => periodDone(routineView, it.lastDone)).length;
        const visible = hideDone ? items.filter((it) => !periodDone(routineView, it.lastDone)) : items;
        const now = new Date();
        const q = Math.floor(now.getMonth() / 3) + 1;
        const headings = {
          daily: { title: `${DAY_FULL[routineDay]}${routineDay === todayKey() ? " · Today" : ""}`, reset: "Resets each day" },
          weekly: { title: "This week", reset: "Resets every Monday" },
          monthly: { title: now.toLocaleDateString(undefined, { month: "long", year: "numeric" }), reset: "Resets monthly" },
          quarterly: { title: `This quarter · Q${q}`, reset: "Resets quarterly" },
          yearly: { title: `${now.getFullYear()}`, reset: "Resets yearly" },
        };
        const h = headings[routineView];
        return (
          <div style={{ marginTop: 10 }}>
            <div style={st.routineTabs}>
              {CADENCES.map((c) => (
                <button key={c.k} className="k-rtab"
                  style={{ ...st.rtab, ...(routineView === c.k ? st.rtabOn : {}) }}
                  onClick={() => { setRoutineView(c.k); setAddingRoutine(false); }}>
                  <span style={{ fontSize: 14 }}>{c.emoji}</span> {c.label}
                </button>
              ))}
            </div>

            {routineView === "daily" && (
              <div style={st.dayRow}>
                {DAYS.map((d) => {
                  const isToday = d === todayKey();
                  const on = routineDay === d;
                  return (
                    <button key={d} className="k-day"
                      style={{ ...st.dayPill, ...(on ? st.dayPillOn : {}), ...(isToday && !on ? st.dayToday : {}) }}
                      onClick={() => setRoutineDay(d)}>
                      {d}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={st.rHead}>
              <div>
                <div style={st.rTitle}>{h.title}</div>
                <div style={st.rReset}>{cadenceEmoji(routineView)} {h.reset}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                <StarRating pct={items.length ? Math.round((doneCount / items.length) * 100) : 0} size={16} />
                <span style={st.rProgress}>{doneCount}/{items.length}</span>
              </div>
            </div>

            <div style={st.card}>
              <div style={{ padding: 6 }}>
                {visible.length === 0 ? (
                  <div style={st.rEmpty}>
                    {items.length === 0 ? "Nothing here yet — add your first item below." : "All done for now ✓"}
                  </div>
                ) : (
                  visible.map((it) => {
                    const isDone = periodDone(routineView, it.lastDone);
                    return (
                      <div key={it.id} className={`k-trow${justDone === it.id ? " k-flash" : ""}`} style={st.row}>
                        <button className="k-check" aria-label={isDone ? "Mark not done" : "Mark done"}
                          onClick={() => toggleRoutine(routineView, routineDay, it.id)}
                          style={{ ...st.check, background: isDone ? C.algae : "transparent", borderColor: isDone ? C.algae : C.border }}>
                          {isDone && <span className="k-pop" style={st.checkMark}>✓</span>}
                        </button>
                        <span style={{ ...st.rowText, ...(isDone ? st.rowTextDone : {}) }}>{it.text}</span>
                        <button className="k-rm" aria-label="Remove" onClick={() => removeRoutine(routineView, routineDay, it.id)} style={st.rm}>×</button>
                      </div>
                    );
                  })
                )}

                {addingRoutine ? (
                  <div>
                    <div style={st.addRow}>
                      <input autoFocus value={routineDraft}
                        placeholder={routineView === "daily" ? `Add to ${DAY_FULL[routineDay]}…` : `Add a ${routineView} item…`}
                        onChange={(e) => setRoutineDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addRoutine(routineView, routineDay); if (e.key === "Escape") { setAddingRoutine(false); setRoutineDraft(""); } }}
                        style={st.input} />
                      <button style={st.miniBtn} onClick={() => addRoutine(routineView, routineDay)}>Add</button>
                    </div>
                    {routineView === "daily" && (
                      <label style={st.everyDayLabel}>
                        <input type="checkbox" checked={everyDay} onChange={(e) => setEveryDay(e.target.checked)} />
                        Add to every day of the week
                      </label>
                    )}
                  </div>
                ) : (
                  <button className="k-link" style={st.link} onClick={() => { setAddingRoutine(true); setRoutineDraft(""); }}>
                    + Add an item
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <p style={st.foot}>Saved automatically. Pick up wherever you left off.</p>

      {/* focus overlay */}
      {focus && (
        <div style={st.overlay} onClick={() => setFocus(null)}>
          <div style={st.focusCard} onClick={(e) => e.stopPropagation()}>
            {focus === "ALLDONE" ? (
              <>
                <div style={{ fontSize: 40 }}>🍊</div>
                <h2 style={st.focusH}>Everything's squeezed.</h2>
                <p style={st.focusP}>Nothing left on the board. Go enjoy a juice.</p>
                <button style={st.focusClose} onClick={() => setFocus(null)}>Close</button>
              </>
            ) : (
              <>
                <div style={st.focusEyebrow}>
                  {focus.emoji} {focus.label}
                  {focus.type === "task" && focus.tier !== "U" && (
                    <span style={{ ...st.focusTier, background: TIER_STYLE[focus.tier].bg, color: TIER_STYLE[focus.tier].fg }}>
                      {focus.tier}
                    </span>
                  )}
                </div>
                <h2 style={st.focusH}>{focus.text}</h2>
                <p style={st.focusP}>Just this one. Don't think about the rest yet.</p>
                <div style={st.focusBtns}>
                  <button style={st.focusDone} onClick={() => {
                    if (focus.type === "task") toggleTask(focus.areaId, focus.id);
                    else toggleRoutine(focus.cadence, focus.day, focus.id);
                    setFocus(null);
                  }}>✓ Done</button>
                  <button style={st.focusAnother} onClick={pickNext}>Show me another</button>
                </div>
                <button style={st.focusClose} onClick={() => setFocus(null)}>Not now</button>
              </>
            )}
          </div>
        </div>
      )}

      {confettiOn && <Confetti key={confettiKey} />}
      {toast && (
        <div className="k-toast" style={st.toast}>{toast}</div>
      )}
    </div>
  );
}

function TaskRow({ t, justDone, onToggle, onStar, onRemove }) {
  return (
    <div className={`k-trow${justDone ? " k-flash" : ""}`} style={st.row}>
      <button className="k-check" aria-label={t.done ? "Mark not done" : "Mark done"} onClick={onToggle}
        style={{ ...st.check, background: t.done ? C.algae : "transparent", borderColor: t.done ? C.algae : C.border }}>
        {t.done && <span className="k-pop" style={st.checkMark}>✓</span>}
      </button>
      <span style={{ ...st.rowText, ...(t.done ? st.rowTextDone : {}) }}>{t.text}</span>
      <button className="k-star" aria-label="Flag" onClick={onStar} style={{ ...st.star, color: t.star ? C.tang : C.inkFaint }}>
        {t.star ? "★" : "☆"}
      </button>
      <button className="k-rm" aria-label="Remove task" onClick={onRemove} style={st.rm}>×</button>
    </div>
  );
}

function CitrusMark() {
  return (
    <svg width="38" height="38" viewBox="0 0 48 48" aria-hidden="true">
      <ellipse cx="31" cy="9" rx="7" ry="3" fill={C.spinach} transform="rotate(-26 31 9)" />
      <rect x="22.4" y="5" width="3" height="8" rx="1.5" fill={C.tang} />
      <circle cx="23" cy="29" r="15" fill={C.pink} />
      <circle cx="19" cy="27" r="1.5" fill={C.tang} />
      <circle cx="26.5" cy="31" r="1.5" fill={C.tang} />
      <circle cx="22" cy="34" r="1.3" fill={C.tang} />
    </svg>
  );
}

function StarRating({ pct, size = 16, gap = 2 }) {
  const filled = Math.round((Math.max(0, Math.min(100, pct)) / 100) * 5);
  const color = progressColor(pct);
  const complete = pct >= 100;
  return (
    <div className={"k-stars" + (complete ? " k-stars-done" : "")} style={{ display: "inline-flex", gap, alignItems: "center" }} aria-label={`${filled} of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const on = i < filled;
        return (
          <span key={`${i}-${on}`} className={on ? "k-star k-star-on" : "k-star"}
            style={{ fontSize: size, lineHeight: 1, color: on ? color : STAR_EMPTY, animationDelay: `${i * 45}ms` }}>★</span>
        );
      })}
    </div>
  );
}

function Confetti() {
  const cols = ["#F47A20", "#F2A0AC", "#F6BB42", "#57A9A6", "#3EC296", "#EA8FB3"];
  const bits = Array.from({ length: 30 }).map((_, i) => {
    const ang = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 200;
    return {
      id: i, tx: Math.cos(ang) * dist, ty: Math.sin(ang) * dist - 70,
      rot: Math.random() * 720 - 360, col: cols[i % cols.length],
      delay: Math.random() * 0.08, sq: Math.random() > 0.5,
    };
  });
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2000, overflow: "hidden" }}>
      {bits.map((b) => (
        <span key={b.id} style={{
          position: "absolute", left: "50%", top: "42%",
          width: b.sq ? 9 : 7, height: b.sq ? 9 : 12, background: b.col, borderRadius: b.sq ? 2 : 6,
          ["--tx"]: `${b.tx}px`, ["--ty"]: `${b.ty}px`, ["--rot"]: `${b.rot}deg`,
          animation: `k-confetti 1s cubic-bezier(.2,.6,.3,1) ${b.delay}s forwards`,
        }} />
      ))}
    </div>
  );
}

function fmt(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch { return ""; }
}

/* ---------- styles ---------- */
const st = {
  shell: { fontFamily: "'Nunito', system-ui, sans-serif", background: "#FFFFFF", color: C.ink, maxWidth: 660, margin: "0 auto", padding: "26px 18px 60px", minHeight: "100%", WebkitFontSmoothing: "antialiased" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  eyebrow: { fontFamily: "'Fredoka', sans-serif", fontSize: 12.5, color: C.tang, fontWeight: 500, letterSpacing: ".01em" },
  h1: { fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600, margin: "1px 0 0", color: C.spinach, letterSpacing: "-.01em" },
  overallWrap: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 },
  overallPct: { fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 600, transition: "color .4s" },

  nowBtn: { width: "100%", background: C.spinach, color: C.cream, border: "none", borderRadius: 16, padding: "16px", fontSize: 16.5, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9 },

  controls: { display: "flex", justifyContent: "space-between", alignItems: "center", margin: "18px 0 2px", gap: 12, flexWrap: "wrap" },
  tabs: { display: "flex", gap: 4, background: "#F0E7D3", padding: 4, borderRadius: 12, flex: "1 1 auto" },
  tab: { flex: 1, border: "none", background: "transparent", padding: "8px 10px", borderRadius: 9, fontSize: 13.5, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", cursor: "pointer", color: C.inkSoft, whiteSpace: "nowrap" },
  tabOn: { background: C.white, color: C.spinach, boxShadow: "0 1px 4px rgba(21,83,78,.1)" },
  hideToggle: { display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: C.inkSoft, cursor: "pointer", fontWeight: 600 },

  boardHint: { fontSize: 13, color: C.inkSoft, margin: "4px 2px 12px", fontWeight: 600 },
  tierRow: { display: "flex", gap: 10, marginBottom: 10, background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 8, minHeight: 64, alignItems: "stretch", transition: "background .15s, box-shadow .15s" },
  tierLabel: { flexShrink: 0, width: 58, borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6px 2px", textAlign: "center" },
  tierLetter: { fontFamily: "'Fredoka', sans-serif", fontSize: 24, fontWeight: 600, lineHeight: 1 },
  tierSub: { fontSize: 8.5, fontWeight: 700, marginTop: 3, opacity: .9, lineHeight: 1.1, letterSpacing: ".02em" },
  tierCards: { display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start", flex: 1, alignItems: "flex-start", paddingTop: 2 },
  tierEmpty: { color: C.inkFaint, fontSize: 22, alignSelf: "center", paddingLeft: 6 },

  chip: { display: "flex", alignItems: "center", gap: 7, background: C.cream, border: `1px solid ${C.border}`, borderRadius: 11, padding: "8px 11px", cursor: "grab", position: "relative", maxWidth: 230, userSelect: "none" },
  chipName: { fontSize: 13, fontWeight: 700, color: C.spinach, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130, fontFamily: "'Fredoka', sans-serif" },
  chipCount: { fontSize: 11, color: C.inkSoft, fontWeight: 700, fontVariantNumeric: "tabular-nums" },
  chipBarTrack: { position: "absolute", left: 11, right: 11, bottom: 3, height: 2.5, background: "rgba(21,83,78,.1)", borderRadius: 2 },
  chipBarFill: { position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 2, transition: "width .4s" },
  picker: { display: "flex", gap: 4, marginTop: 5, justifyContent: "flex-start" },
  pickBtn: { width: 30, height: 30, borderRadius: 8, border: "1.5px solid", fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" },

  card: { background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(21,83,78,.05)" },
  catHead: { position: "relative", width: "100%", display: "flex", alignItems: "center", gap: 12, border: "none", padding: "15px 16px 18px", cursor: "pointer", textAlign: "left", fontFamily: "inherit", borderRadius: 16 },
  catEmoji: { fontSize: 19, flexShrink: 0, width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center" },
  catText: { display: "flex", flexDirection: "column", flex: 1, minWidth: 0, gap: 2 },
  catNameRow: { display: "flex", alignItems: "center", gap: 8 },
  catName: { fontFamily: "'Fredoka', sans-serif", fontSize: 15.5, fontWeight: 600, color: C.spinach },
  tierTag: { fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 6, lineHeight: 1.5 },
  peek: { fontSize: 12.5, color: tint(C.spinach, 0.5), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 },
  peekDone: { fontSize: 12.5, color: MINT, fontWeight: 700 },
  catRight: { display: "flex", flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 },
  starCol: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 },
  miniCount: { fontSize: 12.5, fontWeight: 700, fontVariantNumeric: "tabular-nums", fontFamily: "'Fredoka', sans-serif" },
  chevron: { fontSize: 20, color: C.inkFaint, transition: "transform .2s", lineHeight: 1, flexShrink: 0 },
  accentRule: { position: "absolute", left: 0, bottom: 0, height: 4, width: "100%", transition: "background .4s" },

  catBody: { padding: "2px 10px 12px" },
  groupLabel: { fontFamily: "'Fredoka', sans-serif", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: C.tang, fontWeight: 600, padding: "12px 8px 4px" },

  row: { display: "flex", alignItems: "flex-start", gap: 11, padding: "9px 8px", borderRadius: 10 },
  check: { flexShrink: 0, width: 22, height: 22, borderRadius: 8, border: "2px solid", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, padding: 0, transition: "background .15s, border-color .15s" },
  checkMark: { color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1 },
  rowText: { flex: 1, minWidth: 0, fontSize: 14.5, lineHeight: 1.45, color: C.ink, fontWeight: 500, transition: "color .2s" },
  rowTextDone: { color: C.inkFaint, textDecoration: "line-through" },
  star: { background: "none", border: "none", fontSize: 17, cursor: "pointer", lineHeight: 1, padding: "1px 2px", flexShrink: 0 },
  rm: { background: "none", border: "none", fontSize: 18, color: C.inkFaint, cursor: "pointer", lineHeight: 1, padding: "0 2px", flexShrink: 0 },

  link: { background: "none", border: "none", color: C.tang, fontSize: 13.5, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", cursor: "pointer", padding: "8px" },

  /* routines */
  routineTabs: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  rtab: { display: "flex", alignItems: "center", gap: 5, border: `1px solid ${C.border}`, background: C.white, padding: "7px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", cursor: "pointer", color: C.inkSoft },
  rtabOn: { background: C.spinach, color: C.cream, borderColor: C.spinach },
  dayRow: { display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" },
  dayPill: { flex: "1 1 0", minWidth: 38, border: `1px solid ${C.border}`, background: C.white, padding: "8px 4px", borderRadius: 10, fontSize: 12.5, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", cursor: "pointer", color: C.inkSoft },
  dayPillOn: { background: C.tang, color: "#fff", borderColor: C.tang },
  dayToday: { borderColor: C.tang, color: C.tang },
  rHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", margin: "2px 4px 10px" },
  rTitle: { fontFamily: "'Fredoka', sans-serif", fontSize: 19, fontWeight: 600, color: C.spinach },
  rReset: { fontSize: 12, color: C.inkFaint, fontWeight: 700, marginTop: 1 },
  rProgress: { fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 600, color: C.algae, fontVariantNumeric: "tabular-nums" },
  rEmpty: { textAlign: "center", padding: "22px 16px", color: C.inkFaint, fontSize: 14, fontWeight: 600 },
  everyDayLabel: { display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: C.inkSoft, fontWeight: 600, padding: "2px 10px 8px" },

  linkSm: { background: "none", border: "none", color: C.tang, fontSize: 12.5, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", cursor: "pointer", padding: "5px 6px" },
  addRow: { display: "flex", gap: 8, padding: "8px", marginTop: 2 },
  input: { flex: 1, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 11px", fontSize: 14, fontFamily: "inherit", background: C.cream, color: C.ink, outline: "none", fontWeight: 600 },
  miniBtn: { background: C.tang, color: "#fff", border: "none", borderRadius: 9, padding: "0 16px", fontSize: 13.5, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", cursor: "pointer" },

  smartWrap: { marginTop: 8, borderTop: `1px dashed ${C.border}`, paddingTop: 6 },
  smartToggle: { display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", padding: "8px", cursor: "pointer", fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600, color: C.spinach },
  smartBadge: { background: C.lemon, color: C.spinach, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", padding: "2px 7px", borderRadius: 6 },
  chevronSm: { fontSize: 18, color: C.inkFaint, transition: "transform .2s", marginLeft: "auto" },
  smartBody: { padding: "4px 4px 2px" },
  smartPortion: { background: C.cream, border: `1px solid ${C.border}`, borderRadius: 11, padding: "10px 12px", marginBottom: 8 },
  smartHead: { display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  smartLetter: { fontFamily: "'Fredoka', sans-serif", fontWeight: 600, color: C.tang, fontSize: 16, width: 16 },
  smartWord: { fontFamily: "'Fredoka', sans-serif", fontWeight: 600, color: C.spinach, fontSize: 13.5 },
  smartHint: { fontSize: 11.5, color: C.inkFaint, fontWeight: 600 },
  logRow: { display: "flex", alignItems: "flex-start", gap: 7, padding: "5px 2px" },
  logDot: { color: C.tang, fontWeight: 700, lineHeight: 1.5 },
  logText: { flex: 1, fontSize: 13.5, lineHeight: 1.4, color: C.ink, fontWeight: 600 },
  logDate: { fontSize: 11, color: C.inkFaint, fontWeight: 700, whiteSpace: "nowrap", marginTop: 2 },
  logRm: { background: "none", border: "none", color: C.inkFaint, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 2px" },

  removeArea: { background: "none", border: "none", color: C.pinkDeep, fontSize: 12.5, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", cursor: "pointer", padding: "10px 8px 4px", display: "block" },
  addArea: { width: "100%", background: "transparent", border: `2px dashed ${C.border}`, borderRadius: 16, padding: "16px", fontSize: 15, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", color: C.tang, cursor: "pointer" },
  emojiRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  emojiBtn: { width: 36, height: 36, borderRadius: 9, border: "1.5px solid", background: "transparent", fontSize: 18, cursor: "pointer" },

  foot: { textAlign: "center", fontSize: 12, color: C.inkFaint, marginTop: 22, fontWeight: 600 },

  toast: { position: "fixed", left: "50%", bottom: 26, transform: "translateX(-50%)", background: C.spinach, color: C.cream, padding: "13px 22px", borderRadius: 14, fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 15, zIndex: 2100, boxShadow: "0 12px 30px rgba(21,83,78,.35)", maxWidth: "90%", textAlign: "center" },

  overlay: { position: "fixed", inset: 0, background: "rgba(21,83,78,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 1000, backdropFilter: "blur(2px)" },
  focusCard: { background: C.cream, borderRadius: 22, padding: "32px 28px", maxWidth: 380, width: "100%", textAlign: "center", boxShadow: "0 24px 60px rgba(21,83,78,.3)" },
  focusEyebrow: { fontFamily: "'Fredoka', sans-serif", fontSize: 13, color: C.tang, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" },
  focusTier: { fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 6 },
  focusH: { fontFamily: "'Fredoka', sans-serif", fontSize: 22, fontWeight: 600, margin: "0 0 8px", lineHeight: 1.3, color: C.spinach },
  focusP: { fontSize: 14, color: C.inkSoft, margin: "0 0 24px", lineHeight: 1.5, fontWeight: 600 },
  focusBtns: { display: "flex", gap: 10, marginBottom: 14 },
  focusDone: { flex: 1, background: MINT, color: "#fff", border: "none", borderRadius: 13, padding: "14px", fontSize: 15, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", cursor: "pointer" },
  focusAnother: { flex: 1, background: C.white, color: C.spinach, border: `1px solid ${C.border}`, borderRadius: 13, padding: "14px", fontSize: 15, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", cursor: "pointer" },
  focusClose: { background: "none", border: "none", color: C.inkSoft, fontSize: 13.5, fontFamily: "'Fredoka', sans-serif", fontWeight: 600, cursor: "pointer", padding: 4 },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@500;600;700;800&display=swap');
* { box-sizing: border-box; }
.k-now { transition: transform .12s, box-shadow .12s; box-shadow: 0 6px 16px rgba(21,83,78,.18); }
.k-now:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(21,83,78,.24); }
.k-now:active { transform: scale(.98); }
.k-card { transition: transform .18s cubic-bezier(.34,1.4,.64,1), box-shadow .18s; }
.k-card:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(21,83,78,.1); }
.k-card-done { box-shadow: 0 0 0 2px ${MINT}, 0 8px 22px ${tint(MINT, 0.25)}; }
.k-cat { transition: filter .15s; }
.k-cat:hover { filter: brightness(1.03) saturate(1.05); }
.k-trow { transition: background .15s; } .k-trow:hover { background: ${tint(C.tang, 0.06)}; }
.k-check { transition: transform .12s; }
.k-check:hover { border-color: ${C.tang} !important; transform: scale(1.08); }
.k-check:active { transform: scale(.9); }
.k-pop { animation: k-pop .3s cubic-bezier(.34,1.56,.64,1) both; }
.k-star:hover { transform: scale(1.15); }
.k-rm:hover { color: ${C.pinkDeep} !important; }
.k-link:hover, .k-smarttoggle:hover, .k-removearea:hover, .k-addarea:hover { text-decoration: underline; }
.k-chip { transition: transform .15s, box-shadow .15s; }
.k-chip:hover { box-shadow: 0 4px 12px rgba(21,83,78,.14); transform: translateY(-1px); }
.k-chip:active { cursor: grabbing; transform: scale(.97); }
.k-rowover { box-shadow: inset 0 0 0 2px ${C.tang}; background: ${tint(C.tang, 0.05)} !important; }
.k-rtab, .k-day, .k-tab { transition: transform .12s, background .15s, color .15s; }
.k-rtab:active, .k-day:active, .k-tab:active { transform: scale(.95); }
.k-star { display: inline-block; transition: color .35s ease; }
.k-star-on { animation: k-starpop .42s cubic-bezier(.34,1.56,.64,1) both; }
.k-stars-done { animation: k-wiggle .6s ease; }
.k-toast { animation: k-toastin .3s cubic-bezier(.34,1.56,.64,1) both; }
.k-tab:focus-visible, .k-now:focus-visible, .k-check:focus-visible, .k-cat:focus-visible, .k-chip:focus-visible, .k-rtab:focus-visible, .k-day:focus-visible {
  outline: 2px solid ${C.tang}; outline-offset: 2px;
}
@keyframes k-starpop { 0% { transform: scale(.2); opacity: .2; } 60% { transform: scale(1.3); } 100% { transform: scale(1); opacity: 1; } }
@keyframes k-wiggle { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } }
@keyframes k-pop { 0% { transform: scale(0); } 70% { transform: scale(1.35); } 100% { transform: scale(1); } }
@keyframes k-confetti { 0% { transform: translate(0,0) rotate(0); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)); opacity: 0; } }
@keyframes k-toastin { 0% { transform: translateX(-50%) translateY(20px) scale(.9); opacity: 0; } 100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; } }
@keyframes kflash { 0% { background: ${tint(MINT, 0.2)}; } 100% { background: transparent; } }
.k-flash { animation: kflash .7s ease-out; }
input[type="checkbox"] { accent-color: ${C.tang}; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;
