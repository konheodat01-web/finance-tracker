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
let currentPeriodIndex = 3; 

function getTodayStr() {
    // Correctly get YYYY-MM-DD in local timezone (Vietnam UTC+7)
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
}

function getLocalDateStr(date) {
    if (!date) return getTodayStr();
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
}

function initCurrentPeriod() {
    const periods = getPeriods();
    const now = new Date();
    // Compare time at midnight for more accuracy
    const nowTime = now.getTime();
    const idx = periods.findIndex(p => nowTime >= p.start.getTime() && nowTime <= p.end.getTime() + 86399999);
    if (idx !== -1) currentPeriodIndex = idx;
}
let currentTxnType = 'expense';
let selectedCategory = null;
let settings = {
    dateFormat: 'DD/MM/YYYY',
    totalCurrency: 'VND',
    firstDayOfWeek: 'Thứ Hai',
    firstDayOfMonth: 1,
    firstMonthOfYear: 'Tháng Một'
};

let sepayConfig = { apiToken: '', proxyUrl: '', mappings: [], lastSyncIds: [] };

let userCategories = {
    expense: [
        { id: 'cat_e_1', name: 'Ăn uống', icon: '🍜', color: '#f97316' },
        { id: 'cat_e_2', name: 'Di chuyển', icon: '🚗', color: '#3b82f6' },
        { id: 'cat_e_3', name: 'Mua sắm', icon: '🛋', color: '#8b5cf6' },
        { id: 'cat_e_4', name: 'Giải trí', icon: '🎮', color: '#ec4899' },
        { id: 'cat_e_5', name: 'Y tế', icon: '💊', color: '#ef4444' },
        { id: 'cat_e_6', name: 'Giáo dục', icon: '📚', color: '#0ea5e9' },
        { id: 'cat_e_7', name: 'Nhà ở', icon: '🏠', color: '#f59e0b' },
        { id: 'cat_e_8', name: 'Hóa đơn', icon: '📰', color: '#6b7280' },
        { id: 'cat_e_9', name: 'Đi chợ', icon: '🧳', color: '#22c55e' },
        { id: 'cat_e_10', name: 'Sức khỏe', icon: '🏃', color: '#10b981' },
        { id: 'cat_e_11', name: 'Linh tinh', icon: '📦', color: '#d97706' },
        { id: 'cat_e_12', name: 'Chi phí khác', icon: '💸', color: '#9ca3af' },
    ],
    income: [
        { id: 'cat_i_1', name: 'Lương', icon: '💰', color: '#22c55e' },
        { id: 'cat_i_2', name: 'Thưởng', icon: '🎁', color: '#f97316' },
        { id: 'cat_i_3', name: 'Đầu tư', icon: '📈', color: '#3b82f6' },
        { id: 'cat_i_4', name: 'Tiết kiệm', icon: '🏦', color: '#0ea5e9' },
        { id: 'cat_i_5', name: 'Bán hàng', icon: '🛒', color: '#8b5cf6' },
        { id: 'cat_i_6', name: 'Thu nhập khác', icon: '💵', color: '#6b7280' },
    ],
    debt: [
        { id: 'cat_d_1', name: 'Đi vay', icon: '🤝', color: '#8b5cf6' },
        { id: 'cat_d_2', name: 'Cho vay', icon: '💸', color: '#0ea5e9' },
        { id: 'cat_d_3', name: 'Trả nợ', icon: '💳', color: '#ef4444' },
        { id: 'cat_d_4', name: 'Thu nợ', icon: '💰', color: '#22c55e' },
    ]
};

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
    const data = { wallets, isBalanceVisible, settings, transactions, userCategories, sepayConfig };
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
        if (data.settings) {
            settings = { ...settings, ...data.settings };
            initCurrentPeriod();
        }
        if (data.userCategories) userCategories = data.userCategories;
        if (data.sepayConfig) sepayConfig = data.sepayConfig;
    }
    if (database) {
        database.ref('user_data').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                wallets = data.wallets || [];
                transactions = data.transactions || [];
                isBalanceVisible = data.isBalanceVisible !== undefined ? data.isBalanceVisible : true;
                if (data.settings) {
                    settings = { ...settings, ...data.settings };
                    initCurrentPeriod();
                }
                if (data.userCategories) userCategories = data.userCategories;
                if (data.sepayConfig) sepayConfig = data.sepayConfig;
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
    const hideOnPages = ['add-wallet', 'settings', 'add-transaction', 'categories', 'add-category', 'sepay'];
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
    renderChart();
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
    document.getElementById('txnDate').value = getTodayStr();
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
    
    // Prioritize categoryId to find the real category object
    const allCats = [...(userCategories.expense||[]), ...(userCategories.income||[]), ...(userCategories.debt||[])];
    const realCat = allCats.find(c => c.id === t.categoryId);
    
    if (realCat) {
        selectedCategory = realCat;
    } else {
        selectedCategory = { name: t.category, icon: t.categoryIcon, color: t.categoryColor };
    }
    
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
    dateInput.value = getLocalDateStr(d);
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

function generateCategoryListHTML(cats, selectedId, clickHandlerName) {
    if (!cats || cats.length === 0) return '<div style="padding:20px; text-align:center; color:#9ca3af; font-size:13px;">Chưa có nhóm nào.</div>';

    const parents = cats.filter(c => !c.parentId);
    const children = cats.filter(c => c.parentId);
    const orphans = children.filter(c => !cats.find(p => p.id === c.parentId));

    let html = '';
    const allItems = [];

    parents.forEach(parent => {
        const myChildren = children.filter(c => c.parentId === parent.id);
        allItems.push({ cat: parent, isChild: false, childCount: myChildren.length });
        myChildren.forEach(child => allItems.push({ cat: child, isChild: true, parentName: parent.name }));
    });
    orphans.forEach(child => allItems.push({ cat: child, isChild: true, parentName: '(Không có nhóm cha)' }));

    allItems.forEach((item, idx) => {
        const { cat, isChild, childCount, parentName } = item;
        const isLast = idx === allItems.length - 1;
        const isSelected = selectedId === cat.id || selectedId === cat.name;

        let subtitle = '';
        if (isChild) {
            subtitle = `<div style="font-size:12px; color:#6b7280; margin-top:1px;">${parentName}</div>`;
        } else if (childCount > 0) {
            subtitle = `<div style="font-size:12px; color:#9ca3af; margin-top:1px;">${childCount} nhóm con</div>`;
        }

        const indent = isChild ? 'padding-left:28px;' : '';
        const iconSize = isChild ? '34px' : '40px';
        const fontSize = isChild ? '17px' : '20px';
        const nameSize = isChild ? '14px' : '15px';
        const nameWeight = isChild ? '400' : '500';
        
        let bgColor = isChild ? '#fafafa' : 'white';
        let borderColor = isLast ? 'none' : '1px solid #f3f4f6';
        let checkMark = '';
        
        if (isSelected) {
            bgColor = cat.color + '15';
            checkMark = `<i class="fas fa-check" style="color:${cat.color}; font-size:16px;"></i>`;
        }

        let onClickAttr = '';
        if (clickHandlerName === 'selectCategory') {
            onClickAttr = `onclick="selectCategory(${JSON.stringify(cat).replace(/"/g,'&quot;')})"`;
        } else if (clickHandlerName === 'selectSePayCategory') {
            onClickAttr = `onclick="selectSePayCategory('${cat.id}')"`;
        }

        html += `
            <div ${onClickAttr} style="display:flex; align-items:center; padding:12px 16px; ${indent} border-bottom:${borderColor}; cursor:pointer; background:${bgColor}; transition:0.15s;">
                <div style="width:${iconSize}; height:${iconSize}; border-radius:50%; background:${cat.color}20; display:flex; align-items:center; justify-content:center; font-size:${fontSize}; margin-right:12px; color:${cat.color}; flex-shrink:0;">${cat.icon}</div>
                <div style="flex:1; min-width:0;">
                    <div style="font-size:${nameSize}; font-weight:${nameWeight}; color:#1f2937;">${cat.name}</div>
                    ${subtitle}
                </div>
                ${checkMark}
            </div>
        `;
    });

    return html;
}

function openTxnCategoryPicker() {
    const list = document.getElementById('txnCategoryPickerList');
    if (!list) return;
    
    const cats = userCategories[currentTxnType] || [];
    const selectedId = selectedCategory ? selectedCategory.name : null;
    
    list.innerHTML = generateCategoryListHTML(cats, selectedId, 'selectCategory');
    
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

    const oldTxn = id ? transactions.find(t => t.id === id) : null;

    const txn = {
        id: id || 'txn_' + Date.now(),
        walletId, type: currentTxnType,
        categoryId: selectedCategory.id || (oldTxn ? (oldTxn.categoryId || null) : null),
        sepayBankAcc: oldTxn ? (oldTxn.sepayBankAcc || null) : null,
        manuallyEdited: true, // Mark as manually edited - never auto-overwrite
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
let iconTarget = 'wallet';

function openIconPicker() {
    iconTarget = 'wallet';
    renderIconGrid();
    document.getElementById('iconPickerOverlay').style.display = 'flex';
}

function openIconPickerForCat() {
    iconTarget = 'category';
    renderIconGrid();
    document.getElementById('iconPickerOverlay').style.display = 'flex';
}

function renderIconGrid() {
    const grid = document.getElementById('iconGrid');
    if (!grid) return;
    grid.innerHTML = ICONS.map(icon => `
        <div class="icon-grid-item ${icon === selectedIcon ? 'selected' : ''}" onclick="selectIcon('${icon}')">
            ${icon}
        </div>
    `).join('');
}

function selectIcon(icon) {
    selectedIcon = icon;
    if (iconTarget === 'wallet') {
        const preview = document.getElementById('walletIconPreview');
        if (preview) preview.innerHTML = `${icon} <i class="fas fa-chevron-up" style="font-size:9px;color:#aaa"></i>`;
    } else if (iconTarget === 'category') {
        const preview = document.getElementById('catIconPreview');
        if (preview) preview.innerText = icon;
    }
    closeIconPicker();
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
    const ctx = document.getElementById('reportChart');
    if (!ctx) return;
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

    // Get periods
    const periods = getPeriods();
    
    // Logic: If on Home page, always show the period containing Today.
    // If on Transactions page, show the selected currentPeriodIndex.
    let activeIdx = currentPeriodIndex;
    const now = new Date();
    const nowTime = now.getTime();
    
    // Auto-detect index for Today
    const todayIdx = periods.findIndex(p => nowTime >= p.start.getTime() && nowTime <= p.end.getTime() + 86399999);
    
    if (document.getElementById('page-home').classList.contains('active')) {
        if (todayIdx !== -1) activeIdx = todayIdx;
    }

    const period = periods[activeIdx] || (todayIdx !== -1 ? periods[todayIdx] : periods[3]);
    const start = period.start;
    const end = period.end;

    // Build daily data map
    const type = currentTab; // 'expense' or 'income'
    const dailyMap = {};
    
    // Fill all days in period with 0
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dailyMap[getLocalDateStr(d)] = 0;
    }

    // Sum transactions
    transactions.forEach(t => {
        if (t.type !== type) return;
        if (t.date >= getLocalDateStr(start) && t.date <= getLocalDateStr(end)) {
            dailyMap[t.date] = (dailyMap[t.date] || 0) + t.amount;
        }
    });

    const labels = Object.keys(dailyMap).sort();
    const rawData = labels.map(d => dailyMap[d]);

    // Cumulative sum
    let cumSum = 0;
    const data = rawData.map(v => { cumSum += v; return Math.round(cumSum / 1000); }); // in K

    const lineColor = type === 'expense' ? '#ef4444' : '#3b82f6';
    const gradientColor = type === 'expense' ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)';

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, type === 'expense' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    const maxVal = Math.max(...data, 1);
    const maxDisplay = Math.ceil(maxVal / 5) * 5;

    const firstLabel = labels[0] ? labels[0].split('-').slice(1).reverse().join('/') : '';
    const lastLabel = labels[labels.length-1] ? labels[labels.length-1].split('-').slice(1).reverse().join('/') : '';

    // Update Home Report Summary Values
    const currentPeriod = periods[currentPeriodIndex] || periods[3];
    const sStr = getLocalDateStr(currentPeriod.start);
    const eStr = getLocalDateStr(currentPeriod.end);
    
    let totalExp = 0;
    let totalInc = 0;
    transactions.forEach(t => {
        if (t.date >= sStr && t.date <= eStr) {
            if (t.type === 'expense') totalExp += t.amount;
            else if (t.type === 'income') totalInc += t.amount;
        }
    });

    const expValEl = document.querySelector('.tab-value.expense');
    const incValEl = document.querySelector('.tab-value.income');
    if (expValEl) expValEl.innerText = new Intl.NumberFormat('vi-VN').format(totalExp);
    if (incValEl) incValEl.innerText = new Intl.NumberFormat('vi-VN').format(totalInc);

    // Update Chart Date Label (Today's spend)
    const chartDateEl = document.querySelector('.chart-date');
    if (chartDateEl) {
        const todayStr = getTodayStr();
        const todaySpend = dailyMap[todayStr] || 0;
        
        // Manual format to ensure DD/MM/YYYY
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const todayDateFormatted = `${dd}/${mm}/${yyyy}`;
        
        chartDateEl.innerHTML = `${todayDateFormatted}: <strong class="${type === 'expense' ? 'expense-text' : 'income-text'}">${new Intl.NumberFormat('vi-VN').format(todaySpend)}</strong>`;
    }

    // Update Report Title with Date Range
    const reportTitleEl = document.querySelector('.section-title');
    if (reportTitleEl && reportTitleEl.innerText.includes('Báo cáo')) {
        reportTitleEl.innerText = `Báo cáo (${firstLabel} - ${lastLabel})`;
    }

    chartInstance = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data,
                borderColor: lineColor,
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: true,
                backgroundColor: gradient,
            }, {
                // 3-month average line (gray)
                data: Array(data.length).fill(0), // placeholder
                borderColor: '#e5e7eb',
                borderWidth: 1.5,
                tension: 0.4,
                pointRadius: 0,
                fill: false,
                borderDash: [4, 4],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'white',
                    titleColor: '#6b7280',
                    bodyColor: '#1f2937',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 8,
                    callbacks: {
                        title: items => items[0]?.label?.split('-').slice(1).reverse().join('/') || '',
                        label: items => {
                            const v = items.raw * 1000;
                            return new Intl.NumberFormat('vi-VN').format(v) + ' đ';
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: maxDisplay || 10,
                    position: 'right',
                    grid: { color: '#f9fafb' },
                    ticks: {
                        color: '#9ca3af', font: { size: 10 },
                        callback: v => v === 0 ? '0' : (v >= 1000 ? (v/1000)+'M' : v+'K')
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#9ca3af', font: { size: 10 }, maxRotation: 0,
                        callback: (val, i) => {
                            if (i === 0) return firstLabel;
                            if (i === labels.length - 1) return lastLabel;
                            return '';
                        }
                    }
                }
            }
        }
    });
}


