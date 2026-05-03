// === STATE ===
let wallets = [];
let transactions = [];
let budgets = [];
let isBalanceVisible = true;
let currentTab = 'expense';
let editModeActive = false;
let selectedWalletId = null;
let chartInstance = null;
let selectedIcon = 'ðŸ’°';
let prevPage = 'accounts';
let currentTxnWalletIndex = -1; // -1 = Táº¥t cáº£
let currentPeriodIndex = 3; 

function getTodayStr() {
 đ đ// Correctly get YYYY-MM-DD in local timezone (Vietnam UTC+7)
 đ đconst now = new Date();
 đ đconst offset = now.getTimezoneOffset();
 đ đconst localDate = new Date(now.getTime() - (offset * 60 * 1000));
 đ đreturn localDate.toISOString().split('T')[0];
}

function getLocalDateStr(date) {
 đ đif (!date) return getTodayStr();
 đ đconst d = new Date(date);
 đ đconst offset = d.getTimezoneOffset();
 đ đconst localDate = new Date(d.getTime() - (offset * 60 * 1000));
 đ đreturn localDate.toISOString().split('T')[0];
}

function initCurrentPeriod() {
 đ đconst periods = getPeriods();
 đ đconst now = new Date();
 đ đ// Compare time at midnight for more accuracy
 đ đconst nowTime = now.getTime();
 đ đconst idx = periods.findIndex(p => nowTime >= p.start.getTime() && nowTime <= p.end.getTime() + 86399999);
 đ đif (idx !== -1) currentPeriodIndex = idx;
}
let currentTxnType = 'expense';
let selectedCategory = null;
let settings = {
 đ đdateFormat: 'DD/MM/YYYY',
 đ đtotalCurrency: 'VND',
 đ đfirstDayOfWeek: 'Thá»© Hai',
 đ đfirstDayOfMonth: 1,
 đ đfirstMonthOfYear: 'ThÃ¡ng Má»™t'
};

let sepayConfig = { apiToken: '', proxyUrl: '', mappings: [], lastSyncIds: [] };
let userCategories = {
    expense: [
        { id: 'cat1', name: 'Ăn uống', icon: '🍽️', color: '#f97316' },
        { id: 'cat2', name: 'Di chuyển', icon: '🚗', color: '#3b82f6' },
        { id: 'cat3', name: 'Mua sắm', icon: '🛒', color: '#ec4899' },
        { id: 'cat4', name: 'Nhà cửa', icon: '🏠', color: '#8b5cf6' },
        { id: 'cat5', name: 'Giải trí', icon: '🎡', color: '#f59e0b' }
    ],
    income: [
        { id: 'cat6', name: 'Tiền lương', icon: '💰', color: '#10b981' },
        { id: 'cat7', name: 'Tiền thưởng', icon: '💵', color: '#3b82f6' },
        { id: 'cat8', name: 'Thu nhập khác', icon: '💹', color: '#10b981' }
    ],
    debt: [
        { id: 'cat9', name: 'Cho vay', icon: '📤', color: '#ef4444' },
        { id: 'cat10', name: 'Đi vay', icon: '📥', color: '#10b981' },
        { id: 'cat11', name: 'Thu nợ', icon: '📥', color: '#10b981' },
        { id: 'cat12', name: 'Trả nợ', icon: '📤', color: '#ef4444' }
    ]
};
let receivingInfos = [];

const SETTING_OPTIONS = {
 đ đdateFormat: {
 đ đ đ đtitle: 'Äá»‹nh dáº¡ng thá»i gian',
 đ đ đ đoptions: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD',
 đ đ đ đ đ đ đ đ đ'DD-MM-YYYY', 'MM-DD-YYYY', 'D MMM YYYY']
 đ đ},
 đ đtotalCurrency: {
 đ đ đ đtitle: 'ÄÆ¡n vá»‹ tiá»n cho vÃ­ Tá»•ng',
 đ đ đ đoptions: ['VND', 'USD']
 đ đ},
 đ đfirstDayOfWeek: {
 đ đ đ đtitle: 'Chá»n ngÃ y Ä‘áº§u tuáº§n',
 đ đ đ đoptions: ['Thá»© Hai', 'Thá»© Ba', 'Thá»© TÆ°', 'Thá»© NÄƒm', 'Thá»© SÃ¡u', 'Thá»© Báº£y', 'Chá»§ Nháº­t']
 đ đ},
 đ đfirstDayOfMonth: {
 đ đ đ đtitle: 'Äáº·t ngÃ y Ä‘áº§u tiÃªn cá»§a thÃ¡ng',
 đ đ đ đoptions: Array.from({length: 28}, (_, i) => i + 1)
 đ đ},
 đ đfirstMonthOfYear: {
 đ đ đ đtitle: 'Chá»n thÃ¡ng Ä‘áº§u tiÃªn cá»§a nÄƒm',
 đ đ đ đoptions: ['ThÃ¡ng Má»™t','ThÃ¡ng Hai','ThÃ¡ng Ba','ThÃ¡ng TÆ°','ThÃ¡ng NÄƒm',
 đ đ đ đ đ đ đ đ đ'ThÃ¡ng SÃ¡u','ThÃ¡ng Báº£y','ThÃ¡ng TÃ¡m','ThÃ¡ng ChÃ­n',
 đ đ đ đ đ đ đ đ đ'ThÃ¡ng MÆ°á»i','ThÃ¡ng MÆ°á»i Má»™t','ThÃ¡ng MÆ°á»i Hai']
 đ đ}
};

