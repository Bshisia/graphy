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
}

