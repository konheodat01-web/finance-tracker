// === BUDGET LOGIC ===
function getBudgetSpent(b) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let spent = 0;
    transactions.forEach(t => {
        if (t.type !== 'expense') return;
        if (t.excluded) return;
        
        const tDate = new Date(t.date);
        if (tDate.getMonth() !== currentMonth || tDate.getFullYear() !== currentYear) return;
        
        // Match category: budget's categoryId matches transaction's categoryId OR category name
        const catMatch = b.categoryId === 'all' || 
                         t.categoryId === b.categoryId || 
                         t.category === b.categoryId;
        if (!catMatch) return;
        
        // Match wallet: if budget is for a specific wallet, only count that wallet's transactions
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
