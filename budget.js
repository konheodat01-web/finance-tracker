
// === BUDGET LOGIC ===
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

    const activeBudgets = budgets || [];

    activeBudgets.forEach((b) => {
        totalBudget += b.amount;
        
        let spent = 0;
        transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear && t.type === 'expense') {
                if (b.categoryId === 'all' || t.category === b.categoryId) {
                    spent += t.amount;
                }
            }
        });
        
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

        listHtml += `
            <div class="card aw-card" style="padding: 16px; cursor:pointer;" onclick="openBudgetDetail('${b.id}')">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">${icon}</div>
                        <div style="font-weight: 600; font-size: 16px; color:#1f2937;">${name}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; font-size: 16px; color:#1f2937;">${formatMoney(b.amount)}</div>
                        <div style="font-size: 12px; color: #6b7280;">Còn lại ${formatMoney(remain)}</div>
                    </div>
                </div>
                <div style="width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-top: 8px;">
                    <div style="height: 100%; background: ${color}; width: ${percent}%;"></div>
                </div>
                <div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">Hôm nay</div>
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
    
    const deg = -45 + (180 * globalPercent);
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
    openCategoryPicker('expense');
}

const originalSelectCategory = selectCategory;
window.selectCategory = function(id, name, icon, color) {
    if (window.isPickingForBudget) {
        document.getElementById('budgetCatId').value = id;
        document.getElementById('budgetCategoryName').innerText = name;
        document.getElementById('budgetCategoryIcon').innerHTML = icon;
        document.getElementById('budgetCategoryIcon').style.background = color;
        document.getElementById('budgetCategoryIcon').style.color = 'white';
        switchPage('add-budget');
        window.isPickingForBudget = false;
    } else {
        originalSelectCategory(id, name, icon, color);
    }
};

function saveBudget() {
    const id = document.getElementById('editBudgetId').value;
    const catId = document.getElementById('budgetCatId').value;
    const amountStr = document.getElementById('budgetAmount').value.replace(/\./g, '');
    const amount = parseInt(amountStr);
    const isRepeat = document.getElementById('budgetRepeat').checked;

    if (!catId) return alert('Vui lòng chọn nhóm chi tiêu!');
    if (!amount || amount <= 0) return alert('Vui lòng nhập số tiền hợp lệ!');

    if (id) {
        const b = budgets.find(x => x.id === id);
        if (b) {
            b.categoryId = catId;
            b.amount = amount;
            b.isRepeating = isRepeat;
        }
    } else {
        budgets.push({
            id: 'b_' + Date.now(),
            categoryId: catId,
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
    userCategories.expense.forEach(c => { if(c.id === b.categoryId) catObj = c; });
    const icon = catObj ? catObj.icon : '💰';
    const name = catObj ? catObj.name : 'Tổng cộng';
    const color = catObj ? catObj.color : '#10b981';

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysLeft = lastDayOfMonth - today.getDate();
    const daysPassed = today.getDate();

    let spent = 0;
    transactions.forEach(t => {
        const tDate = new Date(t.date);
        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear && t.type === 'expense') {
            if (b.categoryId === 'all' || t.category === b.categoryId) {
                spent += t.amount;
            }
        }
    });

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
    document.getElementById('detailBudgetDateRange').innerText = \`01/\${monthStr} - \${lastDayOfMonth}/\${monthStr}\`;
    document.getElementById('detailBudgetDaysLeft').innerText = \`Còn \${daysLeft} ngày\`;
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
    userCategories.expense.forEach(c => { if(c.id === b.categoryId) catObj = c; });
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
