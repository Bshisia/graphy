// Constants
const AUTH_ENDPOINT = `https://learn.zone01kisumu.ke/api/auth/signin`;

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
        togglePassword.addEventListener('click', function() {
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
        authToken = token;

        // Optionally set username in profile
        const userNameSpan = document.getElementById('user-name');
        if (userNameSpan) userNameSpan.textContent = username;

        successMessage.textContent = 'Login successful!';
        successMessage.classList.add('show');

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
