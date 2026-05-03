
function checkBudgetsThreshold(txn) {
    if (txn.type !== 'expense' || txn.excluded) return;
    
    budgets.forEach(b => {
        const matchIds = getBudgetCategoryIds(b.categoryId);
        const isRelevant = b.categoryId === 'all' || matchIds.has(txn.categoryId) || matchIds.has(txn.category);
        
        if (isRelevant) {
            const spent = getBudgetSpent(b);
            const percent = (spent / b.amount) * 100;
            
            let catName = 'Nhóm chi tiêu';
            if (b.categoryId === 'all') {
                catName = 'Tổng ngân sách';
            } else {
                const cat = (userCategories.expense || []).find(c => c.id === b.categoryId);
                if (cat) catName = cat.name;
            }

            if (spent > b.amount) {
                const overAmount = spent - b.amount;
                showToast('BÁO ĐỘNG: Ngân sách [' + catName + '] đã VƯỢT ' + formatMoney(overAmount) + '!', 'error', 6000);
            } else if (percent >= 100) {
                showToast('Cảnh báo: Ngân sách [' + catName + '] đã hết sạch!', 'error', 5000);
            } else if (percent >= 90) {
                showToast('Sắp hết: Ngân sách [' + catName + '] đã dùng ' + Math.round(percent) + '%', 'warning', 4000);
            }
        }
    });
}
