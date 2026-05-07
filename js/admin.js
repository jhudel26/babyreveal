// ===== ADMIN DASHBOARD JAVASCRIPT =====

class AdminDashboard {
    constructor() {
        this.users = [];
        this.editingUserId = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkAuthStatus();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showUserModal());
        }

        const exportDataBtn = document.getElementById('exportDataBtn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportData());
        }

        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', (e) => this.handleUserSubmit(e));
        }

        this.setupModalListeners();

        // Clear login error on input
        ['adminUsername', 'adminPassword'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    const errorDiv = document.getElementById('loginError');
                    if (errorDiv) errorDiv.classList.remove('show');
                });
            }
        });
    }

    setupModalListeners() {
        const modal = document.getElementById('userModal');
        const closeBtn = modal?.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancelUserBtn');

        if (closeBtn) closeBtn.addEventListener('click', () => this.closeUserModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeUserModal());

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeUserModal();
            });
        }
    }

    async api(path, options = {}) {
        const response = await fetch(path, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });

        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(json.error || 'Request failed');
        }
        return json;
    }

    async checkAuthStatus() {
        try {
            await this.api('/api/auth/session', { method: 'GET' });
            this.showDashboard();
            await this.loadUsers();
        } catch (error) {
            this.showLogin();
        }
    }

    showLogin() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboardScreen = document.getElementById('dashboardScreen');
        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashboardScreen) dashboardScreen.style.display = 'none';
    }

    showDashboard() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboardScreen = document.getElementById('dashboardScreen');
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboardScreen) dashboardScreen.style.display = 'block';
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value;
        const loginBtn = e.target.querySelector('button[type="submit"]');
        const loginCard = document.querySelector('.login-card');

        if (loginBtn) loginBtn.classList.add('loading');

        try {
            await this.api('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            this.clearLoginForm();
            this.showDashboard();
            await this.loadUsers();
        } catch (error) {
            if (loginCard) {
                loginCard.classList.remove('shake');
                void loginCard.offsetWidth;
                loginCard.classList.add('shake');
            }
            this.showLoginError(error.message);
        } finally {
            if (loginBtn) loginBtn.classList.remove('loading');
        }
    }

    async handleLogout() {
        try {
            await this.api('/api/auth/logout', { method: 'POST' });
        } finally {
            this.showLogin();
        }
    }

    showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        if (!errorDiv) return;
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        setTimeout(() => errorDiv.classList.remove('show'), 5000);
    }

    clearLoginForm() {
        const form = document.getElementById('loginForm');
        if (form) form.reset();
    }

    async loadUsers() {
        const data = await this.api('/api/users', { method: 'GET' });
        this.users = data.users || [];
        this.renderUsersTable();
        this.updateStats();
    }

    async refreshData() {
        try {
            await this.loadUsers();
            this.showSuccess('Data refreshed successfully');
        } catch (error) {
            this.showError(error.message);
        }
    }

    updateStats() {
        const totalUsers = this.users.length;
        const revealedCount = this.users.filter((user) => user.revealed).length;
        const boyCount = this.users.filter((user) => user.gender === 'boy').length;
        const girlCount = this.users.filter((user) => user.gender === 'girl').length;
        this.updateStatElement('totalUsers', totalUsers);
        this.updateStatElement('revealedCount', revealedCount);
        this.updateStatElement('boyCount', boyCount);
        this.updateStatElement('girlCount', girlCount);
    }

    updateStatElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: rgba(255,255,255,0.7);">
                        No users found. Click "Add User" to create your first user.
                    </td>
                </tr>
            `;
            return;
        }

        this.users.forEach((user) => tbody.appendChild(this.createUserRow(user)));
    }

    createUserRow(user) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${this.escapeHtml(user.fatherName || user.name || '')}</td>
            <td>${this.escapeHtml(user.motherName || '')}</td>
            <td><code>${this.escapeHtml(user.code)}</code></td>
            <td><span class="gender-badge ${user.gender} ${user.revealed ? '' : 'gender-hidden'}">${user.revealed ? (user.gender === 'boy' ? '👶 Boy' : '👧 Girl') : 'Hidden'}</span></td>
            <td><span class="reveal-type-badge">${this.getRevealTypeLabel(user.revealType)}</span></td>
            <td><span class="status-badge ${user.revealed ? 'revealed' : 'pending'}">${user.revealed ? '✅ Revealed' : '⏳ Pending'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon copy" onclick="admin.copyUserCode('${user.id}')" title="Copy Code">📋</button>
                    <button class="btn-icon edit" onclick="admin.editUser('${user.id}')" title="Edit User">✏️</button>
                    <button class="btn-icon delete" onclick="admin.deleteUser('${user.id}')" title="Delete User">🗑️</button>
                </div>
            </td>
        `;
        return row;
    }

    showUserModal(userId = null) {
        const modal = document.getElementById('userModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('userForm');
        if (!modal || !modalTitle || !form) return;

        this.editingUserId = userId;

        if (userId) {
            const user = this.users.find((item) => item.id === userId);
            if (user) {
                modalTitle.textContent = 'Edit User';
                document.getElementById('fatherName').value = user.fatherName || '';
                document.getElementById('motherName').value = user.motherName || '';
                document.getElementById('userGender').value = user.gender;
                document.getElementById('revealType').value = user.revealType || '';
            }
        } else {
            modalTitle.textContent = 'Add New User';
            form.reset();
        }

        modal.classList.add('active');
    }

    closeUserModal() {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        if (modal) modal.classList.remove('active');
        if (form) form.reset();
        this.editingUserId = null;
    }

    async handleUserSubmit(e) {
        e.preventDefault();
        const fatherName = document.getElementById('fatherName').value.trim();
        const motherName = document.getElementById('motherName').value.trim();
        const gender = document.getElementById('userGender').value;
        const revealType = document.getElementById('revealType').value;

        if (!fatherName || !motherName || !gender || !revealType) {
            this.showError('Please fill in all fields');
            return;
        }

        try {
            if (this.editingUserId) {
                await this.api(`/api/users/${this.editingUserId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ fatherName, motherName, gender, revealType })
                });
                this.showSuccess('User updated successfully');
            } else {
                const result = await this.api('/api/users', {
                    method: 'POST',
                    body: JSON.stringify({ fatherName, motherName, gender, revealType })
                });
                this.showSuccess(`User created with code: ${result.user.code}`);
            }

            this.closeUserModal();
            await this.loadUsers();
        } catch (error) {
            this.showError(error.message);
        }
    }

    editUser(userId) {
        this.showUserModal(userId);
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            await this.api(`/api/users/${userId}`, { method: 'DELETE' });
            await this.loadUsers();
            this.showSuccess('User deleted successfully');
        } catch (error) {
            this.showError(error.message);
        }
    }

    async copyUserCode(userId) {
        const user = this.users.find((item) => item.id === userId);
        if (!user) return;

        const shareUrl = `${window.location.origin}/reveal.html?code=${encodeURIComponent(user.code)}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            this.showSuccess(`Share link copied: ${shareUrl}`);
        } catch (error) {
            this.showError('Could not copy share link');
        }
    }

    exportData() {
        const dataStr = JSON.stringify(this.users, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `baby-reveal-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.showSuccess('Data exported successfully');
    }


    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        const successText = document.getElementById('successText');
        if (!successDiv || !successText) return;
        successText.textContent = message;
        successDiv.classList.add('show');
        setTimeout(() => successDiv.classList.remove('show'), 3000);
    }

    showError(message) {
        const errorDiv = document.getElementById('loginError');
        if (!errorDiv) return;
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        setTimeout(() => errorDiv.classList.remove('show'), 5000);
    }

    getRevealTypeLabel(revealType) {
        const types = {
            scratch: '🎨 Scratch Card',
            balloon: '🎈 Balloon Pop',
            gift: '🎁 Gift Box',
            tap: '👆 Tap Reveal'
        };
        return types[revealType] || '❓ Not Set';
    }
}

let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new AdminDashboard();
    window.admin = admin;
});