// === FIREBASE CONFIG ===
const firebaseConfig = {
 đapiKey: "AIzaSyCSVeY2vlUpmSB5hr1uxmWy9bOdj2rZxGA",
 đauthDomain: "financetracker-c7fc1.firebaseapp.com",
 đdatabaseURL: "https://financetracker-c7fc1-default-rtdb.asia-southeast1.firebasedatabase.app",
 đprojectId: "financetracker-c7fc1",
 đstorageBucket: "financetracker-c7fc1.firebasestorage.app",
 đmessagingSenderId: "388608329528",
 đappId: "1:388608329528:web:b7032a895167da72bb23cd",
 đmeasurementId: "G-3SWB22G1TL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();


// === LOCAL STORAGE ===
const STORAGE_KEY = 'finance_flow_data';

function syncData() {
 đ đconst data = { wallets, isBalanceVisible, settings, transactions, userCategories, sepayConfig, receivingInfos, budgets };
 đ đlocalStorage.setItem(STORAGE_KEY, JSON.stringify(data));
 đ đif (database) database.ref('user_data').set(data);
}

function loadData() {
 đ đconst saved = localStorage.getItem(STORAGE_KEY);
 đ đif (saved) {
 đ đ đ đconst data = JSON.parse(saved);
 đ đ đ đwallets = data.wallets || [];
 đ đ đ đtransactions = data.transactions || [];
 đ đ đ đbudgets = data.budgets || [];
 đ đ đ đisBalanceVisible = data.isBalanceVisible !== undefined ? data.isBalanceVisible : true;
 đ đ đ đif (data.settings) {
 đ đ đ đ đ đsettings = { ...settings, ...data.settings };
 đ đ đ đ đ đinitCurrentPeriod();
 đ đ đ đ}
 đ đ đ đif (data.userCategories) userCategories = data.userCategories;
 đ đ đ đsepayConfig = data.sepayConfig || { apiToken: '', proxyUrl: '', mappings: [], lastSyncIds: [] };
 đ đ đ đreceivingInfos = data.receivingInfos || [];
 đ đ đ đrenderAll();
 đ đ}
 đ đ
 đ đif (database) {
 đ đ đ đdatabase.ref('user_data').once('value').then(s => {
 đ đ đ đ đ đconst data = s.val();
 đ đ đ đ đ đif (data) {
 đ đ đ đ đ đ đ đwallets = data.wallets || [];
 đ đ đ đ đ đ đ đtransactions = data.transactions || [];
 đ đ đ đbudgets = data.budgets || [];
 đ đ đ đ đ đ đ đuserCategories = data.userCategories || userCategories;
 đ đ đ đ đ đ đ đsettings = data.settings || settings;
 đ đ đ đ đ đ đ đsepayConfig = data.sepayConfig || sepayConfig;
 đ đ đ đ đ đ đ đreceivingInfos = data.receivingInfos || [];
 đ đ đ đ đ đ đ đrenderAll();
 đ đ đ đ đ đ}
 đ đ đ đ});
 đ đ}
}

// === ICON LIBRARY ===
const ICONS = [
 đ đ'ðŸ’°','ðŸ’³','ðŸ¦','ðŸ’µ','ðŸ’¸','ðŸ’´',
 đ đ'ðŸ·','ðŸŽ¯','âœˆï¸','ðŸš—','ðŸš¢','ðŸš‚',
 đ đ'ðŸ ','ðŸª','ðŸ¥','ðŸ«','ðŸ—ï¸','ðŸ¨',
 đ đ'ðŸ”','â˜•','ðŸ•','ðŸº','ðŸ¥—','ðŸ±',
 đ đ'âš½','ðŸŽ¾','ðŸŠ','ðŸ†','ðŸŽ®','ðŸŽµ',
 đ đ'ðŸ’»','ðŸ“±','ðŸ“º','ðŸ“–','âŒ¨ï¸','ðŸ–¼ï¸',
 đ đ'ðŸ’Š','ðŸ’‰','ðŸ§ ','â¤ï¸','ðŸ’¡','ðŸ”‘',
 đ đ'ðŸŽ','ðŸŽ€','ðŸŽ„','ðŸš€','ðŸŒŸ','â­'
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
 đ đ// Note: Simple sum for now, ignores conversion
 đ đreturn wallets.reduce((sum, w) => sum + (w.excluded ? 0 : w.balance), 0);
}

// === PAGE ROUTING ===
function switchPage(pageName) {
 đ đdocument.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
 đ đconst targetPage = document.getElementById('page-' + pageName);
 đ đif (targetPage) targetPage.classList.add('active');

 đ đ// Update nav active state
 đ đdocument.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
 đ đconst navEl = document.getElementById('nav-' + pageName);
 đ đif (navEl) navEl.classList.add('active');

 đ đ// Hide bottom nav on certain pages
 đ đconst hideNavPages = ['add-transaction', 'add-wallet', 'sepay', 'receiving-info', 'add-receiving', 'add-budget', 'budget-detail'];
 đ đconst nav = document.querySelector('.bottom-nav');
 đ đif (nav) nav.style.display = hideNavPages.includes(pageName) ? 'none' : 'flex';

 đ đrenderAll(true); // Force render when navigating between pages
}

// === RENDER ===
let lastStateHash = "";
function getStateHash() {
 đ đ// Generate a quick hash of the core data state to detect if anything actually changed
 đ đ// This includes wallet balances, txn count, period selection, and UI tab
 đ đconst walletState = wallets.map(w =>  đ${w.id}:${w.balance} đ).join('|');
 đ đconst txnMeta =  đ${transactions.length}:${transactions.length > 0 ? transactions[transactions.length-1].id : ''}:${transactions.filter(t=>t.excluded).length} đ;
 đ đreturn  đ${walletState}#${txnMeta}#${currentPeriodIndex}#${currentTab}#${settings.firstDayOfMonth}#${isBalanceVisible}#${currentTxnWalletIndex} đ;
}

function renderAll(force = false) {
 đ đconst newHash = getStateHash();
 đ đif (!force && newHash === lastStateHash) {
 đ đ đ đreturn; // Skip rendering if state hasn't changed to prevent flicker
 đ đ}
 đ đlastStateHash = newHash;
 đ đ
 đ đrenderHomeWallets();
 đ đrenderAccountsPage();
 đ đrenderSettingsPage();
 đ đrenderTransactionsPage();
 đ đupdateBalanceDisplays();
 đ đrenderChart();
}

function updateBalanceDisplays() {
 đ đconst currency = settings.totalCurrency || 'VND';
 đ đconst total = getTotalBalance();
 đ đconst formatted = formatCurrency(total, currency);
 đ đ// Strip trailing ' Ä‘' for main display if VND since we show 'Ä‘' separately
 đ đdocument.getElementById('mainTotalBalance').innerText = currency === 'VND'
 đ đ đ đ? new Intl.NumberFormat('vi-VN').format(total)
 đ đ đ đ: formatted;
 đ đdocument.getElementById('accountsTotalBalance').innerText = formatted;
}

function renderHomeWallets() {
 đ đconst list = document.getElementById('walletListHome');
 đ đlist.innerHTML = '';
 đ đif (wallets.length === 0) {
 đ đ đ đlist.innerHTML = '<div style="text-align:center; padding:20px; color:#9ca3af; font-size:13px;">ChÆ°a cÃ³ vÃ­ nÃ o. VÃ o <strong>TÃ i khoáº£n</strong> Ä‘á»ƒ thÃªm vÃ­.</div>';
 đ đ đ đreturn;
 đ đ}
 đ đwallets.forEach(w => {
 đ đ đ đlist.innerHTML +=  đ
 đ đ đ đ đ đ<div class="wallet-item">
 đ đ đ đ đ đ đ đ<div class="wallet-info-left">
 đ đ đ đ đ đ đ đ đ đ<div class="wallet-icon ${w.bgClass}">${w.emoji}</div>
 đ đ đ đ đ đ đ đ đ đ<div class="wallet-name">${w.name}</div>
 đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ<div class="wallet-balance">${formatCurrency(w.balance, w.currency || 'VND')}</div>
 đ đ đ đ đ đ</div> đ;
 đ đ});
}

function renderAccountsPage() {
 đ đconst list = document.getElementById('walletListAccounts');
 đ đlist.innerHTML = '';
 đ đif (wallets.length === 0) {
 đ đ đ đlist.innerHTML = '<div style="padding:20px; text-align:center; color:#9ca3af; font-size:13px;">ChÆ°a cÃ³ vÃ­ nÃ o.</div>';
 đ đ đ đreturn;
 đ đ}
 đ đwallets.forEach(w => {
 đ đ đ đlist.innerHTML +=  đ
 đ đ đ đ đ đ<div class="wallet-item" onclick="openEditWallet('${w.id}')" style="cursor:pointer;">
 đ đ đ đ đ đ đ đ<div class="wallet-item-row">
 đ đ đ đ đ đ đ đ đ đ<div class="wallet-left">
 đ đ đ đ đ đ đ đ đ đ đ đ<div class="wallet-icon ${w.bgClass}">${w.emoji}</div>
 đ đ đ đ đ đ đ đ đ đ đ đ<div>
 đ đ đ đ đ đ đ đ đ đ đ đ đ đ<div class="wallet-name">${w.name} ${w.isDefault ? '<span style="font-size:10px; background:#10b981; color:white; padding:2px 6px; border-radius:10px; margin-left:6px; vertical-align:middle;">Máº·c Ä‘á»‹nh</span>' : ''}</div>
 đ đ đ đ đ đ đ đ đ đ đ đ đ đ<div style="font-size:12px; color:#9ca3af;">${formatCurrency(w.balance, w.currency || 'VND')}</div>
 đ đ đ đ đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ</div> đ;
 đ đ});
}
// === SETTINGS PAGE ===
function renderSettingsPage() {
 đ đconst keys = ['dateFormat', 'totalCurrency', 'firstDayOfWeek', 'firstDayOfMonth', 'firstMonthOfYear'];
 đ đkeys.forEach(key => {
 đ đ đ đconst el = document.getElementById('val-' + key);
 đ đ đ đif (el) el.innerText = settings[key];
 đ đ});
}

let currentSettingKey = null;
function openSettingPicker(key) {
 đ đcurrentSettingKey = key;
 đ đconst cfg = SETTING_OPTIONS[key];
 đ đdocument.getElementById('settingPickerTitle').innerText = cfg.title;
 đ đconst list = document.getElementById('settingPickerList');
 đ đlist.innerHTML = '';
 đ đcfg.options.forEach(opt => {
 đ đ đ đconst isActive = String(settings[key]) === String(opt);
 đ đ đ đconst row = document.createElement('div');
 đ đ đ đrow.className = 'setting-option-row' + (isActive ? ' active' : '');
 đ đ đ đrow.innerHTML =  đ<span>${opt}</span>${isActive ? '<i class="fas fa-check check-icon"></i>' : ''} đ;
 đ đ đ đrow.onclick = () => {
 đ đ đ đ đ đsettings[key] = opt;
 đ đ đ đ đ đsyncData();
 đ đ đ đ đ đrenderSettingsPage();
 đ đ đ đ đ đcloseSettingPicker();
 đ đ đ đ};
 đ đ đ đlist.appendChild(row);
 đ đ});
 đ đdocument.getElementById('settingPickerOverlay').style.display = 'flex';
}

function closeSettingPicker() {
 đ đdocument.getElementById('settingPickerOverlay').style.display = 'none';
}

// === SETTINGS PAGE ===

// === TRANSACTIONS PAGE ===
function getPeriods() {
 đ đconst day = parseInt(settings.firstDayOfMonth) || 1;
 đ đconst now = new Date();
 đ đconst periods = [];
 đ đfor (let i = -3; i <= 3; i++) {
 đ đ đ đconst startMonth = now.getMonth() + i;
 đ đ đ đconst startYear = now.getFullYear() + Math.floor(startMonth / 12);
 đ đ đ đconst normStart = ((startMonth % 12) + 12) % 12;
 đ đ đ đconst start = new Date(startYear, normStart, day);
 đ đ đ đconst end = new Date(startYear, normStart + 1, day - 1 < 1 ? 1 : day - 1);
 đ đ đ đif (day === 1) {
 đ đ đ đ đ đend.setMonth(normStart + 1);
 đ đ đ đ đ đend.setDate(0); // last day of start month
 đ đ đ đ}
 đ đ đ đperiods.push({ start, end });
 đ đ}
 đ đreturn periods;
}

function formatDate(d) {
 đ đconst dd = String(d.getDate()).padStart(2,'0');
 đ đconst mm = String(d.getMonth()+1).padStart(2,'0');
 đ đconst yyyy = d.getFullYear();
 đ đreturn  đ${dd}/${mm}/${yyyy} đ;
}

function renderTransactionsPage() {
 đ đ// If no filter selected yet, use default wallet if available
 đ đif (currentTxnWalletIndex === -1 && wallets.length > 0) {
 đ đ đ đconst defaultIdx = wallets.findIndex(w => w.isDefault);
 đ đ đ đif (defaultIdx !== -1) {
 đ đ đ đ đ đcurrentTxnWalletIndex = defaultIdx;
 đ đ đ đ}
 đ đ}

 đ đ// Wallet selector
 đ đconst allWallets = [{id:'all', name:'Táº¥t cáº£', emoji:'ðŸŒ'},...wallets];
 đ đconst idx = currentTxnWalletIndex < 0 ? 0 : currentTxnWalletIndex + 1;
 đ đconst w = allWallets[Math.min(idx, allWallets.length-1)];
 đ đconst walletEl = document.getElementById('txnWalletIcon');
 đ đconst nameEl = document.getElementById('txnWalletName');
 đ đif (walletEl) walletEl.innerText = w.emoji || 'ðŸŒ';
 đ đif (nameEl) nameEl.innerText = w.name;

 đ đ// Balance display
 đ đconst balanceEl = document.getElementById('txnBalance');
 đ đif (balanceEl) {
 đ đ đ đif (currentTxnWalletIndex < 0) {
 đ đ đ đ đ đbalanceEl.innerText = formatCurrency(wallets.reduce((s,x)=>s+x.balance,0), settings.totalCurrency||'VND');
 đ đ đ đ} else if (wallets[currentTxnWalletIndex]) {
 đ đ đ đ đ đconst ww = wallets[currentTxnWalletIndex];
 đ đ đ đ đ đbalanceEl.innerText = formatCurrency(ww.balance, ww.currency||'VND');
 đ đ đ đ}
 đ đ}

 đ đ// Period tabs
 đ đconst periods = getPeriods();
 đ đconst tabsEl = document.getElementById('periodTabs');
 đ đif (tabsEl) {
 đ đ đ đtabsEl.innerHTML = '';
 đ đ đ đperiods.forEach((p, i) => {
 đ đ đ đ đ đconst label =  đ${formatDate(p.start)} - ${formatDate(p.end)} đ;
 đ đ đ đ đ đconst tab = document.createElement('div');
 đ đ đ đ đ đtab.style.cssText =  đ
 đ đ đ đ đ đ đ đflex-shrink:0; padding:10px 14px; font-size:12px; cursor:pointer;
 đ đ đ đ đ đ đ đcolor:${i===currentPeriodIndex ? '#1f2937' : '#9ca3af'};
 đ đ đ đ đ đ đ đfont-weight:${i===currentPeriodIndex ? '700' : '400'};
 đ đ đ đ đ đ đ đborder-bottom:${i===currentPeriodIndex ? '2px solid #1f2937' : '2px solid transparent'};
 đ đ đ đ đ đ đ đwhite-space:nowrap; đ;
 đ đ đ đ đ đtab.innerText = label;
 đ đ đ đ đ đtab.onclick = () => { currentPeriodIndex = i; renderTransactionsPage(); };
 đ đ đ đ đ đtabsEl.appendChild(tab);
 đ đ đ đ});
 đ đ đ đ// Scroll active tab into view
 đ đ đ đconst activeTab = tabsEl.children[currentPeriodIndex];
 đ đ đ đif (activeTab) activeTab.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
 đ đ}

 đ đ// Render transactions
 đ đrenderTxnList(periods[currentPeriodIndex]);
}

function renderTxnList(period) {
 đ đconst listEl = document.getElementById('txnList');
 đ đif (!listEl) return;

 đ đ// Filter by wallet and period
 đ đlet filtered = transactions.filter(t => {
 đ đ đ đconst tDate = new Date(t.date);
 đ đ đ đconst inPeriod = tDate >= period.start && tDate <= period.end;
 đ đ đ đconst inWallet = currentTxnWalletIndex < 0 || t.walletId === (wallets[currentTxnWalletIndex]||{}).id;
 đ đ đ đreturn inPeriod && inWallet;
 đ đ});

 đ đif (filtered.length === 0) {
 đ đ đ đlistEl.innerHTML =  đ<div style="text-align:center; padding:40px 20px; color:#9ca3af; font-size:14px;">
 đ đ đ đ đ đ<div style="font-size:40px; margin-bottom:12px;">ðŸ“‹</div>
 đ đ đ đ đ đChÆ°a cÃ³ giao dá»‹ch nÃ o<br>trong ká»³ nÃ y
 đ đ đ đ</div> đ;
 đ đ đ đreturn;
 đ đ}

 đ đ// Group by date (descending)
 đ đconst groups = {};
 đ đfiltered.forEach(t => {
 đ đ đ đif (!groups[t.date]) groups[t.date] = [];
 đ đ đ đgroups[t.date].push(t);
 đ đ});

 đ đconst DAY_NAMES = ['Chá»§ Nháº­t','Thá»© Hai','Thá»© Ba','Thá»© TÆ°','Thá»© NÄƒm','Thá»© SÃ¡u','Thá»© Báº£y'];
 đ đconst MONTH_NAMES = ['thÃ¡ng 1','thÃ¡ng 2','thÃ¡ng 3','thÃ¡ng 4','thÃ¡ng 5','thÃ¡ng 6','thÃ¡ng 7','thÃ¡ng 8','thÃ¡ng 9','thÃ¡ng 10','thÃ¡ng 11','thÃ¡ng 12'];

 đ đconst sortedDates = Object.keys(groups).sort((a,b) => b.localeCompare(a));
 đ đlet html = '';

 đ đsortedDates.forEach(dateStr => {
 đ đ đ đconst d = new Date(dateStr + 'T00:00:00');
 đ đ đ đconst dayNum = String(d.getDate()).padStart(2,'0');
 đ đ đ đconst dayName = DAY_NAMES[d.getDay()];
 đ đ đ đconst monthName = MONTH_NAMES[d.getMonth()];
 đ đ đ đconst year = d.getFullYear();
 đ đ đ đconst txns = groups[dateStr];
 đ đ đ đconst dayTotal = txns.reduce((s,t) => s + (t.type==='income' ? t.amount : -t.amount), 0);
 đ đ đ đconst totalColor = dayTotal >= 0 ? '#3b82f6' : '#ef4444';
 đ đ đ đconst totalStr = (dayTotal >= 0 ? '+' : '') + new Intl.NumberFormat('vi-VN').format(dayTotal);

 đ đ đ đlet txnRows = txns.map(t => {
 đ đ đ đ đ đconst amtColor = t.type === 'income' ? '#3b82f6' : '#ef4444';
 đ đ đ đ đ đconst amtStr = new Intl.NumberFormat('vi-VN').format(t.amount);
 đ đ đ đ đ đreturn  đ
 đ đ đ đ đ đ<div onclick="openEditTransaction('${t.id}')" style="display:flex; align-items:center; gap:12px; padding:12px 16px; border-top:1px solid #f3f4f6; cursor:pointer;">
 đ đ đ đ đ đ đ đ<div style="width:38px;height:38px;border-radius:50%;background:${t.categoryColor||'#9ca3af'};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${t.categoryIcon||'ðŸ’¸'}</div>
 đ đ đ đ đ đ đ đ<div style="flex:1; min-width:0;">
 đ đ đ đ đ đ đ đ đ đ<div style="font-size:14px;font-weight:600;color:#1f2937;">${t.category||'KhÃ¡c'}</div>
 đ đ đ đ đ đ đ đ đ đ${t.note ?  đ<div style="font-size:12px;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.note}</div> đ : ''}
 đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ<div style="font-size:15px;font-weight:600;color:${amtColor};white-space:nowrap;">${amtStr}</div>
 đ đ đ đ đ đ</div> đ;
 đ đ đ đ}).join('');

 đ đ đ đhtml +=  đ
 đ đ đ đ<div style="background:white; border-radius:14px; margin-bottom:10px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.05);">
 đ đ đ đ đ đ<div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px 8px;">
 đ đ đ đ đ đ đ đ<div style="display:flex; align-items:baseline; gap:10px;">
 đ đ đ đ đ đ đ đ đ đ<span style="font-size:28px;font-weight:700;color:#1f2937;">${dayNum}</span>
 đ đ đ đ đ đ đ đ đ đ<div>
 đ đ đ đ đ đ đ đ đ đ đ đ<div style="font-size:13px;font-weight:600;color:#6b7280;">${dayName}</div>
 đ đ đ đ đ đ đ đ đ đ đ đ<div style="font-size:11px;color:#9ca3af;">${monthName} ${year}</div>
 đ đ đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ<div style="font-size:14px;font-weight:600;color:${totalColor};">${totalStr}</div>
 đ đ đ đ đ đ</div>
 đ đ đ đ đ đ${txnRows}
 đ đ đ đ</div> đ;
 đ đ});

 đ đlistEl.innerHTML = html;
}

function openSelectWalletPage() {
 đ đrenderSelectWalletList();
 đ đswitchPage('select-wallet');
}

function renderSelectWalletList() {
 đ đconst list = document.getElementById('selectWalletList');
 đ đif (!list) return;

 đ đconst totalBalance = getTotalBalance();
 đ đconst currency = settings.totalCurrency || 'VND';

 đ đlet html =  đ
 đ đ đ đ<div class="card" style="padding:0; border-radius:12px; background:white; overflow:hidden; margin-bottom:16px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
 đ đ đ đ đ đ<div style="display:flex; align-items:center; padding:16px; cursor:pointer; background:${currentTxnWalletIndex === -1 ? '#f0fdf4' : 'white'};" onclick="selectTxnWalletFilter(-1)">
 đ đ đ đ đ đ đ đ<div style="width:44px; height:44px; border-radius:50%; background:#e5e7eb; display:flex; align-items:center; justify-content:center; font-size:24px; margin-right:12px;">ðŸŒ</div>
 đ đ đ đ đ đ đ đ<div style="flex:1;">
 đ đ đ đ đ đ đ đ đ đ<div style="font-size:16px; font-weight:700; color:#000;">Tá»•ng cá»™ng</div>
 đ đ đ đ đ đ đ đ đ đ<div style="font-size:13px; color:#6b7280;">${new Intl.NumberFormat('vi-VN').format(totalBalance)} ${currency}</div>
 đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ${currentTxnWalletIndex === -1 ? '<i class="fas fa-check" style="color:#10b981;"></i>' : ''}
 đ đ đ đ đ đ</div>
 đ đ đ đ</div>
 đ đ đ đ<div style="font-size:11px; color:#9ca3af; font-weight:600; margin-bottom:8px; padding-left:4px; letter-spacing:0.5px; text-transform:uppercase;">TÃNH VÃ€O Tá»”NG</div>
 đ đ đ đ<div class="card" style="padding:0; border-radius:12px; background:white; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
 đ đ đ;

 đ đwallets.forEach((w, idx) => {
 đ đ đ đconst isSelected = currentTxnWalletIndex === idx;
 đ đ đ đhtml +=  đ
 đ đ đ đ đ đ<div style="display:flex; align-items:center; padding:16px; cursor:pointer; border-bottom:${idx === wallets.length - 1 ? 'none' : '1px solid #f3f4f6'}; background:${isSelected ? '#f0fdf4' : 'white'};" onclick="selectTxnWalletFilter(${idx})">
 đ đ đ đ đ đ đ đ<div style="width:40px; height:40px; border-radius:50%; background:${w.bgClass || '#3b82f6'}; display:flex; align-items:center; justify-content:center; font-size:20px; margin-right:12px; color:white;">${w.emoji || 'ðŸ’°'}</div>
 đ đ đ đ đ đ đ đ<div style="flex:1;">
 đ đ đ đ đ đ đ đ đ đ<div style="font-size:15px; font-weight:600; color:#000;">${w.name}</div>
 đ đ đ đ đ đ đ đ đ đ<div style="font-size:13px; color:#6b7280;">${new Intl.NumberFormat('vi-VN').format(w.balance)} ${w.currency || 'VND'}</div>
 đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ${isSelected ? '<i class="fas fa-check" style="color:#10b981;"></i>' : ''}
 đ đ đ đ đ đ</div>
 đ đ đ đ đ;
 đ đ});

 đ đhtml +=  đ</div> đ;
 đ đlist.innerHTML = html;
}

function selectTxnWalletFilter(index) {
 đ đcurrentTxnWalletIndex = index;
 đ đswitchPage('transactions');
}

// === ADD TRANSACTION ===
let txnSelectedWalletId = null;

function openAddTransaction() {
 đ đcurrentTxnType = 'expense';
 đ đselectedCategory = null;
 đ đconst defaultWallet = wallets.find(w => w.isDefault);
 đ đtxnSelectedWalletId = defaultWallet ? defaultWallet.id : (wallets.length > 0 ? wallets[0].id : null);
 đ đ
 đ đdocument.getElementById('editTxnId').value = '';
 đ đdocument.getElementById('txnAmount').value = '';
 đ đdocument.getElementById('txnNote').value = '';
 đ đdocument.getElementById('txnDate').value = getTodayStr();
 đ đdocument.getElementById('txnExclude').checked = false;
 đ đdocument.getElementById('deleteTxnRow').style.display = 'none';
 đ đ
 đ đsetTxnType('expense');
 đ đupdateTxnDateDisplay();
 đ đupdateSelectedWalletDisplay();
 đ đupdateSelectedCategoryDisplay();
 đ đcheckTxnValid();
 đ đ
 đ đswitchPage('add-transaction');
}

function openEditTransaction(id) {
 đ đconst t = transactions.find(x => x.id === id);
 đ đif (!t) return;
 đ đ
 đ đcurrentTxnType = t.type;
 đ đ
 đ đ// Prioritize categoryId to find the real category object
 đ đconst allCats = [...(userCategories.expense||[]), ...(userCategories.income||[]), ...(userCategories.debt||[])];
 đ đconst realCat = allCats.find(c => c.id === t.categoryId);
 đ đ
 đ đif (realCat) {
 đ đ đ đselectedCategory = realCat;
 đ đ} else {
 đ đ đ đselectedCategory = { name: t.category, icon: t.categoryIcon, color: t.categoryColor };
 đ đ}
 đ đ
 đ đtxnSelectedWalletId = t.walletId;
 đ đ
 đ đdocument.getElementById('editTxnId').value = t.id;
 đ đdocument.getElementById('txnAmount').value = new Intl.NumberFormat('vi-VN').format(t.amount);
 đ đdocument.getElementById('txnNote').value = t.note || '';
 đ đdocument.getElementById('txnDate').value = t.date;
 đ đdocument.getElementById('txnExclude').checked = t.excluded || false;
 đ đdocument.getElementById('deleteTxnRow').style.display = 'block';
 đ đ
 đ đsetTxnType(t.type, false);
 đ đupdateTxnDateDisplay();
 đ đupdateSelectedWalletDisplay();
 đ đupdateSelectedCategoryDisplay();
 đ đcheckTxnValid();
 đ đ
 đ đswitchPage('add-transaction');
}

function closeAddTransaction() {
 đ đswitchPage('transactions');
}

function setTxnType(type, clearCategory = true) {
 đ đcurrentTxnType = type;
 đ đ
 đ đconst expBtn = document.getElementById('typeExpenseBtn');
 đ đconst incBtn = document.getElementById('typeIncomeBtn');
 đ đconst debtBtn = document.getElementById('typeDebtBtn');
 đ đ
 đ đconst colors = { expense: '#ef4444', income: '#10b981', debt: '#8b5cf6' };
 đ đconst activeBg = colors[type];
 đ đ
 đ đconst activeStyle = (bg) =>  đflex:1; padding:8px 0; border:none; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; background:${bg}; color:white; box-shadow:0 1px 3px rgba(0,0,0,0.15); đ;
 đ đconst inactiveStyle =  đflex:1; padding:8px 0; border:none; border-radius:6px; font-size:13px; font-weight:500; cursor:pointer; background:transparent; color:#6b7280; box-shadow:none; đ;
 đ đ
 đ đif (expBtn) expBtn.style.cssText = type === 'expense' ? activeStyle('#ef4444') : inactiveStyle;
 đ đif (incBtn) incBtn.style.cssText = type === 'income' ? activeStyle('#10b981') : inactiveStyle;
 đ đif (debtBtn) debtBtn.style.cssText = type === 'debt' ? activeStyle('#8b5cf6') : inactiveStyle;
 đ đ
 đ đif (clearCategory) {
 đ đ đ đselectedCategory = null;
 đ đ}
 đ đupdateSelectedCategoryDisplay();
 đ đcheckTxnValid();
}

function updateTxnDateDisplay() {
 đ đconst dateVal = document.getElementById('txnDate').value;
 đ đif (!dateVal) return;
 đ đ
 đ đconst d = new Date(dateVal);
 đ đconst today = new Date();
 đ đ
 đ đconst isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
 đ đ
 đ đif (isToday) {
 đ đ đ đdocument.getElementById('txnDateDisplay').innerText = 'HÃ´m nay';
 đ đ} else {
 đ đ đ đconst DAY_NAMES = ['Chá»§ Nháº­t','Thá»© Hai','Thá»© Ba','Thá»© TÆ°','Thá»© NÄƒm','Thá»© SÃ¡u','Thá»© Báº£y'];
 đ đ đ đconst dd = String(d.getDate()).padStart(2, '0');
 đ đ đ đconst mm = String(d.getMonth() + 1).padStart(2, '0');
 đ đ đ đconst yyyy = d.getFullYear();
 đ đ đ đdocument.getElementById('txnDateDisplay').innerText =  đ${DAY_NAMES[d.getDay()]}, ${dd}/${mm}/${yyyy} đ;
 đ đ}
}

function changeTxnDate(delta) {
 đ đconst dateInput = document.getElementById('txnDate');
 đ đif (!dateInput.value) return;
 đ đ
 đ đconst d = new Date(dateInput.value);
 đ đd.setDate(d.getDate() + delta);
 đ đdateInput.value = getLocalDateStr(d);
 đ đupdateTxnDateDisplay();
}

function updateSelectedWalletDisplay() {
 đ đconst w = wallets.find(x => x.id === txnSelectedWalletId);
 đ đconst iconEl = document.getElementById('selectedWalletIconTxn');
 đ đconst nameEl = document.getElementById('selectedWalletNameTxn');
 đ đconst currEl = document.getElementById('txnCurrencyLabel');
 đ đ
 đ đif (w) {
 đ đ đ đif(iconEl) iconEl.innerText = w.emoji || 'ðŸ’°';
 đ đ đ đif(nameEl) {
 đ đ đ đ đ đnameEl.innerText = w.name;
 đ đ đ đ đ đnameEl.style.color = '#000';
 đ đ đ đ}
 đ đ đ đif(currEl) currEl.innerText = w.currency || 'VND';
 đ đ} else {
 đ đ đ đif(iconEl) iconEl.innerText = 'ðŸ’°';
 đ đ đ đif(nameEl) {
 đ đ đ đ đ đnameEl.innerText = 'Chá»n vÃ­';
 đ đ đ đ đ đnameEl.style.color = '#9ca3af';
 đ đ đ đ}
 đ đ đ đif(currEl) currEl.innerText = settings.totalCurrency || 'VND';
 đ đ}
}

function updateSelectedCategoryDisplay() {
 đ đconst iconEl = document.getElementById('selectedCatIconTxn');
 đ đconst nameEl = document.getElementById('selectedCatNameTxn');
 đ đ
 đ đif (selectedCategory) {
 đ đ đ đif(iconEl) {
 đ đ đ đ đ điconEl.innerText = selectedCategory.icon;
 đ đ đ đ đ điconEl.style.background = selectedCategory.color;
 đ đ đ đ}
 đ đ đ đif(nameEl) {
 đ đ đ đ đ đnameEl.innerText = selectedCategory.name;
 đ đ đ đ đ đnameEl.style.color = '#000';
 đ đ đ đ}
 đ đ} else {
 đ đ đ đif(iconEl) {
 đ đ đ đ đ điconEl.innerText = '';
 đ đ đ đ đ điconEl.style.background = '#e5e7eb';
 đ đ đ đ}
 đ đ đ đif(nameEl) {
 đ đ đ đ đ đnameEl.innerText = 'Chá»n nhÃ³m';
 đ đ đ đ đ đnameEl.style.color = '#9ca3af';
 đ đ đ đ}
 đ đ}
}

function openTxnWalletPicker() {
 đ đconst list = document.getElementById('txnWalletPickerList');
 đ đif (!list) return;
 đ đ
 đ đlist.innerHTML = wallets.map(w =>  đ
 đ đ đ đ<div onclick="selectTxnWallet('${w.id}')" style="display:flex; align-items:center; gap:12px; padding:16px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; background:${w.id === txnSelectedWalletId ? '#f0fdf4' : 'transparent'};">
 đ đ đ đ đ đ<div style="font-size:24px;">${w.emoji||'ðŸ’°'}</div>
 đ đ đ đ đ đ<div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">${w.name}</div>
 đ đ đ đ đ đ${w.id === txnSelectedWalletId ? '<i class="fas fa-check" style="color:#10b981;"></i>' : ''}
 đ đ đ đ</div>
 đ đ đ).join('');
 đ đ
 đ đdocument.getElementById('txnWalletPickerOverlay').style.display = 'flex';
}

function closeTxnWalletPicker() {
 đ đdocument.getElementById('txnWalletPickerOverlay').style.display = 'none';
}

function selectTxnWallet(id) {
 đ đtxnSelectedWalletId = id;
 đ đupdateSelectedWalletDisplay();
 đ đcloseTxnWalletPicker();
 đ đcheckTxnValid();
}

function generateCategoryListHTML(cats, selectedId, clickHandlerName) {
 đ đif (!cats || cats.length === 0) return '<div style="padding:20px; text-align:center; color:#9ca3af; font-size:13px;">ChÆ°a cÃ³ nhÃ³m nÃ o.</div>';

 đ đconst parents = cats.filter(c => !c.parentId);
 đ đconst children = cats.filter(c => c.parentId);
 đ đconst orphans = children.filter(c => !cats.find(p => p.id === c.parentId));

 đ đlet html = '';
 đ đconst allItems = [];

 đ đparents.forEach(parent => {
 đ đ đ đconst myChildren = children.filter(c => c.parentId === parent.id);
 đ đ đ đallItems.push({ cat: parent, isChild: false, childCount: myChildren.length });
 đ đ đ đmyChildren.forEach(child => allItems.push({ cat: child, isChild: true, parentName: parent.name }));
 đ đ});
 đ đorphans.forEach(child => allItems.push({ cat: child, isChild: true, parentName: '(KhÃ´ng cÃ³ nhÃ³m cha)' }));

 đ đallItems.forEach((item, idx) => {
 đ đ đ đconst { cat, isChild, childCount, parentName } = item;
 đ đ đ đconst isLast = idx === allItems.length - 1;
 đ đ đ đconst isSelected = selectedId === cat.id || selectedId === cat.name;

 đ đ đ đlet subtitle = '';
 đ đ đ đif (isChild) {
 đ đ đ đ đ đsubtitle =  đ<div style="font-size:12px; color:#6b7280; margin-top:1px;">${parentName}</div> đ;
 đ đ đ đ} else if (childCount > 0) {
 đ đ đ đ đ đsubtitle =  đ<div style="font-size:12px; color:#9ca3af; margin-top:1px;">${childCount} nhÃ³m con</div> đ;
 đ đ đ đ}

 đ đ đ đconst indent = isChild ? 'padding-left:28px;' : '';
 đ đ đ đconst iconSize = isChild ? '34px' : '40px';
 đ đ đ đconst fontSize = isChild ? '17px' : '20px';
 đ đ đ đconst nameSize = isChild ? '14px' : '15px';
 đ đ đ đconst nameWeight = isChild ? '400' : '500';
 đ đ đ đ
 đ đ đ đlet bgColor = isChild ? '#fafafa' : 'white';
 đ đ đ đlet borderColor = isLast ? 'none' : '1px solid #f3f4f6';
 đ đ đ đlet checkMark = '';
 đ đ đ đ
 đ đ đ đif (isSelected) {
 đ đ đ đ đ đbgColor = cat.color + '15';
 đ đ đ đ đ đcheckMark =  đ<i class="fas fa-check" style="color:${cat.color}; font-size:16px;"></i> đ;
 đ đ đ đ}

 đ đ đ đlet onClickAttr = '';
 đ đ đ đif (clickHandlerName === 'selectCategory') {
 đ đ đ đ đ đonClickAttr =  đonclick="selectCategory(${JSON.stringify(cat).replace(/"/g,'&quot;')})" đ;
 đ đ đ đ} else if (clickHandlerName === 'selectSePayCategory') {
 đ đ đ đ đ đonClickAttr =  đonclick="selectSePayCategory('${cat.id}')" đ;
 đ đ đ đ}

 đ đ đ đhtml +=  đ
 đ đ đ đ đ đ<div ${onClickAttr} style="display:flex; align-items:center; padding:12px 16px; ${indent} border-bottom:${borderColor}; cursor:pointer; background:${bgColor}; transition:0.15s;">
 đ đ đ đ đ đ đ đ<div style="width:${iconSize}; height:${iconSize}; border-radius:50%; background:${cat.color}20; display:flex; align-items:center; justify-content:center; font-size:${fontSize}; margin-right:12px; color:${cat.color}; flex-shrink:0;">${cat.icon}</div>
 đ đ đ đ đ đ đ đ<div style="flex:1; min-width:0;">
 đ đ đ đ đ đ đ đ đ đ<div style="font-size:${nameSize}; font-weight:${nameWeight}; color:#1f2937;">${cat.name}</div>
 đ đ đ đ đ đ đ đ đ đ${subtitle}
 đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ${checkMark}
 đ đ đ đ đ đ</div>
 đ đ đ đ đ;
 đ đ});

 đ đreturn html;
}

