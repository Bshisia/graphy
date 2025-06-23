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
        // Load profile data on page refresh
        fetchUserProfile().catch(error => {
            console.error('Failed to load profile on refresh:', error);
            // If profile loading fails, redirect to login
            handleLogout();
        });
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

    // Show loading state
    showLoadingState();

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
    } finally {
        hideLoadingState();
    }
}

function showLoadingState() {
    const elements = ['profile-name', 'profile-email', 'total-xp', 'projects-passed', 'audit-ratio'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = 'Loading...';
    });
}

function hideLoadingState() {
    // Loading state will be replaced by actual data
}

function updateProfileUI(data) {
    console.log('Profile data received:', data);
    const userData = data.user[0];
    console.log('User data:', userData);
    console.log('Transactions:', userData.transactions);

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

function updateActivityTable(transactions) {
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
                ${(tx.amountKB)} kB
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

function createXPGraph(transactions) {
const svg = document.getElementById('xp-graph');
if (!svg) return;

svg.innerHTML = '';

// Filter and sort XP transactions
const sortedXP = transactions
.filter(tx => tx.type === 'xp')
.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

if (sortedXP.length === 0) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '250');
    text.setAttribute('y', '125');
    text.setAttribute('text-anchor', 'middle');
text.setAttribute('font-size', '16');
text.setAttribute('fill', '#6b7280');
text.textContent = 'No XP data available';
svg.appendChild(text);
return;
}

    // Calculate cumulative XP points
let cumulativeXP = 0;
const points = sortedXP.map((tx, i) => {
    cumulativeXP += tx.amount;
    return {
        x: 80 + (i * 360 / Math.max(sortedXP.length - 1, 1)),
    y: cumulativeXP,
    date: new Date(tx.createdAt),
        projectName: tx.object?.name || 'Project'
        };
});

const maxXP = Math.max(...points.map(p => p.y));

// Scale points to SVG coordinates (leave space for axes)
    const scaledPoints = points.map(p => ({
x: p.x,
y: 50 + (130 - ((p.y / maxXP) * 130)),
originalY: p.y,
date: p.date,
projectName: p.projectName
}));

// Draw grid lines and Y-axis labels
const ySteps = 5;
for (let i = 0; i <= ySteps; i++) {
const yValue = (maxXP / ySteps) * i;
const yPos = 180 - ((yValue / maxXP) * 130);

// Horizontal grid line
const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
gridLine.setAttribute('x1', '80');
    gridLine.setAttribute('y1', yPos);
        gridLine.setAttribute('x2', '440');
        gridLine.setAttribute('y2', yPos);
        gridLine.setAttribute('stroke', '#e5e7eb');
        gridLine.setAttribute('stroke-width', '1');
        svg.appendChild(gridLine);
        
        // Y-axis label
        const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yLabel.setAttribute('x', '75');
        yLabel.setAttribute('y', yPos + 4);
        yLabel.setAttribute('text-anchor', 'end');
        yLabel.setAttribute('font-size', '10');
        yLabel.setAttribute('fill', '#6b7280');
        yLabel.textContent = Math.round(yValue / 1000) + 'k';
        svg.appendChild(yLabel);
    }

    // Draw X-axis labels (dates)
    const xSteps = Math.min(5, points.length - 1);
    for (let i = 0; i <= xSteps; i++) {
        const pointIndex = Math.round((points.length - 1) * (i / xSteps));
        const point = points[pointIndex];
        const xPos = 80 + (i * 360 / xSteps);
        
        // Vertical grid line
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('x1', xPos);
        gridLine.setAttribute('y1', '50');
        gridLine.setAttribute('x2', xPos);
        gridLine.setAttribute('y2', '180');
        gridLine.setAttribute('stroke', '#e5e7eb');
        gridLine.setAttribute('stroke-width', '1');
        svg.appendChild(gridLine);
        
        // X-axis label
        const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xLabel.setAttribute('x', xPos);
        xLabel.setAttribute('y', '195');
        xLabel.setAttribute('text-anchor', 'middle');
        xLabel.setAttribute('font-size', '10');
        xLabel.setAttribute('fill', '#6b7280');
        xLabel.textContent = point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        svg.appendChild(xLabel);
    }

    // Draw axes
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', '80');
    yAxis.setAttribute('y1', '50');
    yAxis.setAttribute('x2', '80');
    yAxis.setAttribute('y2', '180');
    yAxis.setAttribute('stroke', '#374151');
    yAxis.setAttribute('stroke-width', '2');
    svg.appendChild(yAxis);

    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', '80');
    xAxis.setAttribute('y1', '180');
    xAxis.setAttribute('x2', '440');
    xAxis.setAttribute('y2', '180');
    xAxis.setAttribute('stroke', '#374151');
    xAxis.setAttribute('stroke-width', '2');
    svg.appendChild(xAxis);

    // Create XP line
    if (scaledPoints.length > 0) {
        const pathData = scaledPoints.map((p, i) =>
            (i === 0 ? 'M' : 'L') + p.x + ',' + p.y
        ).join(' ');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', '#8b5cf6');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        svg.appendChild(path);

        // Add dots at data points
        scaledPoints.forEach((p, i) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', p.y);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', '#8b5cf6');
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', '2');
            svg.appendChild(circle);
        });
    }

    // Add axis labels
    const yAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yAxisLabel.setAttribute('x', '20');
    yAxisLabel.setAttribute('y', '115');
    yAxisLabel.setAttribute('text-anchor', 'middle');
    yAxisLabel.setAttribute('font-size', '12');
    yAxisLabel.setAttribute('fill', '#374151');
    yAxisLabel.setAttribute('transform', 'rotate(-90, 20, 115)');
    yAxisLabel.textContent = 'XP (thousands)';
    svg.appendChild(yAxisLabel);

    const xAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xAxisLabel.setAttribute('x', '260');
    xAxisLabel.setAttribute('y', '220');
    xAxisLabel.setAttribute('text-anchor', 'middle');
    xAxisLabel.setAttribute('font-size', '12');
    xAxisLabel.setAttribute('fill', '#374151');
    xAxisLabel.textContent = 'Time';
    svg.appendChild(xAxisLabel);
}

