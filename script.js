// === STATE ===
let wallets = [];
let transactions = [];
let isBalanceVisible = true;
let currentTab = 'expense';
let editModeActive = false;
let selectedWalletId = null;
let chartInstance = null;
let selectedIcon = '💰';
let prevPage = 'accounts';
let currentTxnWalletIndex = -1; // -1 = Tất cả
let currentPeriodIndex = 3;      // Default to current period
let currentTxnType = 'expense';
let selectedCategory = null;
let settings = {
    dateFormat: 'DD/MM/YYYY',
    totalCurrency: 'VND',
    firstDayOfWeek: 'Thứ Hai',
    firstDayOfMonth: 1,
    firstMonthOfYear: 'Tháng Một'
};

// === CATEGORIES ===
const EXPENSE_CATS = [
    { name: 'Ăn uống', icon: '🍜', color: '#f97316' },
    { name: 'Di chuyển', icon: '🚗', color: '#3b82f6' },
    { name: 'Mua sắm', icon: '🛋', color: '#8b5cf6' },
    { name: 'Giải trí', icon: '🎮', color: '#ec4899' },
    { name: 'Y tế', icon: '💊', color: '#ef4444' },
    { name: 'Giáo dục', icon: '📚', color: '#0ea5e9' },
    { name: 'Nhà ở', icon: '🏠', color: '#f59e0b' },
    { name: 'Hóa đơn', icon: '📰', color: '#6b7280' },
    { name: 'Đi chợ', icon: '🧳', color: '#22c55e' },
    { name: 'Sức khỏe', icon: '🏃', color: '#10b981' },
    { name: 'Linh tinh', icon: '📦', color: '#d97706' },
    { name: 'Chi phí khác', icon: '💸', color: '#9ca3af' },
];
const INCOME_CATS = [
    { name: 'Lương', icon: '💰', color: '#22c55e' },
    { name: 'Thưởng', icon: '🎁', color: '#f97316' },
    { name: 'Đầu tư', icon: '📈', color: '#3b82f6' },
    { name: 'Tiết kiệm', icon: '🏦', color: '#0ea5e9' },
    { name: 'Bán hàng', icon: '🛒', color: '#8b5cf6' },
    { name: 'Thu nhập khác', icon: '💵', color: '#6b7280' },
];
const DEBT_CATS = [
    { name: 'Đi vay', icon: '🤝', color: '#8b5cf6' },
    { name: 'Cho vay', icon: '💸', color: '#0ea5e9' },
    { name: 'Trả nợ', icon: '💳', color: '#ef4444' },
    { name: 'Thu nợ', icon: '💰', color: '#22c55e' },
];

const SETTING_OPTIONS = {
    dateFormat: {
        title: 'Định dạng thời gian',
        options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD',
                  'DD-MM-YYYY', 'MM-DD-YYYY', 'D MMM YYYY']
    },
    totalCurrency: {
        title: 'Đơn vị tiền cho ví Tổng',
        options: ['VND', 'USD']
    },
    firstDayOfWeek: {
        title: 'Chọn ngày đầu tuần',
        options: ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']
    },
    firstDayOfMonth: {
        title: 'Đặt ngày đầu tiên của tháng',
        options: Array.from({length: 28}, (_, i) => i + 1)
    },
    firstMonthOfYear: {
        title: 'Chọn tháng đầu tiên của năm',
        options: ['Tháng Một','Tháng Hai','Tháng Ba','Tháng Tư','Tháng Năm',
                  'Tháng Sáu','Tháng Bảy','Tháng Tám','Tháng Chín',
                  'Tháng Mười','Tháng Mười Một','Tháng Mười Hai']
    }
};

// === FIREBASE CONFIG ===
const firebaseConfig = {
  apiKey: "AIzaSyCSVeY2vlUpmSB5hr1uxmWy9bOdj2rZxGA",
  authDomain: "financetracker-c7fc1.firebaseapp.com",
  databaseURL: "https://financetracker-c7fc1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "financetracker-c7fc1",
  storageBucket: "financetracker-c7fc1.firebasestorage.app",
  messagingSenderId: "388608329528",
  appId: "1:388608329528:web:b7032a895167da72bb23cd",
  measurementId: "G-3SWB22G1TL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();


// === LOCAL STORAGE ===
const STORAGE_KEY = 'finance_flow_data';

function syncData() {
    const data = { wallets, isBalanceVisible, settings, transactions };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (database) database.ref('user_data').set(data);
}

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const data = JSON.parse(saved);
        wallets = data.wallets || [];
        transactions = data.transactions || [];
        isBalanceVisible = data.isBalanceVisible !== undefined ? data.isBalanceVisible : true;
        if (data.settings) settings = { ...settings, ...data.settings };
    }
    if (database) {
        database.ref('user_data').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                wallets = data.wallets || [];
                transactions = data.transactions || [];
                isBalanceVisible = data.isBalanceVisible !== undefined ? data.isBalanceVisible : true;
                if (data.settings) settings = { ...settings, ...data.settings };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                renderAll();
            }
        });
    }
}

