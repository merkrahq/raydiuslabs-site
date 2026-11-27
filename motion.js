/* Raydius Labs motion (stage 10). One IntersectionObserver, no library. Marks reveal targets, staggers each batch by
   --mo-step, replays on re-entry (reset only when fully out of view). html.js is set in <head> only when motion runs. */
(function (d, w) {
  var h = d.documentElement;
  w.__mo = 1;
  if (!h.classList.contains('js')) return;
  var groups = [
    ['.hero .grid>div:first-child>*', 'slow'], ['.hero .mark', 'pop'], ['.hero .chips>li', 'side'], ['.hero .tag', 'up'],
    ['#about .txt>*', 'up'], ['#about .sheet', 'story'], ['#about dl>div', 'up'],
    ['#principles .center>*', 'up'], ['#principles .pc', 'story'], ['#principles .pc .badge', 'pop'],
    ['#contact .ct2-grid>div:first-child>:not(ul)', 'up'], ['#contact .ct2-list>li', 'up'], ['#contact .ct2-card', 'story'], ['#contact .ct2-row', 'up'],
    ['.f1 .top>*', 'up'], ['.f1 .rule', 'story'], ['.f1 .bot>p', 'fade'],
    ['.prose', 'up']
  ];
  var els = [];
  groups.forEach(function (g) {
    d.querySelectorAll(g[0]).forEach(function (el) {
      /* mo-snap: the start state is applied with no transition, or marking an on-screen element would fade it OUT
         over 1 s at load and the reveal would then reverse that fade at a cut duration */
      el.classList.add('mo-r', 'mo-snap'); if (g[1]) el.setAttribute('data-mo', g[1]); els.push(el);
    });
  });
  /* Begins are spaced on one clock, not per observer batch: under smooth scroll siblings cross the line a frame
     apart and land in separate callbacks, so a batch index alone gave 14-16 ms gaps (SOP 6b footgun). Each begin is
     max(now, previous begin + step) on its section's clock, capped 14 steps ahead (a flood of 15 targets still settles
     inside the 3.2 s section budget); a nested target waits 2 extra steps for its parent. A section's clock resets once
     none of its targets is revealed, so a fast scroll past it leaves no backlog. A begin set in a later callback
     than the previous one gets one frame (17 ms) more: a reveal can start a frame after its callback, so 80 ms
     across callbacks measured 63 ms. */
  var step = 80, io = new IntersectionObserver(function (es) {
    /* frame time, not callback time: every transition starts on a frame, so spacing on the frame clock removes the
       one-frame (~17 ms) jitter that callback time gave between batches */
    var now = (d.timeline && d.timeline.currentTime) || performance.now();
    es.forEach(function (e) {
      var el = e.target;
      if (e.isIntersecting) {
        if (el.classList.contains('in')) return;
        var sc = el.__moS, p = el.parentElement.closest('.mo-r'), b = Math.max(now, sc.last + step + (sc.cb < now ? 17 : 0));
        if (p && !p.classList.contains('in-done')) b = Math.max(b, now + 2 * step);
        b = Math.min(b, now + 14 * step); sc.last = Math.max(sc.last, b); sc.cb = now;
        var i = Math.round(b - now);
        el.style.setProperty('--mo-d', i + 'ms');
        el.classList.remove('mo-snap');
        el.classList.add('in');
        clearTimeout(el.__moT);
        el.__moT = setTimeout(function () { el.classList.add('in-done'); el.style.setProperty('--mo-d', '0ms'); }, 2000 + i);
      } else if (el.classList.contains('in')) {
        /* fully out of view: snap back to the start state with no reverse transition, so the replay runs its full
           duration (a reversed transition is shortened by the browser and re-entry then plays a cut reveal) */
        clearTimeout(el.__moT);
        el.classList.add('mo-snap');
        el.classList.remove('in', 'in-done');
        el.style.setProperty('--mo-d', '0ms');
        if (!sc0(el.__moS)) el.__moS.last = -1e9;
      }
    });
  }, { threshold: 0 });
  function sc0(sc) { return sc.els.some(function (x) { return x.classList.contains('in'); }); }
  var clocks = [];
  els.forEach(function (el) {
    var box = el.closest('section, footer, header, main') || d.body, sc = clocks.filter(function (c) { return c.box === box; })[0];
    if (!sc) { sc = { box: box, last: -1e9, cb: 0, els: [] }; clocks.push(sc); }
    sc.els.push(el); el.__moS = sc; io.observe(el);
  });
  var hero = d.querySelector('.hero');
  if (hero) new IntersectionObserver(function (es) { hero.classList.toggle('mo-vis', es[es.length - 1].isIntersecting); }).observe(hero);
})(document, window);
