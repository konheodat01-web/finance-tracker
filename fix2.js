const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

// Replace corrupted emojis before "Tổng cộng" in budget selectors
code = code.replace(
    /<div style="font-size:22px;">[^<]+<\/div><div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">T[^n]+ng c[^n]+ng<\/div>/g,
    '<div style="font-size:20px; display:flex; align-items:center; justify-content:center; width:22px; color:#9ca3af;"><i class="fas fa-layer-group"></i></div><div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">Tổng cộng</div>'
);

fs.writeFileSync('script.js', code, 'utf8');
console.log('Done fixing budget selectors!');
