// Constants
const AUTH_ENDPOINT = `https://learn.zone01kisumu.ke/api/auth/signin`;
const GRAPHQL_ENDPOINT = 'https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql';

// State management
let authToken = localStorage.getItem('authToken');

// DOM elements
const loginContainer = document.querySelector('.login-container');
const profilePage = document.getElementById('profile-page');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('errorMessage');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const successMessage = document.getElementById('successMessage');

// SPA Navigation
function navigateTo(page) {
    // Hide all main sections
    if (loginContainer) loginContainer.classList.add('hidden');
    if (profilePage) profilePage.classList.add('hidden');

    // Show the requested section
    if (page === 'login' && loginContainer) loginContainer.classList.remove('hidden');
    if (page === 'profile' && profilePage) profilePage.classList.remove('hidden');
}

// Initialize application
document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
    // Add event listeners after DOM is loaded
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (togglePassword) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.querySelector('i').classList.toggle('fa-eye');
            togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // Add logout event listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Show correct page based on auth state
    if (authToken) {
        navigateTo('profile');
    } else {
        navigateTo('login');
    }
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showError('Please enter both username/email and password');
        return;
    }

    try {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Logging in...';

        const credentials = btoa(`${username}:${password}`);
        const response = await fetch(AUTH_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        const token = await response.json();
        localStorage.setItem('authToken', token);
        await fetchUserProfile()
        authToken = token;

        // Optionally set username in profile
        const userNameSpan = document.getElementById('user-name');
        if (userNameSpan) userNameSpan.textContent = username;

        successMessage.textContent = 'Login successful!';
        successMessage.classList.add('show');

        await fetchUserProfile();
        navigateTo('profile');

    } catch (error) {
        showError('Login failed: ' + error.message);
        console.error('Login error:', error);
    } finally {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i> Sign In';
    }
}

// Logout function
function handleLogout() {
    localStorage.removeItem('authToken');
    authToken = null;
    // Optionally clear fields and messages
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (successMessage) {
        successMessage.textContent = '';
        successMessage.classList.remove('show');
    }
    if (loginError) {
        loginError.textContent = '';
        loginError.classList.add('hidden');
    }
    navigateTo('login');
}

// Error handling
function showError(message) {
    if (loginError) {
        loginError.textContent = message;
        loginError.classList.remove('hidden');
    }
}

async function fetchUserProfile() {
    if (!authToken) {
        return;
    }

    const query = `{
        user {
            id
            login
            attrs
            email
            auditRatio
            transactions(where: {_and: [{eventId: {_eq: 75}}]}, order_by: {createdAt: asc}) {
                object {
                    name
                    attrs
                    type
                }
                amount
                createdAt
                eventId
                path
                type
            }
            audits(
                order_by: {createdAt: desc}
                where: {closedAt: {_is_null: true}, group: {captain: {canAccessPlatform: {_eq: true}}}}
            ) {
                closedAt
                group {
                    captainLogin
                    path
                    members {
                        userLogin
                    }
                }
                private {
                    code
                }
            }
            events(where: {eventId: {_eq: 75}}) {
                level
            }
            progresses(where: {eventId: {_eq: 75}} order_by: {createdAt: desc}) {
                grade
                path
                createdAt
                updatedAt
            }
        }
        event(where: {path: {_eq: "/kisumu/module"}}) {
            startAt
            endAt
        }
        goItems: object(
            where: {_or: [{type: {_eq: "project"}, attrs: {_contains: {language: "Go"}}}, {type: {_eq: "piscine"}, name: {_ilike: "%Go%"}}]}
            distinct_on: [name]
        ) {
            name
            type
        }
        jsItems: object(
            where: {_or: [{type: {_eq: "project"}, attrs: {_contains: {language: "JavaScript"}}}, {type: {_eq: "piscine"}, name: {_ilike: "%JS%"}}]}
            distinct_on: [name]
        ) {
            name
            type
        }
        rustItems: object(
            where: {_or: [{type: {_eq: "project"}, attrs: {_contains: {language: "rust"}}}, {type: {_eq: "piscine"}, name: {_ilike: "%Rust%"}}]}
            distinct_on: [name]
        ) {
            name
            type
        }
        skill_types: user {
            transactions_aggregate(
                distinct_on: [type]
                where: {type: {_nin: ["xp", "level", "up", "down"]}}
                order_by: [{type: asc}, {amount: desc}]
            ) {
                nodes {
                    type
                    amount
                }
            }
        }
    }`;

    try {
        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        updateProfileUI(data.data);

    } catch (error) {
        console.error('Profile fetch error:', error);
        showError('Failed to load profile data');
    }
}