// === INIT ===
window.onload = () => {
    initCurrentPeriod();
    loadData();
    // Update eye icon state based on loaded data
    document.getElementById('toggleBalanceBtn').className = isBalanceVisible ? 'fas fa-eye' : 'fas fa-eye-slash';
    renderAll();
};

// === MANAGE CATEGORIES ===
let catManageType = 'expense';
let editCatType = 'expense';
let editCatParentId = null;

function openManageCategories() {
    catManageType = 'expense';
    switchPage('categories');
    renderManageCategories();
}

function setCatManageType(type) {
    catManageType = type;
    renderManageCategories();
}

function renderManageCategories() {
    const expBtn = document.getElementById('catManageExpenseBtn');
    const incBtn = document.getElementById('catManageIncomeBtn');
    const debtBtn = document.getElementById('catManageDebtBtn');
    
    const activeStyle = `flex:1; padding:8px 0; border:none; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; background:white; color:#000; box-shadow:0 1px 2px rgba(0,0,0,0.1);`;
    const inactiveStyle = `flex:1; padding:8px 0; border:none; border-radius:6px; font-size:13px; font-weight:500; cursor:pointer; background:transparent; color:#6b7280; box-shadow:none;`;
    
    if(expBtn) expBtn.style.cssText = catManageType === 'expense' ? activeStyle : inactiveStyle;
    if(incBtn) incBtn.style.cssText = catManageType === 'income' ? activeStyle : inactiveStyle;
    if(debtBtn) debtBtn.style.cssText = catManageType === 'debt' ? activeStyle : inactiveStyle;
    
    const list = document.getElementById('manageCategoryList');
    if (!list) return;
    
    const cats = userCategories[catManageType] || [];
    
    if (cats.length === 0) {
        list.innerHTML = '<div style="padding:20px; text-align:center; color:#9ca3af; font-size:13px;">Chưa có nhóm nào.</div>';
        return;
    }
    
    // Separate parents and children
    const parents = cats.filter(c => !c.parentId);
    const children = cats.filter(c => c.parentId);
    const orphans = children.filter(c => !cats.find(p => p.id === c.parentId));

    let html = '';
    const allItems = []; // ordered list: parent then its children

    parents.forEach(parent => {
        const myChildren = children.filter(c => c.parentId === parent.id);
        allItems.push({ cat: parent, isChild: false, childCount: myChildren.length });
        myChildren.forEach(child => allItems.push({ cat: child, isChild: true, parentName: parent.name }));
    });
    // Orphaned children (parent deleted) appended at end
    orphans.forEach(child => allItems.push({ cat: child, isChild: true, parentName: '(Không có nhóm cha)' }));

    allItems.forEach((item, idx) => {
        const { cat, isChild, childCount, parentName } = item;
        const isLast = idx === allItems.length - 1;
        const nextIsChild = !isLast && allItems[idx + 1].isChild;

        let subtitle = '';
        if (isChild) {
            subtitle = `<div style="font-size:12px; color:#6b7280; margin-top:1px;">${parentName}</div>`;
        } else if (childCount > 0) {
            subtitle = `<div style="font-size:12px; color:#9ca3af; margin-top:1px;">${childCount} nhóm con</div>`;
        }

        const indent = isChild ? 'padding-left:28px;' : '';
        const iconSize = isChild ? '34px' : '40px';
        const fontSize = isChild ? '17px' : '20px';
        const nameSize = isChild ? '14px' : '15px';
        const nameWeight = isChild ? '400' : '500';

        html += `
            <div onclick="openEditCategory('${cat.id}')" style="display:flex; align-items:center; padding:12px 16px; ${indent} border-bottom:${isLast ? 'none' : '1px solid #f3f4f6'}; cursor:pointer; background:${isChild ? '#fafafa' : 'white'};">
                <div style="width:${iconSize}; height:${iconSize}; border-radius:50%; background:${cat.color}20; display:flex; align-items:center; justify-content:center; font-size:${fontSize}; margin-right:12px; color:${cat.color}; flex-shrink:0;">${cat.icon}</div>
                <div style="flex:1; min-width:0;">
                    <div style="font-size:${nameSize}; font-weight:${nameWeight}; color:#1f2937;">${cat.name}</div>
                    ${subtitle}
                </div>
                <i class="fas fa-chevron-right" style="font-size:12px; color:#cbd5e1;"></i>
            </div>
        `;
    });

    list.innerHTML = html || '<div style="padding:20px; text-align:center; color:#9ca3af; font-size:13px;">Chưa có nhóm nào.</div>';
}

