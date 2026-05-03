const fs = require('fs');

const lines = fs.readFileSync('script.js', 'utf8').split(/\r?\n/);

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("function formatCurrency(amount, currencyCode = 'VND') {")) {
        // Line i: function formatCurrency...
        // Line i+1: if (!isBalanceVisible)...
        // Line i+2: if (currencyCode === 'USD')...
        // Line i+3: return new Intl...
        // Line i+4: }
        // Line i+5: return new Intl.NumberFormat('vi-VN').format(amount) + ' ...';
        
        // Let's just find the return line directly inside this block
        for (let j = i; j < i + 10; j++) {
            if (lines[j].includes("return new Intl.NumberFormat('vi-VN').format(amount) + ")) {
                lines[j] = "    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';";
                console.log("Fixed formatCurrency currency symbol.");
                break;
            }
        }
        break;
    }
}

// Similarly fix formatMoney
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("function formatMoney(amount) {")) {
        lines[i] = "function formatMoney(amount) { return formatCurrency(amount, 'VND'); }";
        break;
    }
}

// Write back safely
fs.writeFileSync('script.js', lines.join('\n'), 'utf8');
console.log("File saved.");