function openTxnCategoryPicker() {
 đ đconst list = document.getElementById('txnCategoryPickerList');
 đ đif (!list) return;
 đ đ
 đ đconst cats = userCategories[currentTxnType] || [];
 đ đconst selectedId = selectedCategory ? selectedCategory.name : null;
 đ đ
 đ đlist.innerHTML = generateCategoryListHTML(cats, selectedId, 'selectCategory');
 đ đ
 đ đdocument.getElementById('txnCategoryPickerOverlay').style.display = 'flex';
}

function closeTxnCategoryPicker() {
 đ đdocument.getElementById('txnCategoryPickerOverlay').style.display = 'none';
}

function selectCategory(cat) {
 đ đif (window.isPickingForBudget) {
 đ đ đ đdocument.getElementById('budgetCatId').value = cat.id;
 đ đ đ đdocument.getElementById('budgetCategoryName').innerText = cat.name;
 đ đ đ đdocument.getElementById('budgetCategoryIcon').innerHTML = cat.icon;
 đ đ đ đdocument.getElementById('budgetCategoryIcon').style.background = cat.color;
 đ đ đ đdocument.getElementById('budgetCategoryIcon').style.color = 'white';
 đ đ đ đcloseTxnCategoryPicker();
 đ đ đ đwindow.isPickingForBudget = false;
 đ đ} else {
 đ đ đ đselectedCategory = cat;
 đ đ đ đupdateSelectedCategoryDisplay();
 đ đ đ đcloseTxnCategoryPicker();
 đ đ đ đcheckTxnValid();
 đ đ}
}
function checkTxnValid() {
 đ đconst amountStr = document.getElementById('txnAmount').value.replace(/\./g, '').replace(/,/g, '');
 đ đconst amount = parseFloat(amountStr) || 0;
 đ đconst isValid = amount > 0 && txnSelectedWalletId && selectedCategory;
 đ đ
 đ đconst btn = document.getElementById('saveTxnBtn');
 đ đif (btn) {
 đ đ đ đif (isValid) {
 đ đ đ đ đ đbtn.style.background = '#10b981';
 đ đ đ đ đ đbtn.disabled = false;
 đ đ đ đ} else {
 đ đ đ đ đ đbtn.style.background = '#d1d5db';
 đ đ đ đ đ đbtn.disabled = true;
 đ đ đ đ}
 đ đ}
}

function saveTransaction() {
 đ đconst id = document.getElementById('editTxnId').value;
 đ đconst amountStr = document.getElementById('txnAmount').value.replace(/\./g, '').replace(/,/g, '');
 đ đconst amount = parseFloat(amountStr) || 0;
 đ đconst note = document.getElementById('txnNote').value.trim();
 đ đconst date = document.getElementById('txnDate').value;
 đ đconst walletId = txnSelectedWalletId;
 đ đconst excluded = document.getElementById('txnExclude').checked;
 đ đ
 đ đif (!amount || !date || !walletId || !selectedCategory) return;

 đ đconst isIncome = currentTxnType === 'income' || (currentTxnType === 'debt' && (selectedCategory.name === 'Äi vay' || selectedCategory.name === 'Thu ná»£'));

 đ đconst oldTxn = id ? transactions.find(t => t.id === id) : null;

 đ đconst txn = {
 đ đ đ đid: id || 'txn_' + Date.now(),
 đ đ đ đwalletId, type: currentTxnType,
 đ đ đ đcategoryId: selectedCategory.id || (oldTxn ? (oldTxn.categoryId || null) : null),
 đ đ đ đsepayBankAcc: oldTxn ? (oldTxn.sepayBankAcc || null) : null,
 đ đ đ đmanuallyEdited: true, // Mark as manually edited - never auto-overwrite
 đ đ đ đamount, category: selectedCategory.name, categoryIcon: selectedCategory.icon, categoryColor: selectedCategory.color,
 đ đ đ đnote, date, excluded
 đ đ};

 đ đif (id) {
 đ đ đ đconst oldTxn = transactions.find(t => t.id === id);
 đ đ đ đif (oldTxn) {
 đ đ đ đ đ đconst oldIsIncome = oldTxn.type === 'income' || (oldTxn.type === 'debt' && (oldTxn.category === 'Äi vay' || oldTxn.category === 'Thu ná»£'));
 đ đ đ đ đ đconst w = wallets.find(x => x.id === oldTxn.walletId);
 đ đ đ đ đ đif (w) w.balance += oldIsIncome ? -oldTxn.amount : oldTxn.amount;
 đ đ đ đ}
 đ đ đ đtransactions = transactions.filter(t => t.id !== id);
 đ đ}

 đ đconst targetWallet = wallets.find(x => x.id === walletId);
 đ đif (targetWallet) {
 đ đ đ đtargetWallet.balance += isIncome ? amount : -amount;
 đ đ}
 đ đ
 đ đtransactions.push(txn);
 đ đ
 đ đ// Only notify if it's a new transaction
 đ đif (!id) {
 đ đ đ đsendTelegramNotification(txn, targetWallet);
 đ đ}
 đ đ
 đ đsyncData();
 đ đrenderAll();
 đ đcheckBudgetsThreshold(txn);
 đ đshowToast('Đã lưu giao dịch!', 'success');
 đ đswitchPage('transactions');
}

function deleteTransaction() {
 đ đconst id = document.getElementById('editTxnId').value;
 đ đif (!id || !confirm('XÃ³a giao dá»‹ch nÃ y?')) return;
 đ đconst t = transactions.find(x => x.id === id);
 đ đif (t) {
 đ đ đ đconst isIncome = t.type === 'income' || (t.type === 'debt' && (t.category === 'Äi vay' || t.category === 'Thu ná»£'));
 đ đ đ đconst w = wallets.find(x => x.id === t.walletId);
 đ đ đ đif (w) w.balance += isIncome ? -t.amount : t.amount;
 đ đ}
 đ đtransactions = transactions.filter(x => x.id !== id);
 đ đsyncData();
 đ đrenderAll();
 đ đcheckBudgetsThreshold(txn);
 đ đshowToast('Đã lưu giao dịch!', 'success');
 đ đswitchPage('transactions');
}

// === ADD WALLET PAGE ===
function openAddWallet() {
 đ đprevPage = document.querySelector('.page.active')?.id.replace('page-','') || 'accounts';
 đ đselectedIcon = 'ðŸ’°';
 đ đdocument.getElementById('addWalletPageTitle').innerText = 'ThÃªm VÃ­';
 đ đdocument.getElementById('editWalletId').value = '';
 đ đdocument.getElementById('walletName').value = '';
 đ đdocument.getElementById('walletBalance').value = '0';
 đ đdocument.getElementById('walletCurrency').value = 'VND';
 đ đdocument.getElementById('walletExclude').checked = false;
 đ đdocument.getElementById('walletDefault').checked = false;
 đ đdocument.getElementById('walletIconPreview').innerHTML =  đ${selectedIcon} <i class="fas fa-chevron-up" style="font-size:9px;color:#aaa"></i> đ;
 đ đdocument.getElementById('deleteWalletRow').style.display = 'none';
 đ đswitchPage('add-wallet');
}

function openEditWallet(id) {
 đ đconst w = wallets.find(x => x.id === id);
 đ đif (!w) return;
 đ đprevPage = 'accounts';
 đ đselectedIcon = w.emoji || 'ðŸ’°';
 đ đdocument.getElementById('addWalletPageTitle').innerText = 'Sá»­a VÃ­';
 đ đdocument.getElementById('editWalletId').value = w.id;
 đ đdocument.getElementById('walletName').value = w.name;
 đ đdocument.getElementById('walletBalance').value = new Intl.NumberFormat('vi-VN').format(w.balance);
 đ đdocument.getElementById('walletCurrency').value = w.currency || 'VND';
 đ đdocument.getElementById('walletExclude').checked = w.excluded || false;
 đ đdocument.getElementById('walletDefault').checked = w.isDefault || false;
 đ đdocument.getElementById('walletIconPreview').innerHTML =  đ${selectedIcon} <i class="fas fa-chevron-up" style="font-size:9px;color:#aaa"></i> đ;
 đ đdocument.getElementById('deleteWalletRow').style.display = 'block';
 đ đswitchPage('add-wallet');
}

function closeAddWalletPage() {
 đ đswitchPage(prevPage);
}

function saveWallet() {
 đ đconst id = document.getElementById('editWalletId').value;
 đ đconst name = document.getElementById('walletName').value.trim();
 đ đconst balanceStr = document.getElementById('walletBalance').value.replace(/\./g, '').replace(/,/g, '');
 đ đconst balance = parseFloat(balanceStr) || 0;
 đ đconst currency = document.getElementById('walletCurrency').value;
 đ đconst excluded = document.getElementById('walletExclude').checked;
 đ đconst isDefault = document.getElementById('walletDefault').checked;
 đ đif (!name) {
 đ đ đ đdocument.getElementById('walletName').focus();
 đ đ đ đreturn;
 đ đ}
 đ đ
 đ đif (isDefault) {
 đ đ đ đwallets.forEach(w => w.isDefault = false);
 đ đ}
 đ đ
 đ đif (id) {
 đ đ đ đconst w = wallets.find(x => x.id === id);
 đ đ đ đif (w) { w.name = name; w.balance = balance; w.emoji = selectedIcon; w.excluded = excluded; w.isDefault = isDefault; w.currency = currency; }
 đ đ} else {
 đ đ đ đwallets.push({ id: 'w' + Date.now(), name, balance, emoji: selectedIcon, bgClass: 'icon-cash', excluded, isDefault, currency });
 đ đ}
 đ đsyncData();
 đ đswitchPage(prevPage);
 đ đrenderAll();
}

function handleDefaultWalletChange(checkbox) {
 đ đif (checkbox.checked) {
 đ đ đ đconst currentDefault = wallets.find(w => w.isDefault);
 đ đ đ đconst editId = document.getElementById('editWalletId').value;
 đ đ đ đif (currentDefault && currentDefault.id !== editId) {
 đ đ đ đ đ đconst confirmChange = confirm( đVÃ­ "${currentDefault.name}" Ä‘ang lÃ  vÃ­ máº·c Ä‘á»‹nh. Báº¡n cÃ³ muá»‘n Ä‘á»•i sang vÃ­ nÃ y khÃ´ng? đ);
 đ đ đ đ đ đif (!confirmChange) {
 đ đ đ đ đ đ đ đcheckbox.checked = false;
 đ đ đ đ đ đ}
 đ đ đ đ}
 đ đ}
}

function deleteWallet() {
 đ đconst id = document.getElementById('editWalletId').value;
 đ đif (!id || !confirm('XÃ³a vÃ­ nÃ y?')) return;
 đ đwallets = wallets.filter(w => w.id !== id);
 đ đif (selectedWalletId === id) selectedWalletId = null;
 đ đsyncData();
 đ đswitchPage('accounts');
 đ đrenderAll();
}

// === ICON PICKER ===
let iconTarget = 'wallet';

function openIconPicker() {
 đ điconTarget = 'wallet';
 đ đrenderIconGrid();
 đ đdocument.getElementById('iconPickerOverlay').style.display = 'flex';
}

function openIconPickerForCat() {
 đ điconTarget = 'category';
 đ đrenderIconGrid();
 đ đdocument.getElementById('iconPickerOverlay').style.display = 'flex';
}

function renderIconGrid() {
 đ đconst grid = document.getElementById('iconGrid');
 đ đif (!grid) return;
 đ đgrid.innerHTML = ICONS.map(icon =>  đ
 đ đ đ đ<div class="icon-grid-item ${icon === selectedIcon ? 'selected' : ''}" onclick="selectIcon('${icon}')">
 đ đ đ đ đ đ${icon}
 đ đ đ đ</div>
 đ đ đ).join('');
}

function selectIcon(icon) {
 đ đselectedIcon = icon;
 đ đif (iconTarget === 'wallet') {
 đ đ đ đconst preview = document.getElementById('walletIconPreview');
 đ đ đ đif (preview) preview.innerHTML =  đ${icon} <i class="fas fa-chevron-up" style="font-size:9px;color:#aaa"></i> đ;
 đ đ} else if (iconTarget === 'category') {
 đ đ đ đconst preview = document.getElementById('catIconPreview');
 đ đ đ đif (preview) preview.innerText = icon;
 đ đ}
 đ đcloseIconPicker();
}

