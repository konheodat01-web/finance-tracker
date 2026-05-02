// === STATE ===
let wallets = [];
let isBalanceVisible = true;
let currentTab = 'expense';
let editModeActive = false;
let selectedWalletId = null;
let chartInstance = null;
let selectedIcon = '💰';
let prevPage = 'accounts';

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
    // 1. Lưu local trước
    const data = { wallets, isBalanceVisible };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // 2. Đẩy lên Firebase nếu đã kết nối
    if (database) {
        database.ref('user_data').set(data);
    }
}

function loadData() {
    // 1. Ưu tiên tải từ Local Storage trước để app hiện nhanh
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const data = JSON.parse(saved);
        wallets = data.wallets || [];
        isBalanceVisible = data.isBalanceVisible !== undefined ? data.isBalanceVisible : true;
    }

    // 2. Nếu có Firebase, lắng nghe thay đổi thời gian thực
    if (database) {
        database.ref('user_data').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                wallets = data.wallets || [];
                isBalanceVisible = data.isBalanceVisible !== undefined ? data.isBalanceVisible : true;
                // Lưu ngược lại vào local cho lần sau
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

    // Hide bottom nav on add-wallet page
    const bottomNav = document.querySelector('.bottom-nav');
    if (pageName === 'add-wallet') {
        bottomNav.style.display = 'none';
    } else {
        bottomNav.style.display = 'flex';
    }

    renderAll();
}

// === RENDER ===
function renderAll() {
    renderHomeWallets();
    renderAccountsPage();
    updateBalanceDisplays();
}

function updateBalanceDisplays() {
    const total = getTotalBalance();
    document.getElementById('mainTotalBalance').innerText = formatCurrency(total, 'VND').replace(' đ', '');
    document.getElementById('accountsTotalBalance').innerText = formatCurrency(total, 'VND');
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
