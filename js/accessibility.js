/**
 * Raja Sweets — Accessibility Tools Widget
 * Vanilla JS · WCAG 2.1/2.2 AA helper · resets on page refresh
 */
(function () {
  'use strict';

  var DEFAULTS = {
    textScale: 100,
    highContrast: false,
    grayscale: false,
    darkMode: false,
    underlineLinks: false,
    readableFont: false,
    highlightLinks: false,
    highlightHeadings: false,
    stopAnimations: false,
    readingGuide: false,
    enhancedFocus: true,
    saturation: 100,
    brightness: 100
  };

  var LIMITS = {
    textScale: { min: 80, max: 200, step: 10 },
    saturation: { min: 50, max: 200, step: 10 },
    brightness: { min: 50, max: 150, step: 10 }
  };

  var state = {};
  var root = document.documentElement;
  var panel = null;
  var trigger = null;
  var overlay = null;
  var widgetRoot = null;
  var readingGuide = null;
  var statusEl = null;
  var lastFocused = null;

  function initDefaults() {
    state = Object.assign({}, DEFAULTS);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      state.stopAnimations = true;
    }
  }

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function buildFilter() {
    var parts = [];
    if (state.grayscale) parts.push('grayscale(100%)');
    parts.push('saturate(' + state.saturation + '%)');
    parts.push('brightness(' + state.brightness + '%)');
    return parts.join(' ');
  }

  function applySettings() {
    var basePx = 16;
    root.style.fontSize = (basePx * state.textScale / 100) + 'px';
    root.classList.toggle('a11y-text-scaled', state.textScale !== 100);
    root.dataset.a11yTextScale = state.textScale;

    document.body.style.filter = buildFilter();

    toggleClass('a11y-high-contrast', state.highContrast);
    toggleClass('a11y-dark-mode', state.darkMode);
    toggleClass('a11y-underline-links', state.underlineLinks);
    toggleClass('a11y-readable-font', state.readableFont);
    toggleClass('a11y-highlight-links', state.highlightLinks);
    toggleClass('a11y-highlight-headings', state.highlightHeadings);
    toggleClass('a11y-stop-animations', state.stopAnimations);
    toggleClass('a11y-enhanced-focus', state.enhancedFocus);

    if (readingGuide) {
      readingGuide.classList.toggle('is-active', state.readingGuide);
      readingGuide.setAttribute('aria-hidden', state.readingGuide ? 'false' : 'true');
    }

    updateToggleButtons();
    updateStatus();
  }

  function toggleClass(cls, on) {
    root.classList.toggle(cls, !!on);
  }

  function resetAll() {
    state = Object.assign({}, DEFAULTS);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      state.stopAnimations = true;
    }
    root.style.fontSize = '';
    root.classList.remove('a11y-text-scaled');
    delete root.dataset.a11yTextScale;
    document.body.style.filter = '';
    applySettings();
    announce('All accessibility settings have been reset.');
  }

  function onReadingGuideMove(e) {
    if (!state.readingGuide || !readingGuide) return;
    readingGuide.style.top = e.clientY + 'px';
  }

  var ICONS = {
    increaseText: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm.5-7H9v2H7v1h2v2h1v-2h2V9h-2V7z"/></svg>',
    decreaseText: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z"/></svg>',
    highContrast: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18V4c4.41 0 8 3.59 8 8s-3.59 8-8 8z"/></svg>',
    grayscale: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.66 7.93L12 2.27 6.34 7.93c-3.12 3.12-3.12 8.19 0 11.31C7.9 20.8 9.95 21.66 12 21.66s4.1-.86 5.66-2.42c3.12-3.12 3.12-8.19 0-11.31zM12 19.06c-1.6 0-3.11-.62-4.24-1.76C6.62 16.11 6 14.6 6 13.01V4c3.87 3.92 9 6.24 12 11.24v1.83c0 1.59-.62 3.1-1.76 4.24-1.13 1.14-2.64 1.76-4.24 1.76z"/></svg>',
    darkMode: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>',
    underlineLinks: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8v-2z"/></svg>',
    readableFont: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.93 13.5h4.14L12 7.98 9.93 13.5zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.19l-1.12 3H5.96L11 5.75 18.05 18.5h-2.05z"/></svg>',
    highlightLinks: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>',
    highlightHeadings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4v3h5.5v12h3V7H19V4H5z"/></svg>',
    stopAnimations: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h12v12H6V6zm2 2v8h8V8H8z"/></svg>',
    readingGuide: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11h18v2H3v-2zm0-4h18v2H3V7zm0 8h18v2H3v-2z"/></svg>',
    increaseSaturation: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c.55 0 1-.45 1-1v-4.07A5.98 5.98 0 0 1 17.93 13H22c0-5.51-4.49-10-10-10z"/></svg>',
    decreaseSaturation: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 1-.45 1-1v-4.07A5.98 5.98 0 0 0 6.07 13H2c0-5.51 4.49-10 10-10z"/></svg>',
    increaseBrightness: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z"/></svg>',
    decreaseBrightness: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>',
    accessibility: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-1 6h2v2h5v2h-4.2l1.1 5.6 2.9.5-.4 2-3.5-.6a2 2 0 0 1-1.6-1.6l-1-5.9H9.4l-1 5.9a2 2 0 0 1-1.6 1.6l-3.5.6-.4-2 2.9-.5L7.2 12H3v-2h5V8z"/></svg>'
  };

  var ACTIONS = [
    { id: 'increaseText', label: 'Increase Text', icon: 'increaseText', type: 'step', key: 'textScale', dir: 1 },
    { id: 'decreaseText', label: 'Decrease Text', icon: 'decreaseText', type: 'step', key: 'textScale', dir: -1 },
    { id: 'highContrast', label: 'High Contrast', icon: 'highContrast', type: 'toggle', key: 'highContrast' },
    { id: 'grayscale', label: 'Grayscale', icon: 'grayscale', type: 'toggle', key: 'grayscale' },
    { id: 'darkMode', label: 'Dark Mode / Light Mode', icon: 'darkMode', type: 'toggle', key: 'darkMode' },
    { id: 'underlineLinks', label: 'Underline Links', icon: 'underlineLinks', type: 'toggle', key: 'underlineLinks' },
    { id: 'readableFont', label: 'Readable Font', icon: 'readableFont', type: 'toggle', key: 'readableFont' },
    { id: 'highlightLinks', label: 'Highlight Links', icon: 'highlightLinks', type: 'toggle', key: 'highlightLinks' },
    { id: 'highlightHeadings', label: 'Highlight Headings', icon: 'highlightHeadings', type: 'toggle', key: 'highlightHeadings' },
    { id: 'stopAnimations', label: 'Stop Animations', icon: 'stopAnimations', type: 'toggle', key: 'stopAnimations' },
    { id: 'readingGuide', label: 'Reading Guide', icon: 'readingGuide', type: 'toggle', key: 'readingGuide' },
    { id: 'increaseSaturation', label: 'Increase Saturation', icon: 'increaseSaturation', type: 'step', key: 'saturation', dir: 1 },
    { id: 'decreaseSaturation', label: 'Decrease Saturation', icon: 'decreaseSaturation', type: 'step', key: 'saturation', dir: -1 },
    { id: 'increaseBrightness', label: 'Increase Brightness', icon: 'increaseBrightness', type: 'step', key: 'brightness', dir: 1 },
    { id: 'decreaseBrightness', label: 'Decrease Brightness', icon: 'decreaseBrightness', type: 'step', key: 'brightness', dir: -1 },
    { id: 'reset', label: 'Reset All', icon: 'reset', type: 'reset' }
  ];

  function createWidget() {
    var container = document.createElement('div');
    container.className = 'a11y-widget-root';
    container.innerHTML =
      '<div class="a11y-widget-overlay" id="a11yOverlay" aria-hidden="true"></div>' +
      '<div class="a11y-reading-guide" id="a11yReadingGuide" aria-hidden="true" role="presentation"></div>' +
      '<div class="a11y-widget-panel" id="a11yPanel" role="dialog" aria-modal="true" aria-labelledby="a11yPanelTitle" aria-hidden="true">' +
        '<div class="a11y-widget-header">' +
          '<h2 class="a11y-widget-title" id="a11yPanelTitle">Accessibility Tools</h2>' +
          '<button type="button" class="a11y-widget-close" id="a11yClose" aria-label="Close accessibility tools">×</button>' +
        '</div>' +
        '<ul class="a11y-widget-list" id="a11yActionList" role="list"></ul>' +
        '<p class="a11y-widget-status" id="a11yStatus" aria-live="polite" aria-atomic="true"></p>' +
      '</div>' +
      '<button type="button" class="a11y-widget-trigger" id="a11yTrigger" aria-label="Open accessibility tools" aria-expanded="false" aria-controls="a11yPanel">' +
        '<i class="fas fa-wheelchair" aria-hidden="true"></i>' +
      '</button>';

    document.documentElement.appendChild(container);
    widgetRoot = container;

    panel = document.getElementById('a11yPanel');
    trigger = document.getElementById('a11yTrigger');
    overlay = document.getElementById('a11yOverlay');
    readingGuide = document.getElementById('a11yReadingGuide');
    statusEl = document.getElementById('a11yStatus');

    var list = document.getElementById('a11yActionList');
    ACTIONS.forEach(function (action) {
      var li = document.createElement('li');
      li.className = 'a11y-widget-item';
      li.setAttribute('role', 'listitem');

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'a11y-widget-action' + (action.type === 'reset' ? ' a11y-widget-action--reset' : '');
      btn.id = 'a11y-' + action.id;
      btn.dataset.action = action.id;
      btn.innerHTML = ICONS[action.icon] + '<span>' + action.label + '</span>';

      if (action.type === 'toggle') {
        btn.setAttribute('aria-pressed', 'false');
      }

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        handleAction(action);
      });

      li.appendChild(btn);
      list.appendChild(li);
    });

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      togglePanel();
    });
    document.getElementById('a11yClose').addEventListener('click', function (e) {
      e.stopPropagation();
      closePanel();
    });
    document.addEventListener('click', onDocumentClick);
    panel.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousemove', onReadingGuideMove);

    panel.addEventListener('keydown', trapFocus);
  }

  function handleAction(action) {
    if (action.type === 'reset') {
      resetAll();
      return;
    }

    if (action.type === 'toggle') {
      state[action.key] = !state[action.key];
      applySettings();
      announce(action.label + (state[action.key] ? ' enabled' : ' disabled') + '.');
      return;
    }

    if (action.type === 'step') {
      var limits = LIMITS[action.key];
      var next = state[action.key] + action.dir * limits.step;
      var clamped = clamp(next, limits.min, limits.max);
      if (clamped === state[action.key]) {
        announce(action.label + ' limit reached.');
        return;
      }
      state[action.key] = clamped;
      applySettings();
      announce(action.label + '. Current value: ' + state[action.key] + '%.');
    }
  }

  function updateToggleButtons() {
    ACTIONS.filter(function (a) { return a.type === 'toggle'; }).forEach(function (action) {
      var btn = document.getElementById('a11y-' + action.id);
      if (btn) btn.setAttribute('aria-pressed', state[action.key] ? 'true' : 'false');
    });
  }

  function updateStatus() {
    if (!statusEl) return;
    statusEl.textContent = 'Text: ' + state.textScale + '% · Saturation: ' + state.saturation + '% · Brightness: ' + state.brightness + '%';
  }

  function announce(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function togglePanel() {
    if (panel.classList.contains('is-open')) closePanel();
    else openPanel();
  }

  function openPanel() {
    lastFocused = document.activeElement;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-label', 'Close accessibility tools');
    var firstAction = panel.querySelector('.a11y-widget-action');
    if (firstAction) firstAction.focus();
    else document.getElementById('a11yClose').focus();
  }

  function closePanel() {
    if (!panel.classList.contains('is-open')) return;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('is-visible');
    overlay.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Open accessibility tools');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    else trigger.focus();
  }

  function onDocumentClick(e) {
    if (!panel || !panel.classList.contains('is-open')) return;
    if (widgetRoot && widgetRoot.contains(e.target)) return;
    closePanel();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) {
      e.preventDefault();
      closePanel();
    }
  }

  function trapFocus(e) {
    if (e.key !== 'Tab' || !panel.classList.contains('is-open')) return;
    var focusable = panel.querySelectorAll(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function init() {
    initDefaults();
    createWidget();
    applySettings();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.RajaSweetsA11y = {
    getSettings: function () { return Object.assign({}, state); },
    reset: resetAll,
    closePanel: closePanel
  };
})();