function closeIconPicker() {
 đ đdocument.getElementById('iconPickerOverlay').style.display = 'none';
}

// === INTERACTIONS ===
function toggleBalance() {
 đ đisBalanceVisible = !isBalanceVisible;
 đ đdocument.getElementById('toggleBalanceBtn').className = isBalanceVisible ? 'fas fa-eye' : 'fas fa-eye-slash';
 đ đsyncData();
 đ đrenderAll();
}

function switchTab(tab) {
 đ đcurrentTab = tab;
 đ đdocument.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
 đ đconst idx = tab === 'expense' ? 0 : 1;
 đ đdocument.querySelectorAll('.tab')[idx].classList.add('active');
 đ đrenderChart();
}

// === CHART ===
function renderChart() {
 đ đconst ctx = document.getElementById('reportChart');
 đ đif (!ctx) return;
 đ đif (chartInstance) { chartInstance.destroy(); chartInstance = null; }

 đ đ// Get periods
 đ đconst periods = getPeriods();
 đ đ
 đ đ// Logic: If on Home page, always show the period containing Today.
 đ đ// If on Transactions page, show the selected currentPeriodIndex.
 đ đlet activeIdx = currentPeriodIndex;
 đ đconst now = new Date();
 đ đconst nowTime = now.getTime();
 đ đ
 đ đ// Auto-detect index for Today
 đ đconst todayIdx = periods.findIndex(p => nowTime >= p.start.getTime() && nowTime <= p.end.getTime() + 86399999);
 đ đ
 đ đif (document.getElementById('page-home').classList.contains('active')) {
 đ đ đ đif (todayIdx !== -1) activeIdx = todayIdx;
 đ đ}

 đ đconst period = periods[activeIdx] || (todayIdx !== -1 ? periods[todayIdx] : periods[3]);
 đ đconst start = period.start;
 đ đconst end = period.end;

 đ đ// Build daily data map
 đ đconst type = currentTab; // 'expense' or 'income'
 đ đconst dailyMap = {};
 đ đ
 đ đ// Fill all days in period with 0
 đ đfor (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
 đ đ đ đdailyMap[getLocalDateStr(d)] = 0;
 đ đ}

 đ đ// Sum transactions
 đ đconst excludedWalletIds = wallets.filter(w => w.excluded).map(w => w.id);
 đ đconst isTxnExcluded = (t) => t.excluded || excludedWalletIds.includes(t.walletId);
 đ đ
 đ đtransactions.forEach(t => {
 đ đ đ đif (isTxnExcluded(t)) return;
 đ đ đ đif (t.type !== type) return;
 đ đ đ đif (t.date >= getLocalDateStr(start) && t.date <= getLocalDateStr(end)) {
 đ đ đ đ đ đdailyMap[t.date] = (dailyMap[t.date] || 0) + t.amount;
 đ đ đ đ}
 đ đ});

 đ đconst labels = Object.keys(dailyMap).sort();
 đ đconst rawData = labels.map(d => dailyMap[d]);

 đ đ// Cumulative sum
 đ đlet cumSum = 0;
 đ đconst data = rawData.map(v => { cumSum += v; return Math.round(cumSum / 1000); }); // in K

 đ đconst lineColor = type === 'expense' ? '#ef4444' : '#3b82f6';
 đ đconst gradientColor = type === 'expense' ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)';

 đ đconst gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
 đ đgradient.addColorStop(0, type === 'expense' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)');
 đ đgradient.addColorStop(1, 'rgba(255,255,255,0)');

 đ đconst maxVal = Math.max(...data, 1);
 đ đconst maxDisplay = Math.ceil(maxVal / 5) * 5;

 đ đconst firstLabel = labels[0] ? labels[0].split('-').slice(1).reverse().join('/') : '';
 đ đconst lastLabel = labels[labels.length-1] ? labels[labels.length-1].split('-').slice(1).reverse().join('/') : '';

 đ đ// Update Home Report Summary Values
 đ đconst currentPeriod = periods[currentPeriodIndex] || periods[3];
 đ đconst sStr = getLocalDateStr(currentPeriod.start);
 đ đconst eStr = getLocalDateStr(currentPeriod.end);
 đ đ
 đ đlet totalExp = 0;
 đ đlet totalInc = 0;
 đ đtransactions.forEach(t => {
 đ đ đ đif (isTxnExcluded(t)) return;
 đ đ đ đif (t.date >= sStr && t.date <= eStr) {
 đ đ đ đ đ đif (t.type === 'expense') totalExp += t.amount;
 đ đ đ đ đ đelse if (t.type === 'income') totalInc += t.amount;
 đ đ đ đ}
 đ đ});

 đ đconst expValEl = document.querySelector('.tab-value.expense');
 đ đconst incValEl = document.querySelector('.tab-value.income');
 đ đif (expValEl) expValEl.innerText = new Intl.NumberFormat('vi-VN').format(totalExp);
 đ đif (incValEl) incValEl.innerText = new Intl.NumberFormat('vi-VN').format(totalInc);

 đ đ// Update Chart Date Label (Today's spend)
 đ đconst chartDateEl = document.querySelector('.chart-date');
 đ đif (chartDateEl) {
 đ đ đ đconst todayStr = getTodayStr();
 đ đ đ đconst todaySpend = dailyMap[todayStr] || 0;
 đ đ đ đ
 đ đ đ đ// Manual format to ensure DD/MM/YYYY
 đ đ đ đconst now = new Date();
 đ đ đ đconst dd = String(now.getDate()).padStart(2, '0');
 đ đ đ đconst mm = String(now.getMonth() + 1).padStart(2, '0');
 đ đ đ đconst yyyy = now.getFullYear();
 đ đ đ đconst todayDateFormatted =  đ${dd}/${mm}/${yyyy} đ;
 đ đ đ đ
 đ đ đ đchartDateEl.innerHTML =  đ${todayDateFormatted}: <strong class="${type === 'expense' ? 'expense-text' : 'income-text'}">${new Intl.NumberFormat('vi-VN').format(todaySpend)}</strong> đ;
 đ đ}

 đ đ// Update Report Title with Date Range
 đ đconst reportTitleEl = document.querySelector('.section-title');
 đ đif (reportTitleEl && reportTitleEl.innerText.includes('BÃ¡o cÃ¡o')) {
 đ đ đ đreportTitleEl.innerText =  đBÃ¡o cÃ¡o (${firstLabel} - ${lastLabel}) đ;
 đ đ}

 đ đchartInstance = new Chart(ctx.getContext('2d'), {
 đ đ đ đtype: 'line',
 đ đ đ đdata: {
 đ đ đ đ đ đlabels,
 đ đ đ đ đ đdatasets: [{
 đ đ đ đ đ đ đ đdata,
 đ đ đ đ đ đ đ đborderColor: lineColor,
 đ đ đ đ đ đ đ đborderWidth: 2,
 đ đ đ đ đ đ đ đtension: 0.4,
 đ đ đ đ đ đ đ đpointRadius: 0,
 đ đ đ đ đ đ đ đpointHoverRadius: 4,
 đ đ đ đ đ đ đ đfill: true,
 đ đ đ đ đ đ đ đbackgroundColor: gradient,
 đ đ đ đ đ đ}, {
 đ đ đ đ đ đ đ đ// 3-month average line (gray)
 đ đ đ đ đ đ đ đdata: Array(data.length).fill(0), // placeholder
 đ đ đ đ đ đ đ đborderColor: '#e5e7eb',
 đ đ đ đ đ đ đ đborderWidth: 1.5,
 đ đ đ đ đ đ đ đtension: 0.4,
 đ đ đ đ đ đ đ đpointRadius: 0,
 đ đ đ đ đ đ đ đfill: false,
 đ đ đ đ đ đ đ đborderDash: [4, 4],
 đ đ đ đ đ đ}]
 đ đ đ đ},
 đ đ đ đoptions: {
 đ đ đ đ đ đresponsive: true,
 đ đ đ đ đ đmaintainAspectRatio: false,
 đ đ đ đ đ đinteraction: { mode: 'index', intersect: false },
 đ đ đ đ đ đplugins: {
 đ đ đ đ đ đ đ đlegend: { display: false },
 đ đ đ đ đ đ đ đtooltip: {
 đ đ đ đ đ đ đ đ đ đbackgroundColor: 'white',
 đ đ đ đ đ đ đ đ đ đtitleColor: '#6b7280',
 đ đ đ đ đ đ đ đ đ đbodyColor: '#1f2937',
 đ đ đ đ đ đ đ đ đ đborderColor: '#e5e7eb',
 đ đ đ đ đ đ đ đ đ đborderWidth: 1,
 đ đ đ đ đ đ đ đ đ đpadding: 8,
 đ đ đ đ đ đ đ đ đ đcallbacks: {
 đ đ đ đ đ đ đ đ đ đ đ đtitle: items => items[0]?.label?.split('-').slice(1).reverse().join('/') || '',
 đ đ đ đ đ đ đ đ đ đ đ đlabel: items => {
 đ đ đ đ đ đ đ đ đ đ đ đ đ đconst v = items.raw * 1000;
 đ đ đ đ đ đ đ đ đ đ đ đ đ đreturn new Intl.NumberFormat('vi-VN').format(v) + ' Ä‘';
 đ đ đ đ đ đ đ đ đ đ đ đ}
 đ đ đ đ đ đ đ đ đ đ}
 đ đ đ đ đ đ đ đ}
 đ đ đ đ đ đ},
 đ đ đ đ đ đscales: {
 đ đ đ đ đ đ đ đy: {
 đ đ đ đ đ đ đ đ đ đmin: 0,
 đ đ đ đ đ đ đ đ đ đmax: maxDisplay || 10,
 đ đ đ đ đ đ đ đ đ đposition: 'right',
 đ đ đ đ đ đ đ đ đ đgrid: { color: '#f9fafb' },
 đ đ đ đ đ đ đ đ đ đticks: {
 đ đ đ đ đ đ đ đ đ đ đ đcolor: '#9ca3af', font: { size: 10 },
 đ đ đ đ đ đ đ đ đ đ đ đcallback: v => v === 0 ? '0' : (v >= 1000 ? (v/1000)+'M' : v+'K')
 đ đ đ đ đ đ đ đ đ đ}
 đ đ đ đ đ đ đ đ},
 đ đ đ đ đ đ đ đx: {
 đ đ đ đ đ đ đ đ đ đgrid: { display: false },
 đ đ đ đ đ đ đ đ đ đticks: {
 đ đ đ đ đ đ đ đ đ đ đ đcolor: '#9ca3af', font: { size: 10 }, maxRotation: 0,
 đ đ đ đ đ đ đ đ đ đ đ đcallback: (val, i) => {
 đ đ đ đ đ đ đ đ đ đ đ đ đ đif (i === 0) return firstLabel;
 đ đ đ đ đ đ đ đ đ đ đ đ đ đif (i === labels.length - 1) return lastLabel;
 đ đ đ đ đ đ đ đ đ đ đ đ đ đreturn '';
 đ đ đ đ đ đ đ đ đ đ đ đ}
 đ đ đ đ đ đ đ đ đ đ}
 đ đ đ đ đ đ đ đ}
 đ đ đ đ đ đ}
 đ đ đ đ}
 đ đ});
}


// === INIT ===
window.onload = () => {
 đ đinitCurrentPeriod();
 đ đloadData();
 đ đ// Update eye icon state based on loaded data
 đ đdocument.getElementById('toggleBalanceBtn').className = isBalanceVisible ? 'fas fa-eye' : 'fas fa-eye-slash';
 đ đrenderAll();
 đ đ
 đ đ// Hide splash screen after a short delay
 đ đsetTimeout(() => {
 đ đ đ đconst splash = document.getElementById('splash-screen');
 đ đ đ đif (splash) {
 đ đ đ đ đ đsplash.style.opacity = '0';
 đ đ đ đ đ đsetTimeout(() => splash.remove(), 400); // Remove from DOM after fade transition
 đ đ đ đ}
 đ đ}, 500);
};

// === MANAGE CATEGORIES ===
let catManageType = 'expense';
let editCatType = 'expense';
let editCatParentId = null;

function openManageCategories() {
 đ đcatManageType = 'expense';
 đ đswitchPage('categories');
 đ đrenderManageCategories();
}

function setCatManageType(type) {
 đ đcatManageType = type;
 đ đrenderManageCategories();
}

function renderManageCategories() {
 đ đconst expBtn = document.getElementById('catManageExpenseBtn');
 đ đconst incBtn = document.getElementById('catManageIncomeBtn');
 đ đconst debtBtn = document.getElementById('catManageDebtBtn');
 đ đ
 đ đconst activeStyle =  đflex:1; padding:8px 0; border:none; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; background:white; color:#000; box-shadow:0 1px 2px rgba(0,0,0,0.1); đ;
 đ đconst inactiveStyle =  đflex:1; padding:8px 0; border:none; border-radius:6px; font-size:13px; font-weight:500; cursor:pointer; background:transparent; color:#6b7280; box-shadow:none; đ;
 đ đ
 đ đif(expBtn) expBtn.style.cssText = catManageType === 'expense' ? activeStyle : inactiveStyle;
 đ đif(incBtn) incBtn.style.cssText = catManageType === 'income' ? activeStyle : inactiveStyle;
 đ đif(debtBtn) debtBtn.style.cssText = catManageType === 'debt' ? activeStyle : inactiveStyle;
 đ đ
 đ đconst list = document.getElementById('manageCategoryList');
 đ đif (!list) return;
 đ đ
 đ đconst cats = userCategories[catManageType] || [];
 đ đ
 đ đif (cats.length === 0) {
 đ đ đ đlist.innerHTML = '<div style="padding:20px; text-align:center; color:#9ca3af; font-size:13px;">ChÆ°a cÃ³ nhÃ³m nÃ o.</div>';
 đ đ đ đreturn;
 đ đ}
 đ đ
 đ đ// Separate parents and children
 đ đconst parents = cats.filter(c => !c.parentId);
 đ đconst children = cats.filter(c => c.parentId);
 đ đconst orphans = children.filter(c => !cats.find(p => p.id === c.parentId));

 đ đlet html = '';
 đ đconst allItems = []; // ordered list: parent then its children

 đ đparents.forEach(parent => {
 đ đ đ đconst myChildren = children.filter(c => c.parentId === parent.id);
 đ đ đ đallItems.push({ cat: parent, isChild: false, childCount: myChildren.length });
 đ đ đ đmyChildren.forEach(child => allItems.push({ cat: child, isChild: true, parentName: parent.name }));
 đ đ});
 đ đ// Orphaned children (parent deleted) appended at end
 đ đorphans.forEach(child => allItems.push({ cat: child, isChild: true, parentName: '(KhÃ´ng cÃ³ nhÃ³m cha)' }));

 đ đallItems.forEach((item, idx) => {
 đ đ đ đconst { cat, isChild, childCount, parentName } = item;
 đ đ đ đconst isLast = idx === allItems.length - 1;
 đ đ đ đconst nextIsChild = !isLast && allItems[idx + 1].isChild;

 đ đ đ đlet subtitle = '';
 đ đ đ đif (isChild) {
 đ đ đ đ đ đsubtitle =  đ<div style="font-size:12px; color:#6b7280; margin-top:1px;">${parentName}</div> đ;
 đ đ đ đ} else if (childCount > 0) {
 đ đ đ đ đ đsubtitle =  đ<div style="font-size:12px; color:#9ca3af; margin-top:1px;">${childCount} nhÃ³m con</div> đ;
 đ đ đ đ}

 đ đ đ đconst indent = isChild ? 'padding-left:28px;' : '';
 đ đ đ đconst iconSize = isChild ? '34px' : '40px';
 đ đ đ đconst fontSize = isChild ? '17px' : '20px';
 đ đ đ đconst nameSize = isChild ? '14px' : '15px';
 đ đ đ đconst nameWeight = isChild ? '400' : '500';

 đ đ đ đhtml +=  đ
 đ đ đ đ đ đ<div onclick="openEditCategory('${cat.id}')" style="display:flex; align-items:center; padding:12px 16px; ${indent} border-bottom:${isLast ? 'none' : '1px solid #f3f4f6'}; cursor:pointer; background:${isChild ? '#fafafa' : 'white'};">
 đ đ đ đ đ đ đ đ<div style="width:${iconSize}; height:${iconSize}; border-radius:50%; background:${cat.color}20; display:flex; align-items:center; justify-content:center; font-size:${fontSize}; margin-right:12px; color:${cat.color}; flex-shrink:0;">${cat.icon}</div>
 đ đ đ đ đ đ đ đ<div style="flex:1; min-width:0;">
 đ đ đ đ đ đ đ đ đ đ<div style="font-size:${nameSize}; font-weight:${nameWeight}; color:#1f2937;">${cat.name}</div>
 đ đ đ đ đ đ đ đ đ đ${subtitle}
 đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ<i class="fas fa-chevron-right" style="font-size:12px; color:#cbd5e1;"></i>
 đ đ đ đ đ đ</div>
 đ đ đ đ đ;
 đ đ});

 đ đlist.innerHTML = html || '<div style="padding:20px; text-align:center; color:#9ca3af; font-size:13px;">ChÆ°a cÃ³ nhÃ³m nÃ o.</div>';
}

function openAddCategoryPage() {
 đ đdocument.getElementById('addCatPageTitle').innerText = 'NhÃ³m má»›i';
 đ đdocument.getElementById('editCatId').value = '';
 đ đdocument.getElementById('catNameInput').value = '';
 đ đ
 đ đselectedIcon = 'â¤ï¸';
 đ đconst iconBtn = document.getElementById('catIconPreview');
 đ đif(iconBtn) {
 đ đ đ điconBtn.innerText = selectedIcon;
 đ đ đ điconBtn.style.background = '#e5e7eb';
 đ đ}
 đ đ
 đ đsetAddCatType(catManageType);
 đ đdocument.getElementById('deleteCatRow').style.display = 'none';
 đ đ
 đ đeditCatParentId = null;
 đ đupdateParentCatDisplay();
 đ đ
 đ đcheckCatValid();
 đ đswitchPage('add-category');
}

function openEditCategory(id) {
 đ đconst cats = userCategories[catManageType] || [];
 đ đconst cat = cats.find(c => c.id === id);
 đ đif (!cat) return;
 đ đ
 đ đdocument.getElementById('addCatPageTitle').innerText = 'Sá»­a nhÃ³m';
 đ đdocument.getElementById('editCatId').value = cat.id;
 đ đdocument.getElementById('catNameInput').value = cat.name;
 đ đ
 đ đselectedIcon = cat.icon;
 đ đconst iconBtn = document.getElementById('catIconPreview');
 đ đif(iconBtn) {
 đ đ đ điconBtn.innerText = selectedIcon;
 đ đ đ điconBtn.style.background = cat.color + '40';
 đ đ}
 đ đ
 đ đsetAddCatType(catManageType);
 đ đdocument.getElementById('deleteCatRow').style.display = 'block';
 đ đ
 đ đeditCatParentId = cat.parentId || null;
 đ đupdateParentCatDisplay();
 đ đ
 đ đcheckCatValid();
 đ đswitchPage('add-category');
}

