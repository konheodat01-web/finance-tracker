const fs = require('fs');
const lines = fs.readFileSync('script.js', 'utf8').split(/\r?\n/);

// Fix formatCurrency (Line 170-178 approx)
for (let i = 160; i < 190; i++) {
    if (lines[i] && lines[i].includes('formatCurrency')) {
        lines[i] = "function formatCurrency(amount, currencyCode = 'VND') {";
        lines[i+1] = "    if (!isBalanceVisible) return '***';";
        lines[i+2] = "    if (currencyCode === 'USD') {";
        lines[i+3] = "        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);";
        lines[i+4] = "    }";
        lines[i+5] = "    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';";
        lines[i+6] = "}";
        break;
    }
}

// Fix userCategories initialization (Line 50-70 approx)
for (let i = 40; i < 100; i++) {
    if (lines[i] && lines[i].includes('let userCategories = {')) {
        let block = [
            "let userCategories = {",
            "    expense: [",
            "        { id: 'cat1', name: 'Ăn uống', icon: '🍽️', color: '#f97316' },",
            "        { id: 'cat2', name: 'Di chuyển', icon: '🚗', color: '#3b82f6' },",
            "        { id: 'cat3', name: 'Mua sắm', icon: '🛒', color: '#ec4899' },",
            "        { id: 'cat4', name: 'Nhà cửa', icon: '🏠', color: '#8b5cf6' },",
            "        { id: 'cat5', name: 'Giải trí', icon: '🎡', color: '#f59e0b' }",
            "    ],",
            "    income: [",
            "        { id: 'cat6', name: 'Tiền lương', icon: '💰', color: '#10b981' },",
            "        { id: 'cat7', name: 'Tiền thưởng', icon: '💵', color: '#3b82f6' },",
            "        { id: 'cat8', name: 'Thu nhập khác', icon: '💹', color: '#10b981' }",
            "    ],",
            "    debt: [",
            "        { id: 'cat9', name: 'Cho vay', icon: '📤', color: '#ef4444' },",
            "        { id: 'cat10', name: 'Đi vay', icon: '📥', color: '#10b981' },",
            "        { id: 'cat11', name: 'Thu nợ', icon: '📥', color: '#10b981' },",
            "        { id: 'cat12', name: 'Trả nợ', icon: '📤', color: '#ef4444' }",
            "    ]",
            "};"
        ];
        for (let j = 0; j < block.length; j++) {
            lines[i + j] = block[j];
        }
        break;
    }
}

// Global cleanup: remove the weird " ` `" or "  " prefix from ALL lines
const cleaned = lines.map(line => {
    return line.replace(/^[\s\uFFFD\u00A0\u00C2]*`[\s\uFFFD\u00A0\u00C2]*`/, '    ')
               .replace(/^[\s\uFFFD\u00A0\u00C2]*`/, '  ')
               .replace(/\uFFFD/g, ''); // Remove replacement chars
});

fs.writeFileSync('script.js', cleaned.join('\n'), 'utf8');
console.log("Aggressive script cleanup done");
