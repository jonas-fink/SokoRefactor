// WCAG-Kontrastprüfung für die Tokens in src/index.css.
// Exit-Code 1, sobald ein Paar unter seinem Minimum liegt — so kann der
// Token-Block nicht still verrutschen.
//
// ponytail: keine Farb-Lib. sRGB -> relative Luminanz sind sechs Zeilen,
// und mehr als #rrggbb steht in den Tokens nicht drin.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CSS = fileURLToPath(new URL('../src/index.css', import.meta.url));

const AA_TEXT = 4.5; // 1.4.3 — Fließtext
const AA_UI = 3; // 1.4.11 — Control-Ränder, Icons

function readTheme(css, selector) {
    const start = css.indexOf(selector);
    if (start === -1) throw new Error(`Block ${selector} fehlt in index.css`);
    const open = css.indexOf('{', start);
    const end = css.indexOf('\n}', open);
    const tokens = {};
    for (const m of css.slice(open, end).matchAll(/(--color-[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\b/g)) {
        tokens[m[1]] = m[2];
    }
    return tokens;
}

const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
        const v = parseInt(hex.slice(i, i + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
};

const CATEGORIES = [
    'behoerden', 'familie', 'gesundheit', 'finanzen', 'asyl',
    'sport', 'natur', 'kunst', 'bildung', 'markt', 'sonstiges',
];

// [Beschriftung, Vordergrund, Hintergrund, Minimum]
function pairsFor(t) {
    const pairs = [
        ['ink / bg', t['--color-ink'], t['--color-bg'], AA_TEXT],
        ['ink / surface', t['--color-ink'], t['--color-surface'], AA_TEXT],
        ['ink-soft / surface', t['--color-ink-soft'], t['--color-surface'], AA_TEXT],
        ['ink-soft / bg', t['--color-ink-soft'], t['--color-bg'], AA_TEXT],
        ['ink-mute / surface', t['--color-ink-mute'], t['--color-surface'], AA_TEXT],
        ['ink-mute / bg', t['--color-ink-mute'], t['--color-bg'], AA_TEXT],
        ['primary / surface', t['--color-primary'], t['--color-surface'], AA_TEXT],
        ['primary / bg', t['--color-primary'], t['--color-bg'], AA_TEXT],
        ['primary-ink / primary', t['--color-primary-ink'], t['--color-primary'], AA_TEXT],
        ['accent-ink / accent', t['--color-accent-ink'], t['--color-accent'], AA_TEXT],
        ['accent-strong / surface', t['--color-accent-strong'], t['--color-surface'], AA_TEXT],
        ['accent-strong / bg', t['--color-accent-strong'], t['--color-bg'], AA_TEXT],
        ['error / surface', t['--color-error'], t['--color-surface'], AA_TEXT],
        ['success / surface', t['--color-success'], t['--color-surface'], AA_TEXT],
        ['line-strong / surface', t['--color-line-strong'], t['--color-surface'], AA_UI],
        ['line-strong / bg', t['--color-line-strong'], t['--color-bg'], AA_UI],
    ];
    for (const c of CATEGORIES) {
        pairs.push([`cat-${c} / -soft`, t[`--color-cat-${c}`], t[`--color-cat-${c}-soft`], AA_TEXT]);
        pairs.push([`cat-${c} / surface`, t[`--color-cat-${c}`], t['--color-surface'], AA_TEXT]);
    }
    return pairs;
}

const css = readFileSync(CSS, 'utf8');
let failures = 0;

for (const [theme, selector] of [['LIGHT', ':root {'], ['DARK', '.dark {']]) {
    console.log(`\n=== ${theme} ===`);
    for (const [label, fg, bg, min] of pairsFor(readTheme(css, selector))) {
        if (!fg || !bg) {
            console.log(`  FEHLT  ${label}`);
            failures++;
            continue;
        }
        const ratio = contrast(fg, bg);
        const ok = ratio >= min;
        if (!ok) failures++;
        const grade = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA ' : ratio >= 3 ? 'AA+' : '   ';
        console.log(
            `  ${ok ? 'ok  ' : 'FAIL'} ${grade} ${ratio.toFixed(2).padStart(5)} (min ${min})  ${label}`,
        );
    }
}

console.log(failures ? `\n${failures} Paar(e) unter Minimum.` : '\nAlle Paare bestehen.');
process.exit(failures ? 1 : 0);
