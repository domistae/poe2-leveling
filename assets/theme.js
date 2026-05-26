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

    /* ── Theme ─────────────────────────────────────────────────── */
    function syncButton() {
        var cur = document.documentElement.getAttribute('data-theme') || 'light';
        var ic = document.getElementById('theme-icon');
        var lb = document.getElementById('theme-label');
        if (ic) ic.textContent = cur === 'light' ? '☀' : '☾';
        if (lb) lb.textContent = cur === 'light' ? 'Light' : 'Dark';
    }

    function toggleTheme() {
        var html = document.documentElement;
        var cur = html.getAttribute('data-theme') || 'light';
        var next = cur === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', next);
        try { localStorage.setItem('poe2-theme', next); } catch (e) { /* private mode */ }
        syncButton();
    }

    window.toggleTheme = toggleTheme;

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
