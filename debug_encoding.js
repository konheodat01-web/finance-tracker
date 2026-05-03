// The script.js file is already correct UTF-8 - it reads as "giao dá»‹ch" 
// which is "giao d" + valid-but-wrong sequence. The BROWSER is likely reading
// it as double-encoded because it's being served with wrong charset.
//
// Root cause: The file on disk has CORRECT UTF-8 bytes for the MOJIBAKE text
// (i.e., the file contains the UTF-8 encoding of "á»‹" instead of "ị")
//
// What ACTUALLY happened: the original script.js was saved in Windows-1252 
// originally, then opened in UTF-8 mode, producing these mojibake strings.
// The file needs those mojibake strings replaced with the actual correct UTF-8.

const fs = require('fs');
const { execSync } = require('child_process');

// Read file as binary (latin1) to get raw bytes
const rawText = fs.readFileSync('script.js').toString('latin1');

// The bytes are: valid UTF-8 encoding of WRONG text
// Those wrong bytes, when reinterpreted as latin1 and then decoded as utf8, give the correct text.
// But that gives replacement chars...
// 
// Real approach: The bytes in file are: c3 a1 c2 bb e2 80 b9 (for "á»‹")
// The CORRECT bytes should be: e1 bb 8b (for "ị")
//
// So the file has the TRIPLE-encoded form where:
//   ị -> utf-8 bytes e1 bb 8b
//     -> interpreted as latin1 chars: á » ‹
//     -> encoded in utf-8: c3a1 c2bb e2808b
//
// We need to reverse this. 
// Step 1: Read file bytes as latin1 chars (each byte = one char code point)
// Step 2: Take each char code as a byte value (re-pack to buffer)
// Step 3: Decode as utf-8 → gives the double-encoded text  
// Step 4: Repeat one more time to get correct text

// But step 3 already has issues: some byte sequences from step 2 aren't valid utf8.

// Correct approach: the file bytes, when read as latin1, produce chars like "á»‹"
// Take THESE chars, encode them with latin1 back to bytes: c3a1 c2bb e2 80 b9 ... 
// wait that's not right either.

// Let's just try:
const rawBuf = fs.readFileSync('script.js');
const asLatin1 = rawBuf.toString('latin1'); // byte values as chars

// Now encode those latin1 chars back as bytes, then decode as utf8:
const decoded = Buffer.from(asLatin1, 'latin1').toString('utf8');

// Check quality
console.log('Test "giao dịch":', decoded.includes('giao dịch'));
console.log('Test "Chưa có":', decoded.includes('Chưa có'));
console.log('Backticks:', (decoded.match(/`/g)||[]).length);
console.log('Replacements:', (decoded.match(/\uFFFD/g)||[]).length);

// Sample
const idx = decoded.indexOf('giao d');
if (idx > 0) console.log('Sample:', decoded.substring(idx, idx + 30));
