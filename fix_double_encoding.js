const fs = require('fs');

let text = fs.readFileSync('script.js', 'utf8');
let fixed;

try {
    // Attempt to reverse the double-encoding
    fixed = Buffer.from(text, 'latin1').toString('utf8');
    
    // Check if it worked by looking for 'Tất cả'
    if (fixed.includes('Tất cả')) {
        console.log("Successfully decoded double-encoding!");
        fs.writeFileSync('script.js', fixed, 'utf8');
    } else {
        console.log("Decoding didn't produce 'Tất cả'.");
    }
} catch (e) {
    console.error("Error during decoding:", e);
}

let htmlText = fs.readFileSync('index.html', 'utf8');
try {
    let htmlFixed = Buffer.from(htmlText, 'latin1').toString('utf8');
    if (htmlFixed.includes('Tổng cộng') || htmlFixed.includes('Ví của tôi') || htmlFixed.includes('Chi tiêu')) {
        console.log("Successfully decoded index.html!");
        fs.writeFileSync('index.html', htmlFixed, 'utf8');
    } else {
        console.log("Decoding index.html didn't find expected strings.");
    }
} catch (e) {
    console.error("Error during index.html decoding:", e);
}