function openAddCategoryPage() {
    document.getElementById('addCatPageTitle').innerText = 'Nhóm mới';
    document.getElementById('editCatId').value = '';
    document.getElementById('catNameInput').value = '';
    
    selectedIcon = '❤️';
    const iconBtn = document.getElementById('catIconPreview');
    if(iconBtn) {
        iconBtn.innerText = selectedIcon;
        iconBtn.style.background = '#e5e7eb';
    }
    
    setAddCatType(catManageType);
    document.getElementById('deleteCatRow').style.display = 'none';
    
    editCatParentId = null;
    updateParentCatDisplay();
    
    checkCatValid();
    switchPage('add-category');
}

function openEditCategory(id) {
    const cats = userCategories[catManageType] || [];
    const cat = cats.find(c => c.id === id);
    if (!cat) return;
    
    document.getElementById('addCatPageTitle').innerText = 'Sửa nhóm';
    document.getElementById('editCatId').value = cat.id;
    document.getElementById('catNameInput').value = cat.name;
    
    selectedIcon = cat.icon;
    const iconBtn = document.getElementById('catIconPreview');
    if(iconBtn) {
        iconBtn.innerText = selectedIcon;
        iconBtn.style.background = cat.color + '40';
    }
    
    setAddCatType(catManageType);
    document.getElementById('deleteCatRow').style.display = 'block';
    
    editCatParentId = cat.parentId || null;
    updateParentCatDisplay();
    
    checkCatValid();
    switchPage('add-category');
}