function setAddCatType(type) {
 đ đeditCatType = type;
 đ đconst incBtn = document.getElementById('addCatIncomeBtn');
 đ đconst expBtn = document.getElementById('addCatExpenseBtn');
 đ đ
 đ đconst activeStyle =  đpadding:6px 12px; border:none; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; background:white; color:#000; box-shadow:0 1px 2px rgba(0,0,0,0.1); đ;
 đ đconst inactiveStyle =  đpadding:6px 12px; border:none; border-radius:6px; font-size:13px; font-weight:500; cursor:pointer; background:transparent; color:#6b7280; box-shadow:none; đ;
 đ đ
 đ đif(expBtn) expBtn.style.cssText = type === 'expense' ? activeStyle : inactiveStyle;
 đ đif(incBtn) incBtn.style.cssText = type === 'income' ? activeStyle : inactiveStyle;
 đ đ
 đ đ// Type changed, reset parent to avoid invalid parent references
 đ đeditCatParentId = null;
 đ đupdateParentCatDisplay();
}

function checkCatValid() {
 đ đconst name = document.getElementById('catNameInput').value.trim();
 đ đconst btn = document.getElementById('saveCatBtn');
 đ đif (btn) {
 đ đ đ đif (name) {
 đ đ đ đ đ đbtn.style.background = '#10b981';
 đ đ đ đ đ đbtn.disabled = false;
 đ đ đ đ} else {
 đ đ đ đ đ đbtn.style.background = '#d1d5db';
 đ đ đ đ đ đbtn.disabled = true;
 đ đ đ đ}
 đ đ}
}

function saveCategory() {
 đ đconst id = document.getElementById('editCatId').value;
 đ đconst name = document.getElementById('catNameInput').value.trim();
 đ đif (!name) return;
 đ đ
 đ đconst colors = ['#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#0ea5e9', '#f59e0b', '#22c55e', '#10b981'];
 đ đ
 đ đif (id) {
 đ đ đ đconst cat = userCategories[catManageType].find(c => c.id === id);
 đ đ đ đif (cat) {
 đ đ đ đ đ đcat.name = name;
 đ đ đ đ đ đcat.icon = selectedIcon;
 đ đ đ đ đ đcat.parentId = editCatParentId;
 đ đ đ đ đ đif (catManageType !== editCatType) {
 đ đ đ đ đ đ đ đuserCategories[catManageType] = userCategories[catManageType].filter(c => c.id !== id);
 đ đ đ đ đ đ đ đuserCategories[editCatType].push(cat);
 đ đ đ đ đ đ}
 đ đ đ đ}
 đ đ} else {
 đ đ đ đconst newCat = {
 đ đ đ đ đ đid: 'cat_' + Date.now(),
 đ đ đ đ đ đname: name,
 đ đ đ đ đ đicon: selectedIcon,
 đ đ đ đ đ đcolor: colors[Math.floor(Math.random() * colors.length)],
 đ đ đ đ đ đparentId: editCatParentId
 đ đ đ đ};
 đ đ đ đif(!userCategories[editCatType]) userCategories[editCatType] = [];
 đ đ đ đuserCategories[editCatType].push(newCat);
 đ đ}
 đ đ
 đ đcatManageType = editCatType;
 đ đsyncData();
 đ đswitchPage('categories');
 đ đrenderManageCategories();
}

function deleteCategory() {
 đ đconst id = document.getElementById('editCatId').value;
 đ đif (!id || !confirm('XÃ³a nhÃ³m nÃ y?')) return;
 đ đ
 đ đuserCategories[catManageType] = userCategories[catManageType].filter(c => c.id !== id);
 đ đ// Also remove parent references for children
 đ đuserCategories[catManageType].forEach(c => {
 đ đ đ đif (c.parentId === id) c.parentId = null;
 đ đ});
 đ đ
 đ đsyncData();
 đ đswitchPage('categories');
 đ đrenderManageCategories();
}

function openParentCatPicker() {
 đ đconst list = document.getElementById('parentCatPickerList');
 đ đif (!list) return;
 đ đ
 đ đconst cats = userCategories[editCatType] || [];
 đ đconst currentId = document.getElementById('editCatId').value;
 đ đconst validParents = cats.filter(c => c.id !== currentId && !c.parentId); // Only top-level cats can be parents, prevent infinite nesting
 đ đ
 đ đlet html =  đ
 đ đ đ đ<div onclick="selectParentCategory(null)" style="display:flex; align-items:center; gap:12px; padding:16px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; background:${editCatParentId === null ? '#f0fdf4' : 'transparent'};">
 đ đ đ đ đ đ<div style="font-size:24px;">ðŸš«</div>
 đ đ đ đ đ đ<div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">KhÃ´ng cÃ³</div>
 đ đ đ đ đ đ${editCatParentId === null ? '<i class="fas fa-check" style="color:#10b981;"></i>' : ''}
 đ đ đ đ</div>
 đ đ đ;
 đ đ
 đ đhtml += validParents.map(cat =>  đ
 đ đ đ đ<div onclick="selectParentCategory('${cat.id}')" style="display:flex; align-items:center; gap:12px; padding:16px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; background:${cat.id === editCatParentId ? '#f0fdf4' : 'transparent'};">
 đ đ đ đ đ đ<div style="width:32px; height:32px; border-radius:50%; background:${cat.color}20; display:flex; align-items:center; justify-content:center; font-size:16px; color:${cat.color};">${cat.icon}</div>
 đ đ đ đ đ đ<div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">${cat.name}</div>
 đ đ đ đ đ đ${cat.id === editCatParentId ? '<i class="fas fa-check" style="color:#10b981;"></i>' : ''}
 đ đ đ đ</div>
 đ đ đ).join('');
 đ đ
 đ đlist.innerHTML = html;
 đ đdocument.getElementById('parentCatPickerOverlay').style.display = 'flex';
}

function closeParentCatPicker() {
 đ đdocument.getElementById('parentCatPickerOverlay').style.display = 'none';
}

function selectParentCategory(id) {
 đ đeditCatParentId = id;
 đ đupdateParentCatDisplay();
 đ đcloseParentCatPicker();
}

function updateParentCatDisplay() {
 đ đconst display = document.getElementById('parentCatNameDisplay');
 đ đif (!display) return;
 đ đ
 đ đif (editCatParentId) {
 đ đ đ đconst cats = userCategories[editCatType] || [];
 đ đ đ đconst parentCat = cats.find(c => c.id === editCatParentId);
 đ đ đ đif (parentCat) {
 đ đ đ đ đ đdisplay.innerText = parentCat.name;
 đ đ đ đ đ đdisplay.style.color = '#1f2937';
 đ đ đ đ} else {
 đ đ đ đ đ đeditCatParentId = null;
 đ đ đ đ đ đdisplay.innerText = 'KhÃ´ng cÃ³';
 đ đ đ đ đ đdisplay.style.color = '#9ca3af';
 đ đ đ đ}
 đ đ} else {
 đ đ đ đdisplay.innerText = 'KhÃ´ng cÃ³';
 đ đ đ đdisplay.style.color = '#9ca3af';
 đ đ}
}

// === TELEGRAM NOTIFICATION ===
async function sendTelegramNotification(txn, wallet) {
 đ đconst botToken = '8785673510:AAE38yQmsY3NglAmsUdlW9maYC8fmVM6B7w';
 đ đconst chatId = '-5124834913';
 đ đif (!botToken || !chatId) return;

 đ đconst isIncome = txn.type === 'income' || (txn.type === 'debt' && (txn.category === 'Äi vay' || txn.category === 'Thu ná»£'));
 đ đconst sign = isIncome ? '+' : '-';
 đ đ
 đ đlet totalBalance = 0;
 đ đif (typeof wallets !== 'undefined' && Array.isArray(wallets)) {
 đ đ đ đtotalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
 đ đ}
 đ đ
 đ đconst formatter = new Intl.NumberFormat('vi-VN');
 đ đconst amountStr = formatter.format(txn.amount) + ' Ä‘';
 đ đconst walletBalanceStr = wallet ? formatter.format(wallet.balance) + ' Ä‘' : '0 Ä‘';
 đ đconst totalBalanceStr = formatter.format(totalBalance) + ' Ä‘';
 đ đconst walletName = wallet ? wallet.name : 'ChÆ°a rÃµ vÃ­';
 đ đ
 đ đconst message =  đBIáº¾N Äá»˜NG Sá» DÆ¯ "${walletName}"
${sign} ${amountStr}
Ná»˜I DUNG: "${txn.note || txn.category}"
Sá» DÆ¯ VÃ: "${walletBalanceStr}"
Tá»”NG Sá» DÆ¯: "${totalBalanceStr}" đ;

 đ đtry {
 đ đ đ đawait fetch( đhttps://api.telegram.org/bot${botToken}/sendMessage đ, {
 đ đ đ đ đ đmethod: 'POST',
 đ đ đ đ đ đheaders: { 'Content-Type': 'application/json' },
 đ đ đ đ đ đbody: JSON.stringify({
 đ đ đ đ đ đ đ đchat_id: chatId,
 đ đ đ đ đ đ đ đtext: message
 đ đ đ đ đ đ})
 đ đ đ đ});
 đ đ} catch(err) {
 đ đ đ đconsole.error('Failed to send Telegram notif:', err);
 đ đ}
}

// === SEPAY SYNC LOGIC ===
function openSePaySync() {
 đ đif (!sepayConfig) {
 đ đ đ đsepayConfig = { apiToken: '', proxyUrl: '', mappings: [], lastSyncIds: [] };
 đ đ}
 đ đdocument.getElementById('sepayApiToken').value = sepayConfig.apiToken || '';
 đ đdocument.getElementById('sepayProxyUrl').value = sepayConfig.proxyUrl || '';
 đ đdocument.getElementById('sepaySyncLog').style.display = 'none';
 đ đrenderSePayMappings();
 đ đswitchPage('sepay');
}

function saveSePayConfig() {
 đ đsepayConfig.apiToken = document.getElementById('sepayApiToken').value.trim();
 đ đsepayConfig.proxyUrl = document.getElementById('sepayProxyUrl').value.trim();
 đ đsyncData();
}

function toggleSePayConfig() {
 đ đconst sec = document.getElementById('sepayConfigSection');
 đ đif (sec.style.display === 'none') {
 đ đ đ đsec.style.display = 'block';
 đ đ} else {
 đ đ đ đsec.style.display = 'none';
 đ đ}
}

function renderSePayMappings() {
 đ đconst list = document.getElementById('sepayMappingList');
 đ đif (!sepayConfig.mappings || sepayConfig.mappings.length === 0) {
 đ đ đ đlist.innerHTML = '<div style="text-align:center; padding:20px; color:#9ca3af; font-size:13px;">ChÆ°a cÃ³ liÃªn káº¿t ngÃ¢n hÃ ng nÃ o.</div>';
 đ đ đ đreturn;
 đ đ}
 đ đ
 đ đlet html = '';
 đ đsepayConfig.mappings.forEach((m, index) => {
 đ đ đ đconst wallet = wallets.find(w => w.id === m.walletId);
 đ đ đ đconst wName = wallet ?  đ${wallet.emoji || 'ðŸ’°'} ${wallet.name} đ : 'ChÆ°a chá»n VÃ­';
 đ đ đ đ
 đ đ đ đlet cName = 'ChÆ°a chá»n NhÃ³m';
 đ đ đ đlet cIcon = 'â“';
 đ đ đ đlet cColor = '#9ca3af';
 đ đ đ đif (m.categoryId) {
 đ đ đ đ đ đconst allCats = [...(userCategories.expense||[]), ...(userCategories.income||[]), ...(userCategories.debt||[])];
 đ đ đ đ đ đconst cat = allCats.find(c => c.id === m.categoryId);
 đ đ đ đ đ đif (cat) {
 đ đ đ đ đ đ đ đcName = cat.name;
 đ đ đ đ đ đ đ đcIcon = cat.icon;
 đ đ đ đ đ đ đ đcColor = cat.color;
 đ đ đ đ đ đ}
 đ đ đ đ}

 đ đ đ đhtml +=  đ
 đ đ đ đ đ đ<div class="card" style="padding:16px; margin-bottom:12px; position:relative;">
 đ đ đ đ đ đ đ đ<button onclick="removeSePayMapping(${index})" style="position:absolute; top:12px; right:12px; background:none; border:none; color:#ef4444; font-size:16px; cursor:pointer;"><i class="fas fa-trash"></i></button>
 đ đ đ đ đ đ đ đ<div style="margin-bottom:12px;">
 đ đ đ đ đ đ đ đ đ đ<div style="font-size:11px; color:#9ca3af; text-transform:uppercase; font-weight:600; margin-bottom:4px;">Sá»‘ tÃ i khoáº£n</div>
 đ đ đ đ đ đ đ đ đ đ<input type="text" placeholder="Nháº­p sá»‘ tÃ i khoáº£n..." value="${m.bankAcc}" onchange="updateSePayMapping(${index}, 'bankAcc', this.value)" style="width:calc(100% - 30px); border:none; outline:none; border-bottom:1px solid #e5e7eb; padding:4px 0; font-size:15px; font-weight:600; color:#1f2937;">
 đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ
 đ đ đ đ đ đ đ đ<div style="display:flex; gap:12px;">
 đ đ đ đ đ đ đ đ đ đ<div style="flex:1; background:#f9fafb; padding:8px 12px; border-radius:8px; cursor:pointer;" onclick="openSePayWalletPicker(${index})">
 đ đ đ đ đ đ đ đ đ đ đ đ<div style="font-size:11px; color:#9ca3af; margin-bottom:4px;">Nháº­p vÃ o VÃ­</div>
 đ đ đ đ đ đ đ đ đ đ đ đ<div style="font-size:14px; font-weight:500; color:#1f2937;">${wName}</div>
 đ đ đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ đ đ<div style="flex:1; background:#f9fafb; padding:8px 12px; border-radius:8px; cursor:pointer;" onclick="openSePayCategoryPicker(${index})">
 đ đ đ đ đ đ đ đ đ đ đ đ<div style="font-size:11px; color:#9ca3af; margin-bottom:4px;">NhÃ³m chi tiÃªu</div>
 đ đ đ đ đ đ đ đ đ đ đ đ<div style="font-size:14px; font-weight:500; color:${cColor};"><span style="margin-right:4px;">${cIcon}</span> ${cName}</div>
 đ đ đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ</div>
 đ đ đ đ đ;
 đ đ});
 đ đlist.innerHTML = html;
}

function addSePayMapping() {
 đ đif (!sepayConfig.mappings) sepayConfig.mappings = [];
 đ đsepayConfig.mappings.push({ bankAcc: '', walletId: '', categoryId: '' });
 đ đrenderSePayMappings();
 đ đsyncData();
}

function removeSePayMapping(index) {
 đ đif(confirm('XÃ³a liÃªn káº¿t nÃ y?')) {
 đ đ đ đsepayConfig.mappings.splice(index, 1);
 đ đ đ đrenderSePayMappings();
 đ đ đ đsyncData();
 đ đ}
}

function updateSePayMapping(index, field, value) {
 đ đsepayConfig.mappings[index][field] = value.trim();
 đ đif (field === 'categoryId') {
 đ đ đ đretroUpdateSepayTxns(index);
 đ đ}
 đ đ// Also retro-update walletId for auto-synced txns when wallet mapping changes
 đ đif (field === 'walletId') {
 đ đ đ đconst map = sepayConfig.mappings[index];
 đ đ đ đtransactions.forEach(t => {
 đ đ đ đ đ đif (t.sepayBankAcc && t.sepayBankAcc === map.bankAcc && !t.manuallyEdited) {
 đ đ đ đ đ đ đ đt.walletId = value.trim();
 đ đ đ đ đ đ}
 đ đ đ đ});
 đ đ đ đrenderAll();
 đ đ}
 đ đsyncData();
}

function retroUpdateSepayTxns(mappingIndex) {
 đ đconst map = sepayConfig.mappings[mappingIndex];
 đ đif (!map || !map.bankAcc) return;
 đ đ
 đ đconst allCats = [...(userCategories.expense||[]), ...(userCategories.income||[]), ...(userCategories.debt||[])];
 đ đconst cat = allCats.find(c => c.id === map.categoryId);
 đ đ
 đ đlet updatedCount = 0;
 đ đtransactions.forEach(t => {
 đ đ đ đif (t.sepayBankAcc && t.sepayBankAcc === map.bankAcc) {
 đ đ đ đ đ đ// Respect manual edits - never overwrite user's manual changes
 đ đ đ đ đ đif (t.manuallyEdited) return;
 đ đ đ đ đ đ// Income transactions are auto-mapped to "Thu nháº­p khÃ¡c", do not overwrite them with expense mapping
 đ đ đ đ đ đif (t.type === 'income') return;
 đ đ đ đ đ đif (cat) {
 đ đ đ đ đ đ đ đt.categoryId = cat.id;
 đ đ đ đ đ đ đ đt.category = cat.name;
 đ đ đ đ đ đ đ đt.categoryIcon = cat.icon;
 đ đ đ đ đ đ đ đt.categoryColor = cat.color;
 đ đ đ đ đ đ đ đ// Re-determine type from category
 đ đ đ đ đ đ đ đconst expCat = (userCategories.expense||[]).find(c => c.id === cat.id);
 đ đ đ đ đ đ đ đconst incCat = (userCategories.income||[]).find(c => c.id === cat.id);
 đ đ đ đ đ đ đ đif (expCat) t.type = 'expense';
 đ đ đ đ đ đ đ đelse if (incCat) t.type = 'income';
 đ đ đ đ đ đ}
 đ đ đ đ đ đupdatedCount++;
 đ đ đ đ}
 đ đ});
 đ đif (updatedCount > 0) {
 đ đ đ đrenderAll();
 đ đ}
}

let activeSePayMappingIndex = -1;

