// API Base URL
const API_URL = 'http://localhost:5000';

// Navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    
    // Add active class to clicked nav item
    event.target.closest('.nav-item').classList.add('active');
    
    // Load data for the page
    switch(pageId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsers();
            break;
        case 'tasks':
            loadTasks();
            break;
        case 'withdraw':
            loadWithdrawals();
            loadWithdrawalLimit();
            break;
        case 'info':
            loadConversionRatio();
            loadExchangeRates();
            break;
    }
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        // Load total users
        const usersRes = await fetch(`${API_URL}/get_all_user_details`);
        const usersData = await usersRes.json();
        document.getElementById('totalUsers').textContent = usersData.length || 0;
        
        // Load total tasks
        const tasksRes = await fetch(`${API_URL}/get_user_tasks?userid=1`);
        const tasksData = await tasksRes.json();
        document.getElementById('totalTasks').textContent = tasksData.task_details?.length || 0;
        
        // Load pending withdrawals
        const withdrawalsRes = await fetch(`${API_URL}/get_withdrawals`);
        const withdrawalsData = await withdrawalsRes.json();
        document.getElementById('totalWithdrawals').textContent = withdrawalsData.withdrawals?.length || 0;
        
        // Load conversion ratio
        const ratioRes = await fetch(`${API_URL}/get_ratio`);
        const ratioData = await ratioRes.json();
        document.getElementById('conversionRatio').textContent = ratioData.ratio || '1000';
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Users Functions
let allUsers = [];

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/get_all_user_details`);
        const data = await response.json();
        allUsers = data;
        displayUsers(allUsers);
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = `
            <tr><td colspan="7" class="text-center py-8 text-red-500">Error loading users</td></tr>
        `;
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7" class="text-center py-8 text-gray-500">No users found</td></tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td class="font-mono text-sm">${user.UserId || 'N/A'}</td>
            <td class="font-medium">${user.Username || 'N/A'}</td>
            <td class="font-mono text-xs">${user.walletid ? user.walletid.substring(0, 20) + '...' : 'Not Set'}</td>
            <td class="font-semibold text-blue-600">${(user.totalgot || 0).toLocaleString()}</td>
            <td class="font-semibold text-green-600">${(user.totalcollectabledaily || 0).toLocaleString()}</td>
            <td class="font-semibold text-purple-600">${user.Refertotal || 0}</td>
            <td>
                <button onclick="viewUserDetails('${user.UserId}')" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function searchUsers() {
    const userIdSearch = document.getElementById('searchUserId').value.toLowerCase();
    const usernameSearch = document.getElementById('searchUsername').value.toLowerCase();
    const walletSearch = document.getElementById('searchWallet').value.toLowerCase();
    
    const filtered = allUsers.filter(user => {
        const matchUserId = !userIdSearch || (user.UserId && user.UserId.toString().toLowerCase().includes(userIdSearch));
        const matchUsername = !usernameSearch || (user.Username && user.Username.toLowerCase().includes(usernameSearch));
        const matchWallet = !walletSearch || (user.walletid && user.walletid.toLowerCase().includes(walletSearch));
        
        return matchUserId && matchUsername && matchWallet;
    });
    
    displayUsers(filtered);
}

function viewUserDetails(userId) {
    const user = allUsers.find(u => u.UserId === userId);
    if (user) {
        alert(`User Details:\n\nUser ID: ${user.UserId}\nUsername: ${user.Username}\nTotal Points: ${user.totalgot}\nTWS Balance: ${user.totalcollectabledaily}\nReferrals: ${user.Refertotal}\nWallet: ${user.walletid || 'Not Set'}`);
    }
}

// Tasks Functions
async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/get_user_tasks?userid=1`);
        const data = await response.json();
        
        const tasksList = document.getElementById('tasksList');
        
        if (!data.task_details || data.task_details.length === 0) {
            tasksList.innerHTML = '<p class="text-gray-500">No tasks available</p>';
            return;
        }
        
        tasksList.innerHTML = data.task_details.map(task => `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                    <div class="flex items-start gap-3 flex-1">
                        <img src="${task.taskimage}" alt="${task.tasktitle}" class="w-12 h-12 rounded-lg object-cover">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-800">${task.tasktitle}</h4>
                            <p class="text-sm text-gray-600 mt-1">Reward: <span class="font-semibold text-green-600">${task.taskreward} MTWS</span></p>
                            <a href="${task.tasklink}" target="_blank" class="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block">
                                <i class="fas fa-external-link-alt mr-1"></i>View Link
                            </a>
                        </div>
                    </div>
                    <button onclick="deleteTask(${task.taskid})" class="text-red-600 hover:text-red-800 ml-2">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading tasks:', error);
        document.getElementById('tasksList').innerHTML = '<p class="text-red-500">Error loading tasks</p>';
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        const response = await fetch(`${API_URL}/remove_task?taskid=${taskId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Task deleted successfully!');
            loadTasks();
        } else {
            alert('Failed to delete task');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Error deleting task');
    }
}

