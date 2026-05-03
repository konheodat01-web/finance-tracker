const fs = require('fs');

function cleanFile(path) {
    const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
    const cleaned = lines.map(line => {
        // Remove the weird mangled prefix if it exists
        // It looks like " ` `" or similar
        return line.replace(/^[\s\uFFFD\u00A0\u00C2]*`[\s\uFFFD\u00A0\u00C2]*`/, '    ')
                   .replace(/^[\s\uFFFD\u00A0\u00C2]*`/, '  ');
    });
    fs.writeFileSync(path, cleaned.join('\n'), 'utf8');
}

cleanFile('script.js');
console.log("Line prefix cleanup attempted");
