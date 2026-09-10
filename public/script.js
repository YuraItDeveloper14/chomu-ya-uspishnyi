/* Чому я успішний — Дмитренко Юрій
   Анімації: розбиття заголовків, поява при скролі, лічильники,
   зміна кольорового світу, паралакс, курсор, лайтбокс. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- розбиття заголовків: слова, всередині — літери ---- */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    var n = 0;
    text.split(/\s+/).forEach(function (word, wi) {
      if (wi) {
        var gap = document.createElement('span');
        gap.className = 'sp';
        gap.setAttribute('aria-hidden', 'true');
        el.appendChild(gap);
      }
      var w = document.createElement('span');
      w.className = 'word';
      w.setAttribute('aria-hidden', 'true');
      word.split('').forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'ch';
        s.textContent = ch;
        s.style.setProperty('--n', n++);
        w.appendChild(s);
      });
      el.appendChild(w);
    });
  });

  /* ---- затримки для .reveal ---- */
  document.querySelectorAll('[data-delay]').forEach(function (el) {
    el.style.setProperty('--d', el.dataset.delay);
  });

  /* ---- поява при скролі ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      if (el.hasAttribute('data-split')) el.classList.add('lit');
      else el.classList.add('in');
      if (el.classList.contains('count')) countUp(el);
      io.unobserve(el);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  var hero = document.querySelector('.hero');
  document.querySelectorAll('.reveal, [data-split], .count').forEach(function (el) {
    if (hero.contains(el)) return;   // герой стартує одразу, не чекаючи скролу
    io.observe(el);
  });

  // герой — щойно шрифти готові, щоб літери не стрибали
  function litHero() {
    hero.querySelectorAll('[data-split]').forEach(function (el) { el.classList.add('lit'); });
    hero.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(litHero);
    setTimeout(litHero, 1200);       // запобіжник, якщо шрифти не доїхали
  } else {
    litHero();
  }

  /* ---- лічильники ---- */
  function countUp(el) {
    var to = parseInt(el.dataset.to, 10) || 0;
    if (reduced) { el.textContent = to; return; }
    var start = performance.now(), dur = 1100;
    (function step(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased);
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ---- кольорові світи: та секція, що займає центр екрана ---- */
  var worlds = Array.prototype.slice.call(document.querySelectorAll('[data-world]'));
  document.body.dataset.world = 'neutral';
  function syncWorld() {
    var mid = window.innerHeight / 2, current = 'neutral';
    for (var i = 0; i < worlds.length; i++) {
      var r = worlds[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { current = worlds[i].dataset.world; break; }
    }
    if (document.body.dataset.world !== current) document.body.dataset.world = current;
  }

  /* ---- активний пункт меню ---- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.topbar__nav a'));
  var navIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var link = links.filter(function (a) { return a.hash === '#' + e.target.id; })[0];
      if (link) link.classList.toggle('active', e.isIntersecting);
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('section[id]').forEach(function (s) { navIO.observe(s); });

  /* ---- прогрес + паралакс (один rAF-цикл) ---- */
  var bar = document.querySelector('.progress span');
  var parallax = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]')).map(function (el) {
    return { box: el, target: el.querySelector('img') || el, k: parseFloat(el.dataset.parallax) };
  });
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      syncWorld();
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';

      if (!reduced) {
        var vh = window.innerHeight;
        parallax.forEach(function (p) {
          var r = p.box.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          var mid = r.top + r.height / 2 - vh / 2;
          var cap = r.height * 0.05;                       // запас, який дає scale(1.12)
          var y = Math.max(-cap, Math.min(cap, -mid * p.k));
          p.target.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0) scale(1.12)';
        });
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---- курсор ---- */
  var cursor = document.querySelector('.cursor');
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.add('on');
    });
    (function loop() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a, img[data-zoom], button').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('grow'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('grow'); });
    });
  }

  /* ---- лайтбокс ---- */
  var box = document.getElementById('lightbox');
  var boxImg = box.querySelector('img');
  function closeBox() { box.hidden = true; document.body.style.overflow = ''; }

  document.querySelectorAll('img[data-zoom]').forEach(function (img) {
    img.addEventListener('click', function () {
      boxImg.src = img.src;
      boxImg.alt = img.alt;
      box.hidden = false;
      document.body.style.overflow = 'hidden';
    });
  });
  box.addEventListener('click', function (e) { if (e.target !== boxImg) closeBox(); });
  box.querySelector('.lightbox__close').addEventListener('click', closeBox);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeBox(); });

  /* ---- рік у футері ---- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
