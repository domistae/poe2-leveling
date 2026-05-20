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
        saveProgress();
        updateProgressBar();
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
                saveProgress();
                updateProgressBar();
                syncZoneMarks();
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

    function toggleStep(el) {
        var step = el && el.closest ? el.closest('.step') : null;
        if (!step) return;
        step.classList.toggle('completed');
        saveProgress();
        updateProgressBar();
        syncZoneMarks();
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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
