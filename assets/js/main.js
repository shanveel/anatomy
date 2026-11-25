/* From Two Cells to Life: page behaviour. No dependencies, except the QR encoder loaded on demand. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const api = (window.TwoCells = {});

  /* ---------------- Organ diagram ---------------- */
  function initOrgans() {
    const tract = $("#tract"), list = $("#organ-list");
    if (!tract || !list) return;
    let active = null;
    const show = (part) => {
      active = part;
      tract.classList.toggle("has-active", !!active);
      $$(".part", tract).forEach((g) => g.classList.toggle("on", g.dataset.part === active));
      $$("li", list).forEach((li) => {
        const on = li.dataset.part === active;
        li.classList.toggle("on", on);
        li.querySelector("button").setAttribute("aria-pressed", on);
      });
    };
    const set = (part) => show(active === part ? null : part);
    // On narrow screens the diagram is pinned above the list: follow the reader's scroll position.
    const narrow = matchMedia("(max-width: 52rem)");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (!narrow.matches) return;
        entries.forEach((en) => { if (en.isIntersecting) show(en.target.dataset.part); });
      }, { rootMargin: "-62% 0px -30% 0px" });
      $$("li", list).forEach((li) => io.observe(li));
    }
    list.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b) set(b.parentElement.dataset.part);
    });
    tract.addEventListener("click", (e) => {
      const g = e.target.closest(".part");
      if (!g) return set(active);
      set(g.dataset.part);
      const li = list.querySelector(`[data-part="${g.dataset.part}"]`);
      if (li && matchMedia("(max-width: 52rem)").matches) li.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------- Cycle data ---------------- */
  // Relative levels (0–100) for days 1–28 of an idealised 28-day cycle.
  const H = {
    fsh: [30, 33, 35, 36, 35, 33, 30, 28, 26, 24, 23, 25, 42, 56, 30, 22, 18, 16, 15, 14, 14, 15, 16, 18, 21, 24, 27, 29],
    lh: [14, 14, 14, 14, 14, 15, 15, 15, 16, 16, 18, 22, 62, 100, 38, 20, 16, 14, 13, 12, 12, 12, 12, 12, 12, 13, 13, 14],
    est: [12, 12, 13, 14, 16, 19, 23, 28, 35, 44, 56, 72, 84, 58, 34, 30, 34, 40, 46, 50, 52, 50, 45, 38, 30, 22, 16, 13],
    pro: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 5, 8, 16, 29, 46, 63, 77, 87, 92, 92, 86, 74, 56, 36, 18, 8],
  };
  const HN = { fsh: "FSH", lh: "LH", est: "Estrogen", pro: "Progesterone" };

  const OVARY = [
    { from: 1, to: 13, name: "Follicular phase", cls: "c-follicular", short: "Follicular" },
    { from: 14, to: 14, name: "Ovulation", cls: "c-ovulation", short: "" },
    { from: 15, to: 28, name: "Luteal phase", cls: "c-luteal", short: "Luteal" },
  ];
  const UTERUS = [
    { from: 1, to: 5, name: "Menstrual phase", cls: "c-menstrual", short: "Menstrual" },
    { from: 6, to: 14, name: "Proliferative phase", cls: "c-prolif", short: "Proliferative" },
    { from: 15, to: 28, name: "Secretory phase", cls: "c-secretory", short: "Secretory" },
  ];
  const FERTILE = [9, 14];
  const phaseOf = (arr, d) => arr.find((p) => d >= p.from && d <= p.to);

  function describe(d) {
    let ovary, uterus, hormones;
    if (d <= 5) ovary = "FSH wakes up a group of follicles. They start to grow, each holding an immature egg.";
    else if (d <= 10) ovary = "One follicle pulls ahead and becomes dominant. The others stop growing and break down.";
    else if (d <= 12) ovary = "The dominant follicle swells to about 2 cm and pumps out estrogen.";
    else if (d === 13) ovary = "High estrogen triggers a surge of LH from the pituitary gland. Ovulation is about a day away.";
    else if (d === 14) ovary = "Ovulation. The follicle bursts and releases its egg, which the fimbriae sweep into the fallopian tube.";
    else if (d <= 16) ovary = "The empty follicle turns into the corpus luteum, a temporary gland that makes progesterone.";
    else if (d <= 23) ovary = "The corpus luteum is at its most active. If an embryo implants, its hCG will keep it going.";
    else ovary = "No embryo, no hCG. The corpus luteum shrinks and its hormone output falls.";

    if (d <= 5) uterus = "The upper functional layer of the endometrium breaks down and is shed as the period.";
    else if (d <= 14) uterus = "Rising estrogen rebuilds the endometrium. It thickens from about 1 mm to 10 mm. Cervical mucus turns thin and stretchy near ovulation.";
    else if (d <= 25) uterus = "Progesterone turns the lining soft, glandular and rich in blood vessels, ready for an embryo to implant.";
    else uterus = "Without progesterone, the lining's blood vessels constrict. It will be shed on the next day 1.";

    const top = Object.keys(H).sort((a, b) => H[b][d - 1] - H[a][d - 1]);
    if (d === 13 || d === 14) hormones = "The LH surge, with a smaller FSH peak, triggers ovulation. Estrogen has just peaked.";
    else if (d <= 5) hormones = "Estrogen and progesterone are low, which lets FSH rise.";
    else if (d <= 12) hormones = "Estrogen climbs steadily as the dominant follicle grows.";
    else if (d >= 26) hormones = "Progesterone and estrogen are falling. FSH starts to rise for the next cycle.";
    else hormones = `${HN[top[0]]} is highest, with ${HN[top[1]].toLowerCase()} also raised. Together they keep FSH and LH low.`;
    return { ovary, uterus, hormones };
  }

  /* ---------------- Dial ---------------- */
  function initCycle() {
    const dial = $("#dial"), range = $("#day-range"), chart = $("#chart");
    if (!dial || !range || !chart) return;
    const C = 160, R_OUT = 134, R_IN = 108, W = 20;
    const ang = (day) => ((day - 1) / 28) * 360 - 90; // day start angle, degrees
    const pt = (r, a) => [C + r * Math.cos((a * Math.PI) / 180), C + r * Math.sin((a * Math.PI) / 180)];
    // Arc from a0 to a1 (degrees). Clockwise by default; ccw draws a1 -> a0 counter-clockwise.
    const arc = (r, a0, a1, ccw = false) => {
      const [x0, y0] = pt(r, ccw ? a1 : a0), [x1, y1] = pt(r, ccw ? a0 : a1);
      return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} ${ccw ? 0 : 1} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
    };
    const g = $("#dial-static");
    el("circle", { class: "track", cx: C, cy: C, r: R_OUT, "stroke-width": W }, g);
    el("circle", { class: "track", cx: C, cy: C, r: R_IN, "stroke-width": W }, g);
    const GAP = 0.9;
    const drawRing = (phases, r, id) => {
      phases.forEach((p, i) => {
        const a0 = ang(p.from) + GAP, a1 = ang(p.to + 1) - GAP;
        el("path", { class: `arc ${p.cls}`, d: arc(r, a0, a1), "stroke-width": W }, g);
        if (p.short) {
          const pid = `${id}-${i}`;
          // Text runs clockwise along the ring; flip on the lower half so it stays upright.
          const mid = (a0 + a1) / 2, lower = mid > 0 && mid < 180;
          // Glyphs sit on the outer side of a clockwise path, so offset the baseline inward (and outward when reversed).
          const d = lower ? arc(r + 3.5, a0, a1, true) : arc(r - 3.5, a0, a1);
          el("path", { id: pid, d, fill: "none" }, g);
          const t = el("text", { class: "ring-lbl" }, g);
          const tp = el("textPath", { href: `#${pid}`, startOffset: "50%", "text-anchor": "middle" }, t);
          tp.textContent = p.short;
        }
      });
    };
    drawRing(OVARY, R_OUT, "ro");
    drawRing(UTERUS, R_IN, "ri");
    // fertile window, just outside the outer ring
    el("path", { class: "fertile", d: arc(R_OUT + 16, ang(FERTILE[0]) + 2, ang(FERTILE[1] + 1) - 2) }, g);
    // day ticks + labels
    for (let d = 1; d <= 28; d++) {
      const a = ang(d) + 360 / 56; // centre of the day
      const major = d === 1 || d % 7 === 0;
      const [x0, y0] = pt(R_IN - W / 2 - 3, a), [x1, y1] = pt(R_IN - W / 2 - (major ? 9 : 6), a);
      el("line", { class: `tick${major ? " major" : ""}`, x1: x0, y1: y0, x2: x1, y2: y1 }, g);
      if (major) {
        const [tx, ty] = pt(R_IN - W / 2 - 17, a);
        el("text", { class: "daynum", x: tx.toFixed(1), y: ty.toFixed(1) }, g).textContent = d;
      }
    }

    /* Hormone chart */
    const CW = 340, CH = 170, L = 8, Rt = 92, T = 10, B = 22;
    const PW = CW - L - Rt, PH = CH - T - B;
    const x = (d) => L + ((d - 1) / 27) * PW;
    const y = (v) => T + PH - (v / 100) * PH;
    el("line", { class: "axis", x1: L, y1: T + PH, x2: L + PW, y2: T + PH }, chart);
    [1, 7, 14, 21, 28].forEach((d) => {
      el("line", { class: "axis", x1: x(d), y1: T + PH, x2: x(d), y2: T + PH + 4 }, chart);
      el("text", { class: "ax-lbl", x: x(d), y: CH - 4, "text-anchor": "middle" }, chart).textContent = d === 1 ? "Day 1" : d;
    });
    const smooth = (vals) => {
      const p = vals.map((v, i) => [x(i + 1), y(v)]);
      let s = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
      for (let i = 0; i < p.length - 1; i++) {
        const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        s += `C${c1[0].toFixed(1)} ${Math.min(T + PH, c1[1]).toFixed(1)} ${c2[0].toFixed(1)} ${Math.min(T + PH, c2[1]).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
      }
      return s;
    };
    const keyCls = { fsh: "k-fsh", lh: "k-lh", est: "k-est", pro: "k-pro" };
    const labelY = { lh: 18, est: 52, pro: 86, fsh: 120 };
    const dots = {};
    Object.keys(H).forEach((k) => {
      el("path", { class: `h-line ${keyCls[k]}`, d: smooth(H[k]), style: "fill:none" }, chart);
      el("circle", { class: `${keyCls[k]}`, cx: L + PW + 12, cy: labelY[k] - 4, r: 4 }, chart);
      el("text", { class: `h-lbl ${keyCls[k]}`, x: L + PW + 20, y: labelY[k], style: "stroke:none" }, chart).textContent = HN[k];
    });
    const now = el("line", { class: "now", y1: T, y2: T + PH }, chart);
    Object.keys(H).forEach((k) => (dots[k] = el("circle", { class: `dot ${keyCls[k]}`, r: 4.5 }, chart)));

    /* State */
    const hand = $("#dial-hand"), knob = $("#dial-knob");
    const out = { day: $("#dial-day"), phase: $("#dial-phase"), title: $("#ro-title"), pill: $("#ro-pill"), fertile: $("#ro-fertile"), ovary: $("#ro-ovary"), uterus: $("#ro-uterus"), hormones: $("#ro-hormones") };
    let day = 1;
    const centerLabel = (d) => (d === 14 ? "Ovulation" : d <= 5 ? "Menstruation" : phaseOf(OVARY, d).short + " phase");
    function setDay(d, fromRange) {
      d = Math.max(1, Math.min(28, Math.round(d)));
      day = d;
      const a = ang(d) + 360 / 56;
      const [kx, ky] = pt(R_OUT + 16, a), [hx, hy] = pt(R_IN - W / 2 - 2, a);
      knob.setAttribute("cx", kx.toFixed(1)); knob.setAttribute("cy", ky.toFixed(1));
      hand.setAttribute("x1", hx.toFixed(1)); hand.setAttribute("y1", hy.toFixed(1));
      hand.setAttribute("x2", kx.toFixed(1)); hand.setAttribute("y2", ky.toFixed(1));
      out.day.textContent = d;
      out.phase.textContent = centerLabel(d);
      const ov = phaseOf(OVARY, d), ut = phaseOf(UTERUS, d);
      out.title.textContent = `Day ${d}`;
      out.pill.textContent = d === 14 ? "Ovulation" : `Ovary: ${ov.short.toLowerCase()} · Uterus: ${ut.short.toLowerCase()}`;
      const fertile = d >= FERTILE[0] && d <= FERTILE[1];
      out.fertile.hidden = !fertile;
      const t = describe(d);
      out.ovary.textContent = t.ovary; out.uterus.textContent = t.uterus; out.hormones.textContent = t.hormones;
      now.setAttribute("x1", x(d)); now.setAttribute("x2", x(d));
      Object.keys(H).forEach((k) => { dots[k].setAttribute("cx", x(d)); dots[k].setAttribute("cy", y(H[k][d - 1])); });
      dial.setAttribute("aria-valuenow", d);
      dial.setAttribute("aria-valuetext", `Day ${d}, ${d === 14 ? "ovulation" : ov.name.toLowerCase() + ", " + ut.name.toLowerCase()}${fertile ? ", fertile window" : ""}`);
      if (!fromRange) range.value = d;
    }

    range.addEventListener("input", () => { stop(); setDay(+range.value, true); });
    const dayFromPointer = (e) => {
      const r = dial.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * 320 - C, py = ((e.clientY - r.top) / r.height) * 320 - C;
      let a = (Math.atan2(py, px) * 180) / Math.PI + 90;
      if (a < 0) a += 360;
      return Math.floor((a / 360) * 28) + 1;
    };
    let dragging = false;
    dial.addEventListener("pointerdown", (e) => { stop(); dragging = true; dial.setPointerCapture(e.pointerId); setDay(dayFromPointer(e)); });
    dial.addEventListener("pointermove", (e) => { if (dragging) setDay(dayFromPointer(e)); });
    const end = () => (dragging = false);
    dial.addEventListener("pointerup", end); dial.addEventListener("pointercancel", end);
    dial.addEventListener("keydown", (e) => {
      const map = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 7, PageDown: -7 };
      if (e.key in map) { e.preventDefault(); stop(); setDay(((day - 1 + map[e.key] + 28) % 28) + 1); }
      else if (e.key === "Home") { e.preventDefault(); stop(); setDay(1); }
      else if (e.key === "End") { e.preventDefault(); stop(); setDay(28); }
    });

    /* Play */
    const play = $("#play");
    const ICON_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>';
    const ICON_PAUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>';
    let timer = null;
    function stop() {
      if (!timer) return;
      clearInterval(timer); timer = null;
      play.innerHTML = ICON_PLAY; play.setAttribute("aria-label", "Play the cycle");
    }
    function start(ms) {
      if (timer) return;
      play.innerHTML = ICON_PAUSE; play.setAttribute("aria-label", "Pause");
      timer = setInterval(() => setDay((day % 28) + 1), ms || (reduceMotion ? 1600 : 700));
    }
    play.addEventListener("click", () => (timer ? stop() : start()));
    api.cycle = { setDay, start, stop };

    setDay(1);
  }

  /* ---------------- Quiz ---------------- */
  const QUESTIONS = [
    { q: "Where does fertilization usually happen?", a: ["In the uterus", "In the ampulla of the fallopian tube", "In the ovary", "In the cervix"], c: 1, e: "Sperm meet the egg in the ampulla, the widest part of the fallopian tube." },
    { q: "Which hormone surge triggers ovulation?", a: ["Progesterone", "Estrogen", "Luteinizing hormone (LH)", "hCG"], c: 2, e: "A sharp LH surge, around day 13 of a 28-day cycle, makes the dominant follicle release its egg." },
    { q: "What is the mature follicle, swollen by a fluid-filled antrum just before ovulation, called?", a: ["Primordial follicle", "Corpus luteum", "Morula", "Graafian follicle"], c: 3, e: "Before ovulation the follicle fills with a fluid space called the antrum and swells to about 2 cm. This mature stage is the Graafian follicle." },
    { q: "After ovulation, what does the empty follicle become?", a: ["The corpus luteum", "The endometrium", "The zona pellucida", "A new follicle"], c: 0, e: "The empty follicle becomes the corpus luteum, a temporary gland that makes progesterone." },
    { q: "What is the lining of the uterus called?", a: ["Myometrium", "Endometrium", "Perimetrium", "Zona pellucida"], c: 1, e: "The endometrium is the inner lining. The myometrium is the muscle layer beneath it." },
    { q: "Which part of the sperm holds the enzymes that digest a path into the egg?", a: ["Tail", "Middle piece", "Acrosome", "Nucleus"], c: 2, e: "The acrosome is an enzyme-filled cap on the sperm head. Its release is the acrosome reaction." },
    { q: "What stops a second sperm from entering the egg?", a: ["The corona radiata", "The cortical reaction hardening the zona pellucida", "The acrosome reaction", "Cervical mucus"], c: 1, e: "Once one sperm fuses, the cortical reaction hardens the zona pellucida and blocks all others." },
    { q: "How many chromosomes does a human zygote have?", a: ["23", "46", "92", "44"], c: 1, e: "23 from the egg plus 23 from the sperm gives 46, the full diploid number." },
    { q: "Which hormone mainly prepares the lining for implantation after ovulation?", a: ["FSH", "LH", "Progesterone", "Testosterone"], c: 2, e: "Progesterone from the corpus luteum makes the endometrium soft, glandular and ready for an embryo." },
    { q: "What makes the uterine lining shed at the start of a period?", a: ["A fall in progesterone as the corpus luteum breaks down", "A surge of LH", "A rise in estrogen", "The release of an egg"], c: 0, e: "Without an embryo making hCG, the corpus luteum breaks down after about 14 days. Progesterone and estrogen fall, and the lining is shed." },
    { q: "Roughly when does the blastocyst implant in the uterine lining?", a: ["Within 2 hours", "Day 1", "Days 6 to 10", "Day 28"], c: 2, e: "The blastocyst reaches the uterus around day 4 and burrows into the endometrium from about day 6." },
    { q: "Which part of the blastocyst develops into the embryo?", a: ["Trophoblast", "Zona pellucida", "Corona radiata", "Inner cell mass"], c: 3, e: "The inner cell mass becomes the embryo. The outer layer, the trophoblast, goes on to help form the placenta." },
    { q: "Which part of the fallopian tube is narrow and joins the uterus?", a: ["Ampulla", "Fimbriae", "Infundibulum", "Isthmus"], c: 3, e: "The isthmus is the narrow end next to the uterus. The wide ampulla, nearer the ovary, is where fertilization happens." },
    { q: "Which vaccine helps protect against cervical cancer?", a: ["BCG vaccine", "HPV vaccine", "Flu vaccine", "Tetanus vaccine"], c: 1, e: "Most cervical cancers are caused by HPV, the human papillomavirus. The vaccine protects against the main high-risk types." },
    { q: "Which hormone do pregnancy tests detect?", a: ["hCG", "FSH", "Estrogen", "Insulin"], c: 0, e: "The implanting embryo makes hCG, which keeps the corpus luteum alive. Pregnancy tests detect it." },
  ];

  function initQuiz() {
    const box = $("#quiz-box");
    if (!box) return;
    let i = 0, answers = [];

    const dots = () => `<div class="quiz-dots" aria-hidden="true">${QUESTIONS.map((_, k) =>
      `<span class="${k < answers.length ? (answers[k] === QUESTIONS[k].c ? "ok" : "no") : k === i ? "cur" : ""}"></span>`).join("")}</div>`;

    function renderQuestion() {
      const q = QUESTIONS[i];
      box.innerHTML = `
        <div class="quiz-meta"><span>Question ${i + 1} of ${QUESTIONS.length}</span>${dots()}</div>
        <form id="qf" novalidate>
          <fieldset>
            <legend>${q.q}</legend>
            ${q.a.map((t, k) => `<label class="opt"><input type="radio" name="opt" value="${k}"><span>${t}</span></label>`).join("")}
          </fieldset>
          <p class="quiz-feedback" id="qfb" aria-live="polite"></p>
          <div class="quiz-actions"><button class="btn" type="submit" id="qbtn">Check answer</button></div>
        </form>`;
      const form = $("#qf", box), fb = $("#qfb", box), btn = $("#qbtn", box);
      let checked = false;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (checked) { i++; return i < QUESTIONS.length ? renderQuestion() : renderResult(); }
        const pick = form.querySelector("input:checked");
        if (!pick) { fb.textContent = "Pick an answer first."; return; }
        checked = true;
        const v = +pick.value;
        answers.push(v);
        $$(".opt", form).forEach((o, k) => {
          o.querySelector("input").disabled = true;
          if (k === q.c) o.classList.add("right");
          else if (k === v) o.classList.add("wrong");
        });
        fb.innerHTML = (v === q.c ? "<b>Correct.</b> " : '<b class="no">Not quite.</b> ') + q.e;
        $(".quiz-dots", box).outerHTML = dots();
        btn.textContent = i === QUESTIONS.length - 1 ? "See my score" : "Next question";
        btn.focus();
      });
    }

    function renderResult() {
      const score = answers.filter((v, k) => v === QUESTIONS[k].c).length;
      const missed = QUESTIONS.filter((q, k) => answers[k] !== q.c);
      const verdict = score === QUESTIONS.length ? "A perfect score." : score >= 7 ? "Well done. Check the explanations below for the ones you missed." : "Have another look at the sections above, then try again.";
      box.innerHTML = `
        <div class="quiz-meta"><span>Your score</span>${dots()}</div>
        <p class="score" tabindex="-1" id="qscore">${score}/${QUESTIONS.length}</p>
        <p>${verdict}</p>
        ${missed.length ? `<ol class="review">${missed.map((q) => `<li><b>${q.q}</b><br>${q.e}</li>`).join("")}</ol>` : ""}
        <div class="quiz-actions"><button class="btn" type="button" id="qagain">Try again</button></div>`;
      $("#qscore", box).focus();
      $("#qagain", box).addEventListener("click", () => { i = 0; answers = []; renderQuestion(); $("legend", box).scrollIntoView({ block: "center" }); });
    }
    renderQuestion();
  }

  /* ---------------- QR ---------------- */
  const loadLib = () => window.qrcode ? Promise.resolve() : new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = "assets/js/vendor/qrcode.min.js"; s.onload = ok; s.onerror = fail;
    document.head.appendChild(s);
  });
  // Encode a URL as an SVG QR code (generated locally, no web service needed).
  async function qrSvg(url) {
    await loadLib();
    const qr = window.qrcode(0, "M");
    qr.addData(url); qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return {
      matrix: { n, at: (r, c) => qr.isDark(r, c) },
      svg: `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" role="img" aria-label="QR code that opens ${url}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#2d2463"/></svg>`,
    };
  }
  // The site's home address, whichever page we are on.
  const siteUrl = () => location.href.split("#")[0].split("?")[0].replace(/(index|present)\.html$/, "");
  const isPublic = /^https?:$/.test(location.protocol) && !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname);

  function initQR() {
    const holder = $("#qr-code"), urlOut = $("#qr-url"), form = $("#qr-form"), input = $("#qr-input"), err = $("#qr-err");
    if (!holder) return;
    let matrix = null, current = "";
    async function make(url) {
      const q = await qrSvg(url);
      matrix = q.matrix;
      holder.innerHTML = q.svg;
      urlOut.textContent = url;
      current = url;
    }
    if (isPublic) make(siteUrl()).catch(() => (holder.textContent = "QR code could not load."));
    else {
      form.hidden = false;
      holder.innerHTML = '<span class="note">Publish the site, or enter its public address below.</span>';
    }
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let u;
      try { u = new URL(input.value.trim()); if (!/^https?:$/.test(u.protocol)) throw 0; }
      catch { err.textContent = "Enter a full address that starts with https://"; input.focus(); return; }
      err.textContent = "";
      make(u.href);
    });
    $("#qr-download").addEventListener("click", () => {
      if (!matrix) { err.textContent = "Make a QR code first."; return; }
      const scale = 16, q = 4, size = (matrix.n + q * 2) * scale;
      const cv = document.createElement("canvas"); cv.width = cv.height = size;
      const ctx = cv.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size); ctx.fillStyle = "#2d2463";
      for (let r = 0; r < matrix.n; r++) for (let c = 0; c < matrix.n; c++) if (matrix.at(r, c)) ctx.fillRect((c + q) * scale, (r + q) * scale, scale, scale);
      const a = document.createElement("a");
      a.download = "from-two-cells-to-life-qr.png"; a.href = cv.toDataURL("image/png"); a.click();
    });
    $("#qr-print").addEventListener("click", () => {
      if (!current) { err.textContent = "Make a QR code first."; return; }
      document.body.classList.add("print-qr");
      const done = () => { document.body.classList.remove("print-qr"); removeEventListener("afterprint", done); };
      addEventListener("afterprint", done);
      print();
    });
  }

  /* ---------------- Poster gallery ---------------- */
  function initGallery() {
    const list = $("#gallery"), box = $("#lightbox");
    if (!list || !box || typeof box.showModal !== "function") return; // links still open the full image
    const links = $$("a", list);
    const img = $("#lb-img"), title = $("#lb-title"), count = $("#lb-count"), dl = $("#lb-download"), open = $("#lb-open");
    let i = 0, opener = null;
    const avif = $("#lb-avif");
    // Warm the cache for the neighbours, in the format and size this browser will pick.
    const preload = (k) => {
      const a = links[(k + links.length) % links.length];
      if (!a) return;
      const pic = document.createElement("picture"), src = document.createElement("source"), im = new Image();
      src.type = "image/avif"; src.srcset = a.dataset.avif; src.sizes = sizesAttr(a);
      im.src = a.dataset.webp; pic.append(src, im);
    };
    // How wide the poster will be drawn: limited by the screen width and by the screen height.
    const sizesAttr = (a) => `min(100vw, calc((100dvh - 6rem) * ${a.dataset.w} / ${a.dataset.h}))`;
    function show(k) {
      i = (k + links.length) % links.length;
      const a = links[i];
      // Show the (already loaded) thumbnail immediately, sized like the poster, then let the sharp image replace it.
      img.removeAttribute("srcset");
      img.width = +a.dataset.w; img.height = +a.dataset.h;
      const thumb = a.querySelector("img");  // reuse whichever thumbnail file the gallery already loaded
      img.style.backgroundImage = `url("${thumb.currentSrc || a.dataset.thumb}"), ${thumb.style.backgroundImage}`;
      img.classList.remove("loaded");
      avif.srcset = a.dataset.avif; avif.sizes = sizesAttr(a);
      img.src = a.dataset.webp;
      img.alt = a.querySelector("img").alt;
      title.textContent = a.dataset.title;
      count.textContent = `${i + 1} of ${links.length}`;
      dl.href = a.getAttribute("href");
      dl.setAttribute("download", "from-two-cells-to-life-" + a.getAttribute("href").split("/").pop());
      open.href = a.getAttribute("href");
      preload(i + 1); preload(i - 1);
    }
    img.addEventListener("load", () => img.classList.add("loaded"));
    list.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      opener = a;
      show(links.indexOf(a));
      box.showModal();
      $("#lb-close").focus();
    });
    $("#lb-prev").addEventListener("click", () => show(i - 1));
    $("#lb-next").addEventListener("click", () => show(i + 1));
    $("#lb-close").addEventListener("click", () => box.close());
    box.addEventListener("close", () => { if (opener) opener.focus(); });
    box.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); show(i - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); show(i + 1); }
    });
    // Swipe left/right to move between posters (ignored while pinch-zoomed in).
    let x0 = null, y0 = null;
    box.addEventListener("touchstart", (e) => { if (e.touches.length === 1) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } }, { passive: true });
    box.addEventListener("touchend", (e) => {
      if (x0 === null || (window.visualViewport && visualViewport.scale > 1.05)) { x0 = null; return; }
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(dx < 0 ? i + 1 : i - 1);
      x0 = null;
    });
    // Tapping the dark area around the poster closes the viewer.
    $(".lb-stage", box).addEventListener("click", (e) => { if (e.target === e.currentTarget) box.close(); });
  }

  /* ---------------- Nav highlight ---------------- */
  function initNav() {
    const links = $$(".bar nav a");
    const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.removeAttribute("aria-current"));
        const a = map.get(en.target.id);
        if (a) {
          a.setAttribute("aria-current", "true");
          // Keep the active link visible in the horizontally scrolling nav without disturbing page scroll.
          const nav = a.closest("nav"), l = a.offsetLeft, r = l + a.offsetWidth;
          if (l < nav.scrollLeft || r > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = l - 16;
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------------- Landing on a section link ---------------- */
  // A link such as …/#posters should land on its section even if fonts or late content
  // change the page height while it loads. Re-check once everything has settled, unless the
  // visitor has already started scrolling, then turn on smooth scrolling for in-page links.
  function initLanding() {
    let touched = false;
    const mark = () => (touched = true);
    ["wheel", "touchstart", "keydown", "mousedown"].forEach((t) => addEventListener(t, mark, { once: true, passive: true }));
    const settle = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const target = id && document.getElementById(id);
      if (target && !touched) {
        const off = target.getBoundingClientRect().top - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
        if (Math.abs(off) > 4) target.scrollIntoView({ block: "start" });
      }
      requestAnimationFrame(() => document.documentElement.classList.add("smooth"));
    };
    const ready = () => (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(settle);
    if (document.readyState === "complete") ready(); else addEventListener("load", ready, { once: true });
  }

  function initOffline() {
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
    }
  }

  Object.assign(api, { qrSvg, siteUrl, isPublic, reduceMotion });
  initOrgans(); initCycle(); initQuiz(); initQR(); initGallery(); initNav(); initLanding(); initOffline();
})();
