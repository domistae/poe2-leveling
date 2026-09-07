/*
 * Shared progress + checklist logic for the act and interlude pages.
 * Each page sets window.POE2_PROGRESS before this script loads:
 *   window.POE2_PROGRESS = {
 *     storageKey: 'poe2-act1-v05',
 *     allKeys: ['poe2-act1-v05', 'poe2-act2-v05', 'poe2-act3-v05', 'poe2-act4-v05', 'poe2-interludes-v05'],
 *     resetLabel: 'Act'
 *   };
 * localStorage keys are unchanged — saved progress survives the refactor.
 */
(function () {
    'use strict';

    var cfg = window.POE2_PROGRESS || {};
    var STORAGE_KEY = cfg.storageKey;
    var ALL_STORAGE_KEYS = cfg.allKeys || [];
    var RESET_LABEL = cfg.resetLabel || 'this page';

    function showToast(message, isError) {
        var existing = document.querySelector('.toast');
        if (existing) existing.remove();
        var toast = document.createElement('div');
        toast.className = 'toast' + (isError ? ' error' : '');
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(function () { toast.remove(); }, 3000);
    }

    function exportAllProgress() {
        var allData = {};
        ALL_STORAGE_KEYS.forEach(function (key) {
            var saved = localStorage.getItem(key);
            if (!saved) return;
            try { allData[key] = JSON.parse(saved); } catch (e) { /* skip corrupted */ }
        });
        if (Object.keys(allData).length === 0) {
            showToast('No progress to export!', true);
            return;
        }
        var code = 'PoE2v05_' + btoa(JSON.stringify(allData));
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(function () {
                showToast('Progress code copied to clipboard');
            }).catch(function () {
                prompt('Copy this progress code:', code);
            });
        } else {
            prompt('Copy this progress code:', code);
        }
    }

    function showImportDialog() {
        var dlg = document.getElementById('importDialog');
        var inp = document.getElementById('importCode');
        if (dlg) dlg.style.display = 'block';
        if (inp) { inp.value = ''; inp.focus(); }
    }

    function hideImportDialog() {
        var dlg = document.getElementById('importDialog');
        if (dlg) dlg.style.display = 'none';
    }

    function importAllProgress() {
        var inp = document.getElementById('importCode');
        if (!inp) return;
        var code = inp.value.trim();
        var prefix = code.indexOf('PoE2v05_') === 0 ? 'PoE2v05_'
                   : code.indexOf('PoE2_') === 0 ? 'PoE2_' : null;
        if (!prefix) { showToast('Invalid progress code!', true); return; }
        if (code.length > 10000) { showToast('Progress code too large!', true); return; }
        try {
            var decoded = JSON.parse(atob(code.substring(prefix.length)));
            if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) {
                throw new Error('Invalid format');
            }
            var imported = 0;
            Object.keys(decoded).forEach(function (key) {
                if (ALL_STORAGE_KEYS.indexOf(key) === -1) return;
                var steps = decoded[key];
                if (!Array.isArray(steps) || steps.length > 200) return;
                if (!steps.every(function (s) { return typeof s === 'string' && /^\d+$/.test(s); })) return;
                localStorage.setItem(key, JSON.stringify(steps));
                imported += steps.length;
            });
            hideImportDialog();
            loadProgress();
            showToast('Imported ' + imported + ' completed steps');
        } catch (e) {
            showToast('Failed to import — invalid code', true);
        }
    }

    function loadProgress() {
        document.querySelectorAll('.step.completed').forEach(function (el) {
            el.classList.remove('completed');
        });
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            var steps = [];
            try { steps = JSON.parse(saved); } catch (e) { steps = []; }
            if (Array.isArray(steps)) {
                steps.forEach(function (step) {
                    var el = document.querySelector('[data-step="' + step + '"]');
                    if (el) el.classList.add('completed');
                });
            }
        }
        updateProgressBar();
        syncZoneMarks();
        // Import re-runs this after the filters are already live.
        syncOrphanNotes();
        syncEmptyZones();
    }

    function saveProgress() {
        var completed = [];
        document.querySelectorAll('.step.completed').forEach(function (el) {
            completed.push(el.dataset.step);
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    }

    function isRequiredStep(stepEl) { return !stepEl.querySelector('.skip'); }

    function getZoneSteps(zoneHeader) {
        var steps = [];
        var el = zoneHeader.nextElementSibling;
        while (el && !el.classList.contains('zone-header')) {
            if (el.classList.contains('step')) steps.push(el);
            el = el.nextElementSibling;
        }
        return steps;
    }

    function markZoneRequired(checkbox) {
        var zoneHeader = checkbox.closest('.zone-header');
        var target = checkbox.checked;
        getZoneSteps(zoneHeader).forEach(function (step) {
            if (isRequiredStep(step)) step.classList.toggle('completed', target);
        });
        afterStepChange();
    }

    function syncZoneMarks() {
        document.querySelectorAll('.zone-header').forEach(function (zh) {
            var cb = zh.querySelector('.zone-mark input[type="checkbox"]');
            if (!cb) return;
            var required = getZoneSteps(zh).filter(isRequiredStep);
            if (required.length === 0) { cb.checked = false; return; }
            cb.checked = required.every(function (s) { return s.classList.contains('completed'); });
        });
    }

    function initZoneMarks() {
        document.querySelectorAll('.zone-header').forEach(function (zh) {
            if (zh.querySelector('.zone-mark')) return;
            var required = getZoneSteps(zh).filter(isRequiredStep);
            if (required.length === 0) return;
            var label = document.createElement('label');
            label.className = 'zone-mark';
            label.innerHTML = '<input type="checkbox"><span>mark required</span>';
            var cb = label.querySelector('input');
            cb.addEventListener('change', function (e) { e.stopPropagation(); markZoneRequired(this); });
            label.addEventListener('click', function (e) { e.stopPropagation(); });
            zh.appendChild(label);
        });
        syncZoneMarks();
    }

    function initStepRowClicks() {
        document.querySelectorAll('.step').forEach(function (step) {
            var check = step.querySelector('.step-check');
            if (check) check.removeAttribute('onclick');
            step.addEventListener('click', function (e) {
                if (e.target.closest('a, .zone-mark')) return;
                var sel = window.getSelection && window.getSelection();
                if (sel && sel.toString().length > 0 && this.contains(sel.anchorNode)) return;
                this.classList.toggle('completed');
                afterStepChange();
            });
        });
    }

    function resetProgress() {
        if (!confirm('Reset all progress for this ' + RESET_LABEL + '?')) return;
        localStorage.removeItem(STORAGE_KEY);
        document.querySelectorAll('.step.completed').forEach(function (el) {
            el.classList.remove('completed');
        });
        updateProgressBar();
        syncZoneMarks();
        syncOrphanNotes();
        syncEmptyZones();
    }

    function updateProgressBar() {
        var allSteps = document.querySelectorAll('.step');
        var requiredSteps = document.querySelectorAll('.step:not(:has(.skip))');
        var completedAll = document.querySelectorAll('.step.completed');
        var completedRequired = document.querySelectorAll('.step.completed:not(:has(.skip))');

        var totalAll = allSteps.length;
        var totalRequired = requiredSteps.length;
        var doneAll = completedAll.length;
        var doneRequired = completedRequired.length;

        var barFast = document.getElementById('progressBarFast');
        var textFast = document.getElementById('progressTextFast');
        var barAll = document.getElementById('progressBarComplete');
        var textAll = document.getElementById('progressTextComplete');

        if (barFast && totalRequired > 0) barFast.style.width = (doneRequired / totalRequired) * 100 + '%';
        if (textFast) textFast.textContent = doneRequired + ' / ' + totalRequired;
        if (barAll && totalAll > 0) barAll.style.width = (doneAll / totalAll) * 100 + '%';
        if (textAll) textAll.textContent = doneAll + ' / ' + totalAll;
    }

    /* Everything that must happen after a step's completed state changes.
       Both entry points (the row click handler and the legacy toggleStep
       onclick) go through here so they cannot drift apart — the row handler
       previously skipped the filter re-sync, which left zone headers and
       notes stale while a filter was already on. */
    function afterStepChange() {
        saveProgress();
        updateProgressBar();
        syncZoneMarks();
        syncOrphanNotes();
        syncEmptyZones();
    }

    function toggleStep(el) {
        var step = el && el.closest ? el.closest('.step') : null;
        if (!step) return;
        step.classList.toggle('completed');
        afterStepChange();
    }

    /* ── View filters ────────────────────────────────────────────────
       Two independent toggles that only hide rows — they never touch
       saved progress, and the progress counters keep counting every
       step whether it is visible or not. Persisted per browser and
       shared across all act pages. */
    var VIEW_KEY = 'poe2-view-filters';
    var VIEWS = { 'hide-completed': false, 'alt-leveling': false };

    function loadViewFilters() {
        try {
            var saved = JSON.parse(localStorage.getItem(VIEW_KEY) || '{}');
            Object.keys(VIEWS).forEach(function (k) { VIEWS[k] = saved[k] === true; });
        } catch (e) { /* private mode / cleared storage — defaults stand */ }
    }

    function saveViewFilters() {
        try { localStorage.setItem(VIEW_KEY, JSON.stringify(VIEWS)); } catch (e) {}
    }

    // Is every step in this zone hidden by the filters currently on?
    function zoneIsFiltered(zoneHeader) {
        var steps = getZoneSteps(zoneHeader);
        return steps.length > 0 && steps.every(stepIsFiltered);
    }

    // A zone whose steps are all filtered out keeps its header as a landmark,
    // but stripped back to just the title (see .zone-empty in checklist.css).
    function syncEmptyZones() {
        var anyFilter = VIEWS['hide-completed'] || VIEWS['alt-leveling'];
        document.querySelectorAll('.zone-header').forEach(function (zh) {
            zh.classList.toggle('zone-empty', anyFilter && zoneIsFiltered(zh));
        });
    }

    // Would this step be hidden by the filters currently on? Decided from
    // state rather than from layout, so it does not depend on a reflow
    // having happened first.
    function stepIsFiltered(step) {
        if (VIEWS['alt-leveling'] && step.querySelector('.skip')) return true;
        if (VIEWS['hide-completed'] && step.classList.contains('completed')) return true;
        return false;
    }

    /* A .note is a SIBLING of the step it describes, not a child, so hiding a
       step leaves its commentary stranded. Walk back to whatever each note
       hangs off and hide it only when that owner is gone:
         - owned by a step  -> hide when that step is filtered out
         - owned by a zone  -> hide only when the whole zone is filtered out,
                               so a collapsed zone title is not left trailing
                               notes under it
       Nothing else is touched: a note under a step you have NOT completed
       stays put, which is the point of the per-step rule. */
    function syncOrphanNotes() {
        document.querySelectorAll('.note').forEach(function (n) {
            var owner = n.previousElementSibling;
            while (owner &&
                   !owner.classList.contains('step') &&
                   !owner.classList.contains('zone-header')) {
                owner = owner.previousElementSibling;
            }
            var orphan = false;
            if (owner && owner.classList.contains('step')) {
                orphan = stepIsFiltered(owner);
            } else if (owner && owner.classList.contains('zone-header')) {
                orphan = (VIEWS['hide-completed'] || VIEWS['alt-leveling']) && zoneIsFiltered(owner);
            }
            n.classList.toggle('note-orphan', orphan);
        });
    }

    function applyViewFilters() {
        Object.keys(VIEWS).forEach(function (k) {
            document.body.classList.toggle(k, VIEWS[k]);
            var btn = document.querySelector('[data-view="' + k + '"]');
            if (btn) btn.setAttribute('aria-pressed', VIEWS[k] ? 'true' : 'false');
        });
        syncOrphanNotes();
        syncEmptyZones();
    }

    function toggleView(name) {
        if (!Object.prototype.hasOwnProperty.call(VIEWS, name)) return;
        VIEWS[name] = !VIEWS[name];
        saveViewFilters();
        applyViewFilters();
    }

    function initViewFilters() {
        loadViewFilters();
        document.querySelectorAll('[data-view]').forEach(function (btn) {
            btn.addEventListener('click', function () { toggleView(btn.getAttribute('data-view')); });
        });
        applyViewFilters();
    }

    // onclick attributes in HTML reference these — expose globally.
    window.toggleStep = toggleStep;
    window.resetProgress = resetProgress;
    window.exportAllProgress = exportAllProgress;
    window.showImportDialog = showImportDialog;
    window.hideImportDialog = hideImportDialog;
    window.importAllProgress = importAllProgress;

    function init() {
        loadProgress();
        initStepRowClicks();
        initZoneMarks();
        initViewFilters();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