// === ICON LIBRARY ===
const ICONS = [
    '💰','💳','🏦','💵','💸','💴',
    '🐷','🎯','✈️','🚗','🚢','🚂',
    '🏠','🏪','🏥','🏫','🏗️','🏨',
    '🍔','☕','🍕','🍺','🥗','🍱',
    '⚽','🎾','🏊','🏆','🎮','🎵',
    '💻','📱','📺','📖','⌨️','🖼️',
    '💊','💉','🧠','❤️','💡','🔑',
    '🎁','🎀','🎄','🚀','🌟','⭐'
];

// === UTILS ===
function formatCurrency(amount, currencyCode = 'VND') {
    if (!isBalanceVisible) return '***';
    if (currencyCode === 'USD') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
    }
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

function getTotalBalance() {
    // Note: Simple sum for now, ignores conversion
    return wallets.reduce((sum, w) => sum + w.balance, 0);
}

// === PAGE ROUTING ===
function switchPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById('page-' + pageName);
    if (targetPage) targetPage.classList.add('active');

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navEl = document.getElementById('nav-' + pageName);
    if (navEl) navEl.classList.add('active');

    // Hide bottom nav on certain pages
    const bottomNav = document.querySelector('.bottom-nav');
    const hideOnPages = ['add-wallet', 'settings', 'add-transaction'];
    bottomNav.style.display = hideOnPages.includes(pageName) ? 'none' : 'flex';

    renderAll();
}

// === RENDER ===
function renderAll() {
    renderHomeWallets();
    renderAccountsPage();
    renderSettingsPage();
    renderTransactionsPage();
    updateBalanceDisplays();
}

function updateBalanceDisplays() {
    const currency = settings.totalCurrency || 'VND';
    const total = getTotalBalance();
    const formatted = formatCurrency(total, currency);
    // Strip trailing ' đ' for main display if VND since we show 'đ' separately
    document.getElementById('mainTotalBalance').innerText = currency === 'VND'
        ? new Intl.NumberFormat('vi-VN').format(total)
        : formatted;
    document.getElementById('accountsTotalBalance').innerText = formatted;
}

function renderHomeWallets() {
    const list = document.getElementById('walletListHome');
    list.innerHTML = '';
    if (wallets.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:20px; color:#9ca3af; font-size:13px;">Chưa có ví nào. Vào <strong>Tài khoản</strong> để thêm ví.</div>';
        return;
    }
    wallets.forEach(w => {
        list.innerHTML += `
            <div class="wallet-item">
                <div class="wallet-info-left">
                    <div class="wallet-icon ${w.bgClass}">${w.emoji}</div>
                    <div class="wallet-name">${w.name}</div>
                </div>
                <div class="wallet-balance">${formatCurrency(w.balance, w.currency || 'VND')}</div>
            </div>`;
    });
}

function renderAccountsPage() {
    const list = document.getElementById('walletListAccounts');
    list.innerHTML = '';
    if (wallets.length === 0) {
        list.innerHTML = '<div style="padding:20px; text-align:center; color:#9ca3af; font-size:13px;">Chưa có ví nào.</div>';
        return;
    }
    wallets.forEach(w => {
        const isSelected = selectedWalletId === w.id;
        const rightSide = editModeActive
            ? `<button class="wallet-edit-btn" onclick="openEditWallet('${w.id}'); event.stopPropagation();"><i class="fas fa-pencil-alt"></i></button>`
            : (isSelected ? '<i class="fas fa-check wallet-check"></i>' : '');

        list.innerHTML += `
            <div class="wallet-item" onclick="selectWallet('${w.id}')">
                <div class="wallet-item-row">
                    <div class="wallet-left">
                        <div class="wallet-icon ${w.bgClass}">${w.emoji}</div>
                        <div>
                            <div class="wallet-name">${w.name}</div>
                            <div style="font-size:12px; color:#9ca3af;">${formatCurrency(w.balance, w.currency || 'VND')}</div>
                        </div>
                    </div>
                    ${rightSide}
                </div>
            </div>`;
    });
}
// === SETTINGS PAGE ===
function renderSettingsPage() {
    const keys = ['dateFormat', 'totalCurrency', 'firstDayOfWeek', 'firstDayOfMonth', 'firstMonthOfYear'];
    keys.forEach(key => {
        const el = document.getElementById('val-' + key);
        if (el) el.innerText = settings[key];
    });
}

