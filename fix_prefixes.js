const fs = require('fs');

function cleanFile(path) {
    const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
    const cleaned = lines.map(line => {
        // Remove ' đ' or 'đ' or similar from the beginning of the line
        // Some lines might have multiple ' đ đ đ '
        return line.replace(/^(?:\s*đ)+\s*/g, '')
                   .replace(/^(?:\s*`)+\s*/g, '')
                   .replace(/^(?:\s*d)+\s*/g, ''); 
        // Note: checking for 'd' because sometimes terminal showed 'd'
    });
    
    // Also, my previous script might have messed up the formatting of JS/HTML. Let's hope it's just prefix issues.
    fs.writeFileSync(path, cleaned.join('\n'), 'utf8');
}

cleanFile('script.js');
cleanFile('index.html');
console.log("Removed broken prefixes");
