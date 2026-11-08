/*
 * Shared behaviour for every page. Loaded in <head> without defer, so the
 * saved theme and text size are applied before the first paint (no flash).
 *   - Theme: Night (data-theme="dark") or Light, saved as poe2-theme.
 *   - Text size: --user-font-scale on <html>, saved as poe2-font-scale.
 *     base.css sizes the root font from it and all text is set in rem,
 *     so every piece of text follows it.
 *   - Mobile sidebars: .sidebar-section h2 opens and closes its section.
 * No inline handlers anywhere: the page's Content-Security-Policy forbids them.
 */
(function () {
    'use strict';

    var html = document.documentElement;
    var THEME_KEY = 'poe2-theme';
    var SCALE_KEY = 'poe2-font-scale';
    var MIN_SCALE = 0.85, MAX_SCALE = 1.30, STEP = 0.05;
    var THEMES = {
        dark:  { icon: '☾', label: 'Night', next: 'light' },
        light: { icon: '☀', label: 'Light', next: 'dark' }
    };

    // Storage can be blocked (private mode, site data off): never let that break the page.
    function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
    function save(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* not saved */ } }

    function clampScale(s) {
        return Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(s * 100) / 100));
    }

    /* ── Before first paint ───────────────────────────────────────── */
    (function () {
        var saved = load(THEME_KEY);
        var theme = saved === 'light' ? 'light'
                  : saved === 'dark' || saved === 'night' ? 'dark' /* "night" was folded into dark */
                  : window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        html.setAttribute('data-theme', theme);

        var scale = parseFloat(load(SCALE_KEY));
        if (scale >= MIN_SCALE && scale <= MAX_SCALE) html.style.setProperty('--user-font-scale', scale);
    })();

    /* ── Theme ────────────────────────────────────────────────────── */
    function currentTheme() {
        return html.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    function syncThemeButton() {
        var t = THEMES[currentTheme()];
        var next = THEMES[t.next];
        var icon = document.getElementById('theme-icon');
        var label = document.getElementById('theme-label');
        var btn = document.querySelector('.theme-toggle');
        if (icon) icon.textContent = t.icon;
        if (label) label.textContent = t.label;
        if (btn) {
            btn.setAttribute('aria-label', 'Theme: ' + t.label + '. Switch to ' + next.label);
            btn.setAttribute('title', 'Theme: ' + t.label + ' — click for ' + next.label);
        }
    }

    function toggleTheme() {
        var next = THEMES[currentTheme()].next;
        html.setAttribute('data-theme', next);
        save(THEME_KEY, next);
        syncThemeButton();
    }

    /* ── Text size ────────────────────────────────────────────────── */
    function currentScale() {
        var v = parseFloat(getComputedStyle(html).getPropertyValue('--user-font-scale'));
        return v >= MIN_SCALE && v <= MAX_SCALE ? clampScale(v) : 1;
    }

    function setScale(s) {
        s = clampScale(s);
        html.style.setProperty('--user-font-scale', s);
        save(SCALE_KEY, String(s));
        syncScaler(s);
    }

    function syncScaler(s) {
        var label = document.getElementById('scale-label');
        var down = document.getElementById('scale-down');
        var up = document.getElementById('scale-up');
        if (label) label.textContent = Math.round(s * 100) + '%';
        if (down) down.disabled = s <= MIN_SCALE + 0.001;
        if (up) up.disabled = s >= MAX_SCALE - 0.001;
    }

    function scaleButton(id, text, aria, dir) {
        var b = document.createElement('button');
        b.type = 'button';
        b.id = id;
        b.textContent = text;
        b.setAttribute('aria-label', aria);
        b.addEventListener('click', function () { setScale(currentScale() + dir * STEP); });
        return b;
    }

    function injectScaler(toggle) {
        if (document.querySelector('.font-scaler')) return;
        var box = document.createElement('div');
        box.className = 'font-scaler';
        box.setAttribute('role', 'group');
        box.setAttribute('aria-label', 'Adjust text size');
        var label = document.createElement('span');
        label.className = 'scale-label';
        label.id = 'scale-label';
        box.appendChild(scaleButton('scale-down', 'A−', 'Decrease text size', -1));
        box.appendChild(label);
        box.appendChild(scaleButton('scale-up', 'A+', 'Increase text size', 1));
        toggle.parentNode.insertBefore(box, toggle);
        syncScaler(currentScale());
    }

    /* ── Mobile sidebar sections (≤ 900px) ────────────────────────── */
    function initSidebarSections() {
        var narrow = window.matchMedia('(max-width: 900px)');
        document.querySelectorAll('.sidebar-section h2').forEach(function (h2) {
            h2.addEventListener('click', function () {
                if (narrow.matches) h2.parentElement.classList.toggle('expanded');
            });
        });
        document.querySelectorAll('.sidebar-section .sidebar-link').forEach(function (link) {
            link.addEventListener('click', function () {
                if (narrow.matches) link.closest('.sidebar-section').classList.remove('expanded');
            });
        });
    }

    function init() {
        var toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            toggle.addEventListener('click', toggleTheme);
            syncThemeButton();
            injectScaler(toggle);
        }
        initSidebarSections();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
