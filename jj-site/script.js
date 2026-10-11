(function () {
  'use strict';

  var cfg = window.JJ_CONFIG || {};
  var links = cfg.links || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ── Links from config ───────────────────────────────────── */
  var fallbacks = {
    adventure: ['adventure', 'blog', 'instagram'],
    fitness: ['fitness', 'blog', 'instagram'],
    blog: ['blog'],
    connect: ['connect']
  };

  $$('[data-link]').forEach(function (el) {
    var key = el.getAttribute('data-link');
    var chain = fallbacks[key] || [key];
    var url = '';
    for (var i = 0; i < chain.length; i++) {
      var v = (links[chain[i]] || '').trim();
      if (v) { url = v; break; }
    }
    if (!url) { el.classList.add('is-pending'); return; }
    el.href = url;
    if (/^https?:\/\//i.test(url)) {
      el.target = '_blank';
      el.rel = 'noopener';
    }
  });

  if (cfg.handle) {
    $$('[data-handle]').forEach(function (el) { el.textContent = cfg.handle; });
  }

  /* ── Header shadow on scroll ─────────────────────────────── */
  var header = $('.site-header');
  var onScroll = function () {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Mobile menu ─────────────────────────────────────────── */
  var toggle = $('.nav__toggle');
  var menu = $('#nav-menu');
  var setMenu = function (open) {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', function () {
    setMenu(!menu.classList.contains('is-open'));
  });
  $$('a', menu).forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (menu.classList.contains('is-open') && !header.contains(e.target)) setMenu(false);
  });

  /* ── Reveal on scroll ────────────────────────────────────── */
  var reveals = $$('.reveal');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduce) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ── Newsletter form ─────────────────────────────────────── */
  var form = $('#subscribe');
  if (form) {
    var input = $('#email', form);
    var note = $('.subscribe__note', form);
    var button = $('button[type="submit"]', form);
    var label = $('.subscribe__label', form);
    var defaultNote = note.textContent;
    var endpoint = cfg.newsletterEndpoint || '/api/subscribe';

    var setState = function (state, message) {
      form.classList.remove('is-error', 'is-success', 'is-busy');
      if (state) form.classList.add('is-' + state);
      note.textContent = message || defaultNote;
    };

    input.addEventListener('input', function () {
      if (form.classList.contains('is-error')) setState(null);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        setState('error', 'Enter a valid email address.');
        input.focus();
        return;
      }
      setState('busy', 'Adding you to the list…');
      button.disabled = true;

      var payload = { email: email, website: $('.subscribe__hp', form).value || '' };
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (res.ok && data.ok !== false) {
            setState('success', "You’re on the list. Talk soon.");
            label.textContent = 'Joined';
            input.value = '';
            input.blur();
          } else {
            setState('error', data.error || "Couldn't add you just now. Try again in a minute.");
            button.disabled = false;
          }
        });
      }).catch(function () {
        setState('error', "Couldn't reach the list right now. Try again in a minute.");
        button.disabled = false;
      });
    });
  }
})();
