const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- reveal on scroll ---------------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* ---------------- hero: curved card ring ---------------- */
(function ring() {
  const stage = document.getElementById('ring-stage');
  const cards = [...document.querySelectorAll('.ring-card')];
  if (!stage || !cards.length) return;

  const n = cards.length;
  const step = 16;              // degrees between cards
  const span = step * n;        // full loop length in degrees
  let offset = 0;               // current drift in degrees
  let hot = null;               // hovered card
  let dragging = false;
  let dragMoved = 0;
  let lastX = 0;
  let geom = {};

  function measure() {
    const w = stage.clientWidth;
    const small = w < 640;
    geom = {
      radius: small ? w * 1.05 : Math.min(980, w * 0.7),
      depth: small ? 120 : 170,
      cardW: small ? 120 : Math.max(150, Math.min(215, w * 0.15)),
      lift: small ? 18 : 34,
      maxAngle: small ? 58 : 72,
    };
    cards.forEach((c, i) => {
      const scale = c.classList.contains('tall') ? 0.62 : 1;
      c.style.setProperty('--w', `${Math.round(geom.cardW * scale * (0.92 + ((i * 37) % 17) / 100))}px`);
    });
  }

  function wrap(a) {
    let x = ((a + span / 2) % span + span) % span - span / 2;
    return x;
  }

  function render() {
    const { radius, depth, lift, maxAngle } = geom;
    cards.forEach((card, i) => {
      const theta = wrap((i - (n - 1) / 2) * step + offset);
      const rad = (theta * Math.PI) / 180;
      const x = radius * Math.sin(rad);
      const z = radius * (1 - Math.cos(rad)) - depth;
      const y = (1 - Math.cos(rad)) * lift * 2.2;
      const isHot = card === hot;
      const fade = Math.abs(theta) > maxAngle ? Math.max(0, 1 - (Math.abs(theta) - maxAngle) / 10) : 1;
      card.style.transform =
        `translate3d(${x}px, calc(-50% + ${y}px), ${z + (isHot ? 90 : 0)}px) rotateY(${-theta * 0.9}deg) scale(${isHot ? 1.05 : 1})`;
      card.style.opacity = fade.toFixed(3);
      card.style.zIndex = String(1000 + Math.round(z));
      card.style.pointerEvents = fade < 0.2 ? 'none' : 'auto';
    });
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(64, now - last);
    last = now;
    if (!reduceMotion && !hot && !dragging) offset -= dt * 0.0042; // slow drift
    render();
    requestAnimationFrame(tick);
  }

  cards.forEach((card) => {
    card.addEventListener('pointerenter', () => { hot = card; card.classList.add('is-hot'); });
    card.addEventListener('pointerleave', () => { if (hot === card) hot = null; card.classList.remove('is-hot'); });
    card.addEventListener('focus', () => { hot = card; card.classList.add('is-hot'); });
    card.addEventListener('blur', () => { hot = null; card.classList.remove('is-hot'); });
    card.addEventListener('click', (e) => { if (dragMoved > 6) e.preventDefault(); });
    card.addEventListener('dragstart', (e) => e.preventDefault());
  });

  stage.addEventListener('pointerdown', (e) => {
    dragging = true; dragMoved = 0; lastX = e.clientX;
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    dragMoved += Math.abs(dx);
    offset += dx * 0.06;
  });
  window.addEventListener('pointerup', () => { dragging = false; });

  measure();
  render();
  window.addEventListener('resize', () => { measure(); render(); });
  requestAnimationFrame(tick);
})();

