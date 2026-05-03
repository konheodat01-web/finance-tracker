function getBudgetCategoryIds(categoryId) {
    // Returns a Set of categoryIds: the category itself + all direct children
    const ids = new Set();
    if (!categoryId || categoryId === 'all') return ids;
    ids.add(categoryId);
    const allCats = [...(userCategories.expense || [])];
    allCats.forEach(c => {
        if (c.parentId === categoryId) ids.add(c.id);
    });
    return ids;
}

function getBudgetSpent(b) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const matchIds = getBudgetCategoryIds(b.categoryId);
    let spent = 0;
    transactions.forEach(t => {
        if (t.type !== 'expense') return;
        if (t.excluded) return;
        const tDate = new Date(t.date);
        if (tDate.getMonth() !== currentMonth || tDate.getFullYear() !== currentYear) return;
        let catMatch = false;
        if (b.categoryId === 'all') {
            catMatch = true;
        } else {
            catMatch = matchIds.has(t.categoryId) || matchIds.has(t.category);
        }
        if (!catMatch) return;
        if (b.walletId && b.walletId !== 'all') {
            if (t.walletId !== b.walletId) return;
        }
        spent += t.amount;
    });
    return spent;
}

function renderBudgetsPage() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysLeft = lastDayOfMonth - today.getDate();

    let totalBudget = 0;
    let totalSpent = 0;

    const budgetListEl = document.getElementById('budgetList');
    if (!budgetListEl) return;
    let listHtml = '';

    const allBudgets = budgets || [];
    
    // Filter budgets by the global wallet filter on the dashboard
    const filteredBudgets = allBudgets.filter(b => {
        if (typeof budgetGlobalWalletFilter === 'undefined' || budgetGlobalWalletFilter === 'all') return true;
        return !b.walletId || b.walletId === 'all' || b.walletId === budgetGlobalWalletFilter;
    });

    filteredBudgets.forEach((b) => {
        const spent = getBudgetSpent(b);
        
        totalBudget += b.amount;
        totalSpent += spent;
        const remain = b.amount - spent;
        const percent = Math.min(100, Math.max(0, (spent / b.amount) * 100));

        let catObj = null;
        if (userCategories && userCategories.expense) {
            userCategories.expense.forEach(c => { if(c.id === b.categoryId) catObj = c; });
        }
        const icon = catObj ? catObj.icon : '💰';
        const name = catObj ? catObj.name : 'Tổng cộng';
        const color = catObj ? catObj.color : '#10b981';
        const remainColor = remain < 0 ? '#ef4444' : '#6b7280';
        const barColor = remain < 0 ? '#ef4444' : color;

        listHtml += `
            <div class="card aw-card" style="padding: 16px; cursor:pointer;" onclick="openBudgetDetail('${b.id}')">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">${icon}</div>
                        <div style="font-weight: 600; font-size: 16px; color:#1f2937;">${name}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; font-size: 16px; color:#1f2937;">${formatMoney(b.amount)}</div>
                        <div style="font-size: 12px; color: ${remainColor};">Còn lại ${formatMoney(remain)}</div>
                    </div>
                </div>
                <div style="width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-top: 8px;">
                    <div style="height: 100%; background: ${barColor}; width: ${percent}%; transition: width 0.3s;"></div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top: 4px;">
                    <div style="font-size: 11px; color: #9ca3af;">Đã chi ${formatMoney(spent)}</div>
                    <div style="font-size: 11px; color: #9ca3af;">${Math.round(percent)}%</div>
                </div>
            </div>
        `;
    });

    budgetListEl.innerHTML = listHtml;

    document.getElementById('budgetGlobalTotal').innerText = formatMoney(totalBudget);
    document.getElementById('budgetGlobalSpent').innerText = formatMoney(totalSpent);
    document.getElementById('budgetGlobalDays').innerText = daysLeft + ' ngày';
    
    const globalAvailable = totalBudget - totalSpent;
    document.getElementById('budgetGlobalAvailable').innerText = formatMoney(globalAvailable);
    document.getElementById('budgetGlobalAvailable').style.color = globalAvailable < 0 ? '#ef4444' : '#10b981';

    let globalPercent = totalBudget > 0 ? (totalSpent / totalBudget) : 0;
    if (globalPercent > 1) globalPercent = 1;
    if (globalPercent < 0) globalPercent = 0;
    
    const deg = -135 + (180 * globalPercent);
    document.getElementById('budgetGlobalProgress').style.transform = `rotate(${deg}deg)`;
    document.getElementById('budgetGlobalProgress').style.borderColor = globalAvailable < 0 ? '#ef4444' : '#10b981';
    document.getElementById('budgetGlobalProgress').style.borderBottomColor = 'transparent';
    document.getElementById('budgetGlobalProgress').style.borderRightColor = 'transparent';
}

