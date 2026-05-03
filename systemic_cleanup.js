const fs = require('fs');

function fixFile(path) {
    const content = fs.readFileSync(path, 'utf8');
    let fixed = content;

    // Common mangled sequences to correct Vietnamese
    const replacements = [
        // Currency
        [/A,?~|A,?~|A,?~|  |`/g, ' đ'],
        
        // Categories & Core Terms
        [/A,?sn uAA?~ng/g, 'Ăn uống'],
        [/Di chuyAAn/g, 'Di chuyển'],
        [/Mua sAAA_m/g, 'Mua sắm'],
        [/NhAA cAAA-a/g, 'Nhà cửa'],
        [/GiAAAi trAA-/g, 'Giải trí'],
        [/TiAAA\?n lA\+AA\+Ang/g, 'Tiền lương'],
        [/TiAAA\?n thA\+AAA,ng/g, 'Tiền thưởng'],
        [/Thu nhAAA-p khAAc/g, 'Thu nhập khác'],
        [/A,A\?i vay/g, 'Đi vay'],
        [/Thu nAAA/g, 'Thu nợ'],
        [/TrAAA nAAA/g, 'Trả nợ'],
        [/Cho vay/g, 'Cho vay'],
        
        // UI Terms (Common patterns)
        [/T ng `A chi/g, 'Tổng đã chi'],
        [/T ng thu/g, 'Tổng thu'],
        [/Trung bAnh/g, 'Trung bình'],
        [/thAng nAy/g, 'tháng này'],
        [/ThAng nAy/g, 'Tháng này'],
        [/thAng tr>c/g, 'tháng trước'],
        [/Mc `<nh/g, 'Mặc định'],
        [/Cha cA3 vA nAo/g, 'Chưa có ví nào'],
        [/TAi khon/g, 'Tài khoản'],
        [/` thAm vA/g, 'để thêm ví'],
        [/Ch Nht/g, 'Chủ Nhật'],
        [/Thc Hai/g, 'Thứ Hai'],
        [/Thc Ba/g, 'Thứ Ba'],
        [/Thc T/g, 'Thứ Tư'],
        [/Thc Nm/g, 'Thứ Năm'],
        [/Thc SAu/g, 'Thứ Sáu'],
        [/Thc By/g, 'Thứ Bảy']
    ];

    replacements.forEach(([regex, replacement]) => {
        fixed = fixed.replace(regex, replacement);
    });

    fs.writeFileSync(path, fixed, 'utf8');
}

fixFile('script.js');
fixFile('index.html');
console.log("Cleanup attempted");