/* ---------------- practice slideshow ---------------- */
(function practice() {
  const slidesEl = document.getElementById('slides');
  const list = document.getElementById('practice-list');
  if (!slidesEl || !list) return;
  const title = document.getElementById('slide-title');
  const desc = document.getElementById('slide-desc');
  const pauseBtn = document.getElementById('slide-pause');

  const tokenSlide = `
    <div class="token-slide">
      <div><small>Figma</small><b>Action / Primary</b></div><em>→</em>
      <div><small>Contract</small><b>mapped by meaning</b></div><em>→</em>
      <div><small>Code</small><b>color.action.primary</b></div>
    </div>`;

  const fields = [
    { title: 'CodeAgent Workbench', desc: 'Ocean token system, MCP-readable components, and interactive HTML prototypes.', href: '#codeagent',
      items: ['assets/codeagent-light.png', 'assets/prototype-hifi.png', 'assets/prototype-home.png', 'assets/prototype-inbox.png', 'assets/prototype-login.png'] },
    { title: 'Farris FlowCanvas', desc: 'Schema-driven agent workflow editor with reusable nodes and routed ports.', href: '#flowcanvas',
      items: ['assets/flowcanvas-property-panel.png', 'assets/flowcanvas-routing.png', 'assets/flowcanvas-architecture.png'] },
    { title: 'Attention badge & wireframes', desc: 'Interaction rules for one trustworthy red dot, plus twenty requirement wireframes.', href: '#badge',
      items: ['assets/work/badge.jpg', 'assets/work/wf-fused-workbench.jpg', 'assets/work/wf-workspace-nav.jpg', 'assets/work/wf-team-home.jpg', 'assets/work/wf-onboarding.jpg'] },
    { title: 'TikTok Shop Figma-to-code', desc: 'A semantic token contract between design files and a multi-region creator codebase.', href: '#tiktok',
      items: [{ html: tokenSlide }] },
  ];

  let field = 0, idx = 0, timer = null, paused = false;

  function build() {
    const f = fields[field];
    slidesEl.innerHTML = f.items.map((it, i) =>
      typeof it === 'string'
        ? `<figure class="${i === 0 ? 'on' : ''}"><a href="${f.href}"><img src="${it}" alt="${f.title} — image ${i + 1}" loading="lazy"></a></figure>`
        : `<figure class="${i === 0 ? 'on' : ''}"><a href="${f.href}">${it.html}</a></figure>`
    ).join('');
    title.textContent = f.title;
    desc.textContent = f.desc;
    idx = 0;
  }
  function show(i) {
    const figs = slidesEl.querySelectorAll('figure');
    idx = (i + figs.length) % figs.length;
    figs.forEach((fg, k) => fg.classList.toggle('on', k === idx));
  }
  function restart() {
    clearInterval(timer);
    if (!paused && !reduceMotion) timer = setInterval(() => show(idx + 1), 3800);
  }

  list.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      list.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
      field = Number(btn.dataset.field);
      build(); restart();
    });
  });
  document.getElementById('slide-prev').addEventListener('click', () => { show(idx - 1); restart(); });
  document.getElementById('slide-next').addEventListener('click', () => { show(idx + 1); restart(); });
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? '▶' : '❙❙';
    pauseBtn.setAttribute('aria-label', paused ? 'Play' : 'Pause');
    restart();
  });

  build(); restart();
})();

/* ---------------- FlowCanvas interactive reconstruction ---------------- */
(function flow() {
  const stage = document.querySelector('#workflow-stage');
  const edgeLayer = document.querySelector('#edges');
  const panel = document.querySelector('#property-panel');
  const nodes = [...document.querySelectorAll('.flow-node')];
  if (!stage || !edgeLayer || !nodes.length) return;

  const nodeDetails = {
    trigger: { title: 'Input', type: 'Trigger', variable: 'user_request', required: true },
    agent: { title: 'Plan', type: 'Agent', variable: 'plan_result', required: true },
    knowledge: { title: 'Retrieve', type: 'Knowledge', variable: 'context_pack', required: false },
    output: { title: 'Validate', type: 'Output', variable: 'verified_result', required: true },
  };

  const centerOf = (node) => ({ x: node.offsetLeft + node.offsetWidth / 2, y: node.offsetTop + node.offsetHeight / 2 });
  function curve(from, to) {
    const a = centerOf(from), b = centerOf(to);
    const bend = Math.max(55, Math.abs(b.x - a.x) * 0.45);
    return `M ${a.x + from.offsetWidth / 2 - 8} ${a.y} C ${a.x + bend} ${a.y}, ${b.x - bend} ${b.y}, ${b.x - to.offsetWidth / 2 + 8} ${b.y}`;
  }
  function drawEdges() {
    edgeLayer.setAttribute('viewBox', `0 0 ${stage.clientWidth} ${stage.clientHeight}`);
    edgeLayer.innerHTML = [[0, 1], [0, 2], [1, 3], [2, 3]].map(([a, b]) => `<path d="${curve(nodes[a], nodes[b])}" />`).join('');
  }
  function selectNode(node) {
    nodes.forEach((item) => item.classList.toggle('selected', item === node));
    const d = nodeDetails[node.dataset.node];
    if (panel) panel.innerHTML = `<p>PROPERTIES</p><h4>${d.title}</h4><label>Node type<input value="${d.type}" readonly></label><label>Variable<input value="${d.variable}" readonly></label><label>Required<span class="toggle ${d.required ? 'on' : ''}"></span></label>`;
  }

  nodes.forEach((node) => {
    node.addEventListener('pointerdown', (event) => {
      selectNode(node);
      node.setPointerCapture(event.pointerId);
      const start = { x: event.clientX, y: event.clientY, left: node.offsetLeft, top: node.offsetTop };
      const move = (m) => {
        const maxX = stage.clientWidth - node.offsetWidth;
        const maxY = stage.clientHeight - node.offsetHeight;
        node.style.left = `${Math.max(0, Math.min(maxX, start.left + m.clientX - start.x))}px`;
        node.style.top = `${Math.max(0, Math.min(maxY, start.top + m.clientY - start.y))}px`;
        drawEdges();
      };
      const up = () => { node.removeEventListener('pointermove', move); node.removeEventListener('pointerup', up); };
      node.addEventListener('pointermove', move);
      node.addEventListener('pointerup', up);
    });
  });
  window.addEventListener('resize', drawEdges);
  requestAnimationFrame(drawEdges);
})();

