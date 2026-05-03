const fs = require('fs');
let lines = fs.readFileSync('script.js', 'utf8').split(/\r?\n/);

function fix(lineIndex, text) {
    if (lines[lineIndex]) {
        const indent = lines[lineIndex].match(/^\s*/)[0];
        lines[lineIndex] = indent + text;
    }
}

fix(884, "showToast('Đã lưu giao dịch!', 'success');");
fix(901, "showToast('Đã lưu giao dịch!', 'success');");
fix(2350, "showToast('Đã tạo ngân sách!', 'success');");
fix(2657, "showToast('BÁO ĐỘNG: Ngân sách [' + catName + '] đã VƯỢT ' + formatMoney(overAmount) + '!', 'error', 6000);");
fix(2659, "showToast('Cảnh báo: Ngân sách [' + catName + '] đã hết sạch!', 'error', 5000);");
fix(2661, "showToast('Sắp hết: Ngân sách [' + catName + '] đã dùng ' + Math.round(percent) + '%', 'warning', 4000);");

fs.writeFileSync('script.js', lines.join('\n'), 'utf8');
console.log('Fixed lines by index');