function setAddCatType(type) {
    editCatType = type;
    const incBtn = document.getElementById('addCatIncomeBtn');
    const expBtn = document.getElementById('addCatExpenseBtn');
    
    const activeStyle = `padding:6px 12px; border:none; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; background:white; color:#000; box-shadow:0 1px 2px rgba(0,0,0,0.1);`;
    const inactiveStyle = `padding:6px 12px; border:none; border-radius:6px; font-size:13px; font-weight:500; cursor:pointer; background:transparent; color:#6b7280; box-shadow:none;`;
    
    if(expBtn) expBtn.style.cssText = type === 'expense' ? activeStyle : inactiveStyle;
    if(incBtn) incBtn.style.cssText = type === 'income' ? activeStyle : inactiveStyle;
    
    // Type changed, reset parent to avoid invalid parent references
    editCatParentId = null;
    updateParentCatDisplay();
}

function checkCatValid() {
    const name = document.getElementById('catNameInput').value.trim();
    const btn = document.getElementById('saveCatBtn');
    if (btn) {
        if (name) {
            btn.style.background = '#10b981';
            btn.disabled = false;
        } else {
            btn.style.background = '#d1d5db';
            btn.disabled = true;
        }
    }
}

function saveCategory() {
    const id = document.getElementById('editCatId').value;
    const name = document.getElementById('catNameInput').value.trim();
    if (!name) return;
    
    const colors = ['#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#0ea5e9', '#f59e0b', '#22c55e', '#10b981'];
    
    if (id) {
        const cat = userCategories[catManageType].find(c => c.id === id);
        if (cat) {
            cat.name = name;
            cat.icon = selectedIcon;
            cat.parentId = editCatParentId;
            if (catManageType !== editCatType) {
                userCategories[catManageType] = userCategories[catManageType].filter(c => c.id !== id);
                userCategories[editCatType].push(cat);
            }
        }
    } else {
        const newCat = {
            id: 'cat_' + Date.now(),
            name: name,
            icon: selectedIcon,
            color: colors[Math.floor(Math.random() * colors.length)],
            parentId: editCatParentId
        };
        if(!userCategories[editCatType]) userCategories[editCatType] = [];
        userCategories[editCatType].push(newCat);
    }
    
    catManageType = editCatType;
    syncData();
    switchPage('categories');
    renderManageCategories();
}