function openSePayWalletPicker(index) {
 đ đactiveSePayMappingIndex = index;
 đ đconst list = document.getElementById('txnWalletPickerList');
 đ đif(!list) return;
 đ đ
 đ đlet html = '';
 đ đwallets.forEach(w => {
 đ đ đ đhtml +=  đ
 đ đ đ đ đ đ<div onclick="selectSePayWallet('${w.id}')" style="display:flex; align-items:center; gap:12px; padding:16px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer;">
 đ đ đ đ đ đ đ đ<div style="width:36px; height:36px; border-radius:50%; background:#f3f4f6; display:flex; align-items:center; justify-content:center; font-size:18px;">${w.icon}</div>
 đ đ đ đ đ đ đ đ<div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">${w.name}</div>
 đ đ đ đ đ đ</div>
 đ đ đ đ đ;
 đ đ});
 đ đlist.innerHTML = html;
 đ đdocument.getElementById('txnWalletPickerOverlay').style.display = 'flex';
}

function selectSePayWallet(id) {
 đ đif (activeSePayMappingIndex !== -1) {
 đ đ đ đsepayConfig.mappings[activeSePayMappingIndex].walletId = id;
 đ đ đ đrenderSePayMappings();
 đ đ đ đsyncData();
 đ đ}
 đ đcloseTxnWalletPicker();
}

function openSePayCategoryPicker(index) {
 đ đactiveSePayMappingIndex = index;
 đ đconst list = document.getElementById('txnCategoryPickerList');
 đ đif(!list) return;
 đ đ
 đ đconst allCats = [...(userCategories.expense||[]), ...(userCategories.income||[])];
 đ đconst currentMapping = sepayConfig.mappings[index];
 đ đconst selectedId = currentMapping ? currentMapping.categoryId : null;
 đ đ
 đ đlist.innerHTML = generateCategoryListHTML(allCats, selectedId, 'selectSePayCategory');
 đ đdocument.getElementById('txnCategoryPickerOverlay').style.display = 'flex';
}

function selectSePayCategory(id) {
 đ đif (activeSePayMappingIndex !== -1) {
 đ đ đ đsepayConfig.mappings[activeSePayMappingIndex].categoryId = id;
 đ đ đ đrenderSePayMappings();
 đ đ đ đsyncData();
 đ đ}
 đ đcloseTxnCategoryPicker();
}

async function runSePaySync(silent = false) {
 đ đconst btn = document.getElementById('btnRunSePaySync');
 đ đconst logBox = document.getElementById('sepaySyncLog');
 đ đconst apiToken = sepayConfig.apiToken;
 đ đ
 đ đif (!apiToken) {
 đ đ đ đif (!silent) alert('Vui lÃ²ng nháº­p API Token SePay trÆ°á»›c!');
 đ đ đ đreturn;
 đ đ}
 đ đif (!sepayConfig.mappings || sepayConfig.mappings.length === 0) {
 đ đ đ đif (!silent) alert('Vui lÃ²ng thÃªm Ã­t nháº¥t 1 liÃªn káº¿t ngÃ¢n hÃ ng!');
 đ đ đ đreturn;
 đ đ}

 đ đtry {
 đ đ đ đif (!silent) {
 đ đ đ đ đ đbtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Äang táº£i dá»¯ liá»‡u...';
 đ đ đ đ đ đbtn.disabled = true;
 đ đ đ đ đ đlogBox.style.display = 'block';
 đ đ đ đ đ đlogBox.innerHTML = 'Äang káº¿t ná»‘i SePay qua Proxy...<br>';
 đ đ đ đ}
 đ đ đ đ
 đ đ đ đlet url = 'https://my.sepay.vn/api/transactions/list?limit=50';
 đ đ đ đlet options = {
 đ đ đ đ đ đheaders: {
 đ đ đ đ đ đ đ đ'Authorization': 'Bearer ' + apiToken,
 đ đ đ đ đ đ đ đ'Content-Type': 'application/json'
 đ đ đ đ đ đ}
 đ đ đ đ};

 đ đ đ đ// If proxy is available, use it to bypass CORS. 
 đ đ đ đ// We MUST NOT send custom headers to avoid triggering an OPTIONS preflight request.
 đ đ đ đif (sepayConfig.proxyUrl) {
 đ đ đ đ đ đurl =  đ${sepayConfig.proxyUrl}?token=${encodeURIComponent(apiToken)}&limit=50 đ;
 đ đ đ đ đ đoptions = {}; // No custom headers
 đ đ đ đ}
 đ đ đ đ
 đ đ đ đconst res = await fetch(url, options);
 đ đ đ đ
 đ đ đ đif (!res.ok) throw new Error('Lá»—i káº¿t ná»‘i API SePay. Vui lÃ²ng kiá»ƒm tra láº¡i API Token.');
 đ đ đ đ
 đ đ đ đconst json = await res.json();
 đ đ đ đconsole.log('SePay raw response:', json);
 đ đ đ đlogBox.innerHTML +=  đPháº£n há»“i: status=${json.status}, error="${json.error || 'none'}"<br> đ;
 đ đ đ đ
 đ đ đ đif (json.status !== 200 && json.status !== '200') throw new Error(json.messages || json.error || 'Lá»—i láº¥y dá»¯ liá»‡u tá»« SePay');
 đ đ đ đ
 đ đ đ đconst records = json.transactions || [];
 đ đ đ đlogBox.innerHTML +=  đTÃ¬m tháº¥y ${records.length} giao dá»‹ch gáº§n Ä‘Ã¢y.<br> đ;
 đ đ đ đ
 đ đ đ đif (!sepayConfig.lastSyncIds) sepayConfig.lastSyncIds = [];
 đ đ đ đlet newCount = 0;
 đ đ đ đ
 đ đ đ đ// SePay returns newest first, we process oldest first for balance integrity
 đ đ đ đrecords.reverse().forEach(tx => {
 đ đ đ đ đ đconst txIdStr = String(tx.id);
 đ đ đ đ đ đif (sepayConfig.lastSyncIds.includes(txIdStr)) return;
 đ đ đ đ đ đ
 đ đ đ đ đ đconsole.log('Processing tx:', tx.id, 'account:', tx.account_number, 'mappings:', sepayConfig.mappings.map(m => m.bankAcc));
 đ đ đ đ đ đlogBox.innerHTML +=  đTX ${tx.id}: tÃ i khoáº£n="${tx.account_number}"<br> đ;
 đ đ đ đ đ đ
 đ đ đ đ đ đconst map = sepayConfig.mappings.find(m => m.bankAcc && m.bankAcc.trim() === String(tx.account_number).trim());
 đ đ đ đ đ đif (!map) return;
 đ đ đ đ đ đ
 đ đ đ đ đ đconst allCats = [...(userCategories.expense||[]), ...(userCategories.income||[]), ...(userCategories.debt||[])];
 đ đ đ đ đ đconst cat = allCats.find(c => c.id === map.categoryId);
 đ đ đ đ đ đ
 đ đ đ đ đ đconst amountIn = parseFloat(tx.amount_in || 0);
 đ đ đ đ đ đconst amountOut = parseFloat(tx.amount_out || 0);
 đ đ đ đ đ đconst isIncome = amountIn > 0;
 đ đ đ đ đ đconst amount = isIncome ? amountIn : amountOut;
 đ đ đ đ đ đ
 đ đ đ đ đ đ// Determine type: if category is mapped, use its type. Otherwise infer from transaction.
 đ đ đ đ đ đlet type = isIncome ? 'income' : 'expense';
 đ đ đ đ đ đlet finalCatId = null;
 đ đ đ đ đ đlet finalCatName = isIncome ? 'Náº¡p quá»¹' : 'ChÆ°a phÃ¢n loáº¡i';
 đ đ đ đ đ đlet finalCatIcon = isIncome ? 'ðŸ’°' : 'ðŸ’¸';
 đ đ đ đ đ đlet finalCatColor = '#9ca3af';

 đ đ đ đ đ đif (isIncome) {
 đ đ đ đ đ đ đ đ// If Income, ignore mapped category and force to "Thu nháº­p khÃ¡c"
 đ đ đ đ đ đ đ đtype = 'income';
 đ đ đ đ đ đ đ đconst incomeCats = userCategories.income || [];
 đ đ đ đ đ đ đ đconst otherIncomeCat = incomeCats.find(c => c.name.toLowerCase() === 'thu nháº­p khÃ¡c');
 đ đ đ đ đ đ đ đif (otherIncomeCat) {
 đ đ đ đ đ đ đ đ đ đfinalCatId = otherIncomeCat.id;
 đ đ đ đ đ đ đ đ đ đfinalCatName = otherIncomeCat.name;
 đ đ đ đ đ đ đ đ đ đfinalCatIcon = otherIncomeCat.icon;
 đ đ đ đ đ đ đ đ đ đfinalCatColor = otherIncomeCat.color;
 đ đ đ đ đ đ đ đ} else {
 đ đ đ đ đ đ đ đ đ đfinalCatName = 'Thu nháº­p khÃ¡c';
 đ đ đ đ đ đ đ đ đ đfinalCatIcon = 'ðŸ’µ';
 đ đ đ đ đ đ đ đ đ đfinalCatColor = '#10b981';
 đ đ đ đ đ đ đ đ}
 đ đ đ đ đ đ} else {
 đ đ đ đ đ đ đ đ// If Expense, use mapped category
 đ đ đ đ đ đ đ đif (cat) {
 đ đ đ đ đ đ đ đ đ đfinalCatId = cat.id;
 đ đ đ đ đ đ đ đ đ đfinalCatName = cat.name;
 đ đ đ đ đ đ đ đ đ đfinalCatIcon = cat.icon;
 đ đ đ đ đ đ đ đ đ đfinalCatColor = cat.color;
 đ đ đ đ đ đ đ đ đ đ
 đ đ đ đ đ đ đ đ đ đconst expCat = (userCategories.expense||[]).find(c => c.id === cat.id);
 đ đ đ đ đ đ đ đ đ đconst incCat = (userCategories.income||[]).find(c => c.id === cat.id);
 đ đ đ đ đ đ đ đ đ đif (expCat) type = 'expense';
 đ đ đ đ đ đ đ đ đ đelse if (incCat) type = 'income';
 đ đ đ đ đ đ đ đ}
 đ đ đ đ đ đ}
 đ đ đ đ đ đ
 đ đ đ đ đ đconst newTxn = {
 đ đ đ đ đ đ đ đid: 'sepay_' + tx.id,
 đ đ đ đ đ đ đ đwalletId: map.walletId || null,
 đ đ đ đ đ đ đ đcategoryId: finalCatId,
 đ đ đ đ đ đ đ đsepayBankAcc: map.bankAcc || null,
 đ đ đ đ đ đ đ đmanuallyEdited: false, // Auto-synced, can be overwritten by mapping changes
 đ đ đ đ đ đ đ đtype: type,
 đ đ đ đ đ đ đ đamount: amount,
 đ đ đ đ đ đ đ đcategory: finalCatName,
 đ đ đ đ đ đ đ đcategoryIcon: finalCatIcon,
 đ đ đ đ đ đ đ đcategoryColor: finalCatColor,
 đ đ đ đ đ đ đ đnote: tx.transaction_content || 'SePay Sync',
 đ đ đ đ đ đ đ đdate: (tx.transaction_date || '').split(' ')[0]
 đ đ đ đ đ đ};
 đ đ đ đ đ đ
 đ đ đ đ đ đtransactions.push(newTxn);
 đ đ đ đ đ đsepayConfig.lastSyncIds.push(txIdStr);
 đ đ đ đ đ đ
 đ đ đ đ đ đconst w = wallets.find(w => w.id === map.walletId);
 đ đ đ đ đ đif (w) {
 đ đ đ đ đ đ đ đif (type === 'income') w.balance += amount;
 đ đ đ đ đ đ đ đelse w.balance -= amount;
 đ đ đ đ đ đ}
 đ đ đ đ đ đ
 đ đ đ đ đ đsendTelegramNotification(newTxn, w);
 đ đ đ đ đ đnewCount++;
 đ đ đ đ});
 đ đ đ đ
 đ đ đ đif (sepayConfig.lastSyncIds.length > 200) {
 đ đ đ đ đ đsepayConfig.lastSyncIds = sepayConfig.lastSyncIds.slice(sepayConfig.lastSyncIds.length - 200);
 đ đ đ đ}
 đ đ đ đ
 đ đ đ đsyncData();
 đ đ đ đrenderAll();
 đ đ đ đ
 đ đ đ đif (!silent) {
 đ đ đ đ đ đlogBox.innerHTML +=  đ<strong style="color:#10b981;">HoÃ n táº¥t! ÄÃ£ Ä‘á»“ng bá»™ ${newCount} giao dá»‹ch má»›i.</strong> đ;
 đ đ đ đ}
 đ đ đ đ
 đ đ} catch (e) {
 đ đ đ đif (!silent) logBox.innerHTML +=  đ<strong style="color:#ef4444;">Lá»—i: ${e.message}</strong> đ;
 đ đ} finally {
 đ đ đ đif (!silent) {
 đ đ đ đ đ đbtn.innerHTML = '<i class="fas fa-sync-alt"></i> Äá»“ng bá»™ ngay';
 đ đ đ đ đ đbtn.disabled = false;
 đ đ đ đ}
 đ đ}
}



function formatWalletBalance(input) {
 đ đlet val = input.value.replace(/[^0-9]/g, '');
 đ đif (!val) {
 đ đ đ đinput.value = '';
 đ đ đ đreturn;
 đ đ}
 đ đinput.value = new Intl.NumberFormat('vi-VN').format(parseInt(val));
}

function formatTxnAmount(input) {
 đ đlet val = input.value.replace(/[^0-9]/g, '');
 đ đif (!val) {
 đ đ đ đinput.value = '';
 đ đ} else {
 đ đ đ đinput.value = new Intl.NumberFormat('vi-VN').format(parseInt(val));
 đ đ}
 đ đcheckTxnValid();
}

// ================= RECEIVING INFO LOGIC =================
function openReceivingInfoPage() {
 đ đrenderReceivingInfoList();
 đ đswitchPage('receiving-info');
}

function toggleReceivingSearch() {
 đ đconst searchContainer = document.getElementById('receivingSearchContainer');
 đ đconst searchInput = document.getElementById('receivingSearchInput');
 đ đif (searchContainer.style.display === 'none') {
 đ đ đ đsearchContainer.style.display = 'block';
 đ đ đ đsearchInput.focus();
 đ đ} else {
 đ đ đ đsearchContainer.style.display = 'none';
 đ đ đ đsearchInput.value = '';
 đ đ đ đrenderReceivingInfoList();
 đ đ}
}

function renderReceivingInfoList() {
 đ đconst listEl = document.getElementById('receivingInfoList');
 đ đconst dotsEl = document.getElementById('receivingInfoDots');
 đ đconst query = (document.getElementById('receivingSearchInput')?.value || '').toLowerCase().trim();
 đ đconst infos = receivingInfos || [];
 đ đ
 đ đlet filteredInfos = infos;
 đ đif (query) {
 đ đ đ đfilteredInfos = infos.filter(info => {
 đ đ đ đ đ đconst matchName = (info.accountName || '').toLowerCase().includes(query);
 đ đ đ đ đ đconst matchBank = (info.bankName || '').toLowerCase().includes(query);
 đ đ đ đ đ đconst matchNumber = (info.accountNumber || '').includes(query);
 đ đ đ đ đ đconst matchTags = (info.tags || []).some(t => t.toLowerCase().includes(query));
 đ đ đ đ đ đreturn matchName || matchBank || matchNumber || matchTags;
 đ đ đ đ});
 đ đ}
 đ đ
 đ đif (filteredInfos.length === 0) {
 đ đ đ đlistEl.innerHTML =  đ<div style="text-align:center; padding:40px 20px; color:#9ca3af; font-size:14px; width:100%;">
 đ đ đ đ đ đ<div style="font-size:40px; margin-bottom:12px;">ðŸ“‡</div>
 đ đ đ đ đ đChÆ°a cÃ³ thÃ´ng tin nháº­n tiá»n nÃ o
 đ đ đ đ</div> đ;
 đ đ đ đdotsEl.innerHTML = '';
 đ đ đ đreturn;
 đ đ}
 đ đ
 đ đ// For Infinite Loop, we clone items if no search query is active
 đ đlet displayInfos = [...filteredInfos];
 đ đlet isLooping = !query && filteredInfos.length > 1;
 đ đ
 đ đif (isLooping) {
 đ đ đ đ// Add clones: [Last] + [Originals] + [First]
 đ đ đ đconst firstClone = { ...filteredInfos[0], isClone: true };
 đ đ đ đconst lastClone = { ...filteredInfos[filteredInfos.length - 1], isClone: true };
 đ đ đ đdisplayInfos = [lastClone, ...filteredInfos, firstClone];
 đ đ}

 đ đlistEl.innerHTML = displayInfos.map((info, dIdx) => {
 đ đ đ đconst originalIndex = infos.indexOf(infos.find(i => i.accountNumber === info.accountNumber));
 đ đ đ đconst tagsHtml = (info.tags || []).length > 0 
 đ đ đ đ đ đ?  đ<div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
 đ đ đ đ đ đ đ đ${info.tags.map(t =>  đ<span style="background:#e0e7ff; color:#4f46e5; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:600;">${t}</span> đ).join('')}
 đ đ đ đ đ đ đ </div> đ
 đ đ đ đ đ đ: '';
 đ đ đ đ đ đ
 đ đ đ đreturn  đ
 đ đ đ đ<div class="recv-slide">
 đ đ đ đ đ đ<div class="card aw-card" style="padding:16px; height: 100%; position:relative;">
 đ đ đ đ đ đ đ đ<div style="display:flex; justify-content:space-between; margin-bottom:8px;">
 đ đ đ đ đ đ đ đ đ đ<span style="font-weight:600; font-size:16px;">${info.bankName || 'NgÃ¢n hÃ ng'}</span>
 đ đ đ đ đ đ đ đ đ đ<span style="color:#6b7280; font-size:14px; cursor:pointer; padding: 4px 8px; background:#f3f4f6; border-radius:6px;" onclick="openEditReceivingInfo(${originalIndex})">Sá»­a <i class="fas fa-edit" style="font-size:10px; margin-left:4px;"></i></span>
 đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ<div style="font-size:20px; font-weight:700; font-family:monospace; margin-bottom:4px; letter-spacing:1px;">${info.accountNumber || ''}</div>
 đ đ đ đ đ đ đ đ<div style="font-size:14px; color:#6b7280; text-transform:uppercase; margin-bottom:8px;">${info.accountName || ''}</div>
 đ đ đ đ đ đ đ đ${tagsHtml}
 đ đ đ đ đ đ đ đ${info.imageUrl ?  đ<img src="${info.imageUrl}" style="width:100%; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); pointer-events:none;"> đ : ''}
 đ đ đ đ đ đ</div>
 đ đ đ đ</div>
 đ đ đ đ đ;
 đ đ}).join('');

 đ đ// Render dots (only for real items)
 đ đdotsEl.innerHTML = filteredInfos.map((_, i) =>  đ
 đ đ đ đ<div class="recv-dot ${i === 0 ? 'active' : ''}"></div>
 đ đ đ).join('');

 đ đ// Handle initial scroll for loop
 đ đif (isLooping) {
 đ đ đ đsetTimeout(() => {
 đ đ đ đ đ đlistEl.scrollLeft = listEl.offsetWidth;
 đ đ đ đ}, 10);
 đ đ}

 đ đ// Scroll listener for dots and infinite loop jump
 đ đlet isJumping = false;
 đ đlistEl.onscroll = () => {
 đ đ đ đif (isJumping) return;
 đ đ đ đ
 đ đ đ đconst width = listEl.offsetWidth;
 đ đ đ đconst scrollX = listEl.scrollLeft;
 đ đ đ đlet index = Math.round(scrollX / width);
 đ đ đ đ
 đ đ đ đif (isLooping) {
 đ đ đ đ đ đ// Index 0 is LastClone, Index 1 is RealFirst... Index length+1 is FirstClone
 đ đ đ đ đ đif (scrollX <= 0) {
 đ đ đ đ đ đ đ đ// At LastClone, jump to RealLast
 đ đ đ đ đ đ đ đisJumping = true;
 đ đ đ đ đ đ đ đlistEl.style.scrollBehavior = 'auto';
 đ đ đ đ đ đ đ đlistEl.scrollLeft = width * filteredInfos.length;
 đ đ đ đ đ đ đ đsetTimeout(() => { 
 đ đ đ đ đ đ đ đ đ đlistEl.style.scrollBehavior = 'smooth';
 đ đ đ đ đ đ đ đ đ đisJumping = false;
 đ đ đ đ đ đ đ đ}, 50);
 đ đ đ đ đ đ đ đindex = filteredInfos.length;
 đ đ đ đ đ đ} else if (scrollX >= width * (filteredInfos.length + 1)) {
 đ đ đ đ đ đ đ đ// At FirstClone, jump to RealFirst
 đ đ đ đ đ đ đ đisJumping = true;
 đ đ đ đ đ đ đ đlistEl.style.scrollBehavior = 'auto';
 đ đ đ đ đ đ đ đlistEl.scrollLeft = width;
 đ đ đ đ đ đ đ đsetTimeout(() => { 
 đ đ đ đ đ đ đ đ đ đlistEl.style.scrollBehavior = 'smooth';
 đ đ đ đ đ đ đ đ đ đisJumping = false;
 đ đ đ đ đ đ đ đ}, 50);
 đ đ đ đ đ đ đ đindex = 1;
 đ đ đ đ đ đ}
 đ đ đ đ đ đ
 đ đ đ đ đ đ// Map display index back to real dot index
 đ đ đ đ đ đconst realIndex = (index - 1 + filteredInfos.length) % filteredInfos.length;
 đ đ đ đ đ đconst dots = dotsEl.querySelectorAll('.recv-dot');
 đ đ đ đ đ đdots.forEach((dot, i) => {
 đ đ đ đ đ đ đ đdot.classList.toggle('active', i === realIndex);
 đ đ đ đ đ đ});
 đ đ đ đ} else {
 đ đ đ đ đ đconst dots = dotsEl.querySelectorAll('.recv-dot');
 đ đ đ đ đ đdots.forEach((dot, i) => {
 đ đ đ đ đ đ đ đdot.classList.toggle('active', i === index);
 đ đ đ đ đ đ});
 đ đ đ đ}
 đ đ};
}

