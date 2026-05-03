const fs = require('fs');

const dictionary = {
    'Ã ': 'à', 'Ã¡': 'á', 'áº£': 'ả', 'Ã£': 'ã', 'áº¡': 'ạ',
    'Äƒ': 'ă', 'áº±': 'ằ', 'áº¯': 'ắ', 'áº³': 'ẳ', 'áºµ': 'ẵ', 'áº·': 'ặ',
    'Ã¢': 'â', 'áº§': 'ầ', 'áº¥': 'ấ', 'áº©': 'ẩ', 'áº«': 'ẫ', 'áº­': 'ậ',
    'Ã¨': 'è', 'Ã©': 'é', 'áº»': 'ẻ', 'áº½': 'ẽ', 'áº¹': 'ẹ',
    'Ãª': 'ê', 'á» ': 'ề', 'áº¿': 'ế', 'á»ƒ': 'ể', 'á»…': 'ễ', 'á»‡': 'ệ',
    'Ã¬': 'ì', 'Ã­': 'í', 'á»‰': 'ỉ', 'Ä©': 'ĩ', 'á»‹': 'ị',
    'Ã²': 'ò', 'Ã³': 'ó', 'á» ': 'ỏ', 'Ãµ': 'õ', 'á» ': 'ọ',
    'Ã´': 'ô', 'á»“': 'ồ', 'á»‘': 'ố', 'á»•': 'ổ', 'á»—': 'ỗ', 'á»™': 'ộ',
    'Æ¡': 'ơ', 'á» ': 'ờ', 'á»›': 'ớ', 'á»Ÿ': 'ở', 'á»¡': 'ỡ', 'á»£': 'ợ',
    'Ã¹': 'ù', 'Ãº': 'ú', 'á»§': 'ủ', 'Å©': 'ũ', 'á»¥': 'ụ',
    'Æ°': 'ư', 'á»«': 'ừ', 'á»©': 'ứ', 'á»­': 'ử', 'á»¯': 'ữ', 'á»±': 'ự',
    'á»³': 'ỳ', 'Ã½': 'ý', 'á»·': 'ỷ', 'á»¹': 'ỹ', 'á»µ': 'ỵ',
    'Ä‘': 'đ', 'Ä ': 'Đ'
};

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Sort keys by length descending to avoid partial matches
    const sortedKeys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
    
    for (const key of sortedKeys) {
        content = content.split(key).join(dictionary[key]);
    }
    
    // Fix specific known remaining mangled patterns
    content = content.replace(/giao d9ch/g, 'giao dịch');
    content = content.replace(/Ch0a/g, 'Chưa');
    content = content.replace(/k3/g, 'kỳ');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
}

fixFile('script.js');
fixFile('index.html');
