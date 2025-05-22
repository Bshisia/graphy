// Constants
const API_DOMAIN = window.location.hostname;
const AUTH_ENDPOINT = `https://learn.zone01kisumu.ke/api/auth/signin`;
const GRAPHQL_ENDPOINT = `https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql`;

// State management
let authToken = localStorage.getItem('authToken');

// DOM elements
const loginContainer = document.getElementById('login-container');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('errorMessage');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

// Event Listeners
document.addEventListener('DOMContentLoaded', initialize);

// Initialize application
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

    showLogin();
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
        
        // Redirect to dashboard or home page after successful login
        window.location.href = '/dashboard.html';
        
    } catch (error) {
        showError('Login failed: ' + error.message);
        console.error('Login error:', error);
    } finally {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i> Sign In';
    }
}

// Error handling
function showError(message) {
    if (loginError) {
        loginError.textContent = message;
        loginError.classList.remove('hidden');
    }
}

// UI functions
function showLogin() {
    if (loginContainer) loginContainer.classList.remove('hidden');
    if (loginError) {
        loginError.textContent = '';
        loginError.classList.add('hidden');
    }
}