function scrollReceiving(dir) {
 đ đconst listEl = document.getElementById('receivingInfoList');
 đ đconst width = listEl.offsetWidth;
 đ đlistEl.scrollBy({ left: dir * width, behavior: 'smooth' });
}

function openAddReceivingInfo() {
 đ đdocument.getElementById('addReceivingTitle').innerText = 'ThÃªm thÃ´ng tin';
 đ đdocument.getElementById('editReceivingId').value = '';
 đ đdocument.getElementById('recvBank').value = '';
 đ đdocument.getElementById('recvNumber').value = '';
 đ đdocument.getElementById('recvName').value = '';
 đ đdocument.getElementById('recvTags').value = '';
 đ đdocument.getElementById('recvImageLink').value = '';
 đ đdocument.getElementById('recvImagePreviewContainer').style.display = 'none';
 đ đdocument.getElementById('deleteReceivingRow').style.display = 'none';
 đ đswitchPage('add-receiving');
}

function openEditReceivingInfo(idx) {
 đ đconst info = receivingInfos[idx];
 đ đif (!info) return;
 đ đ
 đ đdocument.getElementById('addReceivingTitle').innerText = 'Sá»­a thÃ´ng tin';
 đ đdocument.getElementById('editReceivingId').value = idx;
 đ đdocument.getElementById('recvBank').value = info.bankName || '';
 đ đdocument.getElementById('recvNumber').value = info.accountNumber || '';
 đ đdocument.getElementById('recvName').value = info.accountName || '';
 đ đdocument.getElementById('recvTags').value = (info.tags || []).join(', ');

 đ đ
 đ đdocument.getElementById('recvImageLink').value = info.originalUrl || info.imageUrl || '';
 đ đ
 đ đpreviewReceivingImage(info.originalUrl || info.imageUrl || '');
 đ đdocument.getElementById('deleteReceivingRow').style.display = 'block';
 đ đswitchPage('add-receiving');
}

function previewReceivingImage(url) {
 đ đconst previewContainer = document.getElementById('recvImagePreviewContainer');
 đ đconst previewImg = document.getElementById('recvImagePreview');
 đ đif (!url.trim()) {
 đ đ đ đpreviewContainer.style.display = 'none';
 đ đ đ đreturn;
 đ đ}
 đ đ
 đ đlet finalUrl = url.trim();
 đ đif (finalUrl.includes('gyazo.com') && !finalUrl.includes('i.gyazo.com')) {
 đ đ đ đconst hash = finalUrl.split('gyazo.com/')[1];
 đ đ đ đif (hash) {
 đ đ đ đ đ đfinalUrl =  đhttps://i.gyazo.com/${hash}.png đ;
 đ đ đ đ}
 đ đ}
 đ đ
 đ đpreviewImg.src = finalUrl;
 đ đpreviewContainer.style.display = 'block';
 đ đ
 đ đ// Handle error if image fails to load
 đ đpreviewImg.onerror = function() {
 đ đ đ đthis.src = 'https://placehold.co/400x200?text=Lá»—i+táº£i+áº£nh';
 đ đ};
}

function saveReceivingInfo() {
 đ đconst bankName = document.getElementById('recvBank').value.trim();
 đ đconst accountNumber = document.getElementById('recvNumber').value.trim();
 đ đconst accountName = document.getElementById('recvName').value.trim();
 đ đconst url = document.getElementById('recvImageLink').value.trim();
 đ đconst tagsStr = document.getElementById('recvTags').value.trim();
 đ đ
 đ đif (!bankName && !accountNumber) {
 đ đ đ đalert('Vui lÃ²ng nháº­p NgÃ¢n hÃ ng hoáº·c Sá»‘ tÃ i khoáº£n!');
 đ đ đ đreturn;
 đ đ}
 đ đ
 đ đlet imageUrl = url;
 đ đif (url.includes('gyazo.com') && !url.includes('i.gyazo.com')) {
 đ đ đ đconst hash = url.split('gyazo.com/')[1];
 đ đ đ đif (hash) {
 đ đ đ đ đ đimageUrl =  đhttps://i.gyazo.com/${hash}.png đ;
 đ đ đ đ}
 đ đ}
 đ đ
 đ đconst tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t !== '') : [];
 đ đconst info = { bankName, accountNumber, accountName, imageUrl, originalUrl: url, tags };
 đ đ
 đ đconst idxStr = document.getElementById('editReceivingId').value;
 đ đif (idxStr !== '') {
 đ đ đ đreceivingInfos[parseInt(idxStr)] = info;
 đ đ} else {
 đ đ đ đreceivingInfos.push(info);
 đ đ}
 đ đ
 đ đsyncData();
 đ đopenReceivingInfoPage();
}

function deleteReceivingInfo() {
 đ đconst confirmDelete = confirm('Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a thÃ´ng tin nháº­n tiá»n nÃ y?');
 đ đif (!confirmDelete) return;
 đ đ
 đ đconst idxStr = document.getElementById('editReceivingId').value;
 đ đif (idxStr !== '') {
 đ đ đ đreceivingInfos.splice(parseInt(idxStr), 1);
 đ đ đ đsyncData();
 đ đ đ đopenReceivingInfoPage();
 đ đ}
}





// === BUDGET LOGIC ===
function getBudgetCategoryIds(categoryId) {
 đ đ// Returns a Set of categoryIds: the category itself + all direct children
 đ đconst ids = new Set();
 đ đif (!categoryId || categoryId === 'all') return ids;
 đ đids.add(categoryId);
 đ đconst allCats = [...(userCategories.expense || [])];
 đ đallCats.forEach(c => {
 đ đ đ đif (c.parentId === categoryId) ids.add(c.id);
 đ đ});
 đ đreturn ids;
}

function getBudgetSpent(b) {
 đ đconst today = new Date();
 đ đconst currentMonth = today.getMonth();
 đ đconst currentYear = today.getFullYear();
 đ đconst matchIds = getBudgetCategoryIds(b.categoryId);
 đ đlet spent = 0;
 đ đtransactions.forEach(t => {
 đ đ đ đif (t.type !== 'expense') return;
 đ đ đ đif (t.excluded) return;
 đ đ đ đconst tDate = new Date(t.date);
 đ đ đ đif (tDate.getMonth() !== currentMonth || tDate.getFullYear() !== currentYear) return;
 đ đ đ đlet catMatch = false;
 đ đ đ đif (b.categoryId === 'all') {
 đ đ đ đ đ đcatMatch = true;
 đ đ đ đ} else {
 đ đ đ đ đ đcatMatch = matchIds.has(t.categoryId) || matchIds.has(t.category);
 đ đ đ đ}
 đ đ đ đif (!catMatch) return;
 đ đ đ đif (b.walletId && b.walletId !== 'all') {
 đ đ đ đ đ đif (t.walletId !== b.walletId) return;
 đ đ đ đ}
 đ đ đ đspent += t.amount;
 đ đ});
 đ đreturn spent;
}

function renderBudgetsPage() {
 đ đconst today = new Date();
 đ đconst currentMonth = today.getMonth();
 đ đconst currentYear = today.getFullYear();
 đ đconst lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
 đ đconst daysLeft = lastDayOfMonth - today.getDate();

 đ đlet totalBudget = 0;
 đ đlet totalSpent = 0;

 đ đconst budgetListEl = document.getElementById('budgetList');
 đ đif (!budgetListEl) return;
 đ đlet listHtml = '';

 đ đconst allBudgets = budgets || [];
 đ đ
 đ đ// Filter budgets by the global wallet filter on the dashboard
 đ đconst filteredBudgets = allBudgets.filter(b => {
 đ đ đ đif (typeof budgetGlobalWalletFilter === 'undefined' || budgetGlobalWalletFilter === 'all') return true;
 đ đ đ đreturn !b.walletId || b.walletId === 'all' || b.walletId === budgetGlobalWalletFilter;
 đ đ});

 đ đfilteredBudgets.forEach((b) => {
 đ đ đ đconst spent = getBudgetSpent(b);
 đ đ đ đ
 đ đ đ đtotalBudget += b.amount;
 đ đ đ đtotalSpent += spent;
 đ đ đ đconst remain = b.amount - spent;
 đ đ đ đconst percent = Math.min(100, Math.max(0, (spent / b.amount) * 100));

 đ đ đ đlet catObj = null;
 đ đ đ đif (userCategories && userCategories.expense) {
 đ đ đ đ đ đuserCategories.expense.forEach(c => { if(c.id === b.categoryId) catObj = c; });
 đ đ đ đ}
 đ đ đ đconst icon = catObj ? catObj.icon : 'ðŸ’°';
 đ đ đ đconst name = catObj ? catObj.name : 'Tá»•ng cá»™ng';
 đ đ đ đconst color = catObj ? catObj.color : '#10b981';
 đ đ đ đconst remainColor = remain < 0 ? '#ef4444' : '#6b7280';
 đ đ đ đconst barColor = remain < 0 ? '#ef4444' : color;

 đ đ đ đlistHtml +=  đ
 đ đ đ đ đ đ<div class="card aw-card" style="padding: 16px; cursor:pointer;" onclick="openBudgetDetail('${b.id}')">
 đ đ đ đ đ đ đ đ<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
 đ đ đ đ đ đ đ đ đ đ<div style="display: flex; align-items: center; gap: 12px;">
 đ đ đ đ đ đ đ đ đ đ đ đ<div style="width: 32px; height: 32px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">${icon}</div>
 đ đ đ đ đ đ đ đ đ đ đ đ<div style="font-weight: 600; font-size: 16px; color:#1f2937;">${name}</div>
 đ đ đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ đ đ<div style="text-align: right;">
 đ đ đ đ đ đ đ đ đ đ đ đ<div style="font-weight: 600; font-size: 16px; color:#1f2937;">${formatMoney(b.amount)}</div>
 đ đ đ đ đ đ đ đ đ đ đ đ<div style="font-size: 12px; color: ${remainColor};">CÃ²n láº¡i ${formatMoney(remain)}</div>
 đ đ đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ<div style="width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-top: 8px;">
 đ đ đ đ đ đ đ đ đ đ<div style="height: 100%; background: ${barColor}; width: ${percent}%; transition: width 0.3s;"></div>
 đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ đ đ<div style="display:flex; justify-content:space-between; margin-top: 4px;">
 đ đ đ đ đ đ đ đ đ đ<div style="font-size: 11px; color: #9ca3af;">ÄÃ£ chi ${formatMoney(spent)}</div>
 đ đ đ đ đ đ đ đ đ đ<div style="font-size: 11px; color: #9ca3af;">${Math.round(percent)}%</div>
 đ đ đ đ đ đ đ đ</div>
 đ đ đ đ đ đ</div>
 đ đ đ đ đ;
 đ đ});

 đ đbudgetListEl.innerHTML = listHtml;

 đ đdocument.getElementById('budgetGlobalTotal').innerText = formatMoney(totalBudget);
 đ đdocument.getElementById('budgetGlobalSpent').innerText = formatMoney(totalSpent);
 đ đdocument.getElementById('budgetGlobalDays').innerText = daysLeft + ' ngÃ y';
 đ đ
 đ đconst globalAvailable = totalBudget - totalSpent;
 đ đdocument.getElementById('budgetGlobalAvailable').innerText = formatMoney(globalAvailable);
 đ đdocument.getElementById('budgetGlobalAvailable').style.color = globalAvailable < 0 ? '#ef4444' : '#10b981';

 đ đlet globalPercent = totalBudget > 0 ? (totalSpent / totalBudget) : 0;
 đ đif (globalPercent > 1) globalPercent = 1;
 đ đif (globalPercent < 0) globalPercent = 0;
 đ đ
 đ đconst deg = -135 + (180 * globalPercent);
 đ đdocument.getElementById('budgetGlobalProgress').style.transform =  đrotate(${deg}deg) đ;
 đ đdocument.getElementById('budgetGlobalProgress').style.borderColor = globalAvailable < 0 ? '#ef4444' : '#10b981';
 đ đdocument.getElementById('budgetGlobalProgress').style.borderBottomColor = 'transparent';
 đ đdocument.getElementById('budgetGlobalProgress').style.borderRightColor = 'transparent';
}

function openAddBudget() {
 đ đdocument.getElementById('editBudgetId').value = '';
 đ đdocument.getElementById('budgetAmount').value = '';
 đ đdocument.getElementById('budgetCatId').value = '';
 đ đdocument.getElementById('budgetCategoryName').innerText = 'Chá»n nhÃ³m';
 đ đdocument.getElementById('budgetCategoryIcon').innerHTML = '<i class="fas fa-question"></i>';
 đ đdocument.getElementById('budgetCategoryIcon').style.background = '#e5e7eb';
 đ đdocument.getElementById('budgetCategoryIcon').style.color = '#9ca3af';
 đ đdocument.getElementById('btnDeleteBudget').style.display = 'none';
 đ đdocument.getElementById('budgetTitle').innerText = 'ThÃªm ngÃ¢n sÃ¡ch';
 đ đ
 đ đswitchPage('add-budget');
}

function openBudgetCategoryPicker() {
 đ đwindow.isPickingForBudget = true;
 đ đ// Reuse the existing category picker overlay
 đ đconst list = document.getElementById('txnCategoryPickerList');
 đ đif (!list) return;
 đ đconst cats = userCategories['expense'] || [];
 đ đlist.innerHTML = generateCategoryListHTML(cats, null, 'selectCategory');
 đ đdocument.getElementById('txnCategoryPickerOverlay').style.display = 'flex';
}


function saveBudget() {
 đ đconst id = document.getElementById('editBudgetId').value;
 đ đconst catId = document.getElementById('budgetCatId').value;
 đ đconst amountStr = document.getElementById('budgetAmount').value.replace(/\./g, '');
 đ đconst amount = parseInt(amountStr);
 đ đconst isRepeat = document.getElementById('budgetRepeat').checked;
 đ đconst walletId = document.getElementById('budgetWalletId') ? document.getElementById('budgetWalletId').value : 'all';

 đ đif (!catId) return alert('Vui lÃ²ng chá»n nhÃ³m chi tiÃªu!');
 đ đif (!amount || amount <= 0) return alert('Vui lÃ²ng nháº­p sá»‘ tiá»n há»£p lá»‡!');

 đ đif (id) {
 đ đ đ đconst b = budgets.find(x => x.id === id);
 đ đ đ đif (b) {
 đ đ đ đ đ đb.categoryId = catId;
 đ đ đ đ đ đb.amount = amount;
 đ đ đ đ đ đb.isRepeating = isRepeat;
 đ đ đ đ đ đb.walletId = walletId;
 đ đ đ đ}
 đ đ} else {
 đ đ đ đshowToast('Đã tạo ngân sách!', 'success');
budgets.push({
 đ đ đ đ đ đid: 'b_' + Date.now(),
 đ đ đ đ đ đcategoryId: catId,
 đ đ đ đ đ đwalletId: walletId,
 đ đ đ đ đ đamount: amount,
 đ đ đ đ đ đisRepeating: isRepeat,
 đ đ đ đ đ đcreatedAt: new Date().toISOString()
 đ đ đ đ});
 đ đ}

 đ đsyncData();
 đ đrenderBudgetsPage();
 đ đswitchPage('budgets');
}

let currentDetailBudgetId = null;