function openAddBudget() {
    document.getElementById('editBudgetId').value = '';
    document.getElementById('budgetAmount').value = '';
    document.getElementById('budgetCatId').value = '';
    document.getElementById('budgetCategoryName').innerText = 'Chọn nhóm';
    document.getElementById('budgetCategoryIcon').innerHTML = '<i class="fas fa-question"></i>';
    document.getElementById('budgetCategoryIcon').style.background = '#e5e7eb';
    document.getElementById('budgetCategoryIcon').style.color = '#9ca3af';
    document.getElementById('btnDeleteBudget').style.display = 'none';
    document.getElementById('budgetTitle').innerText = 'Thêm ngân sách';
    
    switchPage('add-budget');
}

function openBudgetCategoryPicker() {
    window.isPickingForBudget = true;
    // Reuse the existing category picker overlay
    const list = document.getElementById('txnCategoryPickerList');
    if (!list) return;
    const cats = userCategories['expense'] || [];
    list.innerHTML = generateCategoryListHTML(cats, null, 'selectCategory');
    document.getElementById('txnCategoryPickerOverlay').style.display = 'flex';
}


function saveBudget() {
    const id = document.getElementById('editBudgetId').value;
    const catId = document.getElementById('budgetCatId').value;
    const amountStr = document.getElementById('budgetAmount').value.replace(/\./g, '');
    const amount = parseInt(amountStr);
    const isRepeat = document.getElementById('budgetRepeat').checked;
    const walletId = document.getElementById('budgetWalletId') ? document.getElementById('budgetWalletId').value : 'all';

    if (!catId) return alert('Vui lòng chọn nhóm chi tiêu!');
    if (!amount || amount <= 0) return alert('Vui lòng nhập số tiền hợp lệ!');

    if (id) {
        const b = budgets.find(x => x.id === id);
        if (b) {
            b.categoryId = catId;
            b.amount = amount;
            b.isRepeating = isRepeat;
            b.walletId = walletId;
        }
    } else {
        showToast('�� t?o ng�n s�ch!', 'success');
budgets.push({
            id: 'b_' + Date.now(),
            categoryId: catId,
            walletId: walletId,
            amount: amount,
            isRepeating: isRepeat,
            createdAt: new Date().toISOString()
        });
    }

    syncData();
    renderBudgetsPage();
    switchPage('budgets');
}

let currentDetailBudgetId = null;

