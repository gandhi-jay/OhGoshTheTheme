(() => {
  'use strict';

  /* ────────────────── Theme ──────────────────── */

  const getSavedTheme = () => localStorage.getItem('theme');
  const saveTheme = (id) => localStorage.setItem('theme', id);
  const applyTheme = (id) => document.documentElement.setAttribute('data-theme', id);

  const getDefaultTheme = () => {
    const el = document.querySelector('.theme-selector');
    return el ? el.getAttribute('data-default-theme') || 'terminal' : 'terminal';
  };

  const updateDropdown = (activeId) => {
    const btn = document.querySelector('.theme-selector-btn');
    const dropdown = document.querySelector('.theme-dropdown');
    if (!btn || !dropdown) return;
    const activeOpt = dropdown.querySelector(`.theme-option[data-theme="${activeId}"]`);
    if (activeOpt) {
      const dotSpan = activeOpt.querySelector('.dot');
      const label = activeOpt.textContent.trim();
      const dotClass = dotSpan ? dotSpan.className.replace('dot', '').trim() : activeId;
      btn.innerHTML = `<span class="theme-indicator ${dotClass}"></span><span>${label}</span>`;
    }
    dropdown.querySelectorAll('.theme-option')
      .forEach((opt) => opt.classList.toggle('active', opt.dataset.theme === activeId));
  };

  const toggleDropdown = () => {
    const dd = document.querySelector('.theme-dropdown');
    if (dd) dd.classList.toggle('open');
  };

  const closeDropdown = () => {
    const dd = document.querySelector('.theme-dropdown');
    if (dd) dd.classList.remove('open');
  };

  document.addEventListener('click', (e) => {
    const sel = document.querySelector('.theme-selector');
    if (sel && !sel.contains(e.target)) closeDropdown();
  });

  const initTheme = () => {
    const saved = getSavedTheme() || getDefaultTheme();
    applyTheme(saved);
    saveTheme(saved);
    updateDropdown(saved);
  };

  const initThemeSelector = () => {
    const btn = document.querySelector('.theme-selector-btn');
    const dd = document.querySelector('.theme-dropdown');
    if (!btn || !dd) return;
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(); });
    dd.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const id = opt.dataset.theme;
      applyTheme(id);
      saveTheme(id);
      updateDropdown(id);
      closeDropdown();
    });
  };

  /* ── Scroll to top ──────────────────────────── */

  const initScrollToTop = () => {
    const btn = document.getElementById('top-link');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      if (document.body.scrollTop > 800 || document.documentElement.scrollTop > 800) {
        btn.style.visibility = 'visible';
        btn.style.opacity = '1';
      } else {
        btn.style.visibility = 'hidden';
        btn.style.opacity = '0';
      }
    });
  };

  /* ── Shared: code copy ─────────────────────── */

  const initCodeCopy = () => {
    document.querySelectorAll('pre > code').forEach((codeblock) => {
      const container = codeblock.parentNode;
      if (container.querySelector('.copy-code')) return;
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-code';
      copyBtn.textContent = 'copy';

      const copyingDone = () => {
        copyBtn.textContent = 'copied!';
        setTimeout(() => { copyBtn.textContent = 'copy'; }, 2000);
      };

      copyBtn.addEventListener('click', async () => {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(codeblock.textContent);
          copyingDone();
          return;
        }
        const range = document.createRange();
        range.selectNodeContents(codeblock);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        try { document.execCommand('copy'); copyingDone(); } catch (e) {}
        selection.removeRange(range);
      });
      container.appendChild(copyBtn);
    });
  };

  /* ── Shared: smooth scroll (event delegation) ─ */

  const initSmoothScroll = () => {
    // Single document-level listener — works for content swapped by HTMX
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      e.preventDefault();
      const id = anchor.getAttribute('href').substring(1);
      const el = document.getElementById(decodeURIComponent(id));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        history.pushState(null, null, id === 'top' ? ' ' : `#${id}`);
      }
    });
  };

  /* ── Shared: nav avatar ────────────────────── */

  let navAvatarObserver = null;

  const initNavAvatar = () => {
    const profileImg = document.querySelector('.profile_inner img');
    const navAvatar = document.querySelector('.logo-avatar');
    if (!profileImg || !navAvatar) {
      if (navAvatar) navAvatar.style.display = 'none';
      return;
    }

    const rect = profileImg.getBoundingClientRect();
    navAvatar.style.display = rect.top < window.innerHeight && rect.bottom >= 0 ? 'none' : 'block';

    if (navAvatarObserver) navAvatarObserver.disconnect();

    if ('IntersectionObserver' in window) {
      navAvatarObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navAvatar.style.display = 'none';
            navAvatar.classList.remove('avatar-enter');
          } else {
            navAvatar.style.display = 'block';
            navAvatar.classList.remove('avatar-enter');
            void navAvatar.offsetWidth;
            navAvatar.classList.add('avatar-enter');
          }
        });
      }, { threshold: 0 });
      navAvatarObserver.observe(profileImg);
    }
  };

  /* ── Shared: scroll restore ────────────────── */

  let scrollHandler = null;

  const initScrollRestore = () => {
    const KEY_PREFIX = 'scrollPos:';
    const pageKey = KEY_PREFIX + window.location.pathname;
    const MAX_AGE = 5 * 24 * 60 * 60 * 1000;

    if (window.location.search.includes('scrollToTop')) {
      localStorage.removeItem(pageKey);
      return;
    }

    try {
      const saved = JSON.parse(localStorage.getItem(pageKey));
      if (saved && Date.now() - saved.timestamp < MAX_AGE) {
        requestAnimationFrame(() => window.scrollTo(0, saved.position));
      }
    } catch (e) {}

    if (scrollHandler) window.removeEventListener('scroll', scrollHandler);

    let ticking = false;
    scrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          localStorage.setItem(pageKey, JSON.stringify({
            position: window.scrollY,
            timestamp: Date.now()
          }));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', scrollHandler);
  };

  /* ── Export shared re-init functions ────────── */

  window.__reinit = {
    codeCopy: initCodeCopy,
    smoothScroll: initSmoothScroll,
    navAvatar: initNavAvatar,
    scrollRestore: initScrollRestore,
    theme: () => {
      const saved = getSavedTheme() || getDefaultTheme();
      applyTheme(saved);
      updateDropdown(saved);
      initThemeSelector();
    },
    all() {
      initCodeCopy();
      initNavAvatar();
      initScrollRestore();
      // smoothScroll is event delegation — registered once, no need to re-run
    }
  };

  /* ── Bootstrap ──────────────────────────────── */

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initThemeSelector();
    initSmoothScroll();
    initScrollToTop();
    window.__reinit.all();
  });
})();