function openBudgetDetail(id) {
 đ đconst b = budgets.find(x => x.id === id);
 đ đif (!b) return;
 đ đcurrentDetailBudgetId = id;
 đ đ
 đ đlet catObj = null;
 đ đif (userCategories && userCategories.expense) {
 đ đ đ đuserCategories.expense.forEach(c => { if(c.id === b.categoryId) catObj = c; });
 đ đ}
 đ đconst icon = catObj ? catObj.icon : 'ðŸ’°';
 đ đconst name = catObj ? catObj.name : 'Tá»•ng cá»™ng';
 đ đconst color = catObj ? catObj.color : '#10b981';

 đ đconst today = new Date();
 đ đconst currentMonth = today.getMonth();
 đ đconst currentYear = today.getFullYear();
 đ đconst lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
 đ đconst daysLeft = lastDayOfMonth - today.getDate();
 đ đconst daysPassed = today.getDate();

 đ đconst spent = getBudgetSpent(b);

 đ đconst remain = b.amount - spent;
 đ đlet percent = (spent / b.amount) * 100;
 đ đif (percent > 100) percent = 100;
 đ đ
 đ đlet timePercent = (daysPassed / lastDayOfMonth) * 100;

 đ đdocument.getElementById('detailBudgetIcon').innerHTML = icon;
 đ đdocument.getElementById('detailBudgetIcon').style.background = color;
 đ đdocument.getElementById('detailBudgetCategory').innerText = name;
 đ đdocument.getElementById('detailBudgetAmount').innerText = formatMoney(b.amount);
 đ đdocument.getElementById('detailBudgetSpent').innerText = formatMoney(spent);
 đ đdocument.getElementById('detailBudgetRemain').innerText = formatMoney(remain);
 đ đ
 đ đdocument.getElementById('detailBudgetBar').style.width = percent + '%';
 đ đdocument.getElementById('detailBudgetBar').style.background = remain < 0 ? '#ef4444' : color;
 đ đdocument.getElementById('detailBudgetTodayMarker').style.left = timePercent + '%';
 đ đdocument.getElementById('detailBudgetTodayText').style.left = timePercent + '%';

 đ đconst monthStr = (currentMonth + 1).toString().padStart(2, '0');
 đ đdocument.getElementById('detailBudgetDateRange').innerText =  đ01/${monthStr} - ${lastDayOfMonth}/${monthStr} đ;
 đ đdocument.getElementById('detailBudgetDaysLeft').innerText =  đCÃ²n ${daysLeft} ngÃ y đ;
 đ đdocument.getElementById('detailBudgetRepeatText').innerText = b.isRepeating ? 'NgÃ¢n sÃ¡ch Ä‘Æ°á»£c tá»± Ä‘á»™ng láº·p láº¡i á»Ÿ ká»³ háº¡n tiáº¿p theo.' : 'NgÃ¢n sÃ¡ch khÃ´ng láº·p láº¡i.';

 đ đconst recDaily = remain > 0 && daysLeft > 0 ? remain / daysLeft : 0;
 đ đconst actualDaily = daysPassed > 0 ? spent / daysPassed : 0;
 đ đconst projected = actualDaily * lastDayOfMonth;

 đ đdocument.getElementById('detailBudgetRecDaily').innerText = formatMoney(Math.round(recDaily));
 đ đdocument.getElementById('detailBudgetActualDaily').innerText = formatMoney(Math.round(actualDaily));
 đ đdocument.getElementById('detailBudgetProjected').innerText = formatMoney(Math.round(projected));

 đ đswitchPage('budget-detail');
}

function editBudgetFromDetail() {
 đ đconst b = budgets.find(x => x.id === currentDetailBudgetId);
 đ đif (!b) return;

 đ đlet catObj = null;
 đ đif (userCategories && userCategories.expense) {
 đ đ đ đuserCategories.expense.forEach(c => { if(c.id === b.categoryId) catObj = c; });
 đ đ}
 đ đconst icon = catObj ? catObj.icon : 'ðŸ’°';
 đ đconst name = catObj ? catObj.name : 'Tá»•ng cá»™ng';
 đ đconst color = catObj ? catObj.color : '#10b981';

 đ đdocument.getElementById('editBudgetId').value = b.id;
 đ đdocument.getElementById('budgetCatId').value = b.categoryId;
 đ đdocument.getElementById('budgetCategoryName').innerText = name;
 đ đdocument.getElementById('budgetCategoryIcon').innerHTML = icon;
 đ đdocument.getElementById('budgetCategoryIcon').style.background = color;
 đ đdocument.getElementById('budgetCategoryIcon').style.color = 'white';
 đ đ
 đ đdocument.getElementById('budgetAmount').value = formatMoney(b.amount).replace(/Ä‘/g, '').trim();
 đ đdocument.getElementById('budgetRepeat').checked = !!b.isRepeating;

 đ đdocument.getElementById('budgetTitle').innerText = 'Sá»­a ngÃ¢n sÃ¡ch';
 đ đdocument.getElementById('btnDeleteBudget').style.display = 'block';

 đ đswitchPage('add-budget');
}

function deleteBudget() {
 đ đif (confirm('Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a ngÃ¢n sÃ¡ch nÃ y?')) {
 đ đ đ đconst id = document.getElementById('editBudgetId').value;
 đ đ đ đbudgets = budgets.filter(x => x.id !== id);
 đ đ đ đsyncData();
 đ đ đ đrenderBudgetsPage();
 đ đ đ đswitchPage('budgets');
 đ đ}
}

// === BUDGET WALLET PICKER (centered modal) ===
function openBudgetWalletPicker() {
 đ đlet existing = document.getElementById('budgetWalletOverlay');
 đ đif (existing) existing.remove();
 đ đ
 đ đconst currentWalletId = document.getElementById('budgetWalletId').value;
 đ đlet listHtml = '';
 đ đ
 đ đconst allCheck = currentWalletId === 'all' ? '<i class="fas fa-check" style="color:#10b981; font-size:14px;"></i>' : '';
 đ đlistHtml +=  đ<div onclick="selectBudgetWallet('all')" style="display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; background:${currentWalletId === 'all' ? '#f0fdf4' : 'transparent'};"><div style="font-size:22px;">ðŸŒ</div><div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">Tá»•ng cá»™ng</div>${allCheck}</div> đ;
 đ đ
 đ đwallets.forEach(w => {
 đ đ đ đconst check = currentWalletId === w.id ? '<i class="fas fa-check" style="color:#10b981; font-size:14px;"></i>' : '';
 đ đ đ đlistHtml +=  đ<div onclick="selectBudgetWallet('${w.id}')" style="display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; background:${currentWalletId === w.id ? '#f0fdf4' : 'transparent'};"><div style="font-size:22px;">${w.emoji||'ðŸ’³'}</div><div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">${w.name}</div>${check}</div> đ;
 đ đ});
 đ đ
 đ đconst overlay = document.createElement('div');
 đ đoverlay.id = 'budgetWalletOverlay';
 đ đoverlay.style.cssText = 'display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.45); z-index:4000; justify-content:center; align-items:center;';
 đ đoverlay.innerHTML =  đ
 đ đ đ đ<div style="background:white; width:90%; max-width:380px; border-radius:20px; padding:0 0 20px 0; max-height:70vh; display:flex; flex-direction:column; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
 đ đ đ đ đ đ<div style="display:flex; justify-content:space-between; align-items:center; padding:18px 20px 14px; border-bottom:1px solid #f3f4f6; flex-shrink:0;">
 đ đ đ đ đ đ đ đ<h3 style="font-size:16px; font-weight:700; margin:0;">Chá»n vÃ­</h3>
 đ đ đ đ đ đ đ đ<button onclick="closeBudgetWalletPicker()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888;">âœ•</button>
 đ đ đ đ đ đ</div>
 đ đ đ đ đ đ<div style="flex:1; overflow-y:auto;">${listHtml}</div>
 đ đ đ đ</div> đ;
 đ đoverlay.addEventListener('click', function(e) { if (e.target === overlay) closeBudgetWalletPicker(); });
 đ đdocument.body.appendChild(overlay);
}

function closeBudgetWalletPicker() {
 đ đconst el = document.getElementById('budgetWalletOverlay');
 đ đif (el) el.remove();
}

function selectBudgetWallet(id) {
 đ đdocument.getElementById('budgetWalletId').value = id;
 đ đif (id === 'all') {
 đ đ đ đdocument.getElementById('budgetWalletName').innerText = 'Tá»•ng cá»™ng';
 đ đ} else {
 đ đ đ đconst w = wallets.find(x => x.id === id);
 đ đ đ đdocument.getElementById('budgetWalletName').innerText = w ? w.name : 'Tá»•ng cá»™ng';
 đ đ}
 đ đcloseBudgetWalletPicker();
}

// === BUDGET GLOBAL WALLET PICKER (dashboard header) ===
let budgetGlobalWalletFilter = 'all';

function openBudgetGlobalWalletPicker() {
 đ đlet existing = document.getElementById('budgetGlobalWalletOverlay');
 đ đif (existing) existing.remove();
 đ đ
 đ đlet listHtml = '';
 đ đconst allCheck = budgetGlobalWalletFilter === 'all' ? '<i class="fas fa-check" style="color:#10b981; font-size:14px;"></i>' : '';
 đ đlistHtml +=  đ<div onclick="selectBudgetGlobalWallet('all')" style="display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; background:${budgetGlobalWalletFilter === 'all' ? '#f0fdf4' : 'transparent'};"><div style="font-size:22px;">ðŸŒ</div><div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">Tá»•ng cá»™ng</div>${allCheck}</div> đ;
 đ đ
 đ đwallets.forEach(w => {
 đ đ đ đconst check = budgetGlobalWalletFilter === w.id ? '<i class="fas fa-check" style="color:#10b981; font-size:14px;"></i>' : '';
 đ đ đ đlistHtml +=  đ<div onclick="selectBudgetGlobalWallet('${w.id}')" style="display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; background:${budgetGlobalWalletFilter === w.id ? '#f0fdf4' : 'transparent'};"><div style="font-size:22px;">${w.emoji||'ðŸ’³'}</div><div style="flex:1; font-size:15px; font-weight:500; color:#1f2937;">${w.name}</div>${check}</div> đ;
 đ đ});
 đ đ
 đ đconst overlay = document.createElement('div');
 đ đoverlay.id = 'budgetGlobalWalletOverlay';
 đ đoverlay.style.cssText = 'display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.45); z-index:4000; justify-content:center; align-items:center;';
 đ đoverlay.innerHTML =  đ
 đ đ đ đ<div style="background:white; width:90%; max-width:380px; border-radius:20px; padding:0 0 20px 0; max-height:70vh; display:flex; flex-direction:column; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
 đ đ đ đ đ đ<div style="display:flex; justify-content:space-between; align-items:center; padding:18px 20px 14px; border-bottom:1px solid #f3f4f6; flex-shrink:0;">
 đ đ đ đ đ đ đ đ<h3 style="font-size:16px; font-weight:700; margin:0;">Lá»c theo vÃ­</h3>
 đ đ đ đ đ đ đ đ<button onclick="closeBudgetGlobalWalletPicker()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888;">âœ•</button>
 đ đ đ đ đ đ</div>
 đ đ đ đ đ đ<div style="flex:1; overflow-y:auto;">${listHtml}</div>
 đ đ đ đ</div> đ;
 đ đoverlay.addEventListener('click', function(e) { if (e.target === overlay) closeBudgetGlobalWalletPicker(); });
 đ đdocument.body.appendChild(overlay);
}

function closeBudgetGlobalWalletPicker() {
 đ đconst el = document.getElementById('budgetGlobalWalletOverlay');
 đ đif (el) el.remove();
}

function selectBudgetGlobalWallet(id) {
 đ đbudgetGlobalWalletFilter = id;
 đ đif (id === 'all') {
 đ đ đ đdocument.getElementById('budgetGlobalWalletLabel').innerText = 'Tá»•ng';
 đ đ đ đdocument.getElementById('budgetGlobalWalletIcon').className = 'fas fa-globe';
 đ đ} else {
 đ đ đ đconst w = wallets.find(x => x.id === id);
 đ đ đ đdocument.getElementById('budgetGlobalWalletLabel').innerText = w ? w.name : 'Tá»•ng';
 đ đ đ đdocument.getElementById('budgetGlobalWalletIcon').className = 'fas fa-wallet';
 đ đ}
 đ đcloseBudgetGlobalWalletPicker();
 đ đrenderBudgetsPage();
}

// === BUDGET PERIOD PICKER (centered modal) ===
function openBudgetPeriodPicker() {
 đ đlet existing = document.getElementById('budgetPeriodOverlay');
 đ đif (existing) existing.remove();
 đ đ
 đ đconst periods = getPeriods();
 đ đconst now = new Date();
 đ đlet listHtml = '';
 đ đ
 đ đperiods.forEach((p, i) => {
 đ đ đ đconst label = formatDate(p.start) + ' - ' + formatDate(p.end);
 đ đ đ đconst isThisMonth = now >= p.start && now <= new Date(p.end.getTime() + 86399999);
 đ đ đ đconst displayLabel = isThisMonth ? 'ThÃ¡ng nÃ y (' + label + ')' : label;
 đ đ đ đlistHtml += '<div onclick="selectBudgetPeriod(\'' + p.start.toISOString() + '\', \'' + p.end.toISOString() + '\', \'' + displayLabel.replace(/'/g, "\\'") + '\')" style="display:flex; align-items:center; padding:14px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; font-size:15px; color:#1f2937; font-weight:' + (isThisMonth ? '600' : '400') + '; background:' + (isThisMonth ? '#f0fdf4' : 'transparent') + ';">' + displayLabel + '</div>';
 đ đ});
 đ đ
 đ đconst overlay = document.createElement('div');
 đ đoverlay.id = 'budgetPeriodOverlay';
 đ đoverlay.style.cssText = 'display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.45); z-index:4000; justify-content:center; align-items:center;';
 đ đoverlay.innerHTML = '<div style="background:white; width:90%; max-width:380px; border-radius:20px; padding:0 0 20px 0; max-height:70vh; display:flex; flex-direction:column; box-shadow:0 10px 25px rgba(0,0,0,0.2);"><div style="display:flex; justify-content:space-between; align-items:center; padding:18px 20px 14px; border-bottom:1px solid #f3f4f6; flex-shrink:0;"><h3 style="font-size:16px; font-weight:700; margin:0;">Chá»n giai Ä‘oáº¡n</h3><button onclick="closeBudgetPeriodPicker()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888;">âœ•</button></div><div style="flex:1; overflow-y:auto;">' + listHtml + '</div></div>';
 đ đoverlay.addEventListener('click', function(e) { if (e.target === overlay) closeBudgetPeriodPicker(); });
 đ đdocument.body.appendChild(overlay);
}

function closeBudgetPeriodPicker() {
 đ đconst el = document.getElementById('budgetPeriodOverlay');
 đ đif (el) el.remove();
}

function selectBudgetPeriod(startStr, endStr, label) {
 đ đdocument.getElementById('budgetPeriodStr').innerText = label;
 đ đdocument.getElementById('budgetPeriodStart').value = startStr;
 đ đdocument.getElementById('budgetPeriodEnd').value = endStr;
 đ đcloseBudgetPeriodPicker();
}

// Hook renderBudgetsPage into renderAll
if (typeof originalRenderAll === 'undefined') {
 đ đwindow.originalRenderAll = renderAll;
 đ đwindow.renderAll = function(force = false) {
 đ đ đ đwindow.originalRenderAll(force);
 đ đ đ đif (document.getElementById('page-budgets').classList.contains('active')) {
 đ đ đ đ đ đrenderBudgetsPage();
 đ đ đ đ}
 đ đ};
}

function formatMoney(amount) { return formatCurrency(amount, 'VND'); }




/* === TOAST NOTIFICATION SYSTEM === */
function showToast(message, type = 'info', duration = 3000) {
 đ đconst container = document.getElementById('toastContainer');
 đ đif (!container) return;
 đ đ
 đ đconst toast = document.createElement('div');
 đ đtoast.className = 'toast ' + type;
 đ đ
 đ đlet icon = 'info-circle';
 đ đif (type === 'success') icon = 'check-circle';
 đ đif (type === 'warning') icon = 'exclamation-triangle';
 đ đif (type === 'error') icon = 'times-circle';
 đ đ
 đ đtoast.innerHTML = '<i class="fas fa-' + icon + ' toast-icon"></i><div class="toast-message">' + message + '</div>';
 đ đ
 đ đcontainer.appendChild(toast);
 đ đ
 đ đ// Auto remove
 đ đsetTimeout(() => {
 đ đ đ đtoast.style.animation = 'toastOut 0.3s forwards';
 đ đ đ đsetTimeout(() => toast.remove(), 300);
 đ đ}, duration);
}


function checkBudgetsThreshold(txn) {
 đ đif (txn.type !== 'expense' || txn.excluded) return;
 đ đ
 đ đbudgets.forEach(b => {
 đ đ đ đconst matchIds = getBudgetCategoryIds(b.categoryId);
 đ đ đ đconst isRelevant = b.categoryId === 'all' || matchIds.has(txn.categoryId) || matchIds.has(txn.category);
 đ đ đ đ
 đ đ đ đif (isRelevant) {
 đ đ đ đ đ đconst spent = getBudgetSpent(b);
 đ đ đ đ đ đconst percent = (spent / b.amount) * 100;
 đ đ đ đ đ đ
 đ đ đ đ đ đlet catName = 'NhÃ³m chi tiÃªu';
 đ đ đ đ đ đif (b.categoryId === 'all') {
 đ đ đ đ đ đ đ đcatName = 'Tá»•ng ngÃ¢n sÃ¡ch';
 đ đ đ đ đ đ} else {
 đ đ đ đ đ đ đ đconst cat = (userCategories.expense || []).find(c => c.id === b.categoryId);
 đ đ đ đ đ đ đ đif (cat) catName = cat.name;
 đ đ đ đ đ đ}

 đ đ đ đ đ đif (spent > b.amount) {
 đ đ đ đ đ đ đ đconst overAmount = spent - b.amount;
 đ đ đ đ đ đ đ đshowToast('BÁO ĐỘNG: Ngân sách [' + catName + '] đã VƯỢT ' + formatMoney(overAmount) + '!', 'error', 6000);
 đ đ đ đ đ đ} else if (percent >= 100) {
 đ đ đ đ đ đ đ đshowToast('Cảnh báo: Ngân sách [' + catName + '] đã hết sạch!', 'error', 5000);
 đ đ đ đ đ đ} else if (percent >= 90) {
 đ đ đ đ đ đ đ đshowToast('Sắp hết: Ngân sách [' + catName + '] đã dùng ' + Math.round(percent) + '%', 'warning', 4000);
 đ đ đ đ đ đ}
 đ đ đ đ}
 đ đ});
}