/* ---------------- case-study TOC highlight ---------------- */
(function toc() {
  const links = [...document.querySelectorAll('.cs-toc a')];
  if (!links.length) return;
  const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((a) => a.classList.remove('on'));
        const a = map.get(e.target.id);
        if (a) a.classList.add('on');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
})();

/* ---------------- TikTok creator-home prototype (public-safe reconstruction) ---------------- */
(function creatorProto() {
  const track = document.getElementById('car-track');
  if (!track) return;
  const dotsEl = document.getElementById('car-dots');
  const log = document.getElementById('proto-log');
  const fallbackBox = document.getElementById('fallback');

  // copy deck: missing entries are intentional to show fallback behaviour
  const copy = {
    starter:  { en: ['Start your first campaign', 'Earn a bonus on your first 5 orders', 'Join now'],
                es: ['Empieza tu primera campaña', 'Gana un bono en tus primeros 5 pedidos', 'Unirme'],
                id: ['Mulai kampanye pertamamu', 'Dapatkan bonus untuk 5 pesanan pertama', 'Gabung sekarang'],
                th: ['เริ่มแคมเปญแรกของคุณวันนี้เลย', 'รับโบนัสพิเศษสำหรับคำสั่งซื้อ 5 รายการแรกของคุณ', 'เข้าร่วมเลยตอนนี้'],
                vi: ['Bắt đầu chiến dịch đầu tiên của bạn ngay hôm nay', 'Nhận thưởng cho 5 đơn hàng đầu tiên', 'Tham gia ngay'] },
    bfcm:     { en: ['Black Friday creator rewards', 'Higher commission on featured products', 'See products'],
                es: ['Recompensas de Black Friday para creadores', 'Más comisión en productos destacados', 'Ver productos'],
                id: ['Hadiah kreator Black Friday', 'Komisi lebih tinggi untuk produk unggulan', 'Lihat produk'],
                th: ['รางวัลสำหรับครีเอเตอร์ช่วงแบล็กฟรายเดย์', 'ค่าคอมมิชชันสูงขึ้นสำหรับสินค้าแนะนำ', 'ดูสินค้าทั้งหมด'] /* vi missing */ },
    fashion:  { en: ['Fall fashion week', 'Samples shipped to top fashion creators', 'Request samples'],
                es: ['Semana de la moda de otoño', 'Muestras para creadores de moda destacados', 'Pedir muestras'],
                id: ['Pekan mode musim gugur', 'Sampel dikirim ke kreator fesyen terbaik', 'Minta sampel'],
                vi: ['Tuần lễ thời trang mùa thu', 'Gửi mẫu cho nhà sáng tạo thời trang hàng đầu', 'Yêu cầu mẫu'] /* th missing */ },
    live:     { en: ['Go live this weekend', 'Boosted traffic for scheduled LIVE sessions', 'Schedule LIVE'],
                es: ['Transmite en vivo este fin de semana', 'Más tráfico para transmisiones programadas', 'Programar LIVE'],
                id: ['Siaran LIVE akhir pekan ini', 'Trafik ditingkatkan untuk LIVE terjadwal', 'Jadwalkan LIVE'],
                th: ['ไลฟ์สดสุดสัปดาห์นี้', 'เพิ่มยอดผู้ชมสำหรับไลฟ์ที่ตั้งเวลาไว้ล่วงหน้า', 'ตั้งเวลาไลฟ์'],
                vi: ['Phát trực tiếp cuối tuần này', 'Tăng lượt xem cho phiên LIVE đã lên lịch', 'Lên lịch LIVE'] },
  };
  const colors = { starter: '#2f6bff', bfcm: '#111214', fashion: '#c2416b', live: '#e8590c' };
  const bySegment = { new: ['starter', 'bfcm', 'live'], fashion: ['fashion', 'bfcm', 'starter'], live: ['live', 'bfcm', 'fashion'] };

  let segment = 'new', lang = 'en', idx = 0, timer = null;

  function text(key) {
    const entry = copy[key][lang];
    if (entry) return { t: entry, missing: false };
    if (fallbackBox.checked) return { t: copy[key].en, missing: true };
    return { t: [`campaign.${key}.title`, `campaign.${key}.subtitle`, `campaign.${key}.cta`], missing: true };
  }
  function render() {
    const keys = bySegment[segment];
    track.innerHTML = keys.map((k, i) => {
      const { t } = text(k);
      return `<div class="car-slide" data-i="${i}" style="background:linear-gradient(135deg, ${colors[k]}, ${colors[k]}cc)"><div><h5>${t[0]}</h5><p>${t[1]}</p></div><span class="cta">${t[2]}</span></div>`;
    }).join('');
    dotsEl.innerHTML = keys.map((_, i) => `<i data-i="${i}" class="${i === idx ? 'on' : ''}"></i>`).join('');
    go(idx, false);
  }
  function go(i) {
    const n = bySegment[segment].length;
    idx = (i + n) % n;
    track.style.transform = `translateX(-${idx * 100}%)`;
    dotsEl.querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k === idx));
  }
  function restart() {
    clearInterval(timer);
    if (!reduceMotion) timer = setInterval(() => go(idx + 1), 3200);
  }
  function seg(id, onPick) {
    const el = document.getElementById(id);
    el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      el.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      onPick(b.dataset.v);
    }));
  }
  seg('seg-segment', (v) => { segment = v; idx = 0; render(); restart(); log.textContent = `Targeting: ${v === 'new' ? 'new creator' : v === 'fashion' ? 'fashion seller' : 'live host'} — slide order changed.`; });
  seg('seg-lang', (v) => {
    lang = v; render(); restart();
    const missing = bySegment[segment].filter((k) => !copy[k][v]);
    log.textContent = missing.length
      ? `${missing.length} slide(s) have no ${v.toUpperCase()} copy — ${fallbackBox.checked ? 'falling back to English.' : 'showing raw keys. Turn fallback on.'}`
      : 'All slides translated. Watch how long titles clamp to two lines.';
  });
  fallbackBox.addEventListener('change', () => { render(); log.textContent = fallbackBox.checked ? 'Fallback on: missing copy shows English.' : 'Fallback off: this is what creators would have seen.'; });
  track.addEventListener('click', (e) => {
    const s = e.target.closest('.car-slide'); if (!s) return;
    const key = bySegment[segment][Number(s.dataset.i)];
    log.textContent = `Tap tracked → slide ${Number(s.dataset.i) + 1} · campaign "${key}" · segment ${segment} · ${lang.toUpperCase()}`;
  });
  dotsEl.addEventListener('click', (e) => { const d = e.target.closest('i'); if (d) { go(Number(d.dataset.i)); restart(); } });
  let sx = null;
  track.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  track.addEventListener('pointerup', (e) => { if (sx === null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 30) { go(idx + (dx < 0 ? 1 : -1)); restart(); } sx = null; });
  render(); restart();
})();