let currentSettingKey = null;
function openSettingPicker(key) {
    currentSettingKey = key;
    const cfg = SETTING_OPTIONS[key];
    document.getElementById('settingPickerTitle').innerText = cfg.title;
    const list = document.getElementById('settingPickerList');
    list.innerHTML = '';
    cfg.options.forEach(opt => {
        const isActive = String(settings[key]) === String(opt);
        const row = document.createElement('div');
        row.className = 'setting-option-row' + (isActive ? ' active' : '');
        row.innerHTML = `<span>${opt}</span>${isActive ? '<i class="fas fa-check check-icon"></i>' : ''}`;
        row.onclick = () => {
            settings[key] = opt;
            syncData();
            renderSettingsPage();
            closeSettingPicker();
        };
        list.appendChild(row);
    });
    document.getElementById('settingPickerOverlay').style.display = 'flex';
}

function closeSettingPicker() {
    document.getElementById('settingPickerOverlay').style.display = 'none';
}

// === WALLET SELECTION ===
function selectWallet(id) {
    if (editModeActive) return;
    selectedWalletId = (selectedWalletId === id) ? null : id;
    renderAccountsPage();
}

// === EDIT MODE ===
function toggleEditMode() {
    editModeActive = !editModeActive;
    document.getElementById('btnEditMode').innerText = editModeActive ? 'Xong' : 'Sửa';
    renderAccountsPage();
}

// === TRANSACTIONS PAGE ===
function getPeriods() {
    const day = parseInt(settings.firstDayOfMonth) || 1;
    const now = new Date();
    const periods = [];
    for (let i = -3; i <= 3; i++) {
        const startMonth = now.getMonth() + i;
        const startYear = now.getFullYear() + Math.floor(startMonth / 12);
        const normStart = ((startMonth % 12) + 12) % 12;
        const start = new Date(startYear, normStart, day);
        const end = new Date(startYear, normStart + 1, day - 1 < 1 ? 1 : day - 1);
        if (day === 1) {
            end.setMonth(normStart + 1);
            end.setDate(0); // last day of start month
        }
        periods.push({ start, end });
    }
    return periods;
}