// Add Task Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('tasktitle', document.getElementById('taskTitle').value);
            formData.append('taskreward', document.getElementById('taskReward').value);
            formData.append('tasklink', document.getElementById('taskLink').value);
            formData.append('taskimage', document.getElementById('taskImage').files[0]);
            
            try {
                const response = await fetch(`${API_URL}/add_task`, {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    alert('Task added successfully!');
                    addTaskForm.reset();
                    loadTasks();
                } else {
                    alert('Failed to add task');
                }
            } catch (error) {
                console.error('Error adding task:', error);
                alert('Error adding task');
            }
        });
    }
    
    // Load dashboard data on page load
    loadDashboardData();
});

// Withdrawals Functions
async function loadWithdrawals() {
    try {
        const response = await fetch(`${API_URL}/get_withdrawals`);
        const data = await response.json();
        
        const tbody = document.getElementById('withdrawalsTableBody');
        
        if (!data.withdrawals || data.withdrawals.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="5" class="text-center py-8 text-gray-500">No pending withdrawals</td></tr>
            `;
            return;
        }
        
        tbody.innerHTML = data.withdrawals.map(withdrawal => `
            <tr>
                <td class="font-mono">#${withdrawal.id}</td>
                <td class="font-mono text-sm">${withdrawal.user_id}</td>
                <td class="font-semibold text-green-600">${parseFloat(withdrawal.amount).toLocaleString()}</td>
                <td class="font-mono text-xs">${withdrawal.address.substring(0, 30)}...</td>
                <td>
                    <button onclick="processWithdrawal(${withdrawal.id}, '${withdrawal.user_id}')" class="btn-success px-4 py-2 text-sm">
                        <i class="fas fa-check mr-2"></i>Done
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading withdrawals:', error);
        document.getElementById('withdrawalsTableBody').innerHTML = `
            <tr><td colspan="5" class="text-center py-8 text-red-500">Error loading withdrawals</td></tr>
        `;
    }
}

async function loadWithdrawalLimit() {
    try {
        const response = await fetch(`${API_URL}/get_withdrawal_limit`);
        const data = await response.json();
        document.getElementById('withdrawalLimit').value = data.withdrawal_limit || '100';
    } catch (error) {
        console.error('Error loading withdrawal limit:', error);
    }
}

async function updateWithdrawalLimit() {
    const limit = document.getElementById('withdrawalLimit').value;
    
    if (!limit || limit <= 0) {
        alert('Please enter a valid withdrawal limit');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/update_withdrawal_limit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ withdrawal_limit: limit })
        });
        
        if (response.ok) {
            alert('Withdrawal limit updated successfully!');
        } else {
            alert('Failed to update withdrawal limit');
        }
    } catch (error) {
        console.error('Error updating withdrawal limit:', error);
        alert('Error updating withdrawal limit');
    }
}

async function processWithdrawal(withdrawalId, userId) {
    if (!confirm('Are you sure you want to process this withdrawal? This will reset the user\'s TWS balance to 0.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/delete_withdrawal?withdrawal_id=${withdrawalId}&user_id=${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const data = await response.json();
            alert(`Withdrawal processed successfully!\nAmount: ${data.withdrawal_amount} TWS\nUser balance reset to 0`);
            loadWithdrawals();
            loadDashboardData();
        } else {
            alert('Failed to process withdrawal');
        }
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        alert('Error processing withdrawal');
    }
}

