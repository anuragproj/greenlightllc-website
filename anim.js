/* anim.js, greenlightllc.us (The Useful Pause). Creative-director prototype v1, 2026-10-09.
   Plays each margin note once, when it scrolls into view. About 2 KB. No cookies, no tracking, no network.
   Without this file, or when the reader asks for reduced motion, the page shows every mark already drawn.
   How it works:
   - It adds the class "anim" to <html>. style.css only hides or moves things under html.anim.
   - Each block with data-anim is watched. When it comes into view, it gets the class "on" (style.css then
     plays the moves), and every path inside an <svg class="dr"> draws itself (stroke-dashoffset).
     data-d on that svg is the delay in seconds and data-t the drawing time.
   - A .type line is split into words, which appear one after another. */
(function () {
  var root = document.documentElement;
  if (!('IntersectionObserver' in window) || !window.matchMedia ||
      !matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
  root.classList.add('anim');

  // The on-screen length of a path. Stretchy marks use non-scaling strokes, whose dashes are in screen pixels.
  function len(p) {
    var n = p.getTotalLength();
    if (p.getAttribute('vector-effect') !== 'non-scaling-stroke') return n;
    var m = p.getScreenCTM(), L = 0, a = null, i, q, x, y;
    if (!m) return 0;
    for (i = 0; i <= 40; i++) {
      q = p.getPointAtLength(n * i / 40);
      x = m.a * q.x + m.c * q.y; y = m.b * q.x + m.d * q.y;
      if (a) L += Math.sqrt((x - a[0]) * (x - a[0]) + (y - a[1]) * (y - a[1]));
      a = [x, y];
    }
    return L;
  }

  function prep(block) {
    block.querySelectorAll('svg.dr path').forEach(function (p) {
      var r = p.getBoundingClientRect();
      if (!r.width && !r.height) return;       // hidden at this width (display none): leave it drawn
      var L = len(p) + 2;
      if (L < 4) return;
      p.style.strokeDasharray = L + ' ' + L;
      p.style.strokeDashoffset = L;
      p.__dr = 1;
    });
    if (block.classList.contains('type')) {    // split the words, keep the text the same
      var words = [], k = 0;
      [].slice.call(block.childNodes).forEach(function (t) {
        if (t.nodeType !== 3) return;
        t.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { block.insertBefore(document.createTextNode(w), t); return; }
          var s = document.createElement('span'); s.className = 'w'; s.textContent = w;
          s.style.transitionDelay = (0.08 + 0.07 * k++) + 's';
          block.insertBefore(s, t); words.push(s);
        });
        block.removeChild(t);
      });
      block.style.setProperty('--typed', (0.15 + 0.07 * k) + 's');
    }
    block.classList.add('ready');
  }

  function play(block) {
    block.querySelectorAll('svg.dr').forEach(function (s) {
      var d = s.getAttribute('data-d') || '0', t = s.getAttribute('data-t') || '.5';
      s.querySelectorAll('path').forEach(function (p, j) {
        if (!p.__dr) return;
        // rough.js draws each line twice; the second pass follows a little behind, like a pen going over it
        p.style.transition = 'stroke-dashoffset ' + t + 's cubic-bezier(.45,0,.25,1) ' + (+d + (j % 2) * 0.08) + 's';
        p.style.strokeDashoffset = '0';
        p.addEventListener('transitionend', function () {   // drop the dash, so a later resize can't cut the line
          p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; p.style.transition = '';
        }, { once: true });
      });
    });
    block.classList.add('on');
  }

  function start() {
    try {
      var blocks = document.querySelectorAll('[data-anim]');
      blocks.forEach(prep);
      document.body.getBoundingClientRect();   // commit the hidden state before anything plays
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); play(e.target); } });
      }, { rootMargin: '0px 0px -18% 0px' });
      blocks.forEach(function (b) { io.observe(b); });
    } catch (err) {
      root.classList.remove('anim');           // anything odd: show the finished page
      document.querySelectorAll('svg.dr path').forEach(function (p) { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