function deleteCategory() {
    const id = document.getElementById('editCatId').value;
    if (!id || !confirm('Xóa nhóm này?')) return;
    
    userCategories[catManageType] = userCategories[catManageType].filter(c => c.id !== id);
    // Also remove parent references for children
    userCategories[catManageType].forEach(c => {
        if (c.parentId === id) c.parentId = null;
    });
    
    syncData();
    switchPage('categories');
    renderManageCategories();
}

function openParentCatPicker() {
    const list = document.getElementById('parentCatPickerList');
    if (!list) return;
    
    const cats = userCategories[editCatType] || [];
    const currentId = document.getElementById('editCatId').value;
    const validParents = cats.filter(c => c.id !== currentId && !c.parentId); // Only top-level cats can be parents, prevent infinite nesting
    
    let html = `
        <div onclick="selectParentCategory(null)" style="display:flex; align-items:center; gap:12px; padding:16px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; background:${editCatParentId === null ? '#f0fdf4' : 'transparent'};">
            <div style="font-size:24px;">🚫</div>
            <div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">Không có</div>
            ${editCatParentId === null ? '<i class="fas fa-check" style="color:#10b981;"></i>' : ''}
        </div>
    `;
    
    html += validParents.map(cat => `
        <div onclick="selectParentCategory('${cat.id}')" style="display:flex; align-items:center; gap:12px; padding:16px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; background:${cat.id === editCatParentId ? '#f0fdf4' : 'transparent'};">
            <div style="width:32px; height:32px; border-radius:50%; background:${cat.color}20; display:flex; align-items:center; justify-content:center; font-size:16px; color:${cat.color};">${cat.icon}</div>
            <div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">${cat.name}</div>
            ${cat.id === editCatParentId ? '<i class="fas fa-check" style="color:#10b981;"></i>' : ''}
        </div>
    `).join('');
    
    list.innerHTML = html;
    document.getElementById('parentCatPickerOverlay').style.display = 'flex';
}

