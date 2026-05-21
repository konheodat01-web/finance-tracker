const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

// The globe emoji was corrupted to "ðŸŒ " (or similar bytes in UTF-8 represented as string).
// Wait, to be safe against any exact byte sequence, I will just use regex to match the exact context line.
code = code.replace(
    /<div style="width:44px; height:44px; border-radius:50%; background:#e5e7eb; display:flex; align-items:center; justify-content:center; font-size:24px; margin-right:12px;">.*?<\/div>/,
    '<div style="width:44px; height:44px; border-radius:50%; background:#e5e7eb; display:flex; align-items:center; justify-content:center; margin-right:12px;"><i class="fas fa-layer-group" style="color:#6b7280; font-size:20px;"></i></div>'
);

code = code.replace(
    /<div style="font-size:11px; color:#9ca3af; font-weight:600; margin-bottom:8px; padding-left:4px; letter-spacing:0\.5px; text-transform:uppercase;">.*?<\/div>/,
    '<div style="font-size:11px; color:#9ca3af; font-weight:600; margin-bottom:8px; padding-left:4px; letter-spacing:0.5px; text-transform:uppercase;">TÍNH VÀO TỔNG</div>'
);

fs.writeFileSync('script.js', code, 'utf8');
console.log('Done!');
