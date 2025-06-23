import { showError, navigateTo } from './ui.js';
import { fetchUserProfile } from './profile.js';

const AUTH_ENDPOINT = 'https://learn.zone01kisumu.ke/api/auth/signin';

export function handleLogout() {
    localStorage.removeItem('authToken');
    window.authToken = null;
    
    // Clear form fields and messages
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const successMessage = document.getElementById('successMessage');
    const loginError = document.getElementById('errorMessage');
    
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

export async function handleLogin(e) {
    e.preventDefault();
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginForm = document.getElementById('loginForm');
    const successMessage = document.getElementById('successMessage');
    
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
        window.authToken = token;

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