function openBudgetDetail(id) {
    const b = budgets.find(x => x.id === id);
    if (!b) return;
    currentDetailBudgetId = id;
    
    let catObj = null;
    if (userCategories && userCategories.expense) {
        userCategories.expense.forEach(c => { if(c.id === b.categoryId) catObj = c; });
    }
    const icon = catObj ? catObj.icon : '💰';
    const name = catObj ? catObj.name : 'Tổng cộng';
    const color = catObj ? catObj.color : '#10b981';

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysLeft = lastDayOfMonth - today.getDate();
    const daysPassed = today.getDate();

    const spent = getBudgetSpent(b);

    const remain = b.amount - spent;
    let percent = (spent / b.amount) * 100;
    if (percent > 100) percent = 100;
    
    let timePercent = (daysPassed / lastDayOfMonth) * 100;

    document.getElementById('detailBudgetIcon').innerHTML = icon;
    document.getElementById('detailBudgetIcon').style.background = color;
    document.getElementById('detailBudgetCategory').innerText = name;
    document.getElementById('detailBudgetAmount').innerText = formatMoney(b.amount);
    document.getElementById('detailBudgetSpent').innerText = formatMoney(spent);
    document.getElementById('detailBudgetRemain').innerText = formatMoney(remain);
    
    document.getElementById('detailBudgetBar').style.width = percent + '%';
    document.getElementById('detailBudgetBar').style.background = remain < 0 ? '#ef4444' : color;
    document.getElementById('detailBudgetTodayMarker').style.left = timePercent + '%';
    document.getElementById('detailBudgetTodayText').style.left = timePercent + '%';

    const monthStr = (currentMonth + 1).toString().padStart(2, '0');
    document.getElementById('detailBudgetDateRange').innerText = `01/${monthStr} - ${lastDayOfMonth}/${monthStr}`;
    document.getElementById('detailBudgetDaysLeft').innerText = `Còn ${daysLeft} ngày`;
    document.getElementById('detailBudgetRepeatText').innerText = b.isRepeating ? 'Ngân sách được tự động lặp lại ở kỳ hạn tiếp theo.' : 'Ngân sách không lặp lại.';

    const recDaily = remain > 0 && daysLeft > 0 ? remain / daysLeft : 0;
    const actualDaily = daysPassed > 0 ? spent / daysPassed : 0;
    const projected = actualDaily * lastDayOfMonth;

    document.getElementById('detailBudgetRecDaily').innerText = formatMoney(Math.round(recDaily));
    document.getElementById('detailBudgetActualDaily').innerText = formatMoney(Math.round(actualDaily));
    document.getElementById('detailBudgetProjected').innerText = formatMoney(Math.round(projected));

    switchPage('budget-detail');
}

function editBudgetFromDetail() {
    const b = budgets.find(x => x.id === currentDetailBudgetId);
    if (!b) return;

    let catObj = null;
    if (userCategories && userCategories.expense) {
        userCategories.expense.forEach(c => { if(c.id === b.categoryId) catObj = c; });
    }
    const icon = catObj ? catObj.icon : '💰';
    const name = catObj ? catObj.name : 'Tổng cộng';
    const color = catObj ? catObj.color : '#10b981';

    document.getElementById('editBudgetId').value = b.id;
    document.getElementById('budgetCatId').value = b.categoryId;
    document.getElementById('budgetCategoryName').innerText = name;
    document.getElementById('budgetCategoryIcon').innerHTML = icon;
    document.getElementById('budgetCategoryIcon').style.background = color;
    document.getElementById('budgetCategoryIcon').style.color = 'white';
    
    document.getElementById('budgetAmount').value = formatMoney(b.amount).replace(/đ/g, '').trim();
    document.getElementById('budgetRepeat').checked = !!b.isRepeating;

    document.getElementById('budgetTitle').innerText = 'Sửa ngân sách';
    document.getElementById('btnDeleteBudget').style.display = 'block';

    switchPage('add-budget');
}

function deleteBudget() {
    if (confirm('Bạn có chắc chắn muốn xóa ngân sách này?')) {
        const id = document.getElementById('editBudgetId').value;
        budgets = budgets.filter(x => x.id !== id);
        syncData();
        renderBudgetsPage();
        switchPage('budgets');
    }
}

