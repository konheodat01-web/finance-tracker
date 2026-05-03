const fs = require('fs');
const content = fs.readFileSync('script.js');
// The mangled sequence for " đ" in the file seems to be " A,?~" (or similar bytes)
// But it's easier to just target the line content if I can.
// Let's try replacing the specific line for formatCurrency.

let str = content.toString('binary'); 
// We use binary to preserve whatever bytes are there.

// We saw: return new Intl.NumberFormat('vi-VN').format(amount) + ' A,?~';
// Let's try to find a pattern that matches the end of that function.

const pattern = "return new Intl.NumberFormat('vi-VN').format(amount) + ' ";
const startIdx = str.indexOf(pattern);
if (startIdx !== -1) {
    const endIdx = str.indexOf("';", startIdx);
    if (endIdx !== -1) {
        const fullOldLine = str.substring(startIdx, endIdx + 2);
        const newLine = "return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';";
        str = str.replace(fullOldLine, newLine);
        console.log("Fixed formatCurrency line");
    }
}

// Let's also fix the budget rendering parts if they have similar issues.
// But first, let's write this back as UTF-8.
fs.writeFileSync('script.js', Buffer.from(str, 'binary'));
