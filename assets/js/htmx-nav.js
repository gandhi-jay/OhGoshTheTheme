(() => {
  'use strict';

  let pendingMeta = null;
  const pageMetaCache = {};

  document.addEventListener('htmx:beforeSwap', (e) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(e.detail.serverResponse, 'text/html');

    const meta = {};

    const titleEl = doc.querySelector('title');
    if (titleEl) meta.title = titleEl.textContent;

    const descEl = doc.querySelector('meta[name="description"]');
    if (descEl) meta.description = descEl.getAttribute('content');

    const canonicalEl = doc.querySelector('link[rel="canonical"]');
    if (canonicalEl) meta.canonical = canonicalEl.getAttribute('href');

    ['title', 'description', 'url', 'image'].forEach((prop) => {
      const el = doc.querySelector(`meta[property="og:${prop}"]`);
      if (el) {
        const key = `og${prop.charAt(0).toUpperCase()}${prop.slice(1)}`;
        meta[key] = el.getAttribute('content');
      }
    });

    ['card', 'title', 'description', 'image'].forEach((prop) => {
      const el = doc.querySelector(`meta[name="twitter:${prop}"]`);
      if (el) {
        const key = `twitter${prop.charAt(0).toUpperCase()}${prop.slice(1)}`;
        meta[key] = el.getAttribute('content');
      }
    });

    pendingMeta = meta;
  });

  document.addEventListener('htmx:afterSwap', () => {
    if (pendingMeta) {
      applyMeta(pendingMeta);
      pageMetaCache[window.location.pathname] = pendingMeta;
      pendingMeta = null;
    }
    reinitAfterSwap();
  });

  document.addEventListener('htmx:historyRestore', (e) => {
    const cachedMeta = pageMetaCache[e.detail.path];
    if (cachedMeta) applyMeta(cachedMeta);
    reinitAfterSwap();
    if (window.__reinit && window.__reinit.theme) {
      window.__reinit.theme();
    }
  });

  document.addEventListener('htmx:responseError', (e) => {
    const url = e.detail.elt && e.detail.elt.getAttribute('href');
    if (url && url !== window.location.pathname) window.location.href = url;
  });

  document.addEventListener('htmx:sendError', (e) => {
    const url = e.detail.elt && e.detail.elt.getAttribute('href');
    if (url && url !== window.location.pathname) window.location.href = url;
  });

  const applyMeta = (meta) => {
    if (meta.title) document.title = meta.title;

    const fieldMap = {
      description: 'meta[name="description"]',
      canonical: 'link[rel="canonical"]',
      ogTitle: 'meta[property="og:title"]',
      ogDescription: 'meta[property="og:description"]',
      ogUrl: 'meta[property="og:url"]',
      ogImage: 'meta[property="og:image"]',
      twitterCard: 'meta[name="twitter:card"]',
      twitterTitle: 'meta[name="twitter:title"]',
      twitterDescription: 'meta[name="twitter:description"]',
      twitterImage: 'meta[name="twitter:image"]'
    };

    Object.keys(fieldMap).forEach((key) => {
      if (meta[key]) {
        const el = document.querySelector(fieldMap[key]);
        if (el) {
          if (key === 'canonical') el.setAttribute('href', meta[key]);
          else el.setAttribute('content', meta[key]);
        }
      }
    });
  };

  const reinitAfterSwap = () => {
    // Active nav state
    const currentPath = window.location.pathname;
    document.querySelectorAll('#menu a').forEach((link) => {
      const href = link.getAttribute('href');
      const span = link.querySelector('span');
      if (span) span.classList.toggle('active', href === currentPath);
    });

    // Re-init shared features
    if (window.__reinit) window.__reinit.all();

    // KaTeX
    const mainContent = document.querySelector('main');
    if (mainContent && typeof renderMathInElement !== 'undefined') {
      renderMathInElement(mainContent, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ]
      });
    }

  };

})();