function updateProfileUI(data) {
    const userData = data.user[0];
    
    // Update basic user info
    document.getElementById('profile-name').textContent = userData.login;
    document.getElementById('profile-email').textContent = userData.email
    document.getElementById('audit-ratio').textContent = userData.auditRatio.toFixed(2);

    // Calculate total XP
    const totalXP = userData.transactions.reduce((sum, tx) => sum + tx.amount, 0);
    document.getElementById('total-xp').textContent = totalXP.toLocaleString();

    // Update level from events
    const currentLevel = userData.events[0]?.level || 0;
    document.getElementById('profile-level').textContent = `Level ${currentLevel}`;

    // Calculate project stats
    const projects = userData.progresses;
    const passedProjects = projects.filter(p => p.grade === 1).length;
    document.getElementById('projects-passed').textContent = passedProjects;

    // Update language-specific project counts
    document.getElementById('go-projects').textContent = data.goItems.length;
    document.getElementById('js-projects').textContent = data.jsItems.length;
    document.getElementById('rs-projects').textContent = data.rustItems.length;

    // Create XP over time graph
    createXPGraph(userData.transactions);

    // Create projects completion pie chart
    createProjectsPieChart(projects);

    // Update recent activity table
    updateActivityTable(userData.transactions);
}

function updateActivityTable(transactions) {
    const tableBody = document.getElementById('activity-table');
    tableBody.innerHTML = '';

    transactions.slice(0, 5).forEach(tx => {
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
                ${tx.amount.toLocaleString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs font-semibold rounded-full 
                    ${tx.type === 'xp' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                    ${tx.type === 'xp' ? 'Completed' : 'In Progress'}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function createXPGraph(transactions) {
    const svg = document.getElementById('xp-graph');
    svg.innerHTML = ''; // Clear existing content

    // Sort transactions by date
    const sortedTx = transactions.sort((a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt)
    );

    // Calculate cumulative XP
    let cumulativeXP = 0;
    const points = sortedTx.map((tx, i) => {
        cumulativeXP += tx.amount;
        return {
            x: 50 + (i * 400 / sortedTx.length),
            y: 200 - (cumulativeXP * 150 / Math.max(cumulativeXP, 1))
        };
    });

    // Create path
    const pathData = points.map((p, i) =>
        (i === 0 ? 'M' : 'L') + p.x + ',' + p.y
    ).join(' ');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', '#8b5cf6');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    svg.appendChild(path);
}

function createProjectsPieChart(projects) {
    const svg = document.getElementById('projects-chart');
    svg.innerHTML = ''; // Clear existing content

    const passed = projects.filter(p => p.grade === 1).length;
    const total = projects.length;
    const percentage = (passed / total) * 100;

    // Create pie chart segments
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '100');
    circle.setAttribute('cy', '100');
    circle.setAttribute('r', '80');
    circle.setAttribute('fill', 'transparent');
    circle.setAttribute('stroke', '#8b5cf6');
    circle.setAttribute('stroke-width', '20');
    circle.setAttribute('stroke-dasharray', `${percentage * 5.02} 502`);
    svg.appendChild(circle);

    // Add percentage text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '100');
    text.setAttribute('y', '100');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', '24');
    text.setAttribute('fill', '#4b5563');
    text.textContent = `${Math.round(percentage)}%`;
    svg.appendChild(text);
}