function closeParentCatPicker() {
    document.getElementById('parentCatPickerOverlay').style.display = 'none';
}

function selectParentCategory(id) {
    editCatParentId = id;
    updateParentCatDisplay();
    closeParentCatPicker();
}

function updateParentCatDisplay() {
    const display = document.getElementById('parentCatNameDisplay');
    if (!display) return;
    
    if (editCatParentId) {
        const cats = userCategories[editCatType] || [];
        const parentCat = cats.find(c => c.id === editCatParentId);
        if (parentCat) {
            display.innerText = parentCat.name;
            display.style.color = '#1f2937';
        } else {
            editCatParentId = null;
            display.innerText = 'Không có';
            display.style.color = '#9ca3af';
        }
    } else {
        display.innerText = 'Không có';
        display.style.color = '#9ca3af';
    }
}

// === SEPAY SYNC LOGIC ===
function openSePaySync() {
    if (!sepayConfig) {
        sepayConfig = { apiToken: '', proxyUrl: '', mappings: [], lastSyncIds: [] };
    }
    document.getElementById('sepayApiToken').value = sepayConfig.apiToken || '';
    document.getElementById('sepayProxyUrl').value = sepayConfig.proxyUrl || '';
    document.getElementById('sepaySyncLog').style.display = 'none';
    renderSePayMappings();
    switchPage('sepay');
}

function saveSePayConfig() {
    sepayConfig.apiToken = document.getElementById('sepayApiToken').value.trim();
    sepayConfig.proxyUrl = document.getElementById('sepayProxyUrl').value.trim();
    syncData();
}

function toggleSePayConfig() {
    const sec = document.getElementById('sepayConfigSection');
    if (sec.style.display === 'none') {
        sec.style.display = 'block';
    } else {
        sec.style.display = 'none';
    }
}

