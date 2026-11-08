/*
 * Checklist for the act and interlude pages (body.act-page).
 * The page names its storage key and reset label on <body>:
 *   <body class="act-page" data-progress-key="poe2-act1-v05" data-reset-label="Act I">
 * Saved progress is a JSON array of completed step ids ("1", "2", …) in
 * localStorage; the keys are unchanged, so earlier progress still loads.
 *
 * Built here from the page's own markup:
 *   - the zone rail (one link per zone, repeat visits folded in)
 *   - per-zone counts in each zone band
 *   - step detail lines (tips / warnings under a step, opened with +)
 *   - league note labels, from assets/league.js
 * View filters (Hide done, Alt run, League notes, Cues) only hide rows; they are
 * shared across the act pages under poe2-view-filters.
 */
(function () {
    'use strict';

    var body = document.body;
    var STORAGE_KEY = body.getAttribute('data-progress-key');
    var RESET_LABEL = body.getAttribute('data-reset-label') || 'this page';
    var VIEW_KEY = 'poe2-view-filters';
    var STEP_ID = /^\d{1,4}$/;
    var VIEWS = { 'hide-completed': false, 'alt-leveling': false, 'league-notes': true, 'cue-notes': true };

    var steps = [];        // every .step on the page
    var zones = [];        // { header, steps, count }
    var notes = [];        // { el, owner } for notes in the route (not folded into a step)
    var railEntries = [];  // { link, zones }

    /* ── Storage (blocked storage must never break the page) ──────── */
    function readJSON(key) {
        try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
    }
    function writeJSON(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* not saved */ }
    }

    /* ── Step state ───────────────────────────────────────────────── */
    function isDone(step) { return step.classList.contains('completed'); }
    function isOptional(step) { return !!step.querySelector('.skip'); }
    function anyFilter() { return VIEWS['hide-completed'] || VIEWS['alt-leveling']; }

    // Does this step count toward progress? Alt run counts only required steps.
    function counts(step) { return !(VIEWS['alt-leveling'] && isOptional(step)); }

    // Is this step hidden by the filters that are on?
    function isFiltered(step) {
        return (VIEWS['alt-leveling'] && isOptional(step)) ||
               (VIEWS['hide-completed'] && isDone(step));
    }

    function setDone(step, done) {
        step.classList.toggle('completed', done);
        var check = step.querySelector('.step-check');
        if (check) check.setAttribute('aria-checked', done ? 'true' : 'false');
    }

    function loadProgress() {
        var saved = readJSON(STORAGE_KEY);
        var done = {};
        if (Array.isArray(saved)) {
            saved.forEach(function (id) { if (typeof id === 'string' && STEP_ID.test(id)) done[id] = true; });
        }
        steps.forEach(function (step) { setDone(step, done[step.getAttribute('data-step')] === true); });
    }

    function saveProgress() {
        writeJSON(STORAGE_KEY, steps.filter(isDone).map(function (s) { return s.getAttribute('data-step'); }));
    }

    function resetProgress() {
        if (!window.confirm('Reset all progress for ' + RESET_LABEL + '?')) return;
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* nothing saved */ }
        steps.forEach(function (step) { setDone(step, false); });
        render();
    }

    /* ── Rendering: everything that follows from step state + views ─ */
    function render() {
        renderProgress();
        renderZones();
        renderNotes();
        renderRail();
    }

    function renderProgress() {
        var counted = steps.filter(counts);
        var done = counted.filter(isDone).length;
        var text = document.getElementById('actProgressText');
        var bar = document.getElementById('actProgressBar');
        if (text) text.textContent = done + ' / ' + counted.length;
        if (bar) bar.style.width = (counted.length ? done / counted.length * 100 : 0) + '%';
    }

    // Each band shows "done/total"; a zone whose steps are all filtered out
    // keeps its band as a landmark, stripped back to the title (.zone-empty).
    function renderZones() {
        zones.forEach(function (z) {
            var counted = z.steps.filter(counts);
            z.count.textContent = counted.length ? counted.filter(isDone).length + '/' + counted.length : '';
            z.header.classList.toggle('zone-empty', anyFilter() && isZoneFiltered(z));
        });
    }

    function isZoneFiltered(z) {
        return z.steps.length > 0 && z.steps.every(isFiltered);
    }

    // A note left in the route hides with its owner: a step's note with that
    // step, a zone-level note only once the whole zone is filtered out.
    function renderNotes() {
        notes.forEach(function (n) {
            var orphan = n.owner && (n.owner.steps ? anyFilter() && isZoneFiltered(n.owner) : isFiltered(n.owner));
            n.el.classList.toggle('note-orphan', !!orphan);
        });
    }

    // The current zone is where the first unfinished step sits. A zone visited
    // again later (a town, a "Return") counts as done once its first visit is.
    function renderRail() {
        var current = -1;
        zones.forEach(function (z, i) {
            if (current === -1 && !z.steps.filter(counts).every(isDone)) current = i;
        });
        railEntries.forEach(function (entry) {
            var first = zones.indexOf(entry.zones[0]);
            var state = current === -1 ? 'done'
                      : entry.zones.indexOf(zones[current]) !== -1 ? 'current'
                      : first < current ? 'done' : 'todo';
            entry.link.classList.toggle('is-done', state === 'done');
            entry.link.classList.toggle('is-current', state === 'current');
            if (state === 'current') entry.link.setAttribute('aria-current', 'step');
            else entry.link.removeAttribute('aria-current');
        });
    }

    /* ── View filters ─────────────────────────────────────────────── */
    function loadViews() {
        var saved = readJSON(VIEW_KEY);
        if (!saved || typeof saved !== 'object') return;
        Object.keys(VIEWS).forEach(function (k) {
            if (typeof saved[k] === 'boolean') VIEWS[k] = saved[k];
        });
    }

    function applyViews() {
        Object.keys(VIEWS).forEach(function (k) {
            body.classList.toggle(k, VIEWS[k]);
            // a view can have several buttons (Cues: the filter chip and the eye in each zone band)
            document.querySelectorAll('[data-view="' + k + '"]').forEach(function (btn) {
                btn.setAttribute('aria-pressed', VIEWS[k] ? 'true' : 'false');
            });
        });
        render();
    }

    function initViews() {
        loadViews();
        document.querySelectorAll('[data-view]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var name = btn.getAttribute('data-view');
                if (!Object.prototype.hasOwnProperty.call(VIEWS, name)) return;
                VIEWS[name] = !VIEWS[name];
                writeJSON(VIEW_KEY, VIEWS);
                applyViews();
            });
        });
    }

    /* ── Building the page ────────────────────────────────────────── */
    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
    }

    // League-only notes and steps carry data-league="<key>"; assets/league.js
    // names the leagues. A note gets its "<name> only" label from there, and
    // anything from a league no longer listed is dropped.
    function initLeagues() {
        var leagues = window.POE2_LEAGUES || {};
        document.querySelectorAll('[data-league]').forEach(function (n) {
            var key = n.getAttribute('data-league');
            var league = Object.prototype.hasOwnProperty.call(leagues, key) ? leagues[key] : null;
            if (!league || !league.name) {
                n.remove();
                return;
            }
            if (n.classList.contains('note')) n.insertBefore(el('span', 'label', league.name + ' only'), n.firstChild);
        });
        steps = steps.filter(function (s) { return s.isConnected; });
        if (!document.querySelector('[data-league]')) {
            var btn = document.querySelector('[data-view="league-notes"]');
            if (btn) btn.hidden = true;
        }
    }

    // Tips and warnings written right under a step become that step's detail
    // line, opened with the + on the row.
    function foldStepNotes() {
        var keep = ['cue', 'change', 'league', 'success'];
        function isFoldable(n) {
            return n.classList.contains('note') && !keep.some(function (k) { return n.classList.contains(k); });
        }
        document.querySelectorAll('.main > .note.tip, .main > .note.warning, .main > .note.warn').forEach(function (n) {
            var owner = n.previousElementSibling;
            while (owner && isFoldable(owner)) owner = owner.previousElementSibling;
            if (!owner || !owner.classList.contains('step')) return;
            var detail = owner.querySelector('.step-detail');
            if (!detail) {
                var content = owner.querySelector('.step-content');
                var line = el('div', 'step-line');
                while (content.firstChild) line.appendChild(content.firstChild);
                var sign = el('span', 'step-sign', '+');
                sign.setAttribute('aria-hidden', 'true');
                line.appendChild(sign);
                line.setAttribute('role', 'button');
                line.setAttribute('tabindex', '0');
                line.setAttribute('aria-expanded', 'false');
                content.appendChild(line);
                detail = el('div', 'step-detail');
                content.appendChild(detail);
                owner.classList.add('has-detail');
            }
            detail.appendChild(n);
        });
    }

    function toggleDetail(step) {
        var open = step.classList.toggle('open');
        var line = step.querySelector('.step-line');
        var sign = step.querySelector('.step-sign');
        if (line) line.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (sign) sign.textContent = open ? '−' : '+';
    }

    // The zone name is the band's own text, without its tags and buttons.
    function zoneName(zh) {
        var name = '';
        zh.childNodes.forEach(function (n) { if (n.nodeType === 3) name += n.textContent; });
        return name.replace(/\s+/g, ' ').trim();
    }

    function collectZones() {
        document.querySelectorAll('.zone-header').forEach(function (zh, i) {
            if (!zh.id) zh.id = 'zone-' + (i + 1);
            var count = el('span', 'zone-count');
            zh.insertBefore(count, zh.querySelector('.lvl, .frag, .map'));
            var zone = { header: zh, steps: [], count: count };
            for (var s = zh.nextElementSibling; s && !s.classList.contains('zone-header'); s = s.nextElementSibling) {
                if (s.classList.contains('step')) zone.steps.push(s);
            }
            zones.push(zone);
        });
    }

    function collectNotes() {
        document.querySelectorAll('.main > .note').forEach(function (n) {
            var owner = null;
            for (var p = n.previousElementSibling; p && !owner; p = p.previousElementSibling) {
                if (p.classList.contains('step')) owner = p;
                else if (p.classList.contains('zone-header')) owner = zones.filter(function (z) { return z.header === p; })[0];
            }
            notes.push({ el: n, owner: owner });
        });
    }

    // One rail link per zone; "(Return)" and repeat visits fold into the first.
    function buildRail() {
        var rail = document.getElementById('zoneRail');
        if (!rail) return;
        var byName = {};
        zones.forEach(function (z) {
            var name = zoneName(z.header).replace(/\s*\([^)]*\)\s*$/, '');
            var entry = byName[name];
            if (!entry) {
                var link = el('a', 'rail-link');
                link.href = '#' + z.header.id;
                var node = el('span', 'rail-node');
                node.setAttribute('aria-hidden', 'true');
                var lvl = z.header.querySelector('.lvl');
                link.appendChild(node);
                link.appendChild(el('span', 'rail-name', name));
                link.appendChild(el('span', 'rail-lvl', lvl ? lvl.textContent.replace(/^Lvl\s*/i, '') : ''));
                rail.appendChild(link);
                entry = byName[name] = { link: link, zones: [] };
                railEntries.push(entry);
            }
            entry.zones.push(z);
        });
    }

    /* ── Interaction ──────────────────────────────────────────────── */
    function toggleStep(step) {
        setDone(step, !isDone(step));
        saveProgress();
        render();
    }

    function initSteps() {
        steps.forEach(function (step) {
            var check = step.querySelector('.step-check');
            if (!check) return;
            check.setAttribute('role', 'checkbox');
            check.setAttribute('tabindex', '0');
            check.setAttribute('aria-label', 'Done');
        });

        var main = document.querySelector('.main');
        if (!main) return;
        main.addEventListener('click', function (e) {
            var step = e.target.closest('.step');
            if (!step || e.target.closest('a, .step-detail')) return;
            if (step.classList.contains('has-detail') && !e.target.closest('.step-check')) {
                toggleDetail(step);
                return;
            }
            // Selecting text in a row should not tick it.
            var sel = window.getSelection && window.getSelection();
            if (sel && sel.toString().length > 0 && step.contains(sel.anchorNode)) return;
            toggleStep(step);
        });
        main.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            var target = e.target;
            if (target.classList.contains('step-check')) toggleStep(target.closest('.step'));
            else if (target.classList.contains('step-line')) toggleDetail(target.closest('.step'));
            else return;
            e.preventDefault();
        });

        var reset = document.getElementById('resetProgress');
        if (reset) reset.addEventListener('click', resetProgress);
    }

    function init() {
        if (!STORAGE_KEY) return;
        steps = Array.prototype.slice.call(document.querySelectorAll('.step[data-step]'));
        initLeagues();
        foldStepNotes();
        collectZones();
        collectNotes();
        buildRail();
        loadProgress();
        initSteps();
        initViews();
        applyViews();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
