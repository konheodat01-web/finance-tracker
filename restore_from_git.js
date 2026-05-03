// Fix garbled UTF-8 characters in script.js
// The issue: some characters are stored as UTF-8 replacement char (U+FFFD) + digit 
// This is caused by double-encoding during a previous fix attempt.
// Solution: restore the original text from git and do a MINIMAL targeted fix.

const fs = require('fs');
const { execSync } = require('child_process');

// Get the clean version from git for comparison
const gitVersion = execSync('git show df72f05:script.js').toString('utf-8');
const currentVersion = fs.readFileSync('script.js', 'utf-8');

// Find lines that differ and if the diff is only in string literals, restore them
const gitLines = gitVersion.split(/\r?\n/);
const curLines = currentVersion.split(/\r?\n/);

let fixedCount = 0;
const result = curLines.map((line, i) => {
    const gitLine = gitLines[i] || '';
    
    // If lines are different in just content (same code structure), prefer git version
    // Strategy: if current line has U+FFFD (replacement char, 0xEFBFBD) or garbled chars
    if (line.includes('\uFFFD') || line.includes('\u0018') || line.includes('\u0011')) {
        if (gitLine) {
            fixedCount++;
            return gitLine;
        }
    }
    return line;
});

const output = result.join('\n');
fs.writeFileSync('script.js', output, 'utf-8');
console.log(`Fixed ${fixedCount} garbled lines`);

// Verify syntax
try {
    execSync('node -c script.js', { stdio: 'pipe' });
    console.log('Syntax OK');
} catch(e) {
    console.log('Syntax Error:', e.message);
}
