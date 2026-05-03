const fs = require('fs');

function cleanFile(path) {
    const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
    const cleaned = lines.map(line => {
        return line.replace(/^[\s\uFFFD\u00A0\u00C2]*`[\s\uFFFD\u00A0\u00C2]*`/, '    ')
                   .replace(/^[\s\uFFFD\u00A0\u00C2]*`/, '  ')
                   .replace(/\uFFFD/g, '');
    });
    
    let content = cleaned.join('\n');
    
    // Fix common mangled patterns in index.html
    content = content.replace(/T ng/g, 'Tổng')
                     .replace(/`A chi/g, 'đã chi')
                     .replace(/`A/g, 'đã')
                     .replace(/nAy/g, 'này')
                     .replace(/thAng/g, 'tháng')
                     .replace(/tr>c/g, 'trước')
                     .replace(/Trung bAnh/g, 'Trung bình')
                     .replace(/`/g, 'để')
                     .replace(/`/g, 'đ');

    fs.writeFileSync(path, content, 'utf8');
}

cleanFile('index.html');
cleanFile('script.js'); // Run again for safety
console.log("Systemic cleanup for both files done");
