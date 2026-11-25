/* seyo.. landing — shared renderers (photo calendar, task board), fit-scaling, reveal */
(function () {
  const STAR = 'M12 1.5l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 8.7l7.1-.6z';

  /* ---------- photo calendar (ref 13): Aug 2025, one photo a day ---------- */
  const TINTS = [
    ['#fceef3', '#f6dde6'], ['#eef4fb', '#dce8f6'], ['#f6f6f8', '#eaeaee'],
    ['#f4f0fa', '#e6def4'], ['#fff9ec', '#f6eed6'], ['#eff6f1', '#dcebe1'],
  ];
  const SHAPES = { 8: 'circle', 14: 'heart', 19: 'circle' };
  const FILLED_UP_TO = 25;
  const TODAY = 16;

  function calendar() {
    const offset = 5; // 1 Aug 2025 is a Friday
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = i - offset + 1;
      if (d < 1 || d > 31) { cells.push('<div class="pcal__cell"></div>'); continue; }
      const [a, b] = TINTS[d % TINTS.length];
      const bg = `background:linear-gradient(135deg,${a},${b})`;
      let photo = '';
      if (d <= FILLED_UP_TO) {
        if (SHAPES[d] === 'circle') photo = `<i class="pcal__photo pcal__photo--circle" style="${bg}"></i>`;
        else if (SHAPES[d] === 'heart') photo = `<svg class="pcal__photo pcal__photo--heart" viewBox="0 0 64 58" aria-hidden="true"><path d="M32 54C14 41 4 31 4 18 4 9 11 4 18.5 4 25 4 29.5 8 32 12.5 34.5 8 39 4 45.5 4 53 4 60 9 60 18 60 31 50 41 32 54Z" fill="${a}" stroke="#fff" stroke-width="3"/></svg>`;
        else photo = `<i class="pcal__photo" style="${bg}"></i>`;
      }
      cells.push(`<div class="pcal__cell${d === TODAY ? ' pcal__today' : ''}"><span>${d}</span>${photo}</div>`);
    }
    return `
      <div class="pcal" role="img" aria-label="2025년 8월, 하루 한 장 사진으로 채운 캘린더">
        <div class="pcal__side">
          <div class="pcal__month">08</div>
          <div class="pcal__mini"><strong>09</strong>S M T W T F S
      1 2 3 4 5 6
7 8 9 10 11 12 13
14 15 16 17 18 19 20
21 22 23 24 25 26 27
28 29 30</div>
        </div>
        <div>
          <div class="pcal__head"><span>August</span><span>2025</span></div>
          <div class="pcal__dow"><span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span></div>
          <div class="pcal__grid">${cells.join('')}</div>
        </div>
      </div>`;
  }

  /* ---------- team task board (tokens from the real IDly index) ---------- */
  const MEMBERS = [
    { role: '팀장', tone: 'pink', pts: 1, tasks: [['done', '주간회의 진행과 회의록', '완료  +1점']] },
    { role: 'BE', tone: 'blue', pts: 0, tasks: [['doing', '로그인 API 구현', '진행 중  11/27까지']] },
    { role: 'PM', tone: 'pink', pts: 0, tasks: [['doing', '고객 인터뷰 5건', '진행 중  11/26까지']] },
    { role: 'FE', tone: 'blue', pts: 0, tasks: [['todo', '메인 화면 퍼블리싱', '미진행  11/28까지']] },
    { role: 'DE', tone: 'pink', pts: 0, tasks: [] },
  ];
  function board() {
    const cols = MEMBERS.map(m => `
      <div class="tb__col">
        <div class="tb__who"><span class="av av--${m.tone}">${m.role}</span><span>${m.pts}점</span></div>
        ${m.tasks.length ? m.tasks.map(([s, t, meta]) => `<div class="task${s === 'done' ? ' task--done' : ''}"><i class="mark mark--${s}"></i><div>${t}<small>${meta}</small></div></div>`).join('') : '<div class="empty">업무 없음</div>'}
      </div>`).join('');
    return `
      <div class="tb" role="img" aria-label="팀 태스크 DB 팀원별 보드 화면">
        <div class="tb__top"><h4>팀 태스크 DB</h4><div><button tabindex="-1">댓글</button><button tabindex="-1">프로필 선택</button></div></div>
        <div class="tb__tabs">
          <div class="tb__seg"><span class="on">팀원별</span><span>달력</span><span>R&amp;R 현황</span><span class="gap"></span><span class="on">주간</span><span>월간</span><span>연간</span></div>
          <strong>‹  11월 23일 ~ 29일  ›</strong>
        </div>
        <div class="tb__cols">${cols}</div>
      </div>`;
  }

  document.querySelectorAll('[data-render="calendar"]').forEach(el => { el.innerHTML = calendar(); });
  document.querySelectorAll('[data-render="board"]').forEach(el => { el.innerHTML = board(); });
  document.querySelectorAll('[data-render="star"]').forEach(el => {
    el.innerHTML = `<svg class="star" viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR}" stroke-width="${el.dataset.stroke || 0.18}"/></svg>`;
  });

  /* ---------- fit fixed-width mockups into their containers ---------- */
  function fit() {
    document.querySelectorAll('[data-fit]').forEach(el => {
      const box = el.parentElement;
      const child = el.querySelector('.tb, .pcal') || el.firstElementChild;
      if (!child) return;
      el.style.transform = 'none';
      const natural = child.offsetWidth;
      const target = box.clientWidth * parseFloat(el.dataset.fit);
      const max = parseFloat(el.dataset.max || '1');
      const s = Math.min(max, target / natural);
      el.style.transform = el.classList.contains('fit') ? `translateX(-50%) scale(${s})` : `scale(${s})`;
      el.style.width = natural + 'px';
    });
  }
  fit();
  window.addEventListener('resize', fit);
  document.fonts && document.fonts.ready.then(fit);

  /* ---------- index rows ---------- */
  document.querySelectorAll('tr[data-href]').forEach(tr => {
    tr.addEventListener('click', () => { location.href = tr.dataset.href; });
  });

  /* ---------- "세요": wrap every occurrence, animate on scroll ---------- */
  const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT, {
    acceptNode: n => (n.nodeValue.includes('세요') && !n.parentElement.closest('script, style, svg, .seyo'))
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  });
  const hits = [];
  while (walker.nextNode()) hits.push(walker.currentNode);
  hits.forEach(node => {
    const frag = document.createDocumentFragment();
    node.nodeValue.split(/(세요)/).forEach(part => {
      if (part !== '세요') { if (part) frag.append(part); return; }
      const s = document.createElement('span');
      s.className = 'seyo';
      // gradient-filled text renders optically thinner, so nudge the variable weight up to match its neighbours
      const w = Math.min(900, (parseInt(getComputedStyle(node.parentElement).fontWeight, 10) || 400) + 60);
      s.style.fontWeight = w;
      s.innerHTML = '<i style="--i:0">세</i><i style="--i:1">요</i>';
      frag.append(s);
    });
    // in flex/grid parents (buttons) each node would become its own item and get the gap — keep the phrase together
    const disp = getComputedStyle(node.parentElement).display;
    if (/flex|grid/.test(disp)) { const wrap = document.createElement('span'); wrap.append(frag); node.replaceWith(wrap); }
    else node.replaceWith(frag);
  });
  const seyos = document.querySelectorAll('.seyo');
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { setTimeout(() => e.target.classList.add('is-on'), 200); so.unobserve(e.target); }
    }), { rootMargin: '0px 0px -12% 0px' });
    seyos.forEach(el => so.observe(el));
  } else {
    seyos.forEach(el => el.classList.add('is-on'));
  }

  /* ---------- analytics: request-form CTA clicks → dataLayer (GTM) ---------- */
  document.querySelectorAll('a[href*="docs.google.com/forms"]').forEach(a => {
    a.addEventListener('click', () => {
      (window.dataLayer = window.dataLayer || []).push({
        event: 'cta_click',
        cta_text: a.textContent.trim(),
        cta_location: (a.closest('section, header, footer') || {}).id || a.closest('section, header, footer')?.className || 'unknown',
        page_path: location.pathname,
      });
    });
  });

  /* ---------- reveal ---------- */
  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -10% 0px' });
    els.forEach(el => io.observe(el));
  } else {
    els.forEach(el => el.classList.add('is-in'));
  }
})();
