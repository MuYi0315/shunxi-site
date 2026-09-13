/* =========================================================
   曾舜晞 · 特别活动 —— 交互层
   保持克制：只做导航态、滚动浮现、进度条、移动菜单
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 导航：滚动后加毛玻璃底 ---------- */
  var nav = document.getElementById('nav');
  var progressBar = document.querySelector('#progress span');

  function onScrollUI() {
    var y = window.scrollY || document.documentElement.scrollTop;

    if (nav) nav.classList.toggle('is-scrolled', y > 24);

    if (progressBar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      progressBar.style.width = (pct * 100).toFixed(2) + '%';
    }
  }

  /* ---------- 2. 移动端菜单 ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');

  if (burger && menu) {
    var root = document.documentElement;

    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
      menu.hidden = !open;
      menu.classList.toggle('is-open', open);
      // 全屏菜单展开时锁住页面滚动，并让导航条本身变实底
      root.classList.toggle('is-locked', open);
      if (nav) nav.classList.toggle('menu-open', open);
    };

    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });

    // 横屏 / 放大窗口后菜单不该继续锁着滚动
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860 && burger.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
      }
    });
  }

  /* ---------- 3. 滚动浮现 ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4. Hero 视差 + 大字滚动淡化 ---------- */
  var heroInner = document.querySelector('.hero__inner');
  var fadeEls = Array.prototype.slice.call(document.querySelectorAll('[data-scroll-fade]'));
  var ticking = false;

  function render() {
    var y = window.scrollY || document.documentElement.scrollTop;

    if (heroInner && !reduceMotion && y < window.innerHeight * 1.2) {
      var p = Math.min(1, y / (window.innerHeight * 0.9));
      heroInner.style.opacity = String(1 - p * 0.85);
      heroInner.style.transform = 'translate3d(0,' + (p * -46).toFixed(1) + 'px,0)';
    }

    fadeEls.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var vh = window.innerHeight;
      // 元素进入视口中部时最亮
      var center = rect.top + rect.height / 2;
      var dist = Math.abs(center - vh * 0.55) / (vh * 0.75);
      var opacity = Math.max(0.15, Math.min(1, 1 - dist * 0.85));
      el.style.opacity = String(opacity);
    });

    ticking = false;
  }

  function requestRender() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(render);
    }
  }

  window.addEventListener('scroll', function () {
    onScrollUI();
    if (!reduceMotion) requestRender();
  }, { passive: true });

  window.addEventListener('resize', requestRender);

  /* ---------- 5. 锚点偏移（固定导航高度） ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 68;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* ---------- 6. 导航橙色高亮：当前板块 ---------- */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href^="#"]'));
  var spyTargets = spyLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  function setActive(id) {
    spyLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
    });
  }

  if (!reduceMotion && 'IntersectionObserver' in window && spyTargets.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    spyTargets.forEach(function (el) { spy.observe(el); });
  }

  /* ---------- 7. 初始化 ---------- */
  onScrollUI();
  requestRender();
})();
