/* Hero speech bubbles: drop in with gravity, pile up, drag & throw (desktop), tilt to slide (mobile).
   Falls back to the static CSS layout when Matter.js is missing or reduced motion is requested. */
(function () {
  const cover = document.querySelector('.cover');
  if (!cover || !window.Matter) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const { Engine, Bodies, Body, Composite, Constraint } = Matter;
  const clip = cover.querySelector('.cover__clip');
  let els = [...clip.querySelectorAll('.bubble')];
  if (!els.length) return;

  let engine, bodies = [], walls = [], W = 0, H = 0, running = false, raf = 0, drag = null;

  // clip size in its own (possibly CSS-zoomed) coordinates, and the screen→local scale
  const localPoint = e => {
    const r = clip.getBoundingClientRect();
    const z = r.width / clip.clientWidth || 1;
    return { x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z };
  };

  function buildWalls() {
    if (walls.length) Composite.remove(engine.world, walls);
    const t = 200;
    walls = [
      Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }),          // floor
      Bodies.rectangle(-t / 2, H / 2 - H, t, H * 4, { isStatic: true }),         // left
      Bodies.rectangle(W + t / 2, H / 2 - H, t, H * 4, { isStatic: true }),      // right
      Bodies.rectangle(W / 2, -H * 2 - t / 2, W * 3, t, { isStatic: true }),     // high ceiling
    ];
    Composite.add(engine.world, walls);
  }

  function start() {
    cover.classList.add('is-physics');
    els = els.filter(el => el.offsetWidth > 0); // mobile shows fewer bubbles
    W = clip.clientWidth; H = clip.clientHeight;
    engine = Engine.create();
    engine.gravity.y = 1;
    buildWalls();

    bodies = els.map((el, i) => {
      el.style.left = '0px'; el.style.top = '0px';
      const w = el.offsetWidth, h = el.offsetHeight;
      const x = Math.min(W - w / 2 - 4, Math.max(w / 2 + 4, (W * (0.18 + 0.64 * ((i * 0.37) % 1)))));
      const y = -h - i * (h + 26) - 20;
      const b = Bodies.rectangle(x, y, w, h, {
        chamfer: { radius: h / 2 - 1 }, restitution: 0.35, friction: 0.35, frictionAir: 0.012, density: 0.0016,
        angle: ((i % 2 ? 1 : -1) * (4 + (i * 7) % 9)) * Math.PI / 180,
      });
      if (W < 560) { Body.setInertia(b, b.inertia * 10); Body.setAngle(b, b.angle * 0.3); } // narrow screens: lie flat, less tumbling
      b.el = el; b.w = w; b.h = h;
      return b;
    });
    Composite.add(engine.world, bodies);
    render();
    observe();
  }

  function render() {
    for (const b of bodies) {
      b.el.style.transform = `translate(${b.position.x - b.w / 2}px, ${b.position.y - b.h / 2}px) rotate(${b.angle}rad)`;
    }
  }

  let last = 0;
  function loop(t) {
    const dt = Math.min(1000 / 30, last ? t - last : 1000 / 60);
    last = t;
    Engine.update(engine, dt);
    render();
    raf = requestAnimationFrame(loop);
  }
  function play() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(loop); } }
  function pause() { running = false; cancelAnimationFrame(raf); }

  function observe() {
    if (!('IntersectionObserver' in window)) return play();
    new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()), { threshold: 0 }).observe(cover);
  }

  /* drag & throw */
  clip.addEventListener('pointerdown', e => {
    const el = e.target.closest('.bubble');
    if (!el) return;
    const b = bodies.find(x => x.el === el);
    if (!b) return;
    const p = localPoint(e);
    const local = Matter.Vector.rotate(Matter.Vector.sub(p, b.position), -b.angle);
    drag = Constraint.create({ pointA: p, bodyB: b, pointB: local, stiffness: 0.18, damping: 0.12, length: 0 });
    Composite.add(engine.world, drag);
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-grabbed');
    requestTilt();
  });
  clip.addEventListener('pointermove', e => { if (drag) drag.pointA = localPoint(e); });
  const release = e => {
    if (!drag) return;
    drag.bodyB.el.classList.remove('is-grabbed');
    Composite.remove(engine.world, drag);
    drag = null;
  };
  clip.addEventListener('pointerup', release);
  clip.addEventListener('pointercancel', release);

  /* tilt (phones): gravity follows the device */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function onTilt(e) {
    if (e.gamma == null || e.beta == null) return;
    engine.gravity.x = clamp(e.gamma / 30, -1, 1);
    engine.gravity.y = clamp((e.beta - 10) / 40, -0.6, 1);
  }
  let tiltAsked = false;
  function requestTilt() {
    if (tiltAsked || !window.DeviceOrientationEvent) return;
    tiltAsked = true;
    const P = DeviceOrientationEvent.requestPermission;
    if (typeof P === 'function') {
      P.call(DeviceOrientationEvent).then(s => { if (s === 'granted') window.addEventListener('deviceorientation', onTilt); }).catch(() => {});
    }
  }
  // Android/desktop browsers that don't need permission
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    window.addEventListener('deviceorientation', onTilt);
  }
  cover.addEventListener('click', requestTilt, { once: true });

  /* keep the box in sync with layout changes */
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (!engine) return;
      W = clip.clientWidth; H = clip.clientHeight;
      buildWalls();
      for (const b of bodies) {
        if (b.position.x > W - b.w / 2) Body.setPosition(b, { x: W - b.w / 2 - 4, y: b.position.y });
        if (b.position.y > H) Body.setPosition(b, { x: b.position.x, y: H - b.h });
      }
    }, 150);
  });

  const go = () => requestAnimationFrame(start);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else window.addEventListener('load', go);
})();