function createProjectsPieChart(projects) {
    const svg = document.getElementById('projects-chart');
    if (!svg) return;

    svg.innerHTML = ''; // Clear existing content

    if (projects.length === 0) {
        // Show "No data" message
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '100');
        text.setAttribute('y', '100');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-size', '16');
        text.setAttribute('fill', '#6b7280');
        text.textContent = 'No projects data';
        svg.appendChild(text);
        return;
    }

    const passed = projects.filter(p => p.grade && p.grade >= 1).length;
    const total = projects.length;
    const percentage = total > 0 ? (passed / total) * 100 : 0;

    // Create background circle
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', '100');
    bgCircle.setAttribute('cy', '100');
    bgCircle.setAttribute('r', '80');
    bgCircle.setAttribute('fill', 'none');
    bgCircle.setAttribute('stroke', '#e5e7eb');
    bgCircle.setAttribute('stroke-width', '20');
    svg.appendChild(bgCircle);

    // Create progress circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '100');
    circle.setAttribute('cy', '100');
    circle.setAttribute('r', '80');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', '#8b5cf6');
    circle.setAttribute('stroke-width', '20');
    circle.setAttribute('stroke-linecap', 'round');
    circle.setAttribute('transform', 'rotate(-90 100 100)');

    const circumference = 2 * Math.PI * 80;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    circle.setAttribute('stroke-dasharray', strokeDasharray);
    svg.appendChild(circle);

    // Add percentage text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '100');
    text.setAttribute('y', '105');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', '24');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', '#4b5563');
    text.textContent = `${Math.round(percentage)}%`;
    svg.appendChild(text);

    // Add label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', '100');
    label.setAttribute('y', '125');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'middle');
    label.setAttribute('font-size', '12');
    label.setAttribute('fill', '#6b7280');
    label.textContent = `${passed}/${total} passed`;
    svg.appendChild(label);
}

async function refreshData() {
    if (!authToken) return;

    const refreshButtons = document.querySelectorAll('#refresh-xp, #refresh-projects');

    try {
        // Show loading state
        refreshButtons.forEach(btn => {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;
        });

        await fetchUserProfile();

    } catch (error) {
        console.error('Refresh failed:', error);
        showError('Failed to refresh data');
    } finally {
        // Restore button state
        refreshButtons.forEach(btn => {
            btn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            btn.disabled = false;
        });
    }
}
