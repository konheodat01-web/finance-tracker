// The script.js is double-encoded UTF-8 as latin1 characters.
// To fix: read file bytes, interpret as latin1 string, re-encode to get original UTF-8 bytes.
// But we must NOT touch backtick characters as they're template literal delimiters.

const fs = require('fs');
const { execSync } = require('child_process');

// Read raw bytes
const rawBuf = fs.readFileSync('script.js');
// Convert bytes to latin1 string (byte-by-byte, no interpretation)
const latin1Str = rawBuf.toString('latin1');
// Re-interpret as UTF-8
let fixed = Buffer.from(latin1Str, 'latin1').toString('utf-8');

// Verify syntax won't break - check backtick count is preserved
const btBefore = latin1Str.split('\x60').length - 1;
const btAfter = fixed.split('\x60').length - 1;
console.log('Backticks before:', btBefore, '| after:', btAfter);

// Check for replacement characters
const replacementCount = (fixed.match(/\uFFFD/g) || []).length;
console.log('Replacement chars (garbled):', replacementCount);

if (btAfter >= 100 && replacementCount < 50) {
    fs.writeFileSync('script.js', fixed, 'utf-8');
    console.log('Written. Checking syntax...');
    try {
        execSync('node -c script.js', { stdio: 'pipe' });
        console.log('SYNTAX OK');
    } catch(e) {
        console.log('SYNTAX ERROR:', e.stderr.toString());
    }
} else {
    console.log('Safety check failed, not writing. btAfter:', btAfter, 'replacements:', replacementCount);
}
