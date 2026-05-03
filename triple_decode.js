// The text is TRIPLE encoded (3 levels of UTF-8).
// Fix: decode latin1 → utf8 TWICE
const fs = require('fs');
const { execSync } = require('child_process');

const rawBuf = fs.readFileSync('script.js');

// Pass 1: raw bytes as latin1 → decode as utf8
const pass1 = Buffer.from(rawBuf.toString('latin1'), 'latin1').toString('utf-8');

// Check if still garbled (look for pattern of double-encoded chars)
const stillGarbled = pass1.includes('Chưa có giao d') === false && pass1.includes('ChÆ°a') || pass1.includes('á»');

let fixed = pass1;
if (stillGarbled) {
    console.log('Still garbled after pass 1, doing pass 2...');
    // Pass 2: re-encode again
    fixed = Buffer.from(pass1, 'latin1').toString('utf-8');
}

const btCount = (fixed.match(/`/g) || []).length;
const replacements = (fixed.match(/\uFFFD/g) || []).length;
console.log('Backticks:', btCount, '| Replacements:', replacements);
console.log('Sample check "giao dịch":', fixed.includes('giao dịch') ? 'YES' : 'NO');
console.log('Sample check "Chưa có":', fixed.includes('Chưa có') ? 'YES' : 'NO');

if (btCount >= 100 && replacements < 10 && fixed.includes('giao dịch')) {
    fs.writeFileSync('script.js', fixed, 'utf-8');
    console.log('Written!');
    try {
        execSync('node -c script.js', { stdio: 'pipe' });
        console.log('SYNTAX OK');
    } catch(e) {
        console.log('SYNTAX ERROR:', e.stderr.toString());
    }
} else {
    console.log('Safety check failed');
}
