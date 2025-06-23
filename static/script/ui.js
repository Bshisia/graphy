import { createXPGraph, createProjectsPieChart } from './charts.js';

export function showError(message) {
    const loginError = document.getElementById('errorMessage');
    if (loginError) {
        loginError.textContent = message;
        loginError.classList.remove('hidden');
    }
}

export function showLoadingState() {
    const elements = ['profile-name', 'profile-email', 'total-xp', 'projects-passed', 'audit-ratio'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = 'Loading...';
    });
}

export function hideLoadingState() {
    // Loading state will be replaced by actual data
}

export function navigateTo(page) {
    const loginContainer = document.querySelector('.login-container');
    const profilePage = document.getElementById('profile-page');
    
    // Hide all main sections
    if (loginContainer) loginContainer.classList.add('hidden');
    if (profilePage) profilePage.classList.add('hidden');

    // Show the requested section
    if (page === 'login' && loginContainer) loginContainer.classList.remove('hidden');
    if (page === 'profile' && profilePage) profilePage.classList.remove('hidden');
}

export function updateProfileUI(data) {
    const userData = data.user[0];

    // Update basic user info
    document.getElementById('profile-name').textContent = userData.login;
    document.getElementById('profile-email').textContent = userData.email;
    document.getElementById('audit-ratio').textContent = userData.auditRatio.toFixed(2);

    // Calculate total XP - filter for XP transactions only
    const totalXPBytes = userData.transactions
        .filter(tx => tx.type === 'xp')
        .reduce((sum, tx) => sum + tx.amount, 0);

    const totalXPKB = Math.round(totalXPBytes / (1000) * 100) / 100;
    const totalXPMB = Math.round(totalXPBytes / (1000 * 1000) * 100) / 100;

    document.getElementById('total-xp').textContent = totalXPKB.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    document.getElementById('total-xp-mb').textContent = totalXPMB.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    // Update level from events
    const currentLevel = userData.events[0]?.level || 0;
    document.getElementById('profile-level').textContent = `Level ${currentLevel}`;

    // Calculate project stats
    const projects = userData.progresses;
    const passedProjects = userData.progresses.filter(p => p.grade >= 1).length;
    document.getElementById('projects-passed').textContent = passedProjects;

    // Create XP over time graph
    createXPGraph(userData.transactions);

    // Create projects completion pie chart
    createProjectsPieChart(projects);

    // Update recent activity table
    updateActivityTable(userData.transactions);
}

export function updateActivityTable(transactions) {
    const tableBody = document.getElementById('activity-table');
    tableBody.innerHTML = '';

    // Filter XP transactions and take most recent 5
    const recentXP = transactions
        .filter(tx => tx.type === 'xp')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(tx => ({
            ...tx,
            amountKB: (tx.amount / 1000).toFixed(1)
        }));

    recentXP.forEach(tx => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                ${new Date(tx.createdAt).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${tx.type}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${tx.object?.name || 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${tx.amountKB} kB
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Completed
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}