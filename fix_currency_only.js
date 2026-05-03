const fs = require('fs');

let text = fs.readFileSync('script.js', 'utf-8');

// Replace the mangled currency char (control char U+0018) with proper đ
// We need to find the exact line and replace it
const lines = text.split(/\r?\n/);
let fixed = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("return new Intl.NumberFormat('vi-VN').format(amount) + '")) {
        lines[i] = "    return new Intl.NumberFormat('vi-VN').format(amount) + ' \u0111';";
        console.log(`Fixed line ${i + 1}: ${lines[i]}`);
        fixed = true;
        break;
    }
}

if (!fixed) {
    console.log("Line not found, searching with indexOf...");
    const idx = text.indexOf("return new Intl.NumberFormat('vi-VN').format(amount)");
    if (idx !== -1) {
        console.log("Found at char", idx, ":", text.substring(idx, idx + 100));
    }
}

// Also fix toast messages with mangled chars - run the safe_fix logic
for (let i = 0; i < lines.length; i++) {
    // Fix showToast lines with mangled chars
    if (lines[i].includes("showToast('") && (lines[i].charCodeAt(lines[i].indexOf("showToast('") + 11) > 127)) {
        console.log(`Line ${i + 1} has mangled toast:`, lines[i]);
    }
}

fs.writeFileSync('script.js', lines.join('\n'), 'utf-8');
console.log("Done, writing file.");
