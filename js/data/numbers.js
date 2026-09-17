/**
 * Number Words — 1 to 1000
 *
 * Converts numeric values to English words and generates
 * IndexedDB entries with difficulty tiers:
 *   Level 1:  1–10
 *   Level 2: 11–20
 *   Level 3: 21–100
 *   Level 4: 101–1000
 */

const UNITS = [
    '', 'one', 'two', 'three', 'four', 'five',
    'six', 'seven', 'eight', 'nine'
];

const TEENS = [
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
    'sixteen', 'seventeen', 'eighteen', 'nineteen'
];

const TENS = [
    '', '', 'twenty', 'thirty', 'forty', 'fifty',
    'sixty', 'seventy', 'eighty', 'ninety'
];

/**
 * Convert a number (1–1000) to its English word form.
 * @param {number} n
 * @returns {string}
 */
export function numberToWords(n) {
    if (n === 1000) return 'one thousand';
    if (n < 1 || n > 1000) return String(n);

    if (n < 10)  return UNITS[n];
    if (n < 20)  return TEENS[n - 10];
    if (n < 100) {
        const t = Math.floor(n / 10);
        const u = n % 10;
        return TENS[t] + (u > 0 ? '-' + UNITS[u] : '');
    }

    // 100–999
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    return UNITS[h] + ' hundred' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
}

/**
 * Get difficulty level for a number.
 * @param {number} n
 * @returns {number} 1–4
 */
function getDifficultyLevel(n) {
    if (n <= 10)  return 1;
    if (n <= 20)  return 2;
    if (n <= 100) return 3;
    return 4;
}

/**
 * Generate all number entries for IndexedDB seeding.
 * @returns {Array<Object>}
 */
export function generateNumberEntries() {
    const entries = [];
    for (let i = 1; i <= 1000; i++) {
        entries.push({
            text: numberToWords(i),
            numericValue: i,
            category: 'number',
            difficultyLevel: getDifficultyLevel(i)
        });
    }
    return entries;
}
