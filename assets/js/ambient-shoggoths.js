/*
 * Shoggoth builder
 *
 * Draws the unmasked shoggoth from the December 2022 meme: one amorphous
 * body, a halo of uneven tentacles, and scattered round eyes. No smile,
 * no mouth. Each creature keeps that silhouette, then changes tentacle
 * width, length, curl, and motion to fit its role.
 *
 * Geometry follows the usual jointed-tentacle approach: a tapered ribbon
 * pivots at its base with SMIL, and CSS only handles the slow wander and
 * blinks. Positions stay in the gutters beside the 800px column.
 */

(() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const VIEW = 300;
  const CX = 150;

  const palette = {
    mint: { fill: "#B9E7BD", stroke: "#4F8A60", pupil: "#2A4634" },
    butter: { fill: "#F7E9A7", stroke: "#B08E32", pupil: "#554412" },
    apricot: { fill: "#F5C697", stroke: "#C17A42", pupil: "#5C381E" },
    lilac: { fill: "#D9C6EE", stroke: "#8A70B0", pupil: "#413052" },
    sky: { fill: "#C5DCF6", stroke: "#6894C0", pupil: "#28445E" },
    blossom: { fill: "#F6D0CB", stroke: "#C48480", pupil: "#5E3838" },
    sage: { fill: "#D3E6C6", stroke: "#73966A", pupil: "#2E452C" },
  };

  const characters = [
    {
      role: "rest",
      color: "mint",
      seed: 11,
      side: "left",
      face: "in",
      size: "214px",
      bottom: "4vh",
      tilt: -7,
      duration: 28,
      delay: -4,
      gutter: 18,
      opacity: 1,
    },
    {
      role: "chess",
      color: "apricot",
      seed: 29,
      side: "left",
      face: "in",
      size: "128px",
      bottom: "33vh",
      tilt: 11,
      duration: 23,
      delay: -12,
      gutter: 40,
      opacity: 0.96,
    },
    {
      role: "researcher",
      color: "butter",
      seed: 47,
      side: "left",
      face: "in",
      size: "146px",
      bottom: "56vh",
      tilt: -12,
      duration: 25,
      delay: -8,
      gutter: 26,
      opacity: 0.98,
    },
    {
      role: "reader",
      color: "lilac",
      seed: 71,
      side: "left",
      face: "away",
      size: "118px",
      top: "4vh",
      tilt: 8,
      duration: 30,
      delay: -18,
      gutter: 34,
      opacity: 0.94,
    },
    {
      role: "data",
      color: "blossom",
      seed: 83,
      side: "right",
      face: "in",
      size: "136px",
      bottom: "3vh",
      tilt: -6,
      duration: 24,
      delay: -6,
      gutter: 22,
      opacity: 0.96,
    },
    {
      role: "terminal",
      color: "sky",
      seed: 97,
      side: "right",
      face: "in",
      size: "132px",
      bottom: "38vh",
      tilt: 9,
      duration: 21,
      delay: -15,
      gutter: 36,
      opacity: 0.98,
    },
    {
      role: "lab",
      color: "sage",
      seed: 113,
      side: "right",
      face: "away",
      size: "124px",
      top: "6vh",
      tilt: -14,
      duration: 27,
      delay: -2,
      gutter: 20,
      opacity: 0.95,
    },
  ];

  const options = { enabled: true, ...(window.SHOGGOTH_AMBIENT || {}) };
  if (!options.enabled || document.querySelector(".shoggoth-ambient")) return;

  const motion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const layer = document.createElement("aside");
  layer.className = "shoggoth-ambient";
  if (!motion) layer.classList.add("is-static");
  layer.setAttribute("aria-hidden", "true");

  characters.forEach((character) => {
    const item = document.createElement("span");
    item.className = "shoggoth-ambient__character";
    item.dataset.side = character.side;
    item.dataset.face = character.face;
    item.dataset.role = character.role;
    item.style.setProperty("--shoggoth-size", character.size);
    item.style.setProperty("--shoggoth-gutter", `${character.gutter}px`);
    item.style.setProperty("--shoggoth-tilt", `${character.tilt}deg`);
    item.style.setProperty("--shoggoth-duration", `${character.duration}s`);
    item.style.setProperty("--shoggoth-delay", `${character.delay}s`);
    item.style.setProperty("--shoggoth-opacity", String(character.opacity));
    if (character.top) item.style.setProperty("--shoggoth-top", character.top);
    if (character.bottom) item.style.setProperty("--shoggoth-bottom", character.bottom);
    item.append(buildShoggoth(character, palette[character.color], motion));
    layer.append(item);
  });

  document.body.prepend(layer);

  function buildShoggoth(character, color, animate) {
    const rand = mulberry32(character.seed);
    const model = makeBody(character.role, rand);
    const svg = el("svg", {
      class: "shoggoth-svg",
      viewBox: `0 0 ${VIEW} ${VIEW}`,
      fill: "none",
      "aria-hidden": "true",
    });

    const blueprint = roleBlueprint(character.role, rand);

    const outline = el("path", {
      d: model.d,
      fill: "none",
      stroke: color.stroke,
      "stroke-width": "5",
      "stroke-linejoin": "round",
    });
    svg.append(outline);

    const posed = blueprint.tentacles.map((spec) => drawTentacle(svg, model, spec, color, animate));

    el("path", {
      d: model.d,
      fill: color.fill,
      stroke: "none",
    }, svg);

    placeEyes(svg, model, blueprint.eyes, color, rand);

    const tools = el("g", { class: "shoggoth-tools" }, svg);
    if (blueprint.prop) drawProp(tools, blueprint.prop, color, model);
    posed.forEach((pose) => {
      if (pose.spec.tip !== "none") drawTip(tools, pose, color, animate);
    });
    return svg;
  }

  function makeBody(role, rand) {
    const shape = {
      rest: { rx: 52, ry: 38, cy: 158, lump: 0.2, count: 14, lobe: 110 },
      researcher: { rx: 38, ry: 46, cy: 150, lump: 0.16, count: 12, lobe: -30 },
      chess: { rx: 42, ry: 40, cy: 148, lump: 0.12, count: 12, lobe: 60 },
      reader: { rx: 34, ry: 50, cy: 146, lump: 0.14, count: 12, lobe: -70 },
      terminal: { rx: 46, ry: 36, cy: 150, lump: 0.14, count: 12, lobe: 70 },
      data: { rx: 54, ry: 32, cy: 176, lump: 0.12, count: 12, lobe: 80 },
      lab: { rx: 40, ry: 44, cy: 152, lump: 0.18, count: 13, lobe: 30 },
    }[role];

    let raw = [];
    for (let i = 0; i < shape.count; i += 1) raw.push(0.86 + rand() * shape.lump);
    const lobeIndex = angleIndex(shape.lobe, shape.count);
    raw[lobeIndex] *= 1.16;
    raw[(lobeIndex + 1) % shape.count] *= 1.08;
    raw[(lobeIndex - 1 + shape.count) % shape.count] *= 1.08;
    raw = raw.map((value, i) => {
      const prev = raw[(i - 1 + shape.count) % shape.count];
      const next = raw[(i + 1) % shape.count];
      return value * 0.58 + prev * 0.21 + next * 0.21;
    });

    const pts = raw.map((scale, i) => {
      const angle = (i / shape.count) * Math.PI * 2;
      return {
        x: CX + Math.cos(angle) * shape.rx * scale,
        y: shape.cy + Math.sin(angle) * shape.ry * scale,
        r: scale,
      };
    });

    return { pts, d: closedPath(pts), cx: CX, cy: shape.cy, rx: shape.rx, ry: shape.ry };
  }

  function roleBlueprint(role, rand) {
    const wiggle = { wave: 0.42, waves: 2 };
    const still = { wave: 0, waves: 1, spread: 3 };

    if (role === "rest") {
      return {
        eyes: 11,
        tentacles: [
          arm(rand, -120, 46, 10, 0.34, 0.75, 7, 8.2, { ...wiggle, eye: true }),
          arm(rand, -75, 62, 12, -0.28, 0.7, 6, 9),
          arm(rand, -28, 50, 9, 0.46, 0.8, 8, 7.4, wiggle),
          arm(rand, 18, 68, 11, -0.22, 0.72, 6, 8.8, { eye: true }),
          arm(rand, 62, 74, 14, 0.2, 0.68, 7, 9.4, wiggle),
          arm(rand, 108, 66, 13, -0.3, 0.7, 5, 10),
          arm(rand, 155, 54, 10, 0.38, 0.78, 6, 7.8, { ...wiggle, eye: true }),
          arm(rand, 200, 60, 11, -0.24, 0.74, 5, 8.6),
          arm(rand, 245, 44, 9, 0.5, 0.82, 7, 7.2, wiggle),
          arm(rand, -168, 36, 8, 0.3, 0.7, 5, 6.4),
        ],
      };
    }

    if (role === "researcher") {
      return {
        eyes: 6,
        tentacles: [
          arm(rand, 140, 34, 8, 0.3, 0.8, 5, 6.5, wiggle),
          arm(rand, 190, 40, 9, -0.26, 0.75, 5, 7.2),
          arm(rand, 240, 30, 7, 0.34, 0.8, 4, 6),
          arm(rand, -140, 36, 8, -0.3, 0.75, 5, 6.8),
          arm(rand, -24, 70, 4.6, 0.62, 1.45, 10, 4.6, { wave: 0.2, waves: 2, tip: "lens", eye: true, spread: 4 }),
          arm(rand, 8, 78, 4.2, -0.55, 1.5, 11, 5.2, { wave: 0.18, waves: 2, tip: "lens", spread: 4 }),
          arm(rand, 36, 58, 4.8, 0.7, 1.35, 9, 4.4, { wave: 0.22, waves: 1, tip: "lens", spread: 4 }),
          arm(rand, -78, 48, 4.4, -0.48, 1.4, 8, 5.8, { wave: 0.2, waves: 2, eye: true, spread: 4 }),
        ],
      };
    }

    if (role === "chess") {
      const fingers = [22, 40, 58, 76].map((joinAngle, i) => arm(rand, 52, 36, 6.2, i % 2 ? 0.06 : -0.05, 0.3, 4, 3.2 + i * 0.4, {
        ...still,
        joinAngle,
        depth: 0.92,
      }));
      return {
        eyes: 6,
        prop: { kind: "board", angle: 54, distance: 80, rotate: 6 },
        tentacles: [
          arm(rand, -130, 36, 8, 0.28, 0.78, 5, 6.4, wiggle),
          arm(rand, 168, 40, 9, -0.22, 0.75, 5, 7),
          arm(rand, 215, 32, 7, 0.36, 0.8, 4, 6.2),
          arm(rand, -70, 38, 8, 0.24, 0.76, 5, 6.8),
          ...fingers,
          arm(rand, -46, 72, 6.2, -0.78, 1.2, 8, 7.4, { wave: 0.16, waves: 1, eye: true, spread: 4 }),
        ],
      };
    }

    if (role === "reader") {
      return {
        eyes: 6,
        prop: { kind: "paper", angle: 34, distance: 66, rotate: -12 },
        tentacles: [
          arm(rand, -110, 32, 7, 0.3, 0.8, 4, 6.5, wiggle),
          arm(rand, 150, 36, 8, -0.24, 0.75, 4, 7),
          arm(rand, 210, 30, 7, 0.32, 0.8, 4, 6.2),
          arm(rand, -160, 34, 7, -0.28, 0.78, 4, 6.8),
          arm(rand, 18, 52, 16, 0.1, 0.28, 2.5, 7.6, { ...still, joinAngle: 8, depth: 0.88 }),
          arm(rand, 50, 50, 15, -0.1, 0.26, 2.5, 8.2, { ...still, joinAngle: 58, depth: 0.88 }),
          arm(rand, -4, 64, 4.4, 0.88, 1.35, 7, 5.5, { wave: 0.18, waves: 1, eye: true, spread: 3 }),
        ],
      };
    }

    if (role === "terminal") {
      const fingers = [26, 40, 54, 68, 82].map((joinAngle, i) => arm(rand, 58, 40, 7.2, i % 2 ? 0.1 : -0.08, 0.38, 7, 2.3 + i * 0.35, {
        ...still,
        joinAngle,
        depth: 0.9,
      }));
      return {
        eyes: 6,
        prop: { kind: "keyboard", angle: 58, distance: 70, rotate: 14 },
        tentacles: [
          arm(rand, -120, 32, 8, 0.26, 0.78, 5, 6.4, wiggle),
          arm(rand, 150, 34, 8, -0.22, 0.76, 4, 6.8),
          arm(rand, -155, 28, 7, 0.3, 0.8, 4, 6),
          ...fingers,
          arm(rand, 198, 78, 4.4, 0.26, 1.45, 5, 8.6, { wave: 0.34, waves: 2, eye: true, spread: 4 }),
        ],
      };
    }

    if (role === "data") {
      const heights = [38, 58, 46, 72, 32];
      const columns = heights.map((length, i) => arm(rand, -90, length, 7.4, 0.01, 0.12, 1.6, 6.6 + i * 0.15, {
        ...still,
        joinAngle: -90,
        shift: -32 + i * 16,
        depth: 0.72,
      }));
      return {
        eyes: 6,
        prop: { kind: "axis", angle: -90, distance: 50, rotate: 0 },
        tentacles: [
          arm(rand, 40, 30, 8, 0.22, 0.8, 4, 6.5, wiggle),
          arm(rand, 100, 36, 9, -0.2, 0.75, 4, 7),
          arm(rand, 155, 28, 7, 0.28, 0.8, 4, 6.2),
          arm(rand, 210, 32, 8, -0.24, 0.78, 4, 6.8),
          ...columns,
          arm(rand, 12, 68, 5, 0.16, 1.35, 7, 5.4, { wave: 0.2, waves: 1, tip: "dot", eye: true, spread: 3 }),
        ],
      };
    }

    return {
      eyes: 6,
      prop: { kind: "flask", angle: 96, distance: 64, rotate: 10 },
      tentacles: [
        arm(rand, 170, 32, 7, 0.28, 0.8, 4, 6.4, wiggle),
        arm(rand, 220, 36, 8, -0.22, 0.76, 4, 7),
        arm(rand, -150, 30, 7, 0.3, 0.8, 4, 6),
        arm(rand, -24, 72, 3.4, 0.03, 1.9, 2.6, 7, { ...still, tip: "drop" }),
        arm(rand, 2, 80, 3.2, -0.02, 1.95, 2.4, 7.6, { ...still, tip: "drop" }),
        arm(rand, 28, 66, 3.5, 0.04, 1.85, 2.8, 6.6, { ...still, tip: "drop" }),
        arm(rand, 70, 42, 6.4, 0.95, 1.05, 5, 6.5, { wave: 0.1, waves: 1, spread: 3 }),
        arm(rand, 128, 34, 6, -0.36, 0.9, 4, 5.6, wiggle),
      ],
    };
  }

  function arm(rand, angle, length, width, curl, taper, sway, duration, extra) {
    const options = extra || {};
    const spread = options.spread ?? 7;
    return {
      angle: angle + (rand() - 0.5) * spread * 0.35,
      joinAngle: options.joinAngle === undefined ? undefined : options.joinAngle + (rand() - 0.5) * 3,
      shift: options.shift || 0,
      depth: options.depth,
      length: length * (0.94 + rand() * 0.12),
      width: width * (0.94 + rand() * 0.12),
      curl,
      taper,
      sway,
      duration,
      delay: -rand() * duration,
      eye: Boolean(options.eye),
      tip: options.tip || "none",
      wave: options.wave ?? 0.3,
      waves: options.waves ?? 2,
    };
  }

  function drawTentacle(svg, model, spec, color, animate) {
    const attach = ((spec.joinAngle ?? spec.angle) * Math.PI) / 180;
    const joint = bodyPoint(model, attach, spec.depth || 0.93);
    joint.x += spec.shift || 0;
    const spine = tentacleSpine(spec);
    const outer = el("g", {
      transform: `translate(${fmt(joint.x)} ${fmt(joint.y)}) rotate(${fmt(spec.angle)})`,
    }, svg);
    const spinner = el("g", {}, outer);
    if (animate) {
      el("animateTransform", {
        attributeName: "transform",
        type: "rotate",
        values: `${fmt(-spec.sway)} 0 0;${fmt(spec.sway)} 0 0;${fmt(-spec.sway)} 0 0`,
        keyTimes: "0;0.5;1",
        calcMode: "spline",
        keySplines: "0.42 0.05 0.58 0.95;0.42 0.05 0.58 0.95",
        dur: `${fmt(spec.duration)}s`,
        begin: `${fmt(spec.delay)}s`,
        repeatCount: "indefinite",
      }, spinner);
    }

    el("path", {
      d: ribbonPath(spine),
      fill: color.fill,
      stroke: color.stroke,
      "stroke-width": "4",
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
    }, spinner);

    if (spec.eye) {
      const tip = spine[spine.length - 1];
      const host = spine.find((point) => point.along > spec.length * 0.62) || tip;
      drawEye(spinner, host.x, host.y, Math.max(4.2, spec.width * 0.62), color, 0.4, 0, false);
    }

    return { spec, joint, spine };
  }

  function drawTip(parent, pose, color, animate) {
    const { spec, joint, spine } = pose;
    const tip = spine[spine.length - 1];
    const outer = el("g", {
      transform: `translate(${fmt(joint.x)} ${fmt(joint.y)}) rotate(${fmt(spec.angle)})`,
    }, parent);
    const spinner = el("g", {}, outer);
    if (animate) {
      el("animateTransform", {
        attributeName: "transform",
        type: "rotate",
        values: `${fmt(-spec.sway)} 0 0;${fmt(spec.sway)} 0 0;${fmt(-spec.sway)} 0 0`,
        keyTimes: "0;0.5;1",
        calcMode: "spline",
        keySplines: "0.42 0.05 0.58 0.95;0.42 0.05 0.58 0.95",
        dur: `${fmt(spec.duration)}s`,
        begin: `${fmt(spec.delay)}s`,
        repeatCount: "indefinite",
      }, spinner);
    }

    if (spec.tip === "lens") {
      el("circle", {
        cx: fmt(tip.x),
        cy: fmt(tip.y),
        r: "8",
        fill: "#fffdf8",
        stroke: color.stroke,
        "stroke-width": "2.4",
      }, spinner);
      el("circle", {
        cx: fmt(tip.x + 1.2),
        cy: fmt(tip.y),
        r: "2.6",
        fill: color.pupil,
      }, spinner);
      return;
    }

    if (spec.tip === "dot") {
      el("circle", {
        cx: fmt(tip.x),
        cy: fmt(tip.y),
        r: "3.3",
        fill: color.pupil,
      }, spinner);
      return;
    }

    el("circle", {
      cx: fmt(tip.x + 1),
      cy: fmt(tip.y),
      r: "3.4",
      fill: "#fffdf8",
      stroke: color.stroke,
      "stroke-width": "1.7",
    }, spinner);
  }

  function tentacleSpine(spec) {
    const hidden = 20;
    const total = hidden + spec.length;
    const segments = 10;
    const step = total / segments;
    const spine = [];
    let x = -hidden;
    let y = 0;
    let heading = 0;
    for (let i = 0; i <= segments; i += 1) {
      const visible = Math.max(0, x);
      const t = Math.min(1, visible / spec.length);
      const floor = spec.taper < 1 ? 0.36 : 0.07;
      const width = spec.width * (floor + (1 - floor) * (1 - t) ** spec.taper);
      spine.push({ x, y, w: width, along: visible });
      if (i === segments) break;
      if (x > 2) heading += spec.curl * (0.28 + t * 0.4);
      const bow = Math.sin(t * Math.PI * (spec.waves || 1)) * (spec.wave || 0);
      x += Math.cos(heading + bow) * step;
      y += Math.sin(heading + bow) * step;
    }
    return spine;
  }

  function ribbonPath(spine) {
    const left = [];
    const right = [];
    spine.forEach((point, i) => {
      const prev = spine[Math.max(0, i - 1)];
      const next = spine[Math.min(spine.length - 1, i + 1)];
      let tx = next.x - prev.x;
      let ty = next.y - prev.y;
      const mag = Math.hypot(tx, ty) || 1;
      tx /= mag;
      ty /= mag;
      left.push([point.x + -ty * point.w, point.y + tx * point.w]);
      right.push([point.x - -ty * point.w, point.y - tx * point.w]);
    });

    const tip = spine[spine.length - 1];
    const before = spine[spine.length - 2];
    let tx = tip.x - before.x;
    let ty = tip.y - before.y;
    const mag = Math.hypot(tx, ty) || 1;
    tx /= mag;
    ty /= mag;
    const tipX = tip.x + tx * tip.w * 0.95;
    const tipY = tip.y + ty * tip.w * 0.95;

    let d = `M${pair(left[0])}`;
    for (let i = 1; i < left.length - 1; i += 1) {
      const mx = (left[i][0] + left[i + 1][0]) / 2;
      const my = (left[i][1] + left[i + 1][1]) / 2;
      d += `Q${pair(left[i])} ${fmt(mx)} ${fmt(my)}`;
    }
    d += `L${pair(left[left.length - 1])}Q${fmt(tipX)} ${fmt(tipY)} ${pair(right[right.length - 1])}`;
    for (let i = right.length - 2; i > 0; i -= 1) {
      const mx = (right[i][0] + right[i - 1][0]) / 2;
      const my = (right[i][1] + right[i - 1][1]) / 2;
      d += `Q${pair(right[i])} ${fmt(mx)} ${fmt(my)}`;
    }
    d += `L${pair(right[0])}Z`;
    return d;
  }

  function drawProp(svg, prop, color, model) {
    const angle = (prop.angle * Math.PI) / 180;
    const x = model.cx + Math.cos(angle) * prop.distance;
    const y = model.cy + Math.sin(angle) * prop.distance;
    const g = el("g", {
      transform: `translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(prop.rotate)})`,
      stroke: color.stroke,
      "stroke-width": "2.2",
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
    }, svg);

    if (prop.kind === "board") {
      el("rect", { x: "-18", y: "-18", width: "36", height: "36", rx: "3", fill: "#fffdf8" }, g);
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          if ((row + col) % 2 === 0) {
            el("rect", {
              x: fmt(-18 + col * 9),
              y: fmt(-18 + row * 9),
              width: "9",
              height: "9",
              fill: color.stroke,
              "fill-opacity": "0.35",
              stroke: "none",
            }, g);
          }
        }
      }
      el("circle", { cx: "4", cy: "6", r: "3.2", fill: color.pupil, stroke: "none" }, g);
      return;
    }

    if (prop.kind === "paper") {
      el("rect", { x: "-14", y: "-20", width: "28", height: "40", rx: "2", fill: "#fffdf8" }, g);
      ["-12", "-4", "4", "12"].forEach((yLine, index) => {
        const end = index === 3 ? 6 : 10;
        el("path", { d: `M-8 ${yLine}H${end}`, fill: "none" }, g);
      });
      return;
    }

    if (prop.kind === "axis") {
      el("path", { d: "M-52 0H48M-52 -6V10", fill: "none", "stroke-width": "2.6" }, g);
      return;
    }

    if (prop.kind === "keyboard") {
      el("rect", { x: "-24", y: "-12", width: "48", height: "24", rx: "4", fill: "#fffdf8" }, g);
      for (let row = 0; row < 2; row += 1) {
        for (let col = 0; col < 5; col += 1) {
          el("rect", {
            x: fmt(-18 + col * 8),
            y: fmt(-7 + row * 8),
            width: "5",
            height: "4",
            rx: "1",
            fill: color.stroke,
            "fill-opacity": "0.45",
            stroke: "none",
          }, g);
        }
      }
      return;
    }

    el("path", {
      d: "M-4 -16H6M-1 -16V-4L-10 10Q-14 20 -2 20H8Q20 20 16 10L7 -4V-16",
      fill: "#fffdf8",
    }, g);
    el("path", { d: "M-8 8H14", fill: "none" }, g);
    el("circle", { cx: "-2", cy: "6", r: "1.7", fill: color.fill, stroke: "none" }, g);
    el("circle", { cx: "6", cy: "11", r: "1.5", fill: color.fill, stroke: "none" }, g);
  }

  function placeEyes(svg, model, count, color, rand) {
    const eyes = [];
    let guard = 0;
    while (eyes.length < count && guard < 60) {
      guard += 1;
      const slot = eyes.length;
      const angle = ((slot + rand()) / count) * Math.PI * 2 + rand() * 0.4;
      const depth = rand() > 0.4 ? 0.5 + rand() * 0.28 : 0.2 + rand() * 0.24;
      const point = bodyPoint(model, angle, depth);
      const radius = 3.4 + rand() * (rand() > 0.72 ? 6.5 : 3.4);
      const clear = eyes.every((eye) => Math.hypot(eye.x - point.x, eye.y - point.y) > eye.r + radius + 2);
      if (clear) eyes.push({ x: point.x, y: point.y, r: radius });
    }
    eyes.sort((a, b) => b.r - a.r);
    eyes.forEach((eye, index) => {
      const gazeX = (rand() - 0.32) * eye.r * 0.55;
      const gazeY = (rand() - 0.5) * eye.r * 0.5;
      drawEye(svg, eye.x, eye.y, eye.r, color, gazeX, gazeY, index < 3);
    });
  }

  function drawEye(parent, x, y, radius, color, gazeX, gazeY, blink) {
    const g = el("g", { class: blink ? "eye eye--blink" : "eye" }, parent);
    if (blink) {
      const duration = 5.5 + Math.random() * 5;
      g.style.setProperty("--blink-duration", `${duration.toFixed(2)}s`);
      g.style.setProperty("--blink-delay", `${(-Math.random() * 8).toFixed(2)}s`);
    }
    el("circle", {
      cx: fmt(x),
      cy: fmt(y),
      r: fmt(radius),
      fill: "#fffdf8",
      stroke: color.stroke,
      "stroke-width": "1.7",
    }, g);
    const px = x + gazeX;
    const py = y + gazeY;
    el("circle", {
      class: "pupil",
      cx: fmt(px),
      cy: fmt(py),
      r: fmt(radius * 0.4),
      fill: color.pupil,
    }, g);
    if (radius > 5) {
      el("circle", {
        cx: fmt(px - radius * 0.16),
        cy: fmt(py - radius * 0.18),
        r: fmt(radius * 0.13),
        fill: "#fffdf8",
      }, g);
    }
  }

  function bodyPoint(model, angle, depth) {
    const n = model.pts.length;
    let u = angle / (Math.PI * 2);
    u = ((u % 1) + 1) % 1;
    const index = u * n;
    const i0 = Math.floor(index) % n;
    const i1 = (i0 + 1) % n;
    const f = index - Math.floor(index);
    const scale = model.pts[i0].r * (1 - f) + model.pts[i1].r * f;
    return {
      x: model.cx + Math.cos(angle) * model.rx * scale * depth,
      y: model.cy + Math.sin(angle) * model.ry * scale * depth,
    };
  }

  function closedPath(pts) {
    const n = pts.length;
    let d = `M${fmt(pts[0].x)} ${fmt(pts[0].y)}`;
    for (let i = 0; i < n; i += 1) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[(i + 2) % n];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += `C${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(p2.x)} ${fmt(p2.y)}`;
    }
    return `${d}Z`;
  }

  function angleIndex(degrees, count) {
    let u = degrees / 360;
    u = ((u % 1) + 1) % 1;
    return Math.round(u * count) % count;
  }

  function el(name, attrs, parent) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== undefined) node.setAttribute(key, String(value));
    });
    if (parent) parent.append(node);
    return node;
  }

  function mulberry32(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fmt(value) {
    return Number(value).toFixed(1);
  }

  function pair(point) {
    return `${fmt(point[0])} ${fmt(point[1])}`;
  }
})();
