/*
 * Shared theme handling for all PoE2 guide pages.
 * Includes:
 *   - Early init: <head> reads from localStorage / prefers-color-scheme and sets
 *     [data-theme] on <html> BEFORE first paint to avoid a flash of wrong theme.
 *     This is loaded inline in the head as a separate small script. For pages
 *     loading this file deferred, the early init must already have run.
 *   - Button sync: updates the floating .theme-toggle icon/label.
 *   - toggleTheme(): flips theme and persists. Exposed globally for onclick.
 */
(function () {
    'use strict';

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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncButton);
    } else {
        syncButton();
    }
})();
