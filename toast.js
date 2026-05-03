
/* === TOAST NOTIFICATION SYSTEM === */
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'error') icon = 'times-circle';
    
    toast.innerHTML = '<i class="fas fa-' + icon + ' toast-icon"></i><div class="toast-message">' + message + '</div>';
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function checkBudgetsThreshold(txn) {
    if (txn.type !== 'expense' || txn.excluded) return;
    
    budgets.forEach(b => {
        const matchIds = getBudgetCategoryIds(b.categoryId);
        const isRelevant = b.categoryId === 'all' || matchIds.has(txn.categoryId) || matchIds.has(txn.category);
        
        if (isRelevant) {
            const spent = getBudgetSpent(b);
            const percent = (spent / b.amount) * 100;
            
            // Get category name for better message
            let catName = 'Nhóm chi tiêu';
            if (b.categoryId === 'all') {
                catName = 'Tổng ngân sách';
            } else {
                const cat = (userCategories.expense || []).find(c => c.id === b.categoryId);
                if (cat) catName = cat.name;
            }

            if (percent >= 100) {
                showToast('Cảnh báo: Ngân sách [' + catName + '] đã hết!', 'error', 5000);
            } else if (percent >= 90) {
                showToast('Sắp hết: Ngân sách [' + catName + '] đã dùng ' + Math.round(percent) + '%', 'warning', 4000);
            }
        }
    });
}