// === BUDGET WALLET PICKER (centered modal) ===
function openBudgetWalletPicker() {
    let existing = document.getElementById('budgetWalletOverlay');
    if (existing) existing.remove();
    
    const currentWalletId = document.getElementById('budgetWalletId').value;
    let listHtml = '';
    
    const allCheck = currentWalletId === 'all' ? '<i class="fas fa-check" style="color:#10b981; font-size:14px;"></i>' : '';
    listHtml += `<div onclick="selectBudgetWallet('all')" style="display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; background:${currentWalletId === 'all' ? '#f0fdf4' : 'transparent'};"><div style="font-size:22px;">🌐</div><div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">Tổng cộng</div>${allCheck}</div>`;
    
    wallets.forEach(w => {
        const check = currentWalletId === w.id ? '<i class="fas fa-check" style="color:#10b981; font-size:14px;"></i>' : '';
        listHtml += `<div onclick="selectBudgetWallet('${w.id}')" style="display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; background:${currentWalletId === w.id ? '#f0fdf4' : 'transparent'};"><div style="font-size:22px;">${w.emoji||'💳'}</div><div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">${w.name}</div>${check}</div>`;
    });
    
    const overlay = document.createElement('div');
    overlay.id = 'budgetWalletOverlay';
    overlay.style.cssText = 'display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.45); z-index:4000; justify-content:center; align-items:center;';
    overlay.innerHTML = `
        <div style="background:white; width:90%; max-width:380px; border-radius:20px; padding:0 0 20px 0; max-height:70vh; display:flex; flex-direction:column; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:18px 20px 14px; border-bottom:1px solid #f3f4f6; flex-shrink:0;">
                <h3 style="font-size:16px; font-weight:700; margin:0;">Chọn ví</h3>
                <button onclick="closeBudgetWalletPicker()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888;">✕</button>
            </div>
            <div style="flex:1; overflow-y:auto;">${listHtml}</div>
        </div>`;
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeBudgetWalletPicker(); });
    document.body.appendChild(overlay);
}

function closeBudgetWalletPicker() {
    const el = document.getElementById('budgetWalletOverlay');
    if (el) el.remove();
}

function selectBudgetWallet(id) {
    document.getElementById('budgetWalletId').value = id;
    if (id === 'all') {
        document.getElementById('budgetWalletName').innerText = 'Tổng cộng';
    } else {
        const w = wallets.find(x => x.id === id);
        document.getElementById('budgetWalletName').innerText = w ? w.name : 'Tổng cộng';
    }
    closeBudgetWalletPicker();
}

// === BUDGET GLOBAL WALLET PICKER (dashboard header) ===
let budgetGlobalWalletFilter = 'all';

function openBudgetGlobalWalletPicker() {
    let existing = document.getElementById('budgetGlobalWalletOverlay');
    if (existing) existing.remove();
    
    let listHtml = '';
    const allCheck = budgetGlobalWalletFilter === 'all' ? '<i class="fas fa-check" style="color:#10b981; font-size:14px;"></i>' : '';
    listHtml += `<div onclick="selectBudgetGlobalWallet('all')" style="display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; background:${budgetGlobalWalletFilter === 'all' ? '#f0fdf4' : 'transparent'};"><div style="font-size:22px;">🌐</div><div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">Tổng cộng</div>${allCheck}</div>`;
    
    wallets.forEach(w => {
        const check = budgetGlobalWalletFilter === w.id ? '<i class="fas fa-check" style="color:#10b981; font-size:14px;"></i>' : '';
        listHtml += `<div onclick="selectBudgetGlobalWallet('${w.id}')" style="display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; background:${budgetGlobalWalletFilter === w.id ? '#f0fdf4' : 'transparent'};"><div style="font-size:22px;">${w.emoji||'💳'}</div><div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">${w.name}</div>${check}</div>`;
    });
    
    const overlay = document.createElement('div');
    overlay.id = 'budgetGlobalWalletOverlay';
    overlay.style.cssText = 'display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.45); z-index:4000; justify-content:center; align-items:center;';
    overlay.innerHTML = `
        <div style="background:white; width:90%; max-width:380px; border-radius:20px; padding:0 0 20px 0; max-height:70vh; display:flex; flex-direction:column; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:18px 20px 14px; border-bottom:1px solid #f3f4f6; flex-shrink:0;">
                <h3 style="font-size:16px; font-weight:700; margin:0;">Lọc theo ví</h3>
                <button onclick="closeBudgetGlobalWalletPicker()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888;">✕</button>
            </div>
            <div style="flex:1; overflow-y:auto;">${listHtml}</div>
        </div>`;
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeBudgetGlobalWalletPicker(); });
    document.body.appendChild(overlay);
}