function formatDate(d) {
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function renderTransactionsPage() {
    // Wallet selector
    const allWallets = [{id:'all', name:'Tất cả', emoji:'🌐'},...wallets];
    const idx = currentTxnWalletIndex < 0 ? 0 : currentTxnWalletIndex + 1;
    const w = allWallets[Math.min(idx, allWallets.length-1)];
    const walletEl = document.getElementById('txnWalletIcon');
    const nameEl = document.getElementById('txnWalletName');
    if (walletEl) walletEl.innerText = w.emoji || '🌐';
    if (nameEl) nameEl.innerText = w.name;

    // Balance display
    const balanceEl = document.getElementById('txnBalance');
    if (balanceEl) {
        if (currentTxnWalletIndex < 0) {
            balanceEl.innerText = formatCurrency(wallets.reduce((s,x)=>s+x.balance,0), settings.totalCurrency||'VND');
        } else if (wallets[currentTxnWalletIndex]) {
            const ww = wallets[currentTxnWalletIndex];
            balanceEl.innerText = formatCurrency(ww.balance, ww.currency||'VND');
        }
    }

    // Period tabs
    const periods = getPeriods();
    const tabsEl = document.getElementById('periodTabs');
    if (tabsEl) {
        tabsEl.innerHTML = '';
        periods.forEach((p, i) => {
            const label = `${formatDate(p.start)} - ${formatDate(p.end)}`;
            const tab = document.createElement('div');
            tab.style.cssText = `
                flex-shrink:0; padding:10px 14px; font-size:12px; cursor:pointer;
                color:${i===currentPeriodIndex ? '#1f2937' : '#9ca3af'};
                font-weight:${i===currentPeriodIndex ? '700' : '400'};
                border-bottom:${i===currentPeriodIndex ? '2px solid #1f2937' : '2px solid transparent'};
                white-space:nowrap;`;
            tab.innerText = label;
            tab.onclick = () => { currentPeriodIndex = i; renderTransactionsPage(); };
            tabsEl.appendChild(tab);
        });
        // Scroll active tab into view
        const activeTab = tabsEl.children[currentPeriodIndex];
        if (activeTab) activeTab.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
    }

    // Render transactions
    renderTxnList(periods[currentPeriodIndex]);
}

function renderTxnList(period) {
    const listEl = document.getElementById('txnList');
    if (!listEl) return;

    // Filter by wallet and period
    let filtered = transactions.filter(t => {
        const tDate = new Date(t.date);
        const inPeriod = tDate >= period.start && tDate <= period.end;
        const inWallet = currentTxnWalletIndex < 0 || t.walletId === (wallets[currentTxnWalletIndex]||{}).id;
        return inPeriod && inWallet;
    });

    if (filtered.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; padding:40px 20px; color:#9ca3af; font-size:14px;">
            <div style="font-size:40px; margin-bottom:12px;">📋</div>
            Chưa có giao dịch nào<br>trong kỳ này
        </div>`;
        return;
    }

    // Group by date (descending)
    const groups = {};
    filtered.forEach(t => {
        if (!groups[t.date]) groups[t.date] = [];
        groups[t.date].push(t);
    });

    const DAY_NAMES = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
    const MONTH_NAMES = ['tháng 1','tháng 2','tháng 3','tháng 4','tháng 5','tháng 6','tháng 7','tháng 8','tháng 9','tháng 10','tháng 11','tháng 12'];

    const sortedDates = Object.keys(groups).sort((a,b) => b.localeCompare(a));
    let html = '';

    sortedDates.forEach(dateStr => {
        const d = new Date(dateStr + 'T00:00:00');
        const dayNum = String(d.getDate()).padStart(2,'0');
        const dayName = DAY_NAMES[d.getDay()];
        const monthName = MONTH_NAMES[d.getMonth()];
        const year = d.getFullYear();
        const txns = groups[dateStr];
        const dayTotal = txns.reduce((s,t) => s + (t.type==='income' ? t.amount : -t.amount), 0);
        const totalColor = dayTotal >= 0 ? '#3b82f6' : '#ef4444';
        const totalStr = (dayTotal >= 0 ? '+' : '') + new Intl.NumberFormat('vi-VN').format(dayTotal);

        let txnRows = txns.map(t => {
            const amtColor = t.type === 'income' ? '#3b82f6' : '#ef4444';
            const amtStr = new Intl.NumberFormat('vi-VN').format(t.amount);
            return `
            <div onclick="openEditTransaction('${t.id}')" style="display:flex; align-items:center; gap:12px; padding:12px 16px; border-top:1px solid #f3f4f6; cursor:pointer;">
                <div style="width:38px;height:38px;border-radius:50%;background:${t.categoryColor||'#9ca3af'};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${t.categoryIcon||'💸'}</div>
                <div style="flex:1; min-width:0;">
                    <div style="font-size:14px;font-weight:600;color:#1f2937;">${t.category||'Khác'}</div>
                    ${t.note ? `<div style="font-size:12px;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.note}</div>` : ''}
                </div>
                <div style="font-size:15px;font-weight:600;color:${amtColor};white-space:nowrap;">${amtStr}</div>
            </div>`;
        }).join('');

        html += `
        <div style="background:white; border-radius:14px; margin-bottom:10px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px 8px;">
                <div style="display:flex; align-items:baseline; gap:10px;">
                    <span style="font-size:28px;font-weight:700;color:#1f2937;">${dayNum}</span>
                    <div>
                        <div style="font-size:13px;font-weight:600;color:#6b7280;">${dayName}</div>
                        <div style="font-size:11px;color:#9ca3af;">${monthName} ${year}</div>
                    </div>
                </div>
                <div style="font-size:14px;font-weight:600;color:${totalColor};">${totalStr}</div>
            </div>
            ${txnRows}
        </div>`;
    });

    listEl.innerHTML = html;
}

function openSelectWalletPage() {
    renderSelectWalletList();
    switchPage('select-wallet');
}

function renderSelectWalletList() {
    const list = document.getElementById('selectWalletList');
    if (!list) return;

    const totalBalance = getTotalBalance();
    const currency = settings.totalCurrency || 'VND';

    let html = `
        <div class="card" style="padding:0; border-radius:12px; background:white; overflow:hidden; margin-bottom:16px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <div style="display:flex; align-items:center; padding:16px; cursor:pointer; background:${currentTxnWalletIndex === -1 ? '#f0fdf4' : 'white'};" onclick="selectTxnWalletFilter(-1)">
                <div style="width:44px; height:44px; border-radius:50%; background:#e5e7eb; display:flex; align-items:center; justify-content:center; font-size:24px; margin-right:12px;">🌐</div>
                <div style="flex:1;">
                    <div style="font-size:16px; font-weight:700; color:#000;">Tổng cộng</div>
                    <div style="font-size:13px; color:#6b7280;">${new Intl.NumberFormat('vi-VN').format(totalBalance)} ${currency}</div>
                </div>
                ${currentTxnWalletIndex === -1 ? '<i class="fas fa-check" style="color:#10b981;"></i>' : ''}
            </div>
        </div>
        <div style="font-size:11px; color:#9ca3af; font-weight:600; margin-bottom:8px; padding-left:4px; letter-spacing:0.5px; text-transform:uppercase;">TÍNH VÀO TỔNG</div>
        <div class="card" style="padding:0; border-radius:12px; background:white; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
    `;

    wallets.forEach((w, idx) => {
        const isSelected = currentTxnWalletIndex === idx;
        html += `
            <div style="display:flex; align-items:center; padding:16px; cursor:pointer; border-bottom:${idx === wallets.length - 1 ? 'none' : '1px solid #f3f4f6'}; background:${isSelected ? '#f0fdf4' : 'white'};" onclick="selectTxnWalletFilter(${idx})">
                <div style="width:40px; height:40px; border-radius:50%; background:${w.bgClass || '#3b82f6'}; display:flex; align-items:center; justify-content:center; font-size:20px; margin-right:12px; color:white;">${w.emoji || '💰'}</div>
                <div style="flex:1;">
                    <div style="font-size:15px; font-weight:600; color:#000;">${w.name}</div>
                    <div style="font-size:13px; color:#6b7280;">${new Intl.NumberFormat('vi-VN').format(w.balance)} ${w.currency || 'VND'}</div>
                </div>
                ${isSelected ? '<i class="fas fa-check" style="color:#10b981;"></i>' : ''}
            </div>
        `;
    });

    html += `</div>`;
    list.innerHTML = html;
}

function selectTxnWalletFilter(index) {
    currentTxnWalletIndex = index;
    switchPage('transactions');
}

// === ADD TRANSACTION ===
let txnSelectedWalletId = null;

function openAddTransaction() {
    currentTxnType = 'expense';
    selectedCategory = null;
    txnSelectedWalletId = wallets.length > 0 ? wallets[0].id : null;
    
    document.getElementById('editTxnId').value = '';
    document.getElementById('txnAmount').value = '';
    document.getElementById('txnNote').value = '';
    document.getElementById('txnDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('deleteTxnRow').style.display = 'none';
    
    setTxnType('expense');
    updateTxnDateDisplay();
    updateSelectedWalletDisplay();
    updateSelectedCategoryDisplay();
    checkTxnValid();
    
    switchPage('add-transaction');
}

function openEditTransaction(id) {
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    
    currentTxnType = t.type;
    selectedCategory = { name: t.category, icon: t.categoryIcon, color: t.categoryColor };
    txnSelectedWalletId = t.walletId;
    
    document.getElementById('editTxnId').value = t.id;
    document.getElementById('txnAmount').value = t.amount;
    document.getElementById('txnNote').value = t.note || '';
    document.getElementById('txnDate').value = t.date;
    document.getElementById('deleteTxnRow').style.display = 'block';
    
    setTxnType(t.type);
    updateTxnDateDisplay();
    updateSelectedWalletDisplay();
    updateSelectedCategoryDisplay();
    checkTxnValid();
    
    switchPage('add-transaction');
}

function closeAddTransaction() {
    switchPage('transactions');
}

function setTxnType(type) {
    currentTxnType = type;
    
    const expBtn = document.getElementById('typeExpenseBtn');
    const incBtn = document.getElementById('typeIncomeBtn');
    const debtBtn = document.getElementById('typeDebtBtn');
    
    const colors = { expense: '#ef4444', income: '#10b981', debt: '#8b5cf6' };
    const activeBg = colors[type];
    
    const activeStyle = (bg) => `flex:1; padding:8px 0; border:none; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; background:${bg}; color:white; box-shadow:0 1px 3px rgba(0,0,0,0.15);`;
    const inactiveStyle = `flex:1; padding:8px 0; border:none; border-radius:6px; font-size:13px; font-weight:500; cursor:pointer; background:transparent; color:#6b7280; box-shadow:none;`;
    
    if (expBtn) expBtn.style.cssText = type === 'expense' ? activeStyle('#ef4444') : inactiveStyle;
    if (incBtn) incBtn.style.cssText = type === 'income' ? activeStyle('#10b981') : inactiveStyle;
    if (debtBtn) debtBtn.style.cssText = type === 'debt' ? activeStyle('#8b5cf6') : inactiveStyle;
    
    selectedCategory = null;
    updateSelectedCategoryDisplay();
    checkTxnValid();
}

function updateTxnDateDisplay() {
    const dateVal = document.getElementById('txnDate').value;
    if (!dateVal) return;
    
    const d = new Date(dateVal);
    const today = new Date();
    
    const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    
    if (isToday) {
        document.getElementById('txnDateDisplay').innerText = 'Hôm nay';
    } else {
        const DAY_NAMES = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        document.getElementById('txnDateDisplay').innerText = `${DAY_NAMES[d.getDay()]}, ${dd}/${mm}/${yyyy}`;
    }
}

function changeTxnDate(delta) {
    const dateInput = document.getElementById('txnDate');
    if (!dateInput.value) return;
    
    const d = new Date(dateInput.value);
    d.setDate(d.getDate() + delta);
    dateInput.value = d.toISOString().split('T')[0];
    updateTxnDateDisplay();
}

function updateSelectedWalletDisplay() {
    const w = wallets.find(x => x.id === txnSelectedWalletId);
    const iconEl = document.getElementById('selectedWalletIconTxn');
    const nameEl = document.getElementById('selectedWalletNameTxn');
    const currEl = document.getElementById('txnCurrencyLabel');
    
    if (w) {
        if(iconEl) iconEl.innerText = w.emoji || '💰';
        if(nameEl) {
            nameEl.innerText = w.name;
            nameEl.style.color = '#000';
        }
        if(currEl) currEl.innerText = w.currency || 'VND';
    } else {
        if(iconEl) iconEl.innerText = '💰';
        if(nameEl) {
            nameEl.innerText = 'Chọn ví';
            nameEl.style.color = '#9ca3af';
        }
        if(currEl) currEl.innerText = settings.totalCurrency || 'VND';
    }
}

function updateSelectedCategoryDisplay() {
    const iconEl = document.getElementById('selectedCatIconTxn');
    const nameEl = document.getElementById('selectedCatNameTxn');
    
    if (selectedCategory) {
        if(iconEl) {
            iconEl.innerText = selectedCategory.icon;
            iconEl.style.background = selectedCategory.color;
        }
        if(nameEl) {
            nameEl.innerText = selectedCategory.name;
            nameEl.style.color = '#000';
        }
    } else {
        if(iconEl) {
            iconEl.innerText = '';
            iconEl.style.background = '#e5e7eb';
        }
        if(nameEl) {
            nameEl.innerText = 'Chọn nhóm';
            nameEl.style.color = '#9ca3af';
        }
    }
}

function openTxnWalletPicker() {
    const list = document.getElementById('txnWalletPickerList');
    if (!list) return;
    
    list.innerHTML = wallets.map(w => `
        <div onclick="selectTxnWallet('${w.id}')" style="display:flex; align-items:center; gap:12px; padding:16px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; background:${w.id === txnSelectedWalletId ? '#f0fdf4' : 'transparent'};">
            <div style="font-size:24px;">${w.emoji||'💰'}</div>
            <div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">${w.name}</div>
            ${w.id === txnSelectedWalletId ? '<i class="fas fa-check" style="color:#10b981;"></i>' : ''}
        </div>
    `).join('');
    
    document.getElementById('txnWalletPickerOverlay').style.display = 'flex';
}

function closeTxnWalletPicker() {
    document.getElementById('txnWalletPickerOverlay').style.display = 'none';
}

function selectTxnWallet(id) {
    txnSelectedWalletId = id;
    updateSelectedWalletDisplay();
    closeTxnWalletPicker();
    checkTxnValid();
}

function openTxnCategoryPicker() {
    const grid = document.getElementById('txnCategoryPickerGrid');
    if (!grid) return;
    
    const cats = currentTxnType === 'expense' ? EXPENSE_CATS : (currentTxnType === 'income' ? INCOME_CATS : DEBT_CATS);
    
    grid.innerHTML = cats.map(cat => {
        const isSelected = selectedCategory && selectedCategory.name === cat.name;
        return `<div onclick="selectCategory(${JSON.stringify(cat).replace(/"/g,'&quot;')})" style="
            display:flex; flex-direction:column; align-items:center; gap:8px; padding:12px 4px;
            border-radius:12px; cursor:pointer;
            background:${isSelected ? cat.color + '20' : 'transparent'};
            border:${isSelected ? '2px solid ' + cat.color : '2px solid transparent'};
            transition:0.15s;">
            <div style="width:48px;height:48px;border-radius:50%;background:${cat.color};display:flex;align-items:center;justify-content:center;font-size:24px;">${cat.icon}</div>
            <span style="font-size:11px;text-align:center;color:${isSelected ? cat.color : '#4b5563'};font-weight:${isSelected?'600':'500'};line-height:1.2;">${cat.name}</span>
        </div>`;
    }).join('');
    
    document.getElementById('txnCategoryPickerOverlay').style.display = 'flex';
}

function closeTxnCategoryPicker() {
    document.getElementById('txnCategoryPickerOverlay').style.display = 'none';
}

function selectCategory(cat) {
    selectedCategory = cat;
    updateSelectedCategoryDisplay();
    closeTxnCategoryPicker();
    checkTxnValid();
}

function checkTxnValid() {
    const amount = parseFloat(document.getElementById('txnAmount').value) || 0;
    const isValid = amount > 0 && txnSelectedWalletId && selectedCategory;
    
    const btn = document.getElementById('saveTxnBtn');
    if (btn) {
        if (isValid) {
            btn.style.background = '#10b981';
            btn.disabled = false;
        } else {
            btn.style.background = '#d1d5db';
            btn.disabled = true;
        }
    }
}

function saveTransaction() {
    const id = document.getElementById('editTxnId').value;
    const amount = parseFloat(document.getElementById('txnAmount').value) || 0;
    const note = document.getElementById('txnNote').value.trim();
    const date = document.getElementById('txnDate').value;
    const walletId = txnSelectedWalletId;
    
    if (!amount || !date || !walletId || !selectedCategory) return;

    const isIncome = currentTxnType === 'income' || (currentTxnType === 'debt' && (selectedCategory.name === 'Đi vay' || selectedCategory.name === 'Thu nợ'));

    const txn = {
        id: id || 'txn_' + Date.now(),
        walletId, type: currentTxnType,
        amount, category: selectedCategory.name, categoryIcon: selectedCategory.icon, categoryColor: selectedCategory.color,
        note, date
    };

    if (id) {
        const oldTxn = transactions.find(t => t.id === id);
        if (oldTxn) {
            const oldIsIncome = oldTxn.type === 'income' || (oldTxn.type === 'debt' && (oldTxn.category === 'Đi vay' || oldTxn.category === 'Thu nợ'));
            const w = wallets.find(x => x.id === oldTxn.walletId);
            if (w) w.balance += oldIsIncome ? -oldTxn.amount : oldTxn.amount;
        }
        transactions = transactions.filter(t => t.id !== id);
    }

    const targetWallet = wallets.find(x => x.id === walletId);
    if (targetWallet) {
        targetWallet.balance += isIncome ? amount : -amount;
    }
    
    transactions.push(txn);
    syncData();
    switchPage('transactions');
    renderAll();
}

function deleteTransaction() {
    const id = document.getElementById('editTxnId').value;
    if (!id || !confirm('Xóa giao dịch này?')) return;
    const t = transactions.find(x => x.id === id);
    if (t) {
        const isIncome = t.type === 'income' || (t.type === 'debt' && (t.category === 'Đi vay' || t.category === 'Thu nợ'));
        const w = wallets.find(x => x.id === t.walletId);
        if (w) w.balance += isIncome ? -t.amount : t.amount;
    }
    transactions = transactions.filter(x => x.id !== id);
    syncData();
    switchPage('transactions');
    renderAll();
}

// === ADD WALLET PAGE ===
function openAddWallet() {
    prevPage = document.querySelector('.page.active')?.id.replace('page-','') || 'accounts';
    selectedIcon = '💰';
    document.getElementById('addWalletPageTitle').innerText = 'Thêm Ví';
    document.getElementById('editWalletId').value = '';
    document.getElementById('walletName').value = '';
    document.getElementById('walletBalance').value = '0';
    document.getElementById('walletCurrency').value = 'VND';
    document.getElementById('walletExclude').checked = false;
    document.getElementById('walletIconPreview').innerHTML = `${selectedIcon} <i class="fas fa-chevron-up" style="font-size:9px;color:#aaa"></i>`;
    document.getElementById('deleteWalletRow').style.display = 'none';
    switchPage('add-wallet');
}

function openEditWallet(id) {
    const w = wallets.find(x => x.id === id);
    if (!w) return;
    prevPage = 'accounts';
    selectedIcon = w.emoji || '💰';
    document.getElementById('addWalletPageTitle').innerText = 'Sửa Ví';
    document.getElementById('editWalletId').value = w.id;
    document.getElementById('walletName').value = w.name;
    document.getElementById('walletBalance').value = w.balance;
    document.getElementById('walletCurrency').value = w.currency || 'VND';
    document.getElementById('walletExclude').checked = w.excluded || false;
    document.getElementById('walletIconPreview').innerHTML = `${selectedIcon} <i class="fas fa-chevron-up" style="font-size:9px;color:#aaa"></i>`;
    document.getElementById('deleteWalletRow').style.display = 'block';
    switchPage('add-wallet');
}

function closeAddWalletPage() {
    switchPage(prevPage);
}

function saveWallet() {
    const id = document.getElementById('editWalletId').value;
    const name = document.getElementById('walletName').value.trim();
    const balance = parseFloat(document.getElementById('walletBalance').value) || 0;
    const currency = document.getElementById('walletCurrency').value;
    const excluded = document.getElementById('walletExclude').checked;
    if (!name) {
        document.getElementById('walletName').focus();
        return;
    }
    if (id) {
        const w = wallets.find(x => x.id === id);
        if (w) { w.name = name; w.balance = balance; w.emoji = selectedIcon; w.excluded = excluded; w.currency = currency; }
    } else {
        wallets.push({ id: 'w' + Date.now(), name, balance, emoji: selectedIcon, bgClass: 'icon-cash', excluded, currency });
    }
    syncData();
    switchPage(prevPage);
    renderAll();
}

function deleteWallet() {
    const id = document.getElementById('editWalletId').value;
    if (!id || !confirm('Xóa ví này?')) return;
    wallets = wallets.filter(w => w.id !== id);
    if (selectedWalletId === id) selectedWalletId = null;
    syncData();
    switchPage('accounts');
    renderAll();
}

// === ICON PICKER ===
function openIconPicker() {
    const grid = document.getElementById('iconGrid');
    grid.innerHTML = '';
    ICONS.forEach(icon => {
        const el = document.createElement('div');
        el.className = 'icon-grid-item' + (icon === selectedIcon ? ' selected' : '');
        el.innerText = icon;
        el.onclick = () => {
            selectedIcon = icon;
            document.getElementById('walletIconPreview').innerHTML = `${icon} <i class="fas fa-chevron-up" style="font-size:9px;color:#aaa"></i>`;
            closeIconPicker();
        };
        grid.appendChild(el);
    });
    document.getElementById('iconPickerOverlay').style.display = 'flex';
}

function closeIconPicker() {
    document.getElementById('iconPickerOverlay').style.display = 'none';
}

// === INTERACTIONS ===
function toggleBalance() {
    isBalanceVisible = !isBalanceVisible;
    document.getElementById('toggleBalanceBtn').className = isBalanceVisible ? 'fas fa-eye' : 'fas fa-eye-slash';
    syncData();
    renderAll();
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    const idx = tab === 'expense' ? 0 : 1;
    document.querySelectorAll('.tab')[idx].classList.add('active');
    renderChart();
}

// === CHART ===
function renderChart() {
    const ctx = document.getElementById('reportChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    const dataPoints = [4, 4.2, 5, 5.5, 6, 6.2, 6.5, 6.5, 6.8, 8, 8.5, 9, 9.2, 9.2, 9.5, 12, 22];
    const lineColor = currentTab === 'expense' ? '#ef4444' : '#3b82f6';

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(17).fill(''),
            datasets: [{
                data: dataPoints,
                borderColor: '#d1d5db',
                borderWidth: 2.5,
                tension: 0.1,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: {
                y: {
                    min: 0, max: 25,
                    position: 'right',
                    grid: { color: '#f3f4f6' },
                    ticks: {
                        color: '#9ca3af', font: { size: 10 }, stepSize: 10,
                        callback: v => v === 0 ? '0' : v + ' M'
                    }
                },
                x: {
                    grid: { display: false, borderColor: lineColor, borderWidth: 2 },
                    ticks: {
                        color: '#9ca3af', font: { size: 10 }, maxRotation: 0,
                        callback: (val, i) => i === 0 ? '16/04' : i === 16 ? '15/05' : ''
                    }
                }
            }
        }
    });
}

// === INIT ===
window.onload = () => {
    loadData();
    // Update eye icon state based on loaded data
    document.getElementById('toggleBalanceBtn').className = isBalanceVisible ? 'fas fa-eye' : 'fas fa-eye-slash';
    renderAll();
    renderChart();
};
