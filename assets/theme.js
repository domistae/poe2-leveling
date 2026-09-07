/*
 * Shared theme + font-scale handling for all PoE2 guide pages.
 * Includes:
 *   - Early init: <head> reads from localStorage / prefers-color-scheme and sets
 *     [data-theme] on <html> AND --user-font-scale BEFORE first paint.
 *     This is loaded inline in the head as a separate small script. For pages
 *     loading this file deferred, the early init must already have run.
 *   - Button sync: updates the floating .theme-toggle icon/label.
 *   - toggleTheme(): flips theme and persists. Exposed globally for onclick.
 *   - Font scaler: injects .font-scaler pill and exposes bumpFontScale(dir).
 */
(function () {
    'use strict';

    /* ── Theme ─────────────────────────────────────────────────────
       Three themes, cycled by the one toggle: light → dark → night.

       "night" is NOT its own data-theme value. It reuses
       data-theme="dark" and adds data-tint="night", so the ~117
       `[data-theme="dark"] .foo` rules across the stylesheets and pages all
       continue to apply; only the ground tokens are re-pointed in base.css. */
    var THEMES = ['light', 'dark', 'night'];
    var META = {
        light: { icon: '☀', label: 'Light', theme: 'light', tint: null },
        dark:  { icon: '☾', label: 'Dark',  theme: 'dark',  tint: null },
        night: { icon: '✦', label: 'Night', theme: 'dark',  tint: 'night' }
    };

    // Derive the current theme name from the DOM (set by the early-init script).
    function currentTheme() {
        var html = document.documentElement;
        if (html.getAttribute('data-tint') === 'night') return 'night';
        return html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function applyTheme(name) {
        var m = META[name] || META.light;
        var html = document.documentElement;
        html.setAttribute('data-theme', m.theme);
        if (m.tint) html.setAttribute('data-tint', m.tint);
        else html.removeAttribute('data-tint');
        syncButton();
    }

    function syncButton() {
        var m = META[currentTheme()];
        var ic = document.getElementById('theme-icon');
        var lb = document.getElementById('theme-label');
        var btn = document.querySelector('.theme-toggle');
        if (ic) ic.textContent = m.icon;
        if (lb) lb.textContent = m.label;
        // Announce what the button will do next, not just where it is.
        if (btn) {
            var nxt = META[THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length]];
            btn.setAttribute('aria-label', 'Theme: ' + m.label + '. Switch to ' + nxt.label);
            btn.setAttribute('title', 'Theme: ' + m.label + ' — click for ' + nxt.label);
        }
    }

    function toggleTheme() {
        var next = THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length];
        applyTheme(next);
        try { localStorage.setItem('poe2-theme', next); } catch (e) { /* private mode */ }
    }

    window.toggleTheme = toggleTheme;
    window.setTheme = applyTheme;

    /* ── Font scale ────────────────────────────────────────────── */
    var MIN_SCALE = 0.85, MAX_SCALE = 1.30, STEP = 0.05;

    function getScale() {
        var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--user-font-scale'));
        return (v >= MIN_SCALE && v <= MAX_SCALE) ? Math.round(v * 100) / 100 : 1.0;
    }

    function applyScale(s) {
        s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(s * 100) / 100));
        document.documentElement.style.setProperty('--user-font-scale', s);
        try { localStorage.setItem('poe2-font-scale', s); } catch (e) {}
        var lbl = document.getElementById('scale-label');
        var dn  = document.getElementById('scale-down');
        var up  = document.getElementById('scale-up');
        if (lbl) lbl.textContent = Math.round(s * 100) + '%';
        if (dn)  dn.disabled = s <= MIN_SCALE + 0.001;
        if (up)  up.disabled = s >= MAX_SCALE - 0.001;
    }

    function bumpFontScale(dir) { applyScale(getScale() + dir * STEP); }
    window.bumpFontScale = bumpFontScale;

    function injectScaler() {
        if (document.querySelector('.font-scaler')) return;
        var toggle = document.querySelector('.theme-toggle');
        if (!toggle) return;
        var s = getScale();
        var el = document.createElement('div');
        el.className = 'font-scaler';
        el.setAttribute('role', 'group');
        el.setAttribute('aria-label', 'Adjust text size');
        el.innerHTML =
            '<button id="scale-down" type="button" aria-label="Decrease text size" onclick="bumpFontScale(-1)">A−</button>' +
            '<span class="scale-label" id="scale-label">' + Math.round(s * 100) + '%</span>' +
            '<button id="scale-up" type="button" aria-label="Increase text size" onclick="bumpFontScale(1)">A+</button>';
        toggle.parentNode.insertBefore(el, toggle);
        applyScale(s); /* sync disabled states */
    }

    /* ── Init ──────────────────────────────────────────────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            syncButton();
            injectScaler();
        });
    } else {
        syncButton();
        injectScaler();
    }
})();
