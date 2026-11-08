/*
 * League notes on the act pages: the one place to change for a new season.
 *
 * Each league-only note (or step) in the act pages names its league by key:
 *     <div class="note league" data-league="runes-of-aldur">…text…</div>
 * progress.js gives it the label "<name> only" from the list below, and the
 * "League notes" button shows or hides all of them.
 *
 *   New league   → add { key: { name } } here, then write its notes with that key.
 *   League ended → delete its line here. Its notes disappear from every page
 *                  at once; remove them from the HTML whenever convenient.
 *   No league    → leave the list empty. The League notes button hides itself.
 *
 * Colours: the --a-league-* tokens at the top of assets/act.css.
 */
window.POE2_LEAGUES = {
    'runes-of-aldur': { name: 'Runes of Aldur' }
};