function closeBudgetGlobalWalletPicker() {
    const el = document.getElementById('budgetGlobalWalletOverlay');
    if (el) el.remove();
}

function selectBudgetGlobalWallet(id) {
    budgetGlobalWalletFilter = id;
    if (id === 'all') {
        document.getElementById('budgetGlobalWalletLabel').innerText = 'Tổng';
        document.getElementById('budgetGlobalWalletIcon').className = 'fas fa-globe';
    } else {
        const w = wallets.find(x => x.id === id);
        document.getElementById('budgetGlobalWalletLabel').innerText = w ? w.name : 'Tổng';
        document.getElementById('budgetGlobalWalletIcon').className = 'fas fa-wallet';
    }
    closeBudgetGlobalWalletPicker();
    renderBudgetsPage();
}

// === BUDGET PERIOD PICKER (centered modal) ===
function openBudgetPeriodPicker() {
    let existing = document.getElementById('budgetPeriodOverlay');
    if (existing) existing.remove();
    
    const periods = getPeriods();
    const now = new Date();
    let listHtml = '';
    
    periods.forEach((p, i) => {
        const label = formatDate(p.start) + ' - ' + formatDate(p.end);
        const isThisMonth = now >= p.start && now <= new Date(p.end.getTime() + 86399999);
        const displayLabel = isThisMonth ? 'Tháng này (' + label + ')' : label;
        listHtml += '<div onclick="selectBudgetPeriod(\'' + p.start.toISOString() + '\', \'' + p.end.toISOString() + '\', \'' + displayLabel.replace(/'/g, "\\'") + '\')" style="display:flex; align-items:center; padding:14px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; font-size:15px; color:#1f2937; font-weight:' + (isThisMonth ? '600' : '400') + '; background:' + (isThisMonth ? '#f0fdf4' : 'transparent') + ';">' + displayLabel + '</div>';
    });
    
    const overlay = document.createElement('div');
    overlay.id = 'budgetPeriodOverlay';
    overlay.style.cssText = 'display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.45); z-index:4000; justify-content:center; align-items:center;';
    overlay.innerHTML = '<div style="background:white; width:90%; max-width:380px; border-radius:20px; padding:0 0 20px 0; max-height:70vh; display:flex; flex-direction:column; box-shadow:0 10px 25px rgba(0,0,0,0.2);"><div style="display:flex; justify-content:space-between; align-items:center; padding:18px 20px 14px; border-bottom:1px solid #f3f4f6; flex-shrink:0;"><h3 style="font-size:16px; font-weight:700; margin:0;">Chọn giai đoạn</h3><button onclick="closeBudgetPeriodPicker()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888;">✕</button></div><div style="flex:1; overflow-y:auto;">' + listHtml + '</div></div>';
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeBudgetPeriodPicker(); });
    document.body.appendChild(overlay);
}

function closeBudgetPeriodPicker() {
    const el = document.getElementById('budgetPeriodOverlay');
    if (el) el.remove();
}

function selectBudgetPeriod(startStr, endStr, label) {
    document.getElementById('budgetPeriodStr').innerText = label;
    document.getElementById('budgetPeriodStart').value = startStr;
    document.getElementById('budgetPeriodEnd').value = endStr;
    closeBudgetPeriodPicker();
}

// Hook renderBudgetsPage into renderAll
if (typeof originalRenderAll === 'undefined') {
    window.originalRenderAll = renderAll;
    window.renderAll = function(force = false) {
        window.originalRenderAll(force);
        if (document.getElementById('page-budgets').classList.contains('active')) {
            renderBudgetsPage();
        }
    };
}

function formatMoney(amount) { return formatCurrency(amount, 'VND'); }

