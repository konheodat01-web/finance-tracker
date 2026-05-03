const fs = require('fs');

function restoreText(path) {
    let text = fs.readFileSync(path, 'utf8');
    
    const dictionary = {
        "A,?sn uAA?~ng": "Ăn uống",
        "Di chuyAA'n": "Di chuyển",
        "Mua sAAA_m": "Mua sắm",
        "NhAA cAAA-a": "Nhà cửa",
        "GiAAAi trAA-": "Giải trí",
        "TiAAA?n lA+AA+Ang": "Tiền lương",
        "TiAAA?n thA+AAA,ng": "Tiền thưởng",
        "Thu nhAAA-p khAAc": "Thu nhập khác",
        "A,A?i vay": "Đi vay",
        "Thu nAAA": "Thu nợ",
        "TrAAA nAAA": "Trả nợ",
        "`": "đ",
        "T ng s` d": "Tổng số dư",
        "T ng cTng": "Tổng cộng",
        "T ng `A chi": "Tổng đã chi",
        "T ng thu": "Tổng thu",
        "ThAng nAy": "Tháng này",
        "Trung bAnh 3 thAng tr>c": "Trung bình 3 tháng trước",
        "Mc `<nh": "Mặc định",
        "Cha cA3 vA- nAo": "Chưa có ví nào",
        "TAi khon": "Tài khoản",
        "` thAm vA-": "để thêm ví",
        "?<nh dng th?i gian": "Định dạng thời gian",
        "?n v< ti?n cho vA- T ng": "Đơn vị tiền cho ví Tổng",
        "Ch?n ngAy ` u tu n": "Chọn ngày đầu tuần",
        "Ch  Nht": "Chủ Nhật",
        "Thc Hai": "Thứ Hai",
        "Thc Ba": "Thứ Ba",
        "Thc T": "Thứ Tư",
        "Thc Nm": "Thứ Năm",
        "Thc SAu": "Thứ Sáu",
        "Thc By": "Thứ Bảy",
        "?t ngAy ` u tiAn c a thAng": "Đặt ngày đầu tiên của tháng",
        "Ch?n thAng ` u tiAn c a nm": "Chọn tháng đầu tiên của năm",
        "ThAng MTt": "Tháng Một",
        "ThAng Hai": "Tháng Hai",
        "ThAng Ba": "Tháng Ba",
        "ThAng T": "Tháng Tư",
        "ThAng Nm": "Tháng Năm",
        "ThAng SAu": "Tháng Sáu",
        "ThAng By": "Tháng Bảy",
        "ThAng TAm": "Tháng Tám",
        "ThAng ChA-n": "Tháng Chín",
        "ThAng M?i": "Tháng Mười",
        "ThAng M?i MTt": "Tháng Mười Một",
        "ThAng M?i Hai": "Tháng Mười Hai",
        "A,A???": "🍽️",
        "A,?\"": "🚗",
        "A,?A?A_A,A?": "🛒",
        "A,A?A": "🏠",
        "A,Ar": "🎡",
        "A,?TA,": "💰",
        "A,A?": "💵",
        "A,?TA": "💹",
        "A,?oA ": "📤",
        "A,?oA": "📥"
    };

    for (const [mangled, correct] of Object.entries(dictionary)) {
        text = text.split(mangled).join(correct);
    }
    
    fs.writeFileSync(path, text, 'utf8');
}

restoreText('script.js');
restoreText('index.html');
console.log("Dictionary restore complete.");