function renderSePayMappings() {
    const list = document.getElementById('sepayMappingList');
    if (!sepayConfig.mappings || sepayConfig.mappings.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:20px; color:#9ca3af; font-size:13px;">Chưa có liên kết ngân hàng nào.</div>';
        return;
    }
    
    let html = '';
    sepayConfig.mappings.forEach((m, index) => {
        const wallet = wallets.find(w => w.id === m.walletId);
        const wName = wallet ? `${wallet.emoji || '💰'} ${wallet.name}` : 'Chưa chọn Ví';
        
        let cName = 'Chưa chọn Nhóm';
        let cIcon = '❓';
        let cColor = '#9ca3af';
        if (m.categoryId) {
            const allCats = [...(userCategories.expense||[]), ...(userCategories.income||[]), ...(userCategories.debt||[])];
            const cat = allCats.find(c => c.id === m.categoryId);
            if (cat) {
                cName = cat.name;
                cIcon = cat.icon;
                cColor = cat.color;
            }
        }

        html += `
            <div class="card" style="padding:16px; margin-bottom:12px; position:relative;">
                <button onclick="removeSePayMapping(${index})" style="position:absolute; top:12px; right:12px; background:none; border:none; color:#ef4444; font-size:16px; cursor:pointer;"><i class="fas fa-trash"></i></button>
                <div style="margin-bottom:12px;">
                    <div style="font-size:11px; color:#9ca3af; text-transform:uppercase; font-weight:600; margin-bottom:4px;">Số tài khoản</div>
                    <input type="text" placeholder="Nhập số tài khoản..." value="${m.bankAcc}" onchange="updateSePayMapping(${index}, 'bankAcc', this.value)" style="width:calc(100% - 30px); border:none; outline:none; border-bottom:1px solid #e5e7eb; padding:4px 0; font-size:15px; font-weight:600; color:#1f2937;">
                </div>
                
                <div style="display:flex; gap:12px;">
                    <div style="flex:1; background:#f9fafb; padding:8px 12px; border-radius:8px; cursor:pointer;" onclick="openSePayWalletPicker(${index})">
                        <div style="font-size:11px; color:#9ca3af; margin-bottom:4px;">Nhập vào Ví</div>
                        <div style="font-size:14px; font-weight:500; color:#1f2937;">${wName}</div>
                    </div>
                    <div style="flex:1; background:#f9fafb; padding:8px 12px; border-radius:8px; cursor:pointer;" onclick="openSePayCategoryPicker(${index})">
                        <div style="font-size:11px; color:#9ca3af; margin-bottom:4px;">Nhóm chi tiêu</div>
                        <div style="font-size:14px; font-weight:500; color:${cColor};"><span style="margin-right:4px;">${cIcon}</span> ${cName}</div>
                    </div>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

function addSePayMapping() {
    if (!sepayConfig.mappings) sepayConfig.mappings = [];
    sepayConfig.mappings.push({ bankAcc: '', walletId: '', categoryId: '' });
    renderSePayMappings();
    syncData();
}

function removeSePayMapping(index) {
    if(confirm('Xóa liên kết này?')) {
        sepayConfig.mappings.splice(index, 1);
        renderSePayMappings();
        syncData();
    }
}

function updateSePayMapping(index, field, value) {
    sepayConfig.mappings[index][field] = value.trim();
    if (field === 'categoryId') {
        retroUpdateSepayTxns(index);
    }
    // Also retro-update walletId for auto-synced txns when wallet mapping changes
    if (field === 'walletId') {
        const map = sepayConfig.mappings[index];
        transactions.forEach(t => {
            if (t.sepayBankAcc && t.sepayBankAcc === map.bankAcc && !t.manuallyEdited) {
                t.walletId = value.trim();
            }
        });
        renderAll();
    }
    syncData();
}

function retroUpdateSepayTxns(mappingIndex) {
    const map = sepayConfig.mappings[mappingIndex];
    if (!map || !map.bankAcc) return;
    
    const allCats = [...(userCategories.expense||[]), ...(userCategories.income||[]), ...(userCategories.debt||[])];
    const cat = allCats.find(c => c.id === map.categoryId);
    
    let updatedCount = 0;
    transactions.forEach(t => {
        if (t.sepayBankAcc && t.sepayBankAcc === map.bankAcc) {
            // Respect manual edits - never overwrite user's manual changes
            if (t.manuallyEdited) return;
            // Income transactions are auto-mapped to "Thu nhập khác", do not overwrite them with expense mapping
            if (t.type === 'income') return;
            if (cat) {
                t.categoryId = cat.id;
                t.category = cat.name;
                t.categoryIcon = cat.icon;
                t.categoryColor = cat.color;
                // Re-determine type from category
                const expCat = (userCategories.expense||[]).find(c => c.id === cat.id);
                const incCat = (userCategories.income||[]).find(c => c.id === cat.id);
                if (expCat) t.type = 'expense';
                else if (incCat) t.type = 'income';
            }
            updatedCount++;
        }
    });
    if (updatedCount > 0) {
        renderAll();
    }
}

let activeSePayMappingIndex = -1;

function openSePayWalletPicker(index) {
    activeSePayMappingIndex = index;
    const list = document.getElementById('txnWalletPickerList');
    if(!list) return;
    
    let html = '';
    wallets.forEach(w => {
        html += `
            <div onclick="selectSePayWallet('${w.id}')" style="display:flex; align-items:center; gap:12px; padding:16px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer;">
                <div style="width:36px; height:36px; border-radius:50%; background:#f3f4f6; display:flex; align-items:center; justify-content:center; font-size:18px;">${w.icon}</div>
                <div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">${w.name}</div>
            </div>
        `;
    });
    list.innerHTML = html;
    document.getElementById('txnWalletPickerOverlay').style.display = 'flex';
}

function selectSePayWallet(id) {
    if (activeSePayMappingIndex !== -1) {
        sepayConfig.mappings[activeSePayMappingIndex].walletId = id;
        renderSePayMappings();
        syncData();
    }
    closeTxnWalletPicker();
}

function openSePayCategoryPicker(index) {
    activeSePayMappingIndex = index;
    const list = document.getElementById('txnCategoryPickerList');
    if(!list) return;
    
    const allCats = [...(userCategories.expense||[]), ...(userCategories.income||[])];
    const currentMapping = sepayConfig.mappings[index];
    const selectedId = currentMapping ? currentMapping.categoryId : null;
    
    list.innerHTML = generateCategoryListHTML(allCats, selectedId, 'selectSePayCategory');
    document.getElementById('txnCategoryPickerOverlay').style.display = 'flex';
}

function selectSePayCategory(id) {
    if (activeSePayMappingIndex !== -1) {
        sepayConfig.mappings[activeSePayMappingIndex].categoryId = id;
        renderSePayMappings();
        syncData();
    }
    closeTxnCategoryPicker();
}

async function runSePaySync() {
    const btn = document.getElementById('btnRunSePaySync');
    const logBox = document.getElementById('sepaySyncLog');
    const apiToken = sepayConfig.apiToken;
    
    if (!apiToken) {
        alert('Vui lòng nhập API Token SePay trước!');
        return;
    }
    if (!sepayConfig.mappings || sepayConfig.mappings.length === 0) {
        alert('Vui lòng thêm ít nhất 1 liên kết ngân hàng!');
        return;
    }

    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...';
        btn.disabled = true;
        logBox.style.display = 'block';
        logBox.innerHTML = 'Đang kết nối SePay qua Proxy...<br>';
        
        let url = 'https://my.sepay.vn/api/transactions/list?limit=50';
        let options = {
            headers: {
                'Authorization': 'Bearer ' + apiToken,
                'Content-Type': 'application/json'
            }
        };

        // If proxy is available, use it to bypass CORS. 
        // We MUST NOT send custom headers to avoid triggering an OPTIONS preflight request.
        if (sepayConfig.proxyUrl) {
            url = `${sepayConfig.proxyUrl}?token=${encodeURIComponent(apiToken)}&limit=50`;
            options = {}; // No custom headers
        }
        
        const res = await fetch(url, options);
        
        if (!res.ok) throw new Error('Lỗi kết nối API SePay. Vui lòng kiểm tra lại API Token.');
        
        const json = await res.json();
        console.log('SePay raw response:', json);
        logBox.innerHTML += `Phản hồi: status=${json.status}, error="${json.error || 'none'}"<br>`;
        
        if (json.status !== 200 && json.status !== '200') throw new Error(json.messages || json.error || 'Lỗi lấy dữ liệu từ SePay');
        
        const records = json.transactions || [];
        logBox.innerHTML += `Tìm thấy ${records.length} giao dịch gần đây.<br>`;
        
        if (!sepayConfig.lastSyncIds) sepayConfig.lastSyncIds = [];
        let newCount = 0;
        
        // SePay returns newest first, we process oldest first for balance integrity
        records.reverse().forEach(tx => {
            const txIdStr = String(tx.id);
            if (sepayConfig.lastSyncIds.includes(txIdStr)) return;
            
            console.log('Processing tx:', tx.id, 'account:', tx.account_number, 'mappings:', sepayConfig.mappings.map(m => m.bankAcc));
            logBox.innerHTML += `TX ${tx.id}: tài khoản="${tx.account_number}"<br>`;
            
            const map = sepayConfig.mappings.find(m => m.bankAcc && m.bankAcc.trim() === String(tx.account_number).trim());
            if (!map) return;
            
            const allCats = [...(userCategories.expense||[]), ...(userCategories.income||[]), ...(userCategories.debt||[])];
            const cat = allCats.find(c => c.id === map.categoryId);
            
            const amountIn = parseFloat(tx.amount_in || 0);
            const amountOut = parseFloat(tx.amount_out || 0);
            const isIncome = amountIn > 0;
            const amount = isIncome ? amountIn : amountOut;
            
            // Determine type: if category is mapped, use its type. Otherwise infer from transaction.
            let type = isIncome ? 'income' : 'expense';
            let finalCatId = null;
            let finalCatName = isIncome ? 'Nạp quỹ' : 'Chưa phân loại';
            let finalCatIcon = isIncome ? '💰' : '💸';
            let finalCatColor = '#9ca3af';

            if (isIncome) {
                // If Income, ignore mapped category and force to "Thu nhập khác"
                type = 'income';
                const incomeCats = userCategories.income || [];
                const otherIncomeCat = incomeCats.find(c => c.name.toLowerCase() === 'thu nhập khác');
                if (otherIncomeCat) {
                    finalCatId = otherIncomeCat.id;
                    finalCatName = otherIncomeCat.name;
                    finalCatIcon = otherIncomeCat.icon;
                    finalCatColor = otherIncomeCat.color;
                } else {
                    finalCatName = 'Thu nhập khác';
                    finalCatIcon = '💵';
                    finalCatColor = '#10b981';
                }
            } else {
                // If Expense, use mapped category
                if (cat) {
                    finalCatId = cat.id;
                    finalCatName = cat.name;
                    finalCatIcon = cat.icon;
                    finalCatColor = cat.color;
                    
                    const expCat = (userCategories.expense||[]).find(c => c.id === cat.id);
                    const incCat = (userCategories.income||[]).find(c => c.id === cat.id);
                    if (expCat) type = 'expense';
                    else if (incCat) type = 'income';
                }
            }
            
            const newTxn = {
                id: 'sepay_' + tx.id,
                walletId: map.walletId || null,
                categoryId: finalCatId,
                sepayBankAcc: map.bankAcc || null,
                manuallyEdited: false, // Auto-synced, can be overwritten by mapping changes
                type: type,
                amount: amount,
                category: finalCatName,
                categoryIcon: finalCatIcon,
                categoryColor: finalCatColor,
                note: tx.transaction_content || 'SePay Sync',
                date: (tx.transaction_date || '').split(' ')[0]
            };
            
            transactions.push(newTxn);
            sepayConfig.lastSyncIds.push(txIdStr);
            
            const w = wallets.find(w => w.id === map.walletId);
            if (w) {
                if (type === 'income') w.balance += amount;
                else w.balance -= amount;
            }
            
            newCount++;
            logBox.innerHTML += `<span style="color:#10b981;">+ ${newTxn.category} (${newTxn.amount.toLocaleString()})</span><br>`;
        });
        
        if (sepayConfig.lastSyncIds.length > 200) {
            sepayConfig.lastSyncIds = sepayConfig.lastSyncIds.slice(sepayConfig.lastSyncIds.length - 200);
        }
        
        syncData();
        renderAll();
        
        logBox.innerHTML += `<strong style="color:#10b981;">Hoàn tất! Đã đồng bộ ${newCount} giao dịch mới.</strong>`;
        
    } catch (e) {
        logBox.innerHTML += `<strong style="color:#ef4444;">Lỗi: ${e.message}</strong>`;
    } finally {
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> Đồng bộ ngay';
        btn.disabled = false;
    }
}
