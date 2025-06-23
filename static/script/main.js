import { handleLogin, handleLogout } from './auth.js';
import { fetchUserProfile, refreshData } from './profile.js';
import { navigateTo } from './ui.js';

// Global state management
window.authToken = localStorage.getItem('authToken');

// Initialize application
document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
    setupEventListeners();
    
    // Show correct page based on auth state
    if (window.authToken) {
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

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Password toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.querySelector('i').classList.toggle('fa-eye');
            togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Refresh buttons
    const refreshXpBtn = document.getElementById('refresh-xp');
    const refreshProjectsBtn = document.getElementById('refresh-projects');
    
    if (refreshXpBtn) {
        refreshXpBtn.addEventListener('click', refreshData);
    }
    
    if (refreshProjectsBtn) {
        refreshProjectsBtn.addEventListener('click', refreshData);
    }
}
