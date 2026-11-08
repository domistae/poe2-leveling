/*
 * Google Analytics 4, only with the visitor's consent (GDPR / ePrivacy).
 *
 * Nothing from Google loads, and no analytics cookie is set, until the
 * visitor clicks "Allow" in the banner. The choice is kept in this browser
 * (poe2-consent) for 13 months, then asked again. "Cookie settings" in every
 * page footer reopens the banner; withdrawing deletes the _ga cookies.
 * Kept in a file (no inline script) for the Content-Security-Policy.
 */
(function () {
    'use strict';

    var GA_ID = 'G-7N3S1HHM51';
    var KEY = 'poe2-consent';
    var MAX_AGE = 1000 * 60 * 60 * 24 * 395; // ~13 months

    function readChoice() {
        try {
            var c = JSON.parse(localStorage.getItem(KEY));
            if (c && (c.v === 'granted' || c.v === 'denied') && Date.now() - c.t < MAX_AGE) return c.v;
        } catch (e) { /* no choice stored */ }
        return null;
    }

    function saveChoice(v) {
        try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) { /* asked again next visit */ }
    }

    /* ── Analytics ────────────────────────────────────────────────── */
    var loaded = false;
    function loadAnalytics() {
        if (loaded) return;
        loaded = true;
        window['ga-disable-' + GA_ID] = false;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', GA_ID);
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
        document.head.appendChild(s);
    }

    // Withdrawn consent: stop sending and remove the cookies Analytics set.
    function stopAnalytics() {
        window['ga-disable-' + GA_ID] = true;
        var host = location.hostname;
        document.cookie.split(';').forEach(function (c) {
            var name = c.split('=')[0].trim();
            if (!/^_ga/.test(name) && name !== '_gid') return;
            ['', '; domain=' + host, '; domain=.' + host].forEach(function (domain) {
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + domain;
            });
        });
    }

    /* ── Banner ───────────────────────────────────────────────────── */
    var banner = null;

    function el(tag, className, text) {
        var n = document.createElement(tag);
        if (className) n.className = className;
        if (text) n.textContent = text;
        return n;
    }

    function choose(v) {
        var before = readChoice();
        saveChoice(v);
        if (v === 'granted') loadAnalytics();
        else if (before === 'granted' || loaded) stopAnalytics();
        hideBanner();
    }

    function showBanner() {
        if (banner) { banner.hidden = false; banner.querySelector('button').focus(); return; }
        banner = el('div', 'consent');
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Cookie consent');
        var text = el('p', 'consent-text');
        text.appendChild(document.createTextNode(
            'May this site use Google Analytics cookies to count visits? It helps me see which guides are used. ' +
            'Your checklist progress stays in your browser either way. '));
        var more = el('a', null, 'Privacy');
        more.href = 'index.html#privacy';
        text.appendChild(more);
        var actions = el('div', 'consent-actions');
        var allow = el('button', 'consent-btn', 'Allow');
        var deny = el('button', 'consent-btn', 'No thanks');
        allow.type = deny.type = 'button';
        allow.addEventListener('click', function () { choose('granted'); });
        deny.addEventListener('click', function () { choose('denied'); });
        actions.appendChild(allow);
        actions.appendChild(deny);
        banner.appendChild(text);
        banner.appendChild(actions);
        document.body.appendChild(banner);
    }

    function hideBanner() { if (banner) banner.hidden = true; }

    // "Cookie settings" at the end of the footer links on every page.
    function addSettingsLink() {
        document.querySelectorAll('.site-footer-links, .act-footer-links').forEach(function (links) {
            var b = el('button', 'consent-open' + (links.classList.contains('site-footer-links') ? ' site-footer-link' : ''), 'Cookie settings');
            b.type = 'button';
            b.addEventListener('click', showBanner);
            links.appendChild(b);
        });
    }

    function init() {
        addSettingsLink();
        var choice = readChoice();
        if (choice === 'granted') loadAnalytics();
        else if (choice === null) showBanner();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
