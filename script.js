document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. STATE MANAGEMENT (LocalStorage) ---
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let userProfile = JSON.parse(localStorage.getItem('userProfile')) || { name: 'Alex Thompson', currency: '$' };
    let myChart = null;

    // --- 2. DOM ELEMENTS ---
    const tableBody = document.getElementById('transactionTableBody');
    const balanceEl = document.getElementById('displayBalance');
    const incomeEl = document.getElementById('displayIncome');
    const expenseEl = document.getElementById('displayExpense');
    const countEl = document.getElementById('displayCount');
    
    // Settings Elements
    const topbarName = document.getElementById('topbarName');
    const settingsForm = document.getElementById('settingsForm');
    const settingNameInput = document.getElementById('settingName');
    const settingCurrencyInput = document.getElementById('settingCurrency');

    // Modal Elements
    const modal = document.getElementById('transactionModal');
    const addBtn = document.getElementById('openAddModalBtn');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('transactionForm');
    const modalTitle = document.getElementById('modalTitle');
    const searchInput = document.getElementById('searchInput');

    // --- 3. INITIALIZATION ---
    function initProfile() {
        // Apply profile to UI
        topbarName.innerText = userProfile.name;
        settingNameInput.value = userProfile.name;
        settingCurrencyInput.value = userProfile.currency;
    }
    initProfile();

    const generateID = () => Math.floor(Math.random() * 1000000000);

    // --- 4. CRUD OPERATIONS ---
    function updateUI(dataToRender = transactions) {
        tableBody.innerHTML = ''; 
        
        let totalIncome = 0;
        let totalExpense = 0;
        const cur = userProfile.currency;

        dataToRender.forEach(tx => {
            if (tx.type === 'income') {
                totalIncome += tx.amount;
            } else {
                totalExpense += tx.amount;
            }

            const sign = tx.type === 'income' ? '+' : '-';
            const colorClass = tx.type === 'income' ? 'text-green' : 'text-red';
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${tx.date}</td>
                <td><strong>${tx.description}</strong></td>
                <td><span class="tag">${tx.category}</span></td>
                <td class="${colorClass}">${sign}${cur}${tx.amount.toFixed(2)}</td>
                <td>
                    <button class="action-btn btn-edit" onclick="editTransaction(${tx.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn btn-delete" onclick="deleteTransaction(${tx.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Update Summary Cards with correct currency
        const balance = totalIncome - totalExpense;
        balanceEl.innerText = `${balance < 0 ? '-' : ''}${cur}${Math.abs(balance).toFixed(2)}`;
        incomeEl.innerText = `${cur}${totalIncome.toFixed(2)}`;
        expenseEl.innerText = `${cur}${totalExpense.toFixed(2)}`;
        countEl.innerText = dataToRender.length;

        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateChart(totalIncome, totalExpense);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('txId').value;
        const type = document.getElementById('txType').value;
        const description = document.getElementById('txDescription').value;
        const amount = parseFloat(document.getElementById('txAmount').value);
        const date = document.getElementById('txDate').value;
        const category = document.getElementById('txCategory').value;

        const newTx = {
            id: id ? parseInt(id) : generateID(),
            type, description, amount, date, category
        };

        if (id) {
            transactions = transactions.map(tx => tx.id === newTx.id ? newTx : tx);
        } else {
            transactions.push(newTx);
        }
        
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        closeModal();
        updateUI();
    });

    window.deleteTransaction = (id) => {
        if(confirm('Are you sure you want to delete this transaction?')) {
            transactions = transactions.filter(tx => tx.id !== id);
            updateUI();
        }
    };

    window.editTransaction = (id) => {
        const tx = transactions.find(t => t.id === id);
        if(!tx) return;

        document.getElementById('txId').value = tx.id;
        document.getElementById('txType').value = tx.type;
        document.getElementById('txDescription').value = tx.description;
        document.getElementById('txAmount').value = tx.amount;
        document.getElementById('txDate').value = tx.date;
        document.getElementById('txCategory').value = tx.category;

        modalTitle.innerText = "Edit Transaction";
        modal.classList.add('active');
    };

    // --- 5. SETTINGS FORM LOGIC ---
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        userProfile = {
            name: settingNameInput.value,
            currency: settingCurrencyInput.value
        };
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        
        initProfile(); // Update header
        updateUI();    // Redraw table and cards with new currency
        alert('Settings saved successfully!');
    });

    // --- 6. UI INTERACTIVITY ---
    const openModal = () => {
        form.reset();
        document.getElementById('txId').value = ''; 
        document.getElementById('txDate').valueAsDate = new Date();
        modalTitle.innerText = "Add Transaction";
        modal.classList.add('active');
    };
    const closeModal = () => modal.classList.remove('active');

    addBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = transactions.filter(tx => 
            tx.description.toLowerCase().includes(term) || 
            tx.category.toLowerCase().includes(term)
        );
        updateUI(filtered);
    });

    document.getElementById('resetDataBtn').addEventListener('click', () => {
        if(confirm('WARNING: This will delete all your transaction data permanently!')) {
            transactions = [];
            updateUI();
        }
    });

    // --- 7. CHART.JS ---
    function updateChart(income, expense) {
        const ctx = document.getElementById('cashFlowChart').getContext('2d');
        if (myChart) { myChart.destroy(); }
        myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Income vs Expenses'],
                datasets: [
                    { label: 'Income', data: [income], backgroundColor: '#166534', borderRadius: 4 },
                    { label: 'Expenses', data: [expense], backgroundColor: '#991b1b', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { position: 'top' } }
            }
        });
    }

    // --- 8. THEME & NAVIGATION ---
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        darkModeToggle.checked = true;
    }
    darkModeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    });

    const navItems = document.querySelectorAll('.nav-menu .nav-item[data-target]');
    const views = document.querySelectorAll('.view-section');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-menu .nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            views.forEach(view => view.classList.remove('active'));
            document.getElementById(item.getAttribute('data-target')).classList.add('active');
        });
    });

    
    // Initial Render
    updateUI();

    function applyFilters() {
        const term = searchInput.value.toLowerCase();
        const filterType = typeFilter.value; // 'all', 'income', or 'expense'

        const filtered = transactions.filter(tx => {
            // Check if it matches the text search
            const matchesSearch = tx.description.toLowerCase().includes(term) || 
                                  tx.category.toLowerCase().includes(term);
            
            // Check if it matches the dropdown filter
            const matchesType = (filterType === 'all') || (tx.type === filterType);
            
            // Only show transactions that pass BOTH checks
            return matchesSearch && matchesType;
        });
        
        updateUI(filtered);
    }
    searchInput.addEventListener('input', applyFilters);
    
    // Listen for changes in the dropdown
    typeFilter.addEventListener('change', applyFilters);

    
});