// Info & Settings Functions
async function loadConversionRatio() {
    try {
        const response = await fetch(`${API_URL}/get_ratio`);
        const data = await response.json();
        document.getElementById('conversionRatioInput').value = data.ratio || '1000';
    } catch (error) {
        console.error('Error loading conversion ratio:', error);
    }
}

async function updateConversionRatio() {
    const ratio = document.getElementById('conversionRatioInput').value;
    
    if (!ratio || ratio <= 0) {
        alert('Please enter a valid conversion ratio');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/update_ratio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ratio: ratio })
        });
        
        if (response.ok) {
            alert('Conversion ratio updated successfully!');
            loadDashboardData();
        } else {
            alert('Failed to update conversion ratio');
        }
    } catch (error) {
        console.error('Error updating conversion ratio:', error);
        alert('Error updating conversion ratio');
    }
}

async function loadExchangeRates() {
    try {
        const response = await fetch(`${API_URL}/get_exchange_rates`);
        const data = await response.json();
        
        const container = document.getElementById('exchangeRatesList');
        
        if (!data.exchange_rates || data.exchange_rates.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No exchange rates configured</p>';
            return;
        }
        
        container.innerHTML = data.exchange_rates.map((rate, index) => `
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-3">
                <div class="flex items-center gap-4">
                    <span class="font-semibold text-lg text-blue-600">${rate[0]} TWS</span>
                    <i class="fas fa-exchange-alt text-gray-400"></i>
                    <span class="font-semibold text-lg text-green-600">${rate[1]} TON</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="editExchangeRate(${index}, ${rate[0]}, ${rate[1]})" class="text-blue-600 hover:text-blue-800 px-3 py-1">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteExchangeRate(${index})" class="text-red-600 hover:text-red-800 px-3 py-1">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading exchange rates:', error);
        document.getElementById('exchangeRatesList').innerHTML = '<p class="text-red-500">Error loading exchange rates</p>';
    }
}

async function addExchangeRate() {
    const twsAmount = document.getElementById('twsAmount').value;
    const tonAmount = document.getElementById('tonAmount').value;
    
    if (!twsAmount || !tonAmount || twsAmount <= 0 || tonAmount <= 0) {
        alert('Please enter valid TWS and TON amounts');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/add_exchange_rate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tws_amount: parseFloat(twsAmount),
                ton_amount: parseFloat(tonAmount)
            })
        });
        
        if (response.ok) {
            alert('Exchange rate added successfully!');
            document.getElementById('twsAmount').value = '';
            document.getElementById('tonAmount').value = '';
            loadExchangeRates();
        } else {
            alert('Failed to add exchange rate');
        }
    } catch (error) {
        console.error('Error adding exchange rate:', error);
        alert('Error adding exchange rate');
    }
}

async function editExchangeRate(index, currentTws, currentTon) {
    const newTws = prompt('Enter new TWS amount:', currentTws);
    const newTon = prompt('Enter new TON amount:', currentTon);
    
    if (!newTws || !newTon || newTws <= 0 || newTon <= 0) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/update_exchange_rate`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                index: index,
                tws_amount: parseFloat(newTws),
                ton_amount: parseFloat(newTon)
            })
        });
        
        if (response.ok) {
            alert('Exchange rate updated successfully!');
            loadExchangeRates();
        } else {
            alert('Failed to update exchange rate');
        }
    } catch (error) {
        console.error('Error updating exchange rate:', error);
        alert('Error updating exchange rate');
    }
}

async function deleteExchangeRate(index) {
    if (!confirm('Are you sure you want to delete this exchange rate?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/delete_exchange_rate?index=${index}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Exchange rate deleted successfully!');
            loadExchangeRates();
        } else {
            alert('Failed to delete exchange rate');
        }
    } catch (error) {
        console.error('Error deleting exchange rate:', error);
        alert('Error deleting exchange rate');
    }
}

