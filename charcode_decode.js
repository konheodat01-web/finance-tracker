// The file contains MIXED encoding:
// Some strings are triple-encoded, others are double-encoded.
// The "latin1 -> utf8" approach decodes double-encoding but leaves triple-encoding broken.
// 
// The correct approach: process line by line and for each line
// try decode 1 time (latin1 -> utf8). If the result STILL contains mojibake patterns,
// apply the decode ONCE MORE.
//
// Actually the issue is simpler: the file content as read by Node's utf8 contains
// chars like "á»‹" which are 3 javascript chars (multi-byte when encoded back to utf8)
// We need to encode THOSE chars as latin1 bytes and decode as utf8.

const fs = require('fs');
const { execSync } = require('child_process');

// The correct fix: read file content as JS string (already utf8-decoded by Node)
// Then take each JS codepoint and treat it as a BYTE value, then re-decode as utf8.
// This is the latin1 trick.

const text = fs.readFileSync('script.js', 'utf-8');

// The text string in memory contains chars like 'á' (U+00E1) which is a BYTE value
// when re-interpreted as latin1. We need to re-encode to get the original bytes.

// Build a Uint8Array from the char codes (treating each char as a byte)
const charCodes = [];
for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 255) {
        // This char was already correctly decoded, keep as is (multi-byte)
        // Encode it back to utf8 bytes
        const buf = Buffer.from(text[i], 'utf-8');
        for (const b of buf) charCodes.push(b);
    } else {
        charCodes.push(code);
    }
}

const rawBytes = Buffer.from(charCodes);
let decoded = rawBytes.toString('utf-8');

// Verify
console.log('Contains "giao dịch":', decoded.includes('giao dịch'));
console.log('Contains "Chưa có":', decoded.includes('Chưa có'));
console.log('Backticks:', (decoded.match(/`/g)||[]).length);
const repl = (decoded.match(/\uFFFD/g)||[]).length;
console.log('Replacement chars:', repl);

const idx = decoded.indexOf('giao d');
if (idx >= 0) console.log('Sample:', decoded.substring(idx, idx + 40));

if (decoded.includes('giao dịch') && decoded.includes('Chưa có') && repl < 10) {
    fs.writeFileSync('script.js', decoded, 'utf-8');
    console.log('Written!');
    try {
        execSync('node -c script.js', { stdio: 'pipe' });
        console.log('SYNTAX OK');
    } catch(e) {
        console.log('SYNTAX ERROR:', e.stderr.toString());
    }
} else {
    console.log('Safety check failed, not writing');
}