/* ---------------- click any figure image to view it full size ---------------- */
(function zoom() {
  const imgs = [...document.querySelectorAll('main img')].filter((i) => !i.closest('a, .phone, .mini, .ring'));
  if (!imgs.length) return;
  const box = document.createElement('div');
  box.className = 'zoom-box';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Image viewer');
  box.innerHTML = '<button class="zoom-close" aria-label="Close">×</button><div class="zoom-scroll"><img alt=""></div><p class="zoom-cap"></p>';
  document.body.appendChild(box);
  const big = box.querySelector('img');
  const cap = box.querySelector('.zoom-cap');
  const scroller = box.querySelector('.zoom-scroll');
  let last = null;
  function open(img) {
    last = img;
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    const fc = img.closest('figure')?.querySelector('figcaption');
    cap.textContent = fc ? fc.textContent : img.alt;
    box.classList.remove('actual');
    box.classList.add('on');
    document.documentElement.style.overflow = 'hidden';
    box.querySelector('.zoom-close').focus();
  }
  function close() {
    box.classList.remove('on');
    document.documentElement.style.overflow = '';
    last?.focus?.();
  }
  imgs.forEach((img) => {
    img.classList.add('zoomable');
    img.tabIndex = 0;
    img.addEventListener('click', () => open(img));
    img.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); } });
  });
  big.addEventListener('click', (e) => {
    e.stopPropagation();
    box.classList.toggle('actual');
    if (box.classList.contains('actual')) scroller.scrollTo(0, 0);
  });
  box.addEventListener('click', (e) => { if (e.target === box || e.target === scroller || e.target.classList.contains('zoom-close')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('on')) close(); });
})();